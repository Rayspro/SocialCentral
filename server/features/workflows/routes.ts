import { Express } from "express";

export function workflowRoutes(app: Express) {
  // Import existing workflow routes
  const workflowModule = require("../../routes/workflows.js");
  
  // Setup workflow routes using the module export
  if (typeof workflowModule === 'function') {
    workflowModule(app);
  } else if (workflowModule.default) {
    workflowModule.default(app);
  }
}