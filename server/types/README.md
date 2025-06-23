# Type System Architecture

## Overview

This directory contains the complete type system for the application, organized into shared and feature-specific modules for maximum maintainability and scalability.

## Directory Structure

```
server/types/
├── index.ts              # Central export point for all types
├── shared/               # Types used across multiple features
│   ├── core.ts          # Fundamental types and interfaces
│   └── config.ts        # Configuration-related types
└── features/            # Feature-specific type definitions
    ├── auth.ts          # Authentication system types
    ├── comfyui.ts       # ComfyUI integration types
    ├── platforms.ts     # Social platform types
    ├── vast-ai.ts       # VAST AI server management types
    └── workflows.ts     # Workflow management types
```

## Design Principles

### 1. Separation of Concerns
- **Shared types**: Used by multiple features (StatusType, BaseEntity, etc.)
- **Feature types**: Specific to individual application domains

### 2. Single Source of Truth
- Each type is defined once in its appropriate module
- Central index file provides unified access
- No duplicate type definitions

### 3. Logical Grouping
- Types are grouped by domain and responsibility
- Related interfaces are co-located
- Clear ownership boundaries

## Usage Guide

### Importing Types

```typescript
// Recommended: Import from central index
import { StatusType, ComfyUIConfig, UserData } from '../types/index.js';

// Feature-specific imports when working within a feature
import { ComfyUIProgress, ModelInfo } from '../types/features/comfyui.js';

// Shared types only
import { BaseEntity, ApiResponse } from '../types/shared/core.js';
```

### Adding New Types

1. **Determine scope**: Is this type shared or feature-specific?
2. **Choose module**: Add to existing module or create new feature module
3. **Update index**: Add export to `index.ts` if creating new module
4. **Document**: Add JSDoc comments for complex types

## Type Categories

### Shared Types (`shared/`)

#### Core Types (`core.ts`)
- `StatusType` - Universal status enumeration
- `BaseEntity` - Common database entity structure
- `ApiResponse<T>` - Standardized API responses
- `PaginationParams` & `PaginatedResponse<T>` - Pagination interfaces
- `AuditContext` - Audit logging context
- `ErrorMessages` & `SuccessMessages` - Message dictionaries

#### Configuration Types (`config.ts`)
- `ServerConfig` - Core server settings
- `ApiConfig` - API-specific configuration
- `AuthConfig` - Authentication settings
- `UploadConfig` - File upload configuration
- `WebSocketEvents` - WebSocket event mappings

### Feature Types (`features/`)

#### Authentication (`auth.ts`)
- User management and authentication flows
- Session handling and security
- Password reset workflows
- User preferences and settings

#### ComfyUI Integration (`comfyui.ts`)
- ComfyUI service configuration
- Workflow definitions and execution
- Image generation and progress tracking
- Model management and metadata

#### Platform Integration (`platforms.ts`)
- Social media platform configurations
- OAuth authentication flows
- Platform-specific user data structures
- Account management interfaces

#### VAST AI Management (`vast-ai.ts`)
- Server instance management
- Offer and pricing structures
- Script execution tracking
- Setup and configuration automation

#### Workflow Management (`workflows.ts`)
- Workflow definitions and templates
- Execution tracking and analysis
- Recommendation systems
- Parameter management

## Best Practices

### 1. Type Definition
```typescript
// Good: Clear, documented interface
export interface ComfyUIProgress {
  generationId: number;
  serverId: number;
  status: 'queued' | 'executing' | 'completed' | 'failed';
  progress?: number;
  errorMessage?: string;
}

// Avoid: Unclear or overly generic types
export interface Data {
  stuff: any;
  things: unknown;
}
```

### 2. Extending Base Types
```typescript
// Good: Extend shared base types
export interface UserData extends BaseEntity {
  email: string;
  passwordHash: string;
  isActive: boolean;
}
```

### 3. Union Types for Status
```typescript
// Good: Use union types for constrained values
export type StatusType = 'pending' | 'running' | 'completed' | 'failed';

// Avoid: String types for status values
export interface SomeEntity {
  status: string; // Too permissive
}
```

### 4. Generic Types for Reusability
```typescript
// Good: Generic types for flexible interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Maintenance Guidelines

### Adding New Features
1. Create new file in `features/` directory
2. Define feature-specific types and interfaces
3. Export from `index.ts`
4. Update this documentation

### Modifying Existing Types
1. Check for breaking changes across the application
2. Update related interfaces if needed
3. Run type checking to ensure compatibility
4. Update documentation if interface changes

### Deprecating Types
1. Mark as deprecated with JSDoc `@deprecated` tag
2. Provide migration path in documentation
3. Remove after appropriate deprecation period

## Integration with Database Schema

Types in this system complement the database schema defined in `shared/schema.ts`:

- Database types use Drizzle ORM definitions
- Application types provide TypeScript interfaces
- Insert/Select types are generated from schema
- Application types extend database types with additional properties

Example:
```typescript
// Database schema generates: InsertUser, SelectUser
// Application type extends with computed properties
export interface UserData extends SelectUser {
  fullName?: string; // Computed from firstName + lastName
  isOnline?: boolean; // Runtime status
}
```

## Migration from Legacy Types

The previous monolithic type system has been refactored into this organized structure:

- All types previously in `server/types/index.ts` have been distributed to appropriate modules
- Imports have been updated to use the new structure
- Backward compatibility is maintained through the central index export

No breaking changes were introduced during this reorganization.