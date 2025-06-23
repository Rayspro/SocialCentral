# Script Management System

This directory contains the script management system that replaces hardcoded scripts scattered throughout the codebase.

## Structure

```
server/scripts/
├── templates/           # Script template files
│   ├── comfyui-setup.sh       # Complete ComfyUI installation
│   ├── comfyui-reset.sh       # Reset ComfyUI installation
│   └── model-download.sh      # Download specific models
├── script-manager.ts    # Script management class
└── README.md           # This file
```

## Script Manager Features

### Dynamic Script Generation
- Loads script templates from the templates directory
- Supports parameter substitution
- Generates scripts with proper configuration values

### Script Types
- **Setup Scripts**: Complete installation processes
- **Reset Scripts**: Clean reinstallation procedures
- **Model Scripts**: Download and install AI models
- **Utility Scripts**: Maintenance and diagnostic tools

### Popular Models Integration
- Pre-configured model download URLs
- Automatic filename extraction
- Support for multiple model formats (checkpoints, VAE, LoRA)

## Usage Examples

```typescript
import { scriptManager } from './scripts/script-manager.js';

// Get a script template
const setupScript = scriptManager.generateComfyUISetupScript();

// Generate model download script
const modelScript = scriptManager.generateModelDownloadScript(
  'https://huggingface.co/model.safetensors',
  'checkpoints',
  'model.safetensors'
);

// Get popular models
const models = scriptManager.getPopularModels();
```

## Benefits

1. **Centralized Management**: All scripts in organized templates
2. **Dynamic Configuration**: Scripts adapt to environment settings
3. **Type Safety**: TypeScript interfaces for script metadata
4. **Reusability**: Scripts can be reused across different contexts
5. **Maintainability**: Easy to update and version control scripts