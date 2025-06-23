import { Express, Request, Response } from "express";
import { z } from "zod";
import { insertContentSchema } from "../../shared/schema";
import { storage } from "../storage";

const createContentSchema = insertContentSchema.omit({ id: true, createdAt: true });

export function contentRoutes(app: Express) {
  // Content management
  app.get("/api/content", async (req: Request, res: Response) => {
    try {
      const content = await storage.getContent();
      res.json(content);
    } catch (error) {
      console.error("Get content error:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.get("/api/content/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.getContentById(id);
      if (!content) {
        return res.status(404).json({ error: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Get content by ID error:", error);
      res.status(500).json({ error: "Failed to fetch content" });
    }
  });

  app.post("/api/content", async (req: Request, res: Response) => {
    try {
      const contentData = createContentSchema.parse(req.body);
      const content = await storage.createContent(contentData);
      res.json(content);
    } catch (error) {
      console.error("Create content error:", error);
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.put("/api/content/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contentData = createContentSchema.partial().parse(req.body);
      const content = await storage.updateContent(id, contentData);
      res.json(content);
    } catch (error) {
      console.error("Update content error:", error);
      res.status(400).json({ error: "Invalid content data" });
    }
  });

  app.delete("/api/content/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteContent(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete content error:", error);
      res.status(500).json({ error: "Failed to delete content" });
    }
  });

  // Approval workflow
  app.post("/api/content/:id/approve", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.updateContent(id, { 
        status: "published", 
        publishedAt: new Date() 
      });
      res.json(content);
    } catch (error) {
      console.error("Approve content error:", error);
      res.status(500).json({ error: "Failed to approve content" });
    }
  });

  app.post("/api/content/:id/reject", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const content = await storage.updateContent(id, { 
        status: "failed" 
      });
      res.json(content);
    } catch (error) {
      console.error("Reject content error:", error);
      res.status(500).json({ error: "Failed to reject content" });
    }
  });
}