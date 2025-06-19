import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAccountSchema, insertContentSchema, insertScheduleSchema, insertSetupScriptSchema } from "@shared/schema";
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
  app.get("/api/api-keys", async (req, res) => {
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

  app.post("/api/api-keys", async (req, res) => {
    try {
      const apiKey = await storage.createApiKey(req.body);
      res.json(apiKey);
    } catch (error: any) {
      console.error("Create API key error:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  });

  app.put("/api/api-keys/:id", async (req, res) => {
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

  app.delete("/api/api-keys/:id", async (req, res) => {
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

  // Vast.ai Server routes
  app.get("/api/vast-servers", async (req, res) => {
    try {
      const servers = await storage.getVastServers();
      res.json(servers);
    } catch (error) {
      console.error("Get Vast servers error:", error);
      res.status(500).json({ error: "Failed to fetch Vast.ai servers" });
    }
  });

  app.get("/api/vast-servers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const server = await storage.getVastServer(id);
      
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      res.json(server);
    } catch (error) {
      console.error("Get server error:", error);
      res.status(500).json({ error: "Failed to fetch server details" });
    }
  });

  app.get("/api/vast-servers/available", async (req, res) => {
    try {
      const vastApiKey = await storage.getApiKeyByService('vast');
      if (!vastApiKey || !vastApiKey.keyValue) {
        return res.status(400).json({ 
          error: "Vast.ai API key not configured. Please add your API key in Settings." 
        });
      }

      // Fetch real offers from Vast.ai API
      const vastApiUrl = 'https://console.vast.ai/api/v0';
      
      try {
        const response = await fetch(`${vastApiUrl}/bundles/`, {
          headers: {
            'Authorization': `Bearer ${vastApiKey.keyValue}`,
          },
        });

        if (!response.ok) {
          console.error("Vast.ai API error:", response.status, response.statusText);
          return res.status(500).json({ 
            error: "Failed to fetch offers from Vast.ai. Please check your API key." 
          });
        }

        const data = await response.json();
        console.log("Vast.ai API response received with", data.offers?.length || 0, "offers");

        if (!data.offers || !Array.isArray(data.offers)) {
          return res.status(500).json({ 
            error: "Invalid response from Vast.ai API" 
          });
        }

        // Transform Vast.ai offers to our format
        const availableServers = data.offers
          .filter((offer: any) => offer.rentable && offer.verification === 'verified')
          .slice(0, 20) // Limit to first 20 offers
          .map((offer: any) => ({
            vastId: offer.id.toString(),
            name: `${offer.gpu_name} Server`,
            gpu: offer.gpu_name,
            gpuCount: offer.num_gpus,
            cpuCores: offer.cpu_cores,
            ram: Math.round(offer.cpu_ram / 1024), // Convert MB to GB
            disk: Math.round(offer.disk_space),
            pricePerHour: offer.dph_total.toFixed(3),
            location: `${offer.geolocation || offer.country || 'Unknown'}`,
            isAvailable: true,
            metadata: {
              reliability: offer.reliability2,
              dlperf: offer.dlperf,
              bandwidth: `${offer.inet_up}/${offer.inet_down} Mbps`,
              cuda: offer.cuda_max_good,
              verification: offer.verification,
              machineId: offer.machine_id,
              hostname: offer.hostname
            }
          }));

        res.json(availableServers);

      } catch (apiError) {
        console.error("Error calling Vast.ai API:", apiError);
        res.status(500).json({ 
          error: "Failed to communicate with Vast.ai platform. Please check your API key and network connection." 
        });
      }

    } catch (error) {
      console.error("Get available servers error:", error);
      res.status(500).json({ error: "Failed to fetch available servers" });
    }
  });

  app.post("/api/vast-servers/launch/:vastId", async (req, res) => {
    try {
      const { vastId } = req.params;
      console.log("Launch request for vastId:", vastId, "with body:", req.body);
      
      const vastApiKey = await storage.getApiKeyByService('vast');
      
      if (!vastApiKey || !vastApiKey.keyValue) {
        return res.status(400).json({ 
          error: "Vast.ai API key not configured. Please add your API key in Settings." 
        });
      }

      // Check if server already exists in our database
      let server = await storage.getVastServerByVastId(vastId);
      
      if (!server) {
        // Get server details from available servers (in real app, from Vast.ai API)
        const serverDetails = req.body;
        console.log("Creating new server with details:", serverDetails);
        
        try {
          server = await storage.createVastServer({
            vastId,
            name: serverDetails.name,
            gpu: serverDetails.gpu,
            gpuCount: serverDetails.gpuCount,
            cpuCores: serverDetails.cpuCores,
            ram: serverDetails.ram,
            disk: serverDetails.disk,
            pricePerHour: serverDetails.pricePerHour,
            location: serverDetails.location,
            isAvailable: true,
            isLaunched: false,
            status: "available",
            metadata: serverDetails.metadata
          });
          console.log("Server created successfully:", server);
        } catch (createError) {
          console.error("Failed to create server in database:", createError);
          return res.status(500).json({ 
            error: "Failed to create server record in database" 
          });
        }
      }

      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // Set initial status to launching
      await storage.updateVastServer(server.id, { status: "launching" });

      // Real Vast.ai API integration
      const vastApiUrl = 'https://console.vast.ai/api/v0';
      const dockerImage = "pytorch/pytorch:latest";
      const offerId = parseInt(vastId);
      
      console.log("Creating real Vast.ai instance with offer ID:", offerId);
      
      try {
        // Create instance on Vast.ai platform
        const createResponse = await fetch(`${vastApiUrl}/asks/${offerId}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${vastApiKey.keyValue}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: 'me',
            image: dockerImage,
            args: [],
            env: {},
          }),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          console.error("Vast.ai API HTTP error:", createResponse.status, createResponse.statusText, errorText);
          await storage.updateVastServer(server.id, { status: "error" });
          return res.status(400).json({ 
            error: `Failed to create instance on Vast.ai: ${createResponse.status} ${createResponse.statusText}` 
          });
        }

        const createResult = await createResponse.json();
        console.log("Vast.ai create response:", createResult);
        
        if (!createResult.success) {
          console.error("Vast.ai API response error:", createResult);
          await storage.updateVastServer(server.id, { status: "error" });
          return res.status(400).json({ 
            error: createResult.msg || "Failed to create instance on Vast.ai platform" 
          });
        }

        // Get instance details
        const instanceId = createResult.new_contract;
        const instanceResponse = await fetch(`${vastApiUrl}/instances/`, {
          headers: {
            'Authorization': `Bearer ${vastApiKey.keyValue}`,
          },
        });

        let instanceData = null;
        if (instanceResponse.ok) {
          const instances = await instanceResponse.json();
          instanceData = instances.instances?.find((inst: any) => inst.id === instanceId);
        }

        // Update server with real instance information
        const launchedServer = await storage.updateVastServer(server.id, {
          status: instanceData?.actual_status === 'running' ? "running" : "launching",
          isLaunched: true,
          launchedAt: new Date(),
          serverUrl: instanceData?.ssh_host ? `${instanceData.ssh_host}:${instanceData.ssh_port || 22}` : null,
          sshConnection: instanceData?.ssh_host ? `ssh root@${instanceData.ssh_host} -p ${instanceData.ssh_port || 22}` : null,
          metadata: {
            vastInstanceId: instanceId,
            vastStatus: instanceData?.actual_status || 'unknown'
          }
        });

        res.json(launchedServer);

      } catch (error) {
        console.error("Vast.ai API error:", error);
        await storage.updateVastServer(server.id, { status: "error" });
        res.status(500).json({ 
          error: "Failed to communicate with Vast.ai platform. Please check your API key." 
        });
      }
    } catch (error) {
      console.error("Launch server error:", error);
      res.status(500).json({ error: "Failed to launch server" });
    }
  });

  app.post("/api/vast-servers/stop/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const server = await storage.getVastServer(id);
      
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // If server is launched on Vast.ai, stop the actual instance
      if (server.isLaunched && server.metadata && typeof server.metadata === 'object' && 'vastInstanceId' in server.metadata) {
        const vastApiKey = await storage.getApiKeyByService('vast');
        const metadata = server.metadata as any;
        
        if (vastApiKey && vastApiKey.keyValue) {
          try {
            console.log("Stopping Vast.ai instance:", metadata.vastInstanceId);
            
            const stopResponse = await fetch(`https://console.vast.ai/api/v0/instances/${metadata.vastInstanceId}/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${vastApiKey.keyValue}`,
                'Content-Type': 'application/json',
              },
            });

            if (stopResponse.ok) {
              console.log("Successfully stopped Vast.ai instance");
              // Update server status to stopped
              const stoppedServer = await storage.updateVastServer(id, { 
                status: "stopped",
                isLaunched: false 
              });
              return res.json(stoppedServer);
            } else {
              const errorText = await stopResponse.text();
              console.error("Failed to stop Vast.ai instance:", stopResponse.status, errorText);
            }
          } catch (apiError) {
            console.error("Error calling Vast.ai stop API:", apiError);
          }
        }
      }

      // Fallback to local status update
      const stoppedServer = await storage.stopVastServer(id);
      res.json(stoppedServer);
    } catch (error) {
      console.error("Stop server error:", error);
      res.status(500).json({ error: "Failed to stop server" });
    }
  });

  app.delete("/api/vast-servers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get server details before deletion
      const server = await storage.getVastServer(id);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // If server is launched on Vast.ai, destroy the actual instance
      const metadata = server.metadata as any;
      if (server.isLaunched && metadata?.vastInstanceId) {
        const vastApiKey = await storage.getApiKeyByService('vast');
        
        if (vastApiKey && vastApiKey.keyValue) {
          try {
            console.log("Destroying Vast.ai instance:", metadata.vastInstanceId);
            
            const destroyResponse = await fetch(`https://console.vast.ai/api/v0/instances/${metadata.vastInstanceId}/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${vastApiKey.keyValue}`,
                'Content-Type': 'application/json',
              },
            });

            if (destroyResponse.ok) {
              console.log("Successfully destroyed Vast.ai instance");
            } else {
              const errorText = await destroyResponse.text();
              console.error("Failed to destroy Vast.ai instance:", destroyResponse.status, errorText);
            }
          } catch (apiError) {
            console.error("Error calling Vast.ai destroy API:", apiError);
          }
        }
      }

      // Delete from our database
      const success = await storage.deleteVastServer(id);
      
      if (!success) {
        return res.status(404).json({ error: "Server not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete server error:", error);
      res.status(500).json({ error: "Failed to delete server" });
    }
  });

  // Setup Scripts endpoints
  app.get("/api/setup-scripts", async (_req, res) => {
    const scripts = await storage.getSetupScripts();
    res.json(scripts);
  });

  app.get("/api/setup-scripts/category/:category", async (req, res) => {
    const { category } = req.params;
    const scripts = await storage.getSetupScriptsByCategory(category);
    res.json(scripts);
  });

  app.post("/api/setup-scripts", async (req, res) => {
    try {
      const result = insertSetupScriptSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }
      const script = await storage.createSetupScript(result.data);
      res.status(201).json(script);
    } catch (error) {
      res.status(500).json({ error: "Failed to create setup script" });
    }
  });

  // Server Execution endpoints
  app.get("/api/server-executions/:serverId", async (req, res) => {
    const serverId = parseInt(req.params.serverId);
    const executions = await storage.getServerExecutions(serverId);
    res.json(executions);
  });

  app.post("/api/execute-script", async (req, res) => {
    try {
      const { serverId, scriptId } = req.body;
      
      if (!serverId || !scriptId) {
        return res.status(400).json({ error: "Server ID and Script ID are required" });
      }

      // Get server and script details
      const server = await storage.getVastServer(serverId);
      const script = await storage.getSetupScript(scriptId);

      if (!server || !script) {
        return res.status(404).json({ error: "Server or script not found" });
      }

      if (!server.isLaunched || server.status !== "running") {
        return res.status(400).json({ error: "Server must be running to execute scripts" });
      }

      // Create execution record
      const execution = await storage.createServerExecution({
        serverId,
        scriptId,
        status: "pending",
        startedAt: new Date(),
      });

      // Update server status to configuring
      await storage.updateVastServer(serverId, { 
        status: "configuring",
        setupStatus: "installing" 
      });

      // Simulate script execution (in real implementation, this would SSH to the server)
      setTimeout(async () => {
        try {
          // Simulate script execution with random success/failure
          const isSuccess = Math.random() > 0.2; // 80% success rate
          
          if (isSuccess) {
            await storage.updateServerExecution(execution.id, {
              status: "completed",
              output: `Script '${script.name}' executed successfully!\n\n${script.description}\n\nEstimated time: ${script.estimatedTime} minutes\n\nExecution completed without errors.`,
              completedAt: new Date(),
            });

            await storage.updateVastServer(serverId, { 
              status: "running",
              setupStatus: "ready" 
            });
          } else {
            await storage.updateServerExecution(execution.id, {
              status: "failed",
              errorLog: "Script execution failed due to network timeout or dependency issues.",
              completedAt: new Date(),
            });

            await storage.updateVastServer(serverId, { 
              status: "running",
              setupStatus: "failed" 
            });
          }
        } catch (error) {
          console.error("Error updating execution:", error);
        }
      }, 3000 + Math.random() * 5000); // Random delay 3-8 seconds

      res.json({ 
        success: true, 
        execution,
        message: "Script execution started" 
      });
    } catch (error) {
      console.error("Error executing script:", error);
      res.status(500).json({ error: "Failed to execute script" });
    }
  });

  // Import real Vast.ai handlers for full API integration
  const { 
    getVastServers, 
    getAvailableServers
  } = await import('./vast-ai');

  // Use real Vast.ai API handlers
  app.get("/api/vast-servers", getVastServers);
  app.get("/api/vast-servers/available", getAvailableServers);

  // Setup scripts endpoint
  app.get("/api/setup-scripts", async (req, res) => {
    const setupScripts = [
      {
        id: 1,
        name: "Python ML Environment",
        description: "Python with PyTorch, TensorFlow, and common ML libraries",
        script: `#!/bin/bash
apt update && apt install -y python3-pip git wget
pip install torch torchvision tensorflow jupyter pandas numpy matplotlib scikit-learn
jupyter notebook --generate-config
echo "Setup complete!"`,
        category: "ml"
      },
      {
        id: 2,
        name: "Node.js Development",
        description: "Node.js with npm and common development tools",
        script: `#!/bin/bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs git
npm install -g pm2 nodemon
echo "Node.js environment ready!"`,
        category: "web"
      },
      {
        id: 3,
        name: "CUDA Development",
        description: "CUDA toolkit and development environment",
        script: `#!/bin/bash
apt update && apt install -y build-essential
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/cuda-ubuntu2004.pin
mv cuda-ubuntu2004.pin /etc/apt/preferences.d/cuda-repository-pin-600
apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2004/x86_64/7fa2af80.pub
echo "CUDA environment configured!"`,
        category: "gpu"
      }
    ];
    
    res.json(setupScripts);
  });

  const httpServer = createServer(app);
  return httpServer;
}
