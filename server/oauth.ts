import { Request, Response } from 'express';
import { db } from './db';
import { platforms, accounts } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface YouTubeUserInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

interface InstagramUserInfo {
  id: string;
  username: string;
  account_type: string;
  media_count?: number;
  followers_count?: number;
}

class OAuthManager {
  private getInstagramAuthUrl(credentials: OAuthCredentials, state: string): string {
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
      state: state
    });

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  private getYouTubeAuthUrl(credentials: OAuthCredentials, state: string): string {
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: credentials.redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload',
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private async exchangeCodeForTokens(code: string, credentials: OAuthCredentials, platform: 'youtube' | 'instagram' = 'youtube'): Promise<any> {
    const tokenUrl = platform === 'instagram' 
      ? 'https://api.instagram.com/oauth/access_token'
      : 'https://oauth2.googleapis.com/token';

    const body = platform === 'instagram'
      ? new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: credentials.redirectUri,
        })
      : new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: credentials.redirectUri,
        });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body,
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }

    return await tokenResponse.json();
  }

  private async getYouTubeChannelInfo(accessToken: string): Promise<YouTubeUserInfo> {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    return data.items[0];
  }

  private async getInstagramUserInfo(accessToken: string): Promise<InstagramUserInfo> {
    const response = await fetch(
      'https://graph.instagram.com/me?fields=id,username,account_type,media_count,followers_count',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Instagram API request failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async initiateInstagramAuth(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, clientSecret } = req.body;

      if (!clientId || !clientSecret) {
        res.status(400).json({ error: 'App ID and App Secret are required' });
        return;
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/instagram/callback`;
      const state = Math.random().toString(36).substring(2, 15);

      // Store credentials temporarily
      const tempStorage = (global as any).tempAuthStorage || {};
      tempStorage[state] = {
        clientId,
        clientSecret,
        redirectUri,
        state
      };
      (global as any).tempAuthStorage = tempStorage;

      const authUrl = this.getInstagramAuthUrl({ clientId, clientSecret, redirectUri }, state);
      
      res.json({ authUrl });
    } catch (error) {
      console.error('Instagram auth initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate Instagram authentication' });
    }
  }

  async handleInstagramCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error } = req.query;

      if (error) {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=${encodeURIComponent(error as string)}`);
        return;
      }

      if (!code || !state) {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=missing_code_or_state`);
        return;
      }

      const tempStorage = (global as any).tempAuthStorage || {};
      const authData = tempStorage[state as string];
      if (!authData || authData.state !== state) {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=invalid_state`);
        return;
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code as string, authData, 'instagram');
      
      // Get user information
      const userInfo = await this.getInstagramUserInfo(tokens.access_token);

      // Find Instagram platform
      const instagramPlatform = await db
        .select()
        .from(platforms)
        .where(eq(platforms.name, 'instagram'))
        .limit(1);

      if (instagramPlatform.length === 0) {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=platform_not_found`);
        return;
      }

      // Create account record
      await db.insert(accounts).values({
        platformId: instagramPlatform[0].id,
        name: userInfo.username,
        username: `@${userInfo.username}`,
        isActive: true,
        metadata: {
          instagramId: userInfo.id,
          accountType: userInfo.account_type,
          mediaCount: userInfo.media_count || 0,
          followersCount: userInfo.followers_count || 0,
          accessToken: tokens.access_token,
          tokenExpiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        }
      });

      // Clear temporary storage
      delete tempStorage[state as string];

      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?success=instagram_connected`);
    } catch (error) {
      console.error('Instagram callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=callback_failed`);
    }
  }

  async initiateYouTubeAuth(req: Request, res: Response): Promise<void> {
    try {
      const { clientId, clientSecret } = req.body;

      if (!clientId || !clientSecret) {
        res.status(400).json({ error: 'Client ID and Client Secret are required' });
        return;
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/youtube/callback`;
      const state = Math.random().toString(36).substring(2, 15);

      // Store credentials temporarily using a simple in-memory store
      const tempStorage = (global as any).tempAuthStorage || {};
      tempStorage[state] = {
        clientId,
        clientSecret,
        redirectUri,
        state
      };
      (global as any).tempAuthStorage = tempStorage;

      const authUrl = this.getYouTubeAuthUrl({ clientId, clientSecret, redirectUri }, state);
      
      res.json({ authUrl });
    } catch (error) {
      console.error('YouTube auth initiation error:', error);
      res.status(500).json({ error: 'Failed to initiate YouTube authentication' });
    }
  }

  async handleYouTubeCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error } = req.query;

      if (error) {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=${encodeURIComponent(error as string)}`);
        return;
      }

      if (!code || !state) {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=missing_code_or_state`);
        return;
      }

      const tempStorage = (global as any).tempAuthStorage || {};
      const authData = tempStorage[state as string];
      if (!authData || authData.state !== state) {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=invalid_state`);
        return;
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code as string, authData);
      
      // Get channel information
      const channelInfo = await this.getYouTubeChannelInfo(tokens.access_token);

      // Find YouTube platform
      const youtubePlatform = await db
        .select()
        .from(platforms)
        .where(eq(platforms.name, 'youtube'))
        .limit(1);

      if (youtubePlatform.length === 0) {
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=platform_not_found`);
        return;
      }

      // Create account record
      await db.insert(accounts).values({
        platformId: youtubePlatform[0].id,
        name: channelInfo.snippet.title,
        username: `@${channelInfo.snippet.title.toLowerCase().replace(/\s+/g, '')}`,
        isActive: true,
        metadata: {
          channelId: channelInfo.id,
          subscriberCount: parseInt(channelInfo.statistics.subscriberCount) || 0,
          videoCount: parseInt(channelInfo.statistics.videoCount) || 0,
          viewCount: parseInt(channelInfo.statistics.viewCount) || 0,
          thumbnail: channelInfo.snippet.thumbnails.default.url,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
        }
      });

      // Clear temporary storage
      delete tempStorage[state as string];

      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?success=youtube_connected`);
    } catch (error) {
      console.error('YouTube callback error:', error);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/platforms?error=callback_failed`);
    }
  }

  async refreshYouTubeToken(accountId: number): Promise<boolean> {
    try {
      const account = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, accountId))
        .limit(1);

      if (account.length === 0 || !account[0].metadata) {
        return false;
      }

      const metadata = account[0].metadata as any;
      if (!metadata.refreshToken) {
        return false;
      }

      const refreshToken = metadata.refreshToken;
      const clientId = metadata.clientId;
      const clientSecret = metadata.clientSecret;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        return false;
      }

      const tokens = await response.json();
      
      // Update account with new tokens
      const updatedMetadata = {
        ...account[0].metadata,
        accessToken: tokens.access_token,
        tokenExpiresAt: new Date(Date.now() + (tokens.expires_in * 1000)),
      };

      await db
        .update(accounts)
        .set({ 
          metadata: updatedMetadata
        })
        .where(eq(accounts.id, accountId));

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }
}

export const oauthManager = new OAuthManager();