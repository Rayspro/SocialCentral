# Feature-Based Code Organization

This directory contains the new feature-based organization structure for the SocialSync API server. Each feature is organized in its own directory with co-located routes, services, and types.

## Directory Structure

```
server/features/
├── auth/
│   ├── routes.ts      # Authentication endpoints
│   └── service.ts     # Auth business logic
├── comfyui/
│   ├── routes.ts      # ComfyUI API endpoints
│   └── service.ts     # ComfyUI integration logic
├── platforms/
│   └── routes.ts      # Social platform management
├── vast-ai/
│   └── routes.ts      # Vast.ai server management
├── workflows/
│   └── routes.ts      # Workflow management
├── analytics/
│   └── routes.ts      # Analytics and reporting
├── content/
│   └── routes.ts      # Content management
└── index.ts           # Central feature router
```

## Import Aliases

The project uses TypeScript path mapping for clean imports:

- `@shared/schema.js` - Database schema types
- `@core/storage/` - Storage layer abstractions
- `@core/config/` - Configuration constants

## Migration Status

✅ **Completed:**
- Feature-based directory structure
- Centralized feature router
- Import alias setup in tsconfig.json
- Auth feature with full service implementation
- ComfyUI feature routing structure

🔄 **In Progress:**
- Migrating remaining services to feature directories
- Implementing clean import aliases throughout codebase
- Service layer organization

## Usage

All features are registered through the central `setupFeatureRoutes()` function in `index.ts`, which is imported and used in the main server file.

```typescript
// server/index.ts
import { setupFeatureRoutes } from "./features/index.js";

// Register all feature routes
setupFeatureRoutes(app);
```

This provides a clean, maintainable structure where each feature's code is co-located and easily discoverable.