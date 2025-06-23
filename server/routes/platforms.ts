import { Express, Request, Response } from "express";
import { z } from "zod";
import { insertPlatformSchema, insertAccountSchema } from "../../shared/schema";
import { storage } from "../storage";
import { oauthManager } from "../oauth";

const createPlatformSchema = insertPlatformSchema.omit({ id: true });
const createAccountSchema = insertAccountSchema.omit({ id: true });

export function platformRoutes(app: Express) {
  // Platform management
  app.get("/api/platforms", async (req: Request, res: Response) => {
    try {
      const platforms = await storage.getPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Get platforms error:", error);
      res.status(500).json({ error: "Failed to fetch platforms" });
    }
  });

  app.post("/api/platforms", async (req: Request, res: Response) => {
    try {
      const platformData = createPlatformSchema.parse(req.body);
      const platform = await storage.createPlatform(platformData);
      res.json(platform);
    } catch (error) {
      console.error("Create platform error:", error);
      res.status(400).json({ error: "Invalid platform data" });
    }
  });

  app.put("/api/platforms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const platformData = createPlatformSchema.partial().parse(req.body);
      const platform = await storage.updatePlatform(id, platformData);
      res.json(platform);
    } catch (error) {
      console.error("Update platform error:", error);
      res.status(400).json({ error: "Invalid platform data" });
    }
  });

  app.delete("/api/platforms/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePlatform(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete platform error:", error);
      res.status(500).json({ error: "Failed to delete platform" });
    }
  });

  // Account management
  app.get("/api/accounts", async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Get accounts error:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.get("/api/accounts/platform/:platformId", async (req: Request, res: Response) => {
    try {
      const platformId = parseInt(req.params.platformId);
      const accounts = await storage.getAccountsByPlatform(platformId);
      res.json(accounts);
    } catch (error) {
      console.error("Get accounts by platform error:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", async (req: Request, res: Response) => {
    try {
      const accountData = createAccountSchema.parse(req.body);
      const account = await storage.createAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error("Create account error:", error);
      res.status(400).json({ error: "Invalid account data" });
    }
  });

  // OAuth integration
  app.get("/api/oauth/youtube/auth", async (req: Request, res: Response) => {
    await oauthManager.initiateYouTubeAuth(req, res);
  });

  app.get("/api/oauth/youtube/callback", async (req: Request, res: Response) => {
    await oauthManager.handleYouTubeCallback(req, res);
  });

  app.get("/api/oauth/instagram/auth", async (req: Request, res: Response) => {
    await oauthManager.initiateInstagramAuth(req, res);
  });

  app.get("/api/oauth/instagram/callback", async (req: Request, res: Response) => {
    await oauthManager.handleInstagramCallback(req, res);
  });
}