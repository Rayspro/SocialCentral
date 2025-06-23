import { Express } from "express";
import { authRoutes } from "./auth";
import { platformRoutes } from "./platforms";
import { contentRoutes } from "./content";
import { vastRoutes } from "./vast";
import { comfyRoutes } from "./comfy";
import { analyticsRoutes } from "./analytics";
import { workflowRoutes } from "./workflows";

export async function registerRoutes(app: Express) {
  // Register all route modules
  authRoutes(app);
  platformRoutes(app);
  contentRoutes(app);
  vastRoutes(app);
  comfyRoutes(app);
  analyticsRoutes(app);
  workflowRoutes(app);
  
  return Promise.resolve();
}