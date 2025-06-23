// Centralized type exports for the entire application
// Re-export all shared types
export * from './shared/core.js';
export * from './shared/config.js';

// Re-export all feature-specific types
export * from './features/auth.js';
export * from './features/comfyui.js';
export * from './features/platforms.js';
export * from './features/vast-ai.js';
export * from './features/workflows.js';

// Additional utility types that don't fit into specific categories
export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  filename: string;
  type: 'setup' | 'reset' | 'model' | 'utility';
  parameters: string[];
}