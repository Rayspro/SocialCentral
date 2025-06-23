import { Express } from "express";

export function platformRoutes(app: Express) {
  // Import existing platform routes
  const platformModule = require("../../routes/platforms.js");
  
  // Setup platform routes using the module export
  if (typeof platformModule === 'function') {
    platformModule(app);
  } else if (platformModule.default) {
    platformModule.default(app);
  }
}