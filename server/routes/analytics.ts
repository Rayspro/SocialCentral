import { Express, Request, Response } from "express";
import { storage } from "../storage";

export function analyticsRoutes(app: Express) {
  // System statistics
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Server analytics
  app.get("/api/server-analytics", async (req: Request, res: Response) => {
    try {
      const analytics = await storage.getServerAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Get server analytics error:", error);
      res.status(500).json({ error: "Failed to fetch server analytics" });
    }
  });

  // Audit log
  app.get("/api/audit-log", async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, action, userId } = req.query;
      const filters = {
        action: action as string,
        userId: userId ? parseInt(userId as string) : undefined
      };
      
      const auditLogs = await storage.getAuditLogs(
        parseInt(page as string),
        parseInt(limit as string),
        filters
      );
      
      res.json(auditLogs);
    } catch (error) {
      console.error("Get audit log error:", error);
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  });
}