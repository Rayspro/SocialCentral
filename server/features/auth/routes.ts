import { Express } from "express";

export function authRoutes(app: Express) {
  // Import existing auth routes
  const authModule = require("../../routes/auth.js");
  
  // Setup auth routes using the module export
  if (typeof authModule === 'function') {
    authModule(app);
  } else if (authModule.default) {
    authModule.default(app);
  }
}