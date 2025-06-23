import { Express } from "express";

export function contentRoutes(app: Express) {
  // Import existing content routes
  const contentModule = require("../../routes/content.js");
  
  // Setup content routes using the module export
  if (typeof contentModule === 'function') {
    contentModule(app);
  } else if (contentModule.default) {
    contentModule.default(app);
  }
}