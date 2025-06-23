import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { recommendationEngine } from "../recommendation-engine";

export function workflowRoutes(app: Express) {
  // Workflow management
  app.get("/api/workflows", async (req: Request, res: Response) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      console.error("Get workflows error:", error);
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/with-models", async (req: Request, res: Response) => {
    try {
      const workflows = await storage.getWorkflowsWithModels();
      res.json(workflows);
    } catch (error) {
      console.error("Get workflows with models error:", error);
      res.status(500).json({ error: "Failed to fetch workflows with models" });
    }
  });

  app.get("/api/workflows/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const workflow = await storage.getWorkflowById(id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      console.error("Get workflow by ID error:", error);
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  // Recommendations
  app.get("/api/recommendations/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const recommendations = await recommendationEngine.generatePersonalizedRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      console.error("Get recommendations error:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/recommendations/trending", async (req: Request, res: Response) => {
    try {
      const { limit = 5 } = req.query;
      const trending = await recommendationEngine.getTrendingWorkflows(parseInt(limit as string));
      res.json(trending);
    } catch (error) {
      console.error("Get trending workflows error:", error);
      res.status(500).json({ error: "Failed to fetch trending workflows" });
    }
  });

  app.post("/api/user-interaction", async (req: Request, res: Response) => {
    try {
      const { userId, actionType, entityType, entityId, metadata } = req.body;
      await recommendationEngine.trackUserInteraction(userId, actionType, entityType, entityId, metadata);
      res.json({ success: true });
    } catch (error) {
      console.error("Track interaction error:", error);
      res.status(500).json({ error: "Failed to track user interaction" });
    }
  });
}