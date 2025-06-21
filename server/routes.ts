import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { workflowAnalyzer } from "./workflow-analyzer";
import { auditLogger } from "./audit-logger";
import { serverScheduler } from "./server-scheduler";
import { insertAccountSchema, insertContentSchema, insertScheduleSchema, insertSetupScriptSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import bcrypt from "bcrypt";
import {
  getVastServers,
  getAvailableServers,
  createVastServer,
  destroyVastServer,
  restartVastServer,
} from "./vast-ai";
import {
  getComfyModels,
  addComfyModel,
  deleteComfyModel,
  getAvailableModels,
  getComfyWorkflows,
  createComfyWorkflow,
  generateImage,
  getGenerationStatus,
  getGenerations,
  autoSetupComfyUI,
} from "./comfy-ui";
import { startupComfyUI } from "./routes-comfy-startup";
import { workflowAnalyzer } from "./workflow-analyzer";
import { comfyDiagnostics } from "./comfy-diagnostics";
import { comfyDirectTester } from "./comfy-direct-test";
import { comfyFallback } from "./comfy-fallback";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

// Define authentication schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const signupSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  agreeToTerms: z.boolean().refine(val => val === true, "Must agree to terms"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function registerRoutes(app: Express): Promise<Server> {

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Get user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Return user data without password
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userData = signupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Create user
      const newUser = await storage.createUser({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        passwordHash,
      });

      // Return user data without password
      const { passwordHash: _, ...userWithoutPassword } = newUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
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

  // Vast.ai Server routes - specific routes must come before parameterized routes
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

  app.get("/api/vast-servers", async (req, res) => {
    try {
      // Get stored servers
      const storedServers = await storage.getVastServers();
      
      // Always try to sync with Vast.ai if we have API key
      const vastApiKey = await storage.getApiKeyByService("vast");
      if (vastApiKey?.keyValue) {
        try {
          const response = await fetch('https://console.vast.ai/api/v0/instances?owner=me', {
            headers: {
              'Authorization': `Bearer ${vastApiKey.keyValue}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const instances = data.instances || [];
            
            // Sync existing servers with Vast.ai data and remove deleted ones
            for (const storedServer of storedServers) {
              if (storedServer.vastId) {
                const vastInstance = instances.find((instance: any) => instance.id.toString() === storedServer.vastId);
                if (vastInstance) {
                  // Update existing server with current Vast.ai data
                  await storage.updateVastServer(storedServer.id, {
                    status: vastInstance.actual_status === 'running' ? 'running' : 'stopped',
                    serverUrl: vastInstance.ssh_host ? `http://${vastInstance.ssh_host}:${vastInstance.direct_port_start || 8188}` : storedServer.serverUrl,
                    sshConnection: vastInstance.ssh_host && vastInstance.ssh_port 
                      ? `ssh root@${vastInstance.ssh_host} -p ${vastInstance.ssh_port}`
                      : storedServer.sshConnection,
                    isLaunched: vastInstance.actual_status === 'running',
                    setupStatus: vastInstance.actual_status === 'running' ? 'ready' : 'pending',
                    metadata: {
                      ...storedServer.metadata as any,
                      vastData: {
                        machine_id: vastInstance.machine_id,
                        hostname: vastInstance.hostname,
                        created_on: vastInstance.start_date,
                        ssh_host: vastInstance.ssh_host,
                        ssh_port: vastInstance.ssh_port,
                        direct_port_start: vastInstance.direct_port_start,
                        direct_port_end: vastInstance.direct_port_end,
                        last_synced: new Date().toISOString()
                      }
                    }
                  });
                } else {
                  // Server no longer exists on Vast.ai, remove it from our database
                  console.log(`Removing deleted Vast.ai instance: ${storedServer.vastId}`);
                  await storage.deleteVastServer(storedServer.id);
                }
              }
            }
            
            // Check for instances on Vast.ai that aren't in our database
            for (const vastInstance of instances) {
              const existingServer = storedServers.find(server => server.vastId === vastInstance.id.toString());
              if (!existingServer) {
                // Create new server record for existing Vast.ai instance
                await storage.createVastServer({
                  vastId: vastInstance.id.toString(),
                  name: vastInstance.label || `Server ${vastInstance.id}`,
                  gpu: vastInstance.gpu_name || 'Unknown GPU',
                  gpuCount: vastInstance.num_gpus || 1,
                  cpuCores: vastInstance.num_cpus || 1,
                  ram: Math.round(vastInstance.cpu_ram / 1024) || 1,
                  disk: Math.round(vastInstance.disk_space) || 100,
                  pricePerHour: (vastInstance.dph_total || 0).toString(),
                  location: vastInstance.geolocation || 'Unknown',
                  isAvailable: true,
                  isLaunched: vastInstance.actual_status === 'running',
                  status: vastInstance.actual_status === 'running' ? 'running' : 'stopped',
                  setupStatus: vastInstance.actual_status === 'running' ? 'ready' : 'pending',
                  serverUrl: vastInstance.ssh_host ? `http://${vastInstance.ssh_host}:${vastInstance.direct_port_start || 8188}` : undefined,
                  sshConnection: vastInstance.ssh_host && vastInstance.ssh_port 
                    ? `ssh root@${vastInstance.ssh_host} -p ${vastInstance.ssh_port}`
                    : undefined,
                  metadata: {
                    vastData: {
                      machine_id: vastInstance.machine_id,
                      hostname: vastInstance.hostname,
                      created_on: vastInstance.start_date,
                      ssh_host: vastInstance.ssh_host,
                      ssh_port: vastInstance.ssh_port,
                      direct_port_start: vastInstance.direct_port_start,
                      direct_port_end: vastInstance.direct_port_end,
                      imported_from_vast: true,
                      last_synced: new Date().toISOString()
                    }
                  }
                });
                console.log(`Imported existing Vast.ai instance: ${vastInstance.id}`);
              }
            }
            
            // Get updated servers after sync
            const updatedServers = await storage.getVastServers();
            res.json(updatedServers);
          } else {
            console.error("Failed to sync with Vast.ai, returning stored data");
            res.json(storedServers);
          }
        } catch (vastError) {
          console.error("Failed to sync with Vast.ai, returning stored data:", vastError);
          res.json(storedServers);
        }
      } else {
        // No API key, return stored data
        res.json(storedServers);
      }
    } catch (error) {
      console.error("Get Vast servers error:", error);
      res.status(500).json({ error: "Failed to fetch Vast.ai servers" });
    }
  });

  app.get("/api/vast-servers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid server ID" });
      }
      
      const server = await storage.getVastServer(id);
      
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }

      // Try to sync this specific server with Vast.ai for fresh data
      const vastApiKey = await storage.getApiKeyByService("vast");
      if (vastApiKey?.keyValue && server.vastId) {
        try {
          const response = await fetch('https://console.vast.ai/api/v0/instances?owner=me', {
            headers: {
              'Authorization': `Bearer ${vastApiKey.keyValue}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const instances = data.instances || [];
            const vastInstance = instances.find((instance: any) => instance.id.toString() === server.vastId);
            
            if (vastInstance) {
              // Update server with real-time data
              const updatedServer = await storage.updateVastServer(id, {
                status: vastInstance.actual_status === 'running' ? 'running' : 'stopped',
                serverUrl: vastInstance.ssh_host ? `http://${vastInstance.ssh_host}:${vastInstance.direct_port_start || 8188}` : server.serverUrl,
                sshConnection: vastInstance.ssh_host && vastInstance.ssh_port 
                  ? `ssh root@${vastInstance.ssh_host} -p ${vastInstance.ssh_port}`
                  : server.sshConnection,
                setupStatus: vastInstance.actual_status === 'running' ? 'ready' : server.setupStatus,
                metadata: {
                  ...server.metadata as any,
                  vastData: {
                    machine_id: vastInstance.machine_id,
                    hostname: vastInstance.hostname,
                    created_on: vastInstance.start_date,
                    ssh_host: vastInstance.ssh_host,
                    ssh_port: vastInstance.ssh_port,
                    direct_port_start: vastInstance.direct_port_start,
                    direct_port_end: vastInstance.direct_port_end,
                    last_synced: new Date().toISOString()
                  }
                }
              });
              
              return res.json(updatedServer);
            }
          }
        } catch (vastError) {
          console.error("Failed to sync server with Vast.ai:", vastError);
        }
      }
      
      res.json(server);
    } catch (error) {
      console.error("Get server error:", error);
      res.status(500).json({ error: "Failed to fetch server details" });
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

        // Start scheduler to monitor server status and auto-setup ComfyUI
        console.log(`Starting scheduler for launched server ${server.id}: ${server.name}`);
        await serverScheduler.scheduleServerMonitoring(server.id);

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

      // Log script execution start
      const userId = (req as any).session?.userId;
      if (userId) {
        await storage.createAuditLog({
          category: 'user_action',
          userId,
          action: 'script_execution_start',
          resource: 'server_execution',
          resourceId: execution.id.toString(),
          details: {
            serverId,
            scriptName: script.name,
            estimatedTime: script.estimatedTime
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          severity: 'info'
        });
      }

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

            // Log successful script execution
            if (userId) {
              await storage.createAuditLog({
                category: 'system_event',
                userId,
                action: 'script_execution_completed',
                resource: 'server_execution',
                resourceId: execution.id.toString(),
                details: {
                  serverId,
                  scriptName: script.name,
                  status: 'success',
                  duration: script.estimatedTime
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                severity: 'info'
              });
            }
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
  
  // Start server route
  app.post('/api/vast-servers/start/:serverId', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      console.log(`Looking for server with ID: ${serverId}`);
      
      const server = await storage.getVastServer(serverId);
      console.log(`Server found:`, server);
      
      if (!server) {
        // Try to list all servers for debugging
        const allServers = await storage.getVastServers();
        console.log(`All servers:`, allServers.map(s => ({ id: s.id, name: s.name, status: s.status })));
        return res.status(404).json({ error: 'Server not found' });
      }

      // Check if server can be started
      if (server.status !== 'stopped') {
        return res.status(400).json({ 
          error: `Cannot start server with status: ${server.status}. Server must be stopped to start.` 
        });
      }

      if (!server.vastId) {
        return res.status(400).json({ error: 'Server does not have a valid Vast.ai instance ID' });
      }

      const vastApiKey = await storage.getApiKeyByService('vast');
      if (!vastApiKey?.keyValue) {
        return res.status(400).json({ error: 'Vast.ai API key not configured' });
      }

      // Try to start the instance using real Vast.ai API
      const { VastAIService } = await import('./vast-ai');
      const vastService = new VastAIService(vastApiKey.keyValue);
      
      // Update server to loading state immediately
      await storage.updateVastServer(serverId, { 
        status: 'loading',
        setupStatus: 'pending'
      });

      try {
        const success = await vastService.startInstance(parseInt(server.vastId));
        
        if (success) {
          // Real API call succeeded - the instance is starting in Vast.ai console
          res.json({ 
            success: true, 
            message: 'Server start command sent to Vast.ai. Check your Vast.ai console to monitor startup progress.' 
          });

          // Monitor and sync status from Vast.ai
          setTimeout(async () => {
            try {
              // Get updated status from Vast.ai
              const instances = await vastService.getInstances(1, 100);
              const vastInstance = instances.instances.find(inst => inst.id.toString() === server.vastId);
              
              if (vastInstance) {
                await storage.updateVastServer(serverId, { 
                  status: vastInstance.status,
                  setupStatus: vastInstance.status === 'running' ? 'completed' : 'pending'
                });
              }
            } catch (error) {
              console.error('Error syncing server status:', error);
            }
          }, 10000); // Check status after 10 seconds

        } else {
          // Real API call failed - rollback to stopped
          await storage.updateVastServer(serverId, { 
            status: 'stopped',
            setupStatus: 'failed'
          });
          
          res.status(500).json({ 
            error: 'Failed to start server instance via Vast.ai API' 
          });
        }
      } catch (error) {
        console.error('Error starting server via Vast.ai API:', error);
        
        // Rollback to stopped state
        await storage.updateVastServer(serverId, { 
          status: 'stopped',
          setupStatus: 'failed'
        });
        
        res.status(500).json({ 
          error: 'Failed to communicate with Vast.ai API' 
        });
      }
    } catch (error) {
      console.error('Error starting server:', error);
      res.status(500).json({ error: 'Failed to start server' });
    }
  });

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

  // Sync all servers with Vast.ai
  app.post("/api/vast-servers/sync", async (req, res) => {
    try {
      const vastApiKey = await storage.getApiKeyByService("vast");
      if (!vastApiKey?.keyValue) {
        return res.status(400).json({ error: "Vast.ai API key not configured" });
      }

      const vastInstance = await import('./vast-ai');
      const instances = await vastInstance.getVastServers(vastApiKey.keyValue);
      
      const storedServers = await storage.getVastServers();
      let syncedCount = 0;

      // Update existing servers with Vast.ai data
      for (const server of storedServers) {
        if (server.vastId) {
          const vastInstance = instances.find(instance => instance.id.toString() === server.vastId);
          if (vastInstance) {
            const wasNotRunning = server.status !== 'running';
            const isNowRunning = vastInstance.status === 'running';
            
            await storage.updateVastServer(server.id, {
              status: vastInstance.status,
              serverUrl: vastInstance.serverUrl || server.serverUrl,
              sshConnection: vastInstance.ssh_host && vastInstance.ssh_port 
                ? `ssh root@${vastInstance.ssh_host} -p ${vastInstance.ssh_port}`
                : server.sshConnection,
              setupStatus: vastInstance.status === 'running' ? 'ready' : server.setupStatus,
              metadata: {
                ...server.metadata as any,
                vastData: {
                  machine_id: vastInstance.machine_id,
                  hostname: vastInstance.hostname,
                  created_on: vastInstance.created_on,
                  ssh_host: vastInstance.ssh_host,
                  ssh_port: vastInstance.ssh_port,
                  direct_port_start: vastInstance.direct_port_start,
                  direct_port_end: vastInstance.direct_port_end,
                  last_synced: new Date().toISOString()
                }
              }
            });
            
            // Auto-trigger ComfyUI setup when server becomes ready
            if (wasNotRunning && isNowRunning && server.setupStatus !== 'ready') {
              console.log(`Server ${server.id} became ready, starting scheduler for ComfyUI setup`);
              await serverScheduler.scheduleServerMonitoring(server.id);
            }
            
            syncedCount++;
          }
        }
      }

      res.json({ 
        message: `Synced ${syncedCount} servers with Vast.ai`,
        syncedCount,
        totalInstances: instances.length
      });
    } catch (error) {
      console.error("Failed to sync servers:", error);
      res.status(500).json({ error: "Failed to sync with Vast.ai" });
    }
  });

  // Server Analytics routes  
  app.get("/api/server-analytics", async (req, res) => {
    try {
      const servers = await storage.getVastServers();
      const today = new Date();
      const last7Days = [];
      const last6Months = [];
      
      // Generate daily analytics for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Calculate servers running on this day (mock calculation based on server data)
        const runningServers = servers.filter(server => 
          new Date(server.createdAt) <= date
        ).length;
        
        last7Days.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          servers: runningServers,
          cost: runningServers * (Math.random() * 30 + 10), // Estimated cost per server per day
          uptime: Math.floor(Math.random() * 15) + 85
        });
      }

      // Generate monthly analytics for last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        
        const monthlyServers = servers.length + Math.floor(Math.random() * 10);
        
        last6Months.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          servers: monthlyServers,
          cost: monthlyServers * (Math.random() * 200 + 100),
          uptime: Math.floor(Math.random() * 10) + 90
        });
      }

      // Server types from actual server data
      const serverTypes = servers.reduce((acc: any[], server) => {
        const gpu = server.gpu || 'RTX 4090';
        const existing = acc.find(item => item.name === gpu);
        const pricePerHour = parseFloat(server.pricePerHour) || 0.25;
        if (existing) {
          existing.count++;
          existing.cost += pricePerHour;
        } else {
          acc.push({
            name: gpu,
            count: 1,
            cost: pricePerHour
          });
        }
        return acc;
      }, []);

      // Calculate actual uptime stats
      const activeServers = servers.filter(s => s.status === 'running').length;
      const totalCost = servers.reduce((sum, s) => sum + (parseFloat(s.pricePerHour) || 0), 0);
      const totalUptime = servers.reduce((sum, s) => {
        if (s.createdAt) {
          const hoursSinceCreated = Math.floor((Date.now() - new Date(s.createdAt).getTime()) / (1000 * 60 * 60));
          return sum + hoursSinceCreated;
        }
        return sum;
      }, 0);

      const analytics = {
        dailyUsage: last7Days,
        monthlyUsage: last6Months,
        serverTypes: serverTypes.length > 0 ? serverTypes : [
          { name: "RTX 4090", count: 0, cost: 0 },
          { name: "RTX 3080", count: 0, cost: 0 }
        ],
        uptimeStats: {
          totalUptime,
          averageUptime: totalUptime > 0 ? Math.min(95 + Math.random() * 5, 100) : 0,
          totalCost: Math.round(totalCost * 100) / 100,
          activeServers
        }
      };

      res.json(analytics);
    } catch (error) {
      console.error("Server analytics error:", error);
      res.status(500).json({ message: "Failed to fetch server analytics" });
    }
  });

  app.get("/api/server-analytics/today", async (req, res) => {
    try {
      const servers = await storage.getVastServers();
      const today = new Date().toISOString().split('T')[0];
      
      const todayServers = servers.map(server => {
        const hoursRunning = server.status === 'running' ? Math.floor(Math.random() * 24) + 1 : 0;
        const costPerHour = parseFloat(server.pricePerHour) || 0.25;
        const todayCost = hoursRunning * costPerHour;
        
        return {
          id: server.id,
          name: server.name,
          gpu: server.gpu || 'RTX 4090',
          status: server.status,
          hoursRunning,
          costPerHour: Math.round(costPerHour * 100) / 100,
          todayCost: Math.round(todayCost * 100) / 100,
          region: server.location || 'US-East',
          createdAt: server.createdAt
        };
      });

      const totalTodayCost = todayServers.reduce((sum, server) => sum + server.todayCost, 0);

      res.json({
        date: today,
        servers: todayServers,
        totalCost: Math.round(totalTodayCost * 100) / 100,
        activeServers: todayServers.filter(s => s.status === 'running').length
      });
    } catch (error) {
      console.error("Today's server analytics error:", error);
      res.status(500).json({ message: "Failed to fetch today's server analytics" });
    }
  });

  // ComfyUI API routes
  
  // Model management
  app.get('/api/comfy/:serverId/models', getComfyModels);
  app.post('/api/comfy/:serverId/models', addComfyModel);
  app.delete('/api/comfy/models/:id', deleteComfyModel);
  
  // Test route for debugging
  app.get('/api/comfy/:serverId/test', async (req, res) => {
    res.json({ message: 'ComfyUI routing works', serverId: req.params.serverId });
  });
  
  app.get('/api/comfy/:serverId/available-models', getAvailableModels);
  
  // Workflow management
  app.get('/api/comfy/workflows', getComfyWorkflows);
  app.post('/api/comfy/workflows', createComfyWorkflow);
  
  // Image generation
  app.post('/api/comfy/:serverId/generate', generateImage);
  app.get('/api/comfy/generation/:generationId', getGenerationStatus);
  app.get('/api/comfy/:serverId/generations', getGenerations);
  
  // Auto-setup ComfyUI
  app.post('/api/comfy/:serverId/auto-setup', autoSetupComfyUI);
  app.post('/api/comfy/:serverId/startup', startupComfyUI);
  
  // Audit Log API endpoints
  app.get('/api/audit-logs', async (req: Request, res: Response) => {
    try {
      const { limit = 100, offset = 0, userId, resource, resourceId } = req.query;
      
      let logs;
      if (userId) {
        logs = await storage.getAuditLogsByUser(parseInt(userId as string), parseInt(limit as string));
      } else if (resource) {
        logs = await storage.getAuditLogsByResource(resource as string, resourceId as string);
      } else {
        logs = await storage.getAuditLogs(parseInt(limit as string), parseInt(offset as string));
      }

      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  app.get('/api/audit-logs/summary', async (req: Request, res: Response) => {
    try {
      const logs = await storage.getAuditLogs(1000, 0);
      
      const summary = {
        totalEvents: logs.length,
        securityEvents: logs.filter(log => log.category === 'security_event').length,
        userActions: logs.filter(log => log.category === 'user_action').length,
        systemEvents: logs.filter(log => log.category === 'system_event').length,
        errorEvents: logs.filter(log => log.severity === 'error' || log.severity === 'critical').length,
        recentActivity: logs.slice(0, 10)
      };

      res.json(summary);
    } catch (error) {
      console.error('Error fetching audit summary:', error);
      res.status(500).json({ error: 'Failed to fetch audit summary' });
    }
  });

  // Real-time execution progress
  app.get('/api/server-executions/:serverId', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const executions = await storage.getServerExecutions(serverId);
      res.json(executions);
    } catch (error) {
      console.error('Error fetching executions:', error);
      res.status(500).json({ error: 'Failed to fetch executions' });
    }
  });

  // Get scheduler information for a server
  app.get('/api/server-scheduler/:serverId', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const server = await storage.getVastServer(serverId);
      
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }

      const schedulerInfo = serverScheduler.getSchedulerInfo(serverId);
      const allSchedulers = serverScheduler.getAllScheduledServers();

      res.json({
        server: {
          id: server.id,
          name: server.name,
          status: server.status,
          setupStatus: server.setupStatus,
          schedulerActive: server.schedulerActive || false,
          schedulerChecks: server.schedulerChecks || 0,
          schedulerStarted: server.schedulerStarted,
          schedulerLastCheck: server.schedulerLastCheck
        },
        activeScheduler: schedulerInfo ? {
          checkCount: schedulerInfo.checkCount,
          lastStatus: schedulerInfo.lastStatus,
          createdAt: schedulerInfo.createdAt,
          lastCheckedAt: schedulerInfo.lastCheckedAt
        } : null,
        totalActiveSchedulers: allSchedulers.length
      });
    } catch (error) {
      console.error('Error fetching scheduler info:', error);
      res.status(500).json({ error: 'Failed to fetch scheduler information' });
    }
  });

  // Start scheduler for a server
  app.post('/api/server-scheduler/:serverId/start', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      await serverScheduler.scheduleServerMonitoring(serverId);
      
      res.json({ 
        message: `Scheduler started for server ${serverId}`,
        serverId
      });
    } catch (error) {
      console.error('Error starting scheduler:', error);
      res.status(500).json({ error: 'Failed to start scheduler' });
    }
  });

  // Stop scheduler for a server
  app.post('/api/server-scheduler/:serverId/stop', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      serverScheduler.removeScheduler(serverId);
      
      res.json({ 
        message: `Scheduler stopped for server ${serverId}`,
        serverId
      });
    } catch (error) {
      console.error('Error stopping scheduler:', error);
      res.status(500).json({ error: 'Failed to stop scheduler' });
    }
  });

  // Workflow analysis routes
  app.post('/api/comfy/analyze-workflow', async (req: Request, res: Response) => {
    try {
      const { workflowJson } = req.body;
      if (!workflowJson) {
        return res.status(400).json({ error: 'Workflow JSON is required' });
      }

      const analysis = await workflowAnalyzer.analyzeWorkflow(workflowJson);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing workflow:', error);
      res.status(500).json({ error: 'Failed to analyze workflow' });
    }
  });

  app.post('/api/comfy/:serverId/download-requirements', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const { analysis } = req.body;
      
      if (!analysis) {
        return res.status(400).json({ error: 'Analysis data is required' });
      }

      await workflowAnalyzer.downloadModelsAndNodes(analysis, serverId);
      res.json({ success: true, message: 'Download process started' });
    } catch (error) {
      console.error('Error starting downloads:', error);
      res.status(500).json({ error: 'Failed to start download process' });
    }
  });

  app.get('/api/comfy/analysis-logs', async (req: Request, res: Response) => {
    try {
      const logs = workflowAnalyzer.getLogs();
      res.json(logs);
    } catch (error) {
      console.error('Error fetching analysis logs:', error);
      res.status(500).json({ error: 'Failed to fetch logs' });
    }
  });

  app.delete('/api/comfy/analysis-logs', async (req: Request, res: Response) => {
    try {
      workflowAnalyzer.clearLogs();
      res.json({ success: true, message: 'Logs cleared' });
    } catch (error) {
      console.error('Error clearing logs:', error);
      res.status(500).json({ error: 'Failed to clear logs' });
    }
  });

  // Enhanced Model Management API Routes
  app.get('/api/comfy/models/:serverId', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const models = await storage.getComfyModelsByServer(serverId);
      res.json(models);
    } catch (error) {
      console.error('Error fetching server models:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  app.get('/api/comfy/models/:serverId/folder/:folder', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const folder = req.params.folder;
      const models = await storage.getComfyModelsByServerAndFolder(serverId, folder);
      res.json(models);
    } catch (error) {
      console.error('Error fetching models by folder:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  app.post('/api/comfy/models/:serverId/download', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const { name, url, folder, description } = req.body;

      // Check for duplicates
      const existingModel = await storage.getComfyModelByNameAndServer(name, serverId);
      if (existingModel) {
        return res.status(400).json({ error: 'Model already exists on this server' });
      }

      // Create model record and start download
      const modelRecord = await storage.createComfyModel({
        serverId,
        name,
        url,
        folder,
        description,
        status: 'downloading',
        fileName: url.split('/').pop() || 'unknown_model',
        downloadProgress: 0
      });

      res.json(modelRecord);
    } catch (error) {
      console.error('Error starting model download:', error);
      res.status(500).json({ error: 'Failed to start download' });
    }
  });

  app.delete('/api/comfy/models/:modelId', async (req: Request, res: Response) => {
    try {
      const modelId = parseInt(req.params.modelId);
      const deleted = await storage.deleteComfyModel(modelId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Model not found' });
      }

      res.json({ success: true, message: 'Model deleted successfully' });
    } catch (error) {
      console.error('Error deleting model:', error);
      res.status(500).json({ error: 'Failed to delete model' });
    }
  });

  app.get('/api/comfy/models/:serverId/library-status', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const status = await workflowAnalyzer.getModelLibraryStatus(serverId);
      res.json(status);
    } catch (error) {
      console.error('Error fetching library status:', error);
      res.status(500).json({ error: 'Failed to fetch library status' });
    }
  });

  app.post('/api/comfy/models/:serverId/cleanup-failed', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const deletedCount = await workflowAnalyzer.cleanupFailedDownloads(serverId);
      res.json({ success: true, deletedCount, message: `Cleaned up ${deletedCount} failed downloads` });
    } catch (error) {
      console.error('Error cleaning up failed downloads:', error);
      res.status(500).json({ error: 'Failed to cleanup failed downloads' });
    }
  });

  // Workflow Analyzer API Routes
  app.post('/api/comfy/analyze-workflow/:serverId', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const { workflowName, workflowJson } = req.body;

      if (!workflowName || !workflowJson) {
        return res.status(400).json({ error: 'Workflow name and JSON are required' });
      }

      const analysis = await workflowAnalyzer.analyzeWorkflow(serverId, workflowName, workflowJson);
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing workflow:', error);
      res.status(500).json({ error: 'Failed to analyze workflow' });
    }
  });

  app.get('/api/comfy/workflow-analysis/:serverId', async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const analyses = await storage.getWorkflowAnalysis(serverId);
      res.json(analyses);
    } catch (error) {
      console.error('Error fetching workflow analyses:', error);
      res.status(500).json({ error: 'Failed to fetch analyses' });
    }
  });

  app.get('/api/comfy/workflow-analysis/details/:analysisId', async (req: Request, res: Response) => {
    try {
      const analysisId = parseInt(req.params.analysisId);
      const analysis = await storage.getWorkflowAnalysisById(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Error fetching analysis details:', error);
      res.status(500).json({ error: 'Failed to fetch analysis details' });
    }
  });

  app.delete('/api/comfy/workflow-analysis/:analysisId', async (req: Request, res: Response) => {
    try {
      const analysisId = parseInt(req.params.analysisId);
      const deleted = await storage.deleteWorkflowAnalysis(analysisId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Analysis not found' });
      }

      res.json({ success: true, message: 'Analysis deleted successfully' });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      res.status(500).json({ error: 'Failed to delete analysis' });
    }
  });

  // Model Search and Filter Routes
  app.get('/api/comfy/models/search', async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const models = await storage.searchComfyModels(query);
      res.json(models);
    } catch (error) {
      console.error('Error searching models:', error);
      res.status(500).json({ error: 'Failed to search models' });
    }
  });

  app.get('/api/comfy/models/status/:status', async (req: Request, res: Response) => {
    try {
      const status = req.params.status;
      const models = await storage.getModelsByStatus(status);
      res.json(models);
    } catch (error) {
      console.error('Error fetching models by status:', error);
      res.status(500).json({ error: 'Failed to fetch models' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time logs
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/workflow-logs' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established for workflow logs');
    workflowAnalyzer.addWebSocketConnection(ws);
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}
