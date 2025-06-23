import { Express, Request, Response } from "express";
import { 
  getVastServers,
  createVastServer,
  destroyVastServer,
  restartVastServer,
  getAvailableServers
} from "../vast-ai";
import { storage } from "../storage";

export function vastRoutes(app: Express) {
  // VAST AI server management
  app.get("/api/vast-servers", getVastServers);
  app.get("/api/vast-servers/available", getAvailableServers);
  app.post("/api/vast-servers", createVastServer);
  app.delete("/api/vast-servers/:id", destroyVastServer);
  app.post("/api/vast-servers/:id/restart", restartVastServer);

  // Server details and status
  app.get("/api/vast-servers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const server = await storage.getVastServerById(id);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      res.json(server);
    } catch (error) {
      console.error("Get server error:", error);
      res.status(500).json({ error: "Failed to fetch server" });
    }
  });

  app.put("/api/vast-servers/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const server = await storage.updateVastServer(id, updateData);
      res.json(server);
    } catch (error) {
      console.error("Update server error:", error);
      res.status(400).json({ error: "Failed to update server" });
    }
  });

  // Server setup and execution
  app.post("/api/vast-servers/:id/setup", async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.id);
      const { scriptId } = req.body;
      
      // Create execution record
      const execution = await storage.createServerExecution({
        serverId,
        scriptId,
        status: "pending"
      });

      res.json({ 
        success: true, 
        executionId: execution.id,
        message: "Server setup initiated"
      });
    } catch (error) {
      console.error("Server setup error:", error);
      res.status(500).json({ error: "Failed to initiate server setup" });
    }
  });

  // Server executions
  app.get("/api/server-executions/:serverId", async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const executions = await storage.getServerExecutions(serverId);
      res.json(executions);
    } catch (error) {
      console.error("Get executions error:", error);
      res.status(500).json({ error: "Failed to fetch executions" });
    }
  });

  // Setup scripts
  app.get("/api/setup-scripts", async (req: Request, res: Response) => {
    try {
      const scripts = await storage.getSetupScripts();
      res.json(scripts);
    } catch (error) {
      console.error("Get setup scripts error:", error);
      res.status(500).json({ error: "Failed to fetch setup scripts" });
    }
  });

  // Server scheduler
  app.get("/api/server-scheduler/:serverId", async (req: Request, res: Response) => {
    try {
      const serverId = parseInt(req.params.serverId);
      const server = await storage.getVastServerById(serverId);
      if (!server) {
        return res.status(404).json({ error: "Server not found" });
      }
      
      res.json({
        server,
        schedulerActive: server.schedulerActive || false,
        schedulerChecks: server.schedulerChecks || 0,
        schedulerStarted: server.schedulerStarted,
        schedulerLastCheck: server.schedulerLastCheck
      });
    } catch (error) {
      console.error("Get scheduler error:", error);
      res.status(500).json({ error: "Failed to fetch scheduler status" });
    }
  });
}