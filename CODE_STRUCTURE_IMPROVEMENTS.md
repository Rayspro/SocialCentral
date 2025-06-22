# Code Structure Improvements

## New Folder Organization

The codebase has been restructured to follow proper coding standards with organized folders for better maintainability and readability.

### Client-side Structure

```
client/src/
├── types/                  # TypeScript type definitions
│   └── index.ts           # Core application types
├── constants/             # Application constants
│   └── index.ts          # API endpoints, status constants, validation rules
├── services/              # API service layer
│   └── api.ts            # Centralized API calls
├── composables/           # Reusable React hooks
│   ├── useServer.ts      # Server management hooks
│   └── useComfyUI.ts     # ComfyUI-specific hooks
├── utils/                 # Utility functions
│   └── index.ts          # Formatters, validators, helpers
├── components/            # React components organized by feature
│   ├── ComfyUI/          # ComfyUI-related components
│   │   └── SetupProgress.tsx
│   ├── Server/           # Server management components
│   ├── Layout/           # Layout components
│   ├── Forms/            # Form components
│   └── ui/               # Reusable UI components
├── pages/                # Page components
└── lib/                  # Third-party library configurations
```

## Key Improvements

### 1. Type Safety
- **Centralized Types**: All TypeScript interfaces in `types/index.ts`
- **Proper Typing**: API responses, form data, and component props
- **Type Guards**: Validation functions for runtime type checking

### 2. Constants Organization
- **API Endpoints**: Centralized endpoint definitions
- **Status Constants**: Consistent status enums
- **Validation Rules**: Reusable validation patterns
- **Query Keys**: React Query cache keys
- **Default Values**: Configuration defaults

### 3. Service Layer
- **API Abstraction**: Clean service methods for each domain
- **Error Handling**: Consistent error response handling
- **Type Safety**: Properly typed API responses

### 4. Composable Hooks
- **Server Management**: `useServer.ts` for server operations
- **ComfyUI Operations**: `useComfyUI.ts` for AI image generation
- **Reusable Logic**: Shared state management and API calls
- **Error Handling**: Integrated toast notifications

### 5. Utility Functions
- **Formatters**: Currency, file size, duration, progress
- **Validators**: Email, password, server name validation
- **Helpers**: Common utility functions
- **Type Guards**: Runtime type validation

### 6. Component Organization
- **Feature-based Folders**: Components grouped by domain
- **Single Responsibility**: Each component has a clear purpose
- **Reusable Sub-components**: Broken down into smaller pieces
- **Consistent Props**: Well-defined interfaces

## Example: Refactored ComfyUI Setup Component

### Before (Original Structure)
```typescript
// Large monolithic component with inline logic
export function ComfyUISetupTab({ serverId }: { serverId: number }) {
  // 300+ lines of mixed logic
  // Inline API calls
  // Mixed concerns (UI + business logic)
  // No type safety
  // Hard to test and maintain
}
```

### After (Improved Structure)
```typescript
// Clean, focused component with separated concerns
export function SetupProgress({ serverId, serverName }: SetupProgressProps) {
  // Uses typed composables
  const { data: executions } = useServerExecutions(serverId);
  const startSetup = useStartComfySetup();
  
  // Extracted sub-components
  return (
    <Card>
      {!latestExecution ? (
        <SetupNotStarted onStart={handleStartSetup} />
      ) : (
        <SetupStatus execution={latestExecution} />
      )}
    </Card>
  );
}
```

## Benefits Achieved

### 1. Maintainability
- **Clear Separation**: Each file has a single responsibility
- **Easy Navigation**: Logical folder structure
- **Consistent Patterns**: Standardized approaches across the codebase

### 2. Reusability
- **Composable Hooks**: Shared logic across components
- **Utility Functions**: Reusable formatters and validators
- **Component Library**: Modular UI components

### 3. Type Safety
- **Compile-time Checks**: Catch errors before runtime
- **IntelliSense Support**: Better developer experience
- **Refactoring Safety**: Changes are validated by TypeScript

### 4. Testing
- **Isolated Units**: Each function/component can be tested independently
- **Mock-friendly**: Service layer enables easy mocking
- **Predictable Behavior**: Pure functions and clear interfaces

### 5. Performance
- **Tree Shaking**: Better code splitting capabilities
- **Lazy Loading**: Components can be dynamically imported
- **Optimized Builds**: Smaller bundle sizes

## Migration Strategy

### Phase 1: Infrastructure ✅
- [x] Create folder structure
- [x] Define types and constants
- [x] Build service layer
- [x] Create composable hooks

### Phase 2: Component Refactoring (In Progress)
- [x] Refactor ComfyUI setup component
- [ ] Refactor server management components
- [ ] Refactor workflow components
- [ ] Update page components

### Phase 3: Integration
- [ ] Update imports across the application
- [ ] Remove duplicate code
- [ ] Add comprehensive error handling
- [ ] Implement loading states

### Phase 4: Optimization
- [ ] Add component lazy loading
- [ ] Implement proper caching strategies
- [ ] Add performance monitoring
- [ ] Optimize bundle size

## Developer Guidelines

### 1. File Naming
- Use PascalCase for components: `SetupProgress.tsx`
- Use camelCase for utilities: `formatters.ts`
- Use kebab-case for pages: `server-detail.tsx`

### 2. Import Organization
```typescript
// External libraries
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal imports (ordered by proximity)
import { Button } from '@/components/ui/button';
import { useServer } from '@/composables/useServer';
import { API_ENDPOINTS } from '@/constants';
import { formatters } from '@/utils';
import type { VastServer } from '@/types';
```

### 3. Component Structure
```typescript
// Types first
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// Main component
export function Component({ prop1, prop2 }: ComponentProps) {
  // Hooks
  // Event handlers  
  // Render logic
  
  return (
    // JSX
  );
}

// Sub-components (if needed)
function SubComponent() {
  // ...
}
```

### 4. Error Handling
- Use proper error boundaries
- Implement fallback UI states
- Provide meaningful error messages
- Log errors for debugging

This restructured codebase now follows industry best practices for React/TypeScript applications, making it more maintainable, scalable, and developer-friendly.