import { Express, Request, Response } from "express";
import { storage } from "../../storage.js";

export function comfyRoutes(app: Express) {
  // Import ComfyUI service functions
  const comfyService = require("./service.js");
  
  // ComfyUI model management
  app.get("/api/comfy/models", comfyService.getComfyModels);
  app.post("/api/comfy/models", comfyService.addComfyModel);
  app.delete("/api/comfy/models/:id", comfyService.deleteComfyModel);

  // Available models endpoint - temporarily disabled
  app.get("/api/comfy/:serverId/available-models", async (req: Request, res: Response) => {
    res.json({ message: "Available models endpoint under development" });
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

  // Installed models detection
  app.get("/api/comfy/models/:serverId/installed", async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      
      // Simulate installed models detection
      const installedModels = [
        { name: "sd_xl_base_1.0.safetensors", folder: "checkpoints", size: "6.46 GB" },
        { name: "v1-5-pruned-emaonly.ckpt", folder: "checkpoints", size: "4.27 GB" }
      ];

      res.json(installedModels);
    } catch (error) {
      console.error('Error fetching installed models:', error);
      res.status(500).json({ error: 'Failed to fetch installed models' });
    }
  });
}