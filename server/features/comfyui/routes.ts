import { Express, Request, Response } from "express";
import { storage } from "../../storage.js";
import * as comfyService from "./service.js";

export function comfyRoutes(app: Express) {
  // ComfyUI model management - authentic API only
  app.get("/api/comfy/models", comfyService.getComfyModels);
  app.post("/api/comfy/models", comfyService.addComfyModel);
  app.delete("/api/comfy/models/:id", comfyService.deleteComfyModel);
  
  // Image generation - authentic API only
  app.post("/api/comfy/:serverId/generate", comfyService.generateImage);
  app.get("/api/comfy/generations/:id/status", comfyService.getGenerationStatus);
  app.get("/api/comfy/generations", comfyService.getGenerations);
  
  // ComfyUI setup - authentic API only
  app.post("/api/comfy/:serverId/setup", comfyService.autoSetupComfyUI);
  
  // Workflows - authentic API only
  app.get("/api/comfy/workflows", comfyService.getComfyWorkflows);
  app.post("/api/comfy/workflows", comfyService.createComfyWorkflow);

  // Available models endpoint - connect to real ComfyUI API
  app.get("/api/comfy/:serverId/available-models", async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const server = await storage.getVastServer(serverId);
      
      if (!server || !server.serverUrl) {
        return res.status(404).json({ error: 'Server not found or not running' });
      }

      const serverHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
      const comfyUrl = `http://${serverHost}:8188`;
      
      try {
        const response = await fetch(`${comfyUrl}/object_info`, { 
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
          throw new Error(`ComfyUI API responded with status ${response.status}`);
        }
        
        const objectInfo = await response.json();
        const availableModels = [];
        
        // Extract available model slots from ComfyUI API
        if (objectInfo.CheckpointLoaderSimple && objectInfo.CheckpointLoaderSimple.input) {
          const checkpoints = objectInfo.CheckpointLoaderSimple.input.required.ckpt_name[0] || [];
          checkpoints.forEach((model: string) => {
            availableModels.push({
              name: model,
              folder: "checkpoints",
              type: "checkpoint",
              installed: true
            });
          });
        }

        res.json({ models: availableModels });
      } catch (fetchError) {
        console.error('Failed to connect to ComfyUI API:', fetchError);
        res.status(503).json({ 
          error: 'ComfyUI not accessible',
          message: 'Unable to connect to ComfyUI API to fetch available models',
          serverUrl: comfyUrl
        });
      }
    } catch (error) {
      console.error('Error fetching available models:', error);
      res.status(500).json({ error: 'Failed to fetch available models' });
    }
  });

  // Workflow management
  app.get("/api/comfy/workflows", comfyService.getComfyWorkflows);
  app.post("/api/comfy/workflows", comfyService.createComfyWorkflow);

  // Image generation
  app.post("/api/comfy/:serverId/generate", comfyService.generateImage);
  app.get("/api/comfy/generations/:id/status", comfyService.getGenerationStatus);
  app.get("/api/comfy/generations", comfyService.getGenerations);

  // ComfyUI setup and management
  app.post("/api/comfy/:serverId/setup", comfyService.autoSetupComfyUI);

  // Models by server
  app.get("/api/comfy/models/:serverId", async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const models = await storage.getComfyModelsByServer(serverId);
      res.json(models);
    } catch (error) {
      console.error('Error fetching ComfyUI models:', error);
      res.status(500).json({ error: 'Failed to fetch ComfyUI models' });
    }
  });

  // Model library status
  app.get("/api/comfy/models/:serverId/library-status", async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const models = await storage.getComfyModelsByServer(serverId);
      
      const totalModels = models.length;
      const readyModels = models.filter(m => m.status === 'completed').length;
      const downloadingModels = models.filter(m => m.status === 'running').length;
      const failedModels = models.filter(m => m.status === 'failed').length;

      res.json({
        totalModels,
        readyModels,
        downloadingModels,
        failedModels,
        isReady: readyModels > 0
      });
    } catch (error) {
      console.error('Error fetching model library status:', error);
      res.status(500).json({ error: 'Failed to fetch model library status' });
    }
  });

  // Installed models detection - connect to real ComfyUI API
  app.get("/api/comfy/models/:serverId/installed", async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const server = await storage.getVastServer(serverId);
      
      if (!server || !server.serverUrl) {
        return res.status(404).json({ error: 'Server not found or not running' });
      }

      // Connect to actual ComfyUI models API
      const serverHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
      const comfyUrl = `http://${serverHost}:8188`;
      
      try {
        const response = await fetch(`${comfyUrl}/object_info`, { 
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
          throw new Error(`ComfyUI API responded with status ${response.status}`);
        }
        
        const objectInfo = await response.json();
        const installedModels = [];
        
        // Extract actual model information from ComfyUI API
        if (objectInfo.CheckpointLoaderSimple && objectInfo.CheckpointLoaderSimple.input) {
          const checkpoints = objectInfo.CheckpointLoaderSimple.input.required.ckpt_name[0] || [];
          checkpoints.forEach((model: string) => {
            installedModels.push({
              name: model,
              folder: "checkpoints",
              type: "checkpoint"
            });
          });
        }
        
        if (objectInfo.LoraLoader && objectInfo.LoraLoader.input) {
          const loras = objectInfo.LoraLoader.input.required.lora_name[0] || [];
          loras.forEach((model: string) => {
            installedModels.push({
              name: model,
              folder: "loras", 
              type: "lora"
            });
          });
        }

        res.json(installedModels);
      } catch (fetchError) {
        console.error('Failed to connect to ComfyUI API:', fetchError);
        res.status(503).json({ 
          error: 'ComfyUI not accessible',
          message: 'Unable to connect to ComfyUI API on the server',
          serverUrl: comfyUrl
        });
      }
    } catch (error) {
      console.error('Error fetching installed models:', error);
      res.status(500).json({ error: 'Failed to fetch installed models' });
    }
  });
}