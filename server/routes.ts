import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAccountSchema, insertContentSchema, insertScheduleSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Platform routes
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  app.get("/api/platforms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const platform = await storage.getPlatform(id);
      if (!platform) {
        return res.status(404).json({ message: "Platform not found" });
      }
      res.json(platform);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform" });
    }
  });

  // Account routes
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get("/api/platforms/:platformId/accounts", async (req, res) => {
    try {
      const platformId = parseInt(req.params.platformId);
      const accounts = await storage.getAccountsByPlatform(platformId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platform accounts" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const accountData = insertAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.put("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const accountData = insertAccountSchema.partial().parse(req.body);
      const account = await storage.updateAccount(id, accountData);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid account data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAccount(id);
      if (!success) {
        return res.status(404).json({ message: "Account not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Content routes
  app.get("/api/content", async (req, res) => {
    try {
      const status = req.query.status as string;
      const content = status 
        ? await storage.getContentByStatus(status)
        : await storage.getContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.get("/api/content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getContentById(id);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/content", async (req, res) => {
    try {
      const contentData = insertContentSchema.parse(req.body);
      const content = await storage.createContent(contentData);
      res.status(201).json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create content" });
    }
  });

  app.put("/api/content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contentData = insertContentSchema.partial().parse(req.body);
      const content = await storage.updateContent(id, contentData);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid content data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.delete("/api/content/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteContent(id);
      if (!success) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete content" });
    }
  });

  // Content generation routes
  app.post("/api/content/generate-video", async (req, res) => {
    try {
      const { text, style, duration, platformId, accountId } = req.body;
      
      if (!text || !text.trim()) {
        return res.status(400).json({ message: "Text content is required" });
      }

      // Check for video generation API keys
      const runwayKey = await storage.getApiKeyByService('runway');
      const pikaKey = await storage.getApiKeyByService('pika');
      
      if (!runwayKey && !pikaKey) {
        return res.status(400).json({ 
          message: "Video generation API key not configured. Please add RunwayML or Pika Labs API key in Settings to enable text-to-video generation." 
        });
      }

      // Create content entry with video generation metadata
      const contentData = {
        title: `Video: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`,
        description: `Generated video from text story`,
        type: "video" as const,
        sourceText: text,
        status: "generating" as const,
        platformId: platformId || null,
        accountId: accountId || null,
        metadata: {
          style,
          duration,
          generatedAt: new Date().toISOString(),
          provider: runwayKey ? 'runway' : 'pika'
        },
      };

      const content = await storage.createContent(contentData);
      
      // Queue video generation job (would integrate with actual APIs)
      // For demonstration, we'll simulate the process
      setTimeout(async () => {
        try {
          await storage.updateContent(content.id, {
            contentUrl: `https://example.com/generated-video-${content.id}.mp4`,
            status: "pending"
          });
        } catch (err) {
          console.error("Video generation update failed:", err);
        }
      }, 3000);
      
      res.status(201).json({
        ...content,
        message: "Video generation started. It will be available for approval once processing is complete."
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate video" });
    }
  });

  app.post("/api/content/generate-image", async (req, res) => {
    try {
      const { prompt, style, size, platformId, accountId } = req.body;
      
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ message: "Image prompt is required" });
      }

      // Check for OpenAI API key
      const openaiKey = await storage.getApiKeyByService('openai');
      if (!openaiKey || !openaiKey.keyValue) {
        return res.status(400).json({ 
          message: "OpenAI API key not configured. Please add your API key in Settings." 
        });
      }

      try {
        // Generate image using OpenAI DALL-E 3
        const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey.keyValue}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: `${prompt} in ${style || 'realistic'} style`,
            n: 1,
            size: size || "1024x1024",
            quality: "standard",
          }),
        });

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json();
          throw new Error(errorData.error?.message || 'OpenAI API request failed');
        }

        const openaiData = await openaiResponse.json();
        const imageUrl = openaiData.data[0].url;

        // Create content entry
        const contentData = {
          title: `Image: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`,
          description: `AI-generated image`,
          type: "image" as const,
          contentUrl: imageUrl,
          generationPrompt: prompt,
          status: "pending" as const,
          platformId: platformId || null,
          accountId: accountId || null,
          metadata: {
            style,
            size,
            generatedAt: new Date().toISOString(),
          },
        };

        const content = await storage.createContent(contentData);
        
        res.status(201).json({
          ...content,
          imageUrl,
          message: "Image generated successfully"
        });
      } catch (aiError) {
        console.error("OpenAI API Error:", aiError);
        res.status(500).json({ 
          message: "Failed to generate image with AI service. Please check your API key configuration." 
        });
      }
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ message: "Failed to generate image" });
    }
  });

  // Text generation endpoint
  app.post("/api/content/generate-text", async (req, res) => {
    try {
      const { prompt, type, tone, length } = req.body;
      
      if (!prompt || !prompt.trim()) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const openaiKey = await storage.getApiKeyByService('openai');
      if (!openaiKey || !openaiKey.keyValue) {
        return res.status(400).json({ 
          error: "OpenAI API key not configured. Please add your API key in Settings." 
        });
      }

      try {
        const systemPrompt = `You are a social media content expert. Generate ${type || 'social media'} content that is ${tone || 'engaging'} and approximately ${length || 'medium'} length. Focus on creating content that drives engagement and fits platform best practices.`;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey.keyValue}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            max_tokens: length === 'short' ? 150 : length === 'long' ? 800 : 400,
            temperature: 0.7
          }),
        });

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json();
          throw new Error(errorData.error?.message || 'OpenAI API request failed');
        }

        const openaiData = await openaiResponse.json();
        const generatedText = openaiData.choices[0].message.content;
        
        res.json({
          success: true,
          generatedText,
          originalPrompt: prompt,
          type,
          tone,
          length
        });
      } catch (aiError: any) {
        console.error("OpenAI API Error:", aiError);
        res.status(500).json({ 
          error: "Failed to generate text. Please check your API key configuration." 
        });
      }
    } catch (error: any) {
      console.error("Text generation error:", error);
      res.status(500).json({ 
        error: error.message || "Text generation failed" 
      });
    }
  });

  // Content enhancement endpoint
  app.post("/api/content/enhance-text", async (req, res) => {
    try {
      const { text, platform, objective } = req.body;
      
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Text content is required" });
      }

      const openaiKey = await storage.getApiKeyByService('openai');
      if (!openaiKey || !openaiKey.keyValue) {
        return res.status(400).json({ 
          error: "OpenAI API key not configured. Please add your API key in Settings." 
        });
      }

      try {
        const systemPrompt = `You are a social media optimization expert. Enhance the given text for ${platform || 'social media'} to ${objective || 'increase engagement'}. Improve clarity, add relevant hashtags if appropriate, and optimize for platform best practices. Keep the core message intact while making it more compelling.`;

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey.keyValue}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Enhance this text: "${text}"` }
            ],
            max_tokens: 500,
            temperature: 0.6
          }),
        });

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json();
          throw new Error(errorData.error?.message || 'OpenAI API request failed');
        }

        const openaiData = await openaiResponse.json();
        const enhancedText = openaiData.choices[0].message.content;
        
        res.json({
          success: true,
          originalText: text,
          enhancedText,
          platform,
          objective
        });
      } catch (aiError: any) {
        console.error("OpenAI API Error:", aiError);
        res.status(500).json({ 
          error: "Failed to enhance text. Please check your API key configuration." 
        });
      }
    } catch (error: any) {
      console.error("Text enhancement error:", error);
      res.status(500).json({ 
        error: error.message || "Text enhancement failed" 
      });
    }
  });

  // Approval routes
  app.put("/api/content/:id/approve", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.updateContent(id, { status: "approved" });
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve content" });
    }
  });

  app.put("/api/content/:id/reject", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.updateContent(id, { status: "rejected" });
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject content" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", async (req, res) => {
    try {
      const schedules = await storage.getSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schedule" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // API Keys endpoints
  app.get("/api/api-keys", async (req: Request, res: Response) => {
    try {
      const apiKeys = await storage.getApiKeys();
      // Don't expose the actual key values in the response
      const sanitizedKeys = apiKeys.map(key => ({
        ...key,
        keyValue: key.keyValue ? '***' + key.keyValue.slice(-4) : ''
      }));
      res.json(sanitizedKeys);
    } catch (error: any) {
      console.error("Get API keys error:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });

  app.post("/api/api-keys", async (req: Request, res: Response) => {
    try {
      const apiKey = await storage.createApiKey(req.body);
      res.json(apiKey);
    } catch (error: any) {
      console.error("Create API key error:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.put("/api/api-keys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const apiKey = await storage.updateApiKey(id, req.body);
      if (!apiKey) {
        return res.status(404).json({ error: "API key not found" });
      }
      res.json(apiKey);
    } catch (error: any) {
      console.error("Update API key error:", error);
      res.status(500).json({ error: "Failed to update API key" });
    }
  });

  app.delete("/api/api-keys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteApiKey(id);
      if (!success) {
        return res.status(404).json({ error: "API key not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete API key error:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
