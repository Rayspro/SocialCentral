import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { setupFeatureRoutes } from "./features/index.js";
import { setupVite, serveStatic } from "./vite";
import { comfyWebSocketManager } from "./comfy-websocket";

export async function setupServer(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Setup WebSocket server for ComfyUI progress tracking
  const wss = new WebSocketServer({ server: httpServer });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    comfyWebSocketManager.addClientSocket(ws);
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Setup all feature routes
  setupFeatureRoutes(app);

  // Setup Vite middleware after API routes
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }
  
  return httpServer;
}