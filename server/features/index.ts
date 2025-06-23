import { Express } from "express";
import { authRoutes } from "./auth/routes.js";
import { comfyRoutes } from "./comfyui/routes.js";
import { platformRoutes } from "./platforms/routes.js";
import { vastAiRoutes } from "./vast-ai/routes.js";
import { workflowRoutes } from "./workflows/routes.js";
import { analyticsRoutes } from "./analytics/routes.js";
import { contentRoutes } from "./content/routes.js";

export function setupFeatureRoutes(app: Express) {
  // Register all feature routes
  authRoutes(app);
  comfyRoutes(app);
  platformRoutes(app);
  vastAiRoutes(app);
  workflowRoutes(app);
  analyticsRoutes(app);
  contentRoutes(app);
}