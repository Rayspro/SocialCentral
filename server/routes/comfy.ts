import { Express, Request, Response } from "express";
import { 
  getComfyModels,
  addComfyModel,
  deleteComfyModel,
  getComfyWorkflows,
  createComfyWorkflow,
  generateImage,
  getGenerationStatus,
  getGenerations,
  autoSetupComfyUI,
} from "../comfy-ui";

export function comfyRoutes(app: Express) {
  // ComfyUI model management
  app.get("/api/comfy/models", getComfyModels);
  app.post("/api/comfy/models", addComfyModel);
  app.delete("/api/comfy/models/:id", deleteComfyModel);

  // Available models endpoint - temporarily disabled
  app.get("/api/comfy/:serverId/available-models", async (req: Request, res: Response) => {
    res.json({ message: "Available models endpoint under development" });
  });

  // Workflow management
  app.get("/api/comfy/workflows", getComfyWorkflows);
  app.post("/api/comfy/workflows", createComfyWorkflow);

  // Image generation
  app.post("/api/comfy/:serverId/generate", generateImage);
  app.get("/api/comfy/:serverId/generate/:generationId/status", getGenerationStatus);
  app.get("/api/comfy/:serverId/generations", getGenerations);

  // ComfyUI setup
  app.post("/api/comfy/:serverId/auto-setup", autoSetupComfyUI);

  // Test route for debugging
  app.get("/api/comfy/:serverId/test", async (req: Request, res: Response) => {
    res.json({ message: "ComfyUI routing works", serverId: req.params.serverId });
  });
}