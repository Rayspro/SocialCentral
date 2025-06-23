// Platform integration feature-specific types

import { BaseEntity, StatusType } from '../shared/core.js';

export interface PlatformConfig {
  youtube: {
    apiBaseUrl: string;
    oauthScope: string;
    maxResults: number;
  };
  instagram: {
    apiBaseUrl: string;
    oauthScope: string;
    maxResults: number;
  };
  twitter: {
    apiBaseUrl: string;
    maxTweetLength: number;
    maxMediaPerTweet: number;
  };
}

export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface YouTubeUserInfo {
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

export interface InstagramUserInfo {
  id: string;
  username: string;
  account_type: string;
  media_count?: number;
  followers_count?: number;
}

export interface PlatformData extends BaseEntity {
  name: string;
  displayName: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface AccountData extends BaseEntity {
  platformId: number;
  name: string;
  username: string;
  externalId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}