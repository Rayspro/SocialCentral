# Server Constants Documentation

This directory contains centralized constants and configuration values for the server application.

## Overview

Previously, constants were scattered throughout the codebase as hardcoded values. This organization provides:

- **Centralized Configuration**: All constants in one location
- **Type Safety**: TypeScript const assertions for better type checking
- **Maintainability**: Easy to update values across the entire application
- **Environment Support**: Proper handling of environment variables

## Constants Structure

### Server Configuration (`SERVER_CONFIG`)
- Port, host, session settings
- Node environment configuration

### Database Configuration (`DATABASE_CONFIG`)
- Connection settings and timeouts

### ComfyUI Configuration (`COMFYUI_CONFIG`)
- Default ports, timeouts, image dimensions
- Supported formats and limits

### VAST AI Configuration (`VAST_CONFIG`)
- API endpoints, instance limits
- Setup timeouts and regions

### Generation Configuration (`GENERATION_CONFIG`)
- Concurrent generation limits
- Timeout values and seed ranges
- Default negative prompts

### Platform Integration (`PLATFORM_CONFIG`)
- YouTube, Instagram, Twitter API settings
- OAuth scopes and result limits

### Messages (`ERROR_MESSAGES`, `SUCCESS_MESSAGES`)
- Standardized user-facing messages
- Consistent error reporting

### Status Constants (`STATUS`)
- Standardized status values across the application

### Audit and Events (`AUDIT_ACTIONS`, `WS_EVENTS`)
- Audit log action types
- WebSocket event names

## Usage Examples

```typescript
import { COMFYUI_CONFIG, ERROR_MESSAGES } from './constants/index.js';

// Use configuration values
const port = COMFYUI_CONFIG.DEFAULT_PORT;
const timeout = COMFYUI_CONFIG.CONNECTION_TIMEOUT;

// Use standardized error messages
return res.status(404).json({ error: ERROR_MESSAGES.SERVER_NOT_FOUND });
```

## Benefits

1. **Consistency**: Same values used throughout the application
2. **Maintainability**: Single source of truth for configuration
3. **Type Safety**: Compile-time checking of constant usage
4. **Documentation**: Clear structure and purpose for each constant
5. **Environment Flexibility**: Easy to override with environment variables