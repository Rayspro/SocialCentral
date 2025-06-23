import { Express } from "express";

export function vastAiRoutes(app: Express) {
  // Import existing vast-ai routes
  const vastModule = require("../../routes/vast.js");
  
  // Setup vast-ai routes using the module export
  if (typeof vastModule === 'function') {
    vastModule(app);
  } else if (vastModule.default) {
    vastModule.default(app);
  }
}