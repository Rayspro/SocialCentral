import { Express } from "express";

export function authRoutes(app: Express) {
  // Import auth service functions
  const authService = require("./service.js");
  
  // Authentication endpoints
  app.post("/api/auth/login", authService.loginUser);
  app.post("/api/auth/register", authService.registerUser);
  app.post("/api/auth/logout", authService.logoutUser);
  app.get("/api/auth/me", authService.getCurrentUser);
}