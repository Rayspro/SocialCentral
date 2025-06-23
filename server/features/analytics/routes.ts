import { Express } from "express";

export function analyticsRoutes(app: Express) {
  // Import existing analytics routes
  const analyticsModule = require("../../routes/analytics.js");
  
  // Setup analytics routes using the module export
  if (typeof analyticsModule === 'function') {
    analyticsModule(app);
  } else if (analyticsModule.default) {
    analyticsModule.default(app);
  }
}