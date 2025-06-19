# Developer Guide

## Overview

This guide provides detailed information for developers working on SocialSync, covering architecture, development workflows, testing strategies, and deployment procedures.

## Project Architecture

### System Design

SocialSync follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│  Express API    │───▶│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   External APIs │              │
         │              │ Vast.ai, OpenAI │              │
         │              └─────────────────┘              │
         │                                               │
    ┌─────────────────┐                      ┌─────────────────┐
    │   WebSocket     │                      │   Drizzle ORM   │
    │ (Real-time)     │                      │ (Data Layer)    │
    └─────────────────┘                      └─────────────────┘
```

### Core Components

#### Frontend (React + TypeScript)
- **Pages**: Main application screens (`client/src/pages/`)
- **Components**: Reusable UI elements (`client/src/components/`)
- **Hooks**: Custom React hooks for state management (`client/src/hooks/`)
- **Utils**: Helper functions and utilities (`client/src/lib/`)

#### Backend (Express + TypeScript)
- **Routes**: API endpoint handlers (`server/routes.ts`)
- **Storage**: Data access layer with interface abstraction (`server/storage.ts`)
- **Services**: External API integrations (`server/vast-ai.ts`, `server/comfy-ui.ts`)
- **Utilities**: Helper modules and middleware

#### Database (PostgreSQL + Drizzle)
- **Schema**: Type-safe database definitions (`shared/schema.ts`)
- **Migrations**: Automatic schema management via Drizzle Kit
- **Types**: Shared TypeScript types between frontend and backend

## Development Environment Setup

### Prerequisites

1. **Node.js 18+**
2. **PostgreSQL 14+** (or use Neon serverless)
3. **Git**
4. **Code Editor** (VS Code recommended)

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd socialsync
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/socialsync
   
   # External APIs
   VAST_API_KEY=your_vast_api_key
   OPENAI_API_KEY=your_openai_api_key
   
   # Security
   SESSION_SECRET=your-secret-key-here
   
   # Development
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Optional: Open database studio
   npm run db:studio
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

### Development Workflow

#### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Individual feature development
- `hotfix/*`: Critical bug fixes

#### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Automatic code formatting
- **Tailwind CSS**: Utility-first styling

#### Commit Convention

```
type(scope): description

feat(server): add ComfyUI integration
fix(ui): resolve generation status display
docs(api): update endpoint documentation
refactor(storage): optimize database queries
```

## Adding New Features

### Database Changes

1. **Update Schema**
   ```typescript
   // shared/schema.ts
   export const newTable = pgTable("new_table", {
     id: serial("id").primaryKey(),
     name: varchar("name", { length: 255 }).notNull(),
     createdAt: timestamp("created_at").defaultNow(),
   });
   ```

2. **Add Types**
   ```typescript
   export type NewTable = typeof newTable.$inferSelect;
   export type InsertNewTable = typeof newTable.$inferInsert;
   ```

3. **Push to Database**
   ```bash
   npm run db:push
   ```

### Backend API Endpoints

1. **Update Storage Interface**
   ```typescript
   // server/storage.ts
   interface IStorage {
     // ... existing methods
     getNewItems(): Promise<NewTable[]>;
     createNewItem(item: InsertNewTable): Promise<NewTable>;
   }
   ```

2. **Implement Storage Methods**
   ```typescript
   class MemStorage implements IStorage {
     async getNewItems(): Promise<NewTable[]> {
       return this.newItems;
     }
     
     async createNewItem(item: InsertNewTable): Promise<NewTable> {
       const newItem = { ...item, id: this.newItems.length + 1 };
       this.newItems.push(newItem);
       return newItem;
     }
   }
   ```

3. **Add API Routes**
   ```typescript
   // server/routes.ts
   app.get('/api/new-items', async (req, res) => {
     try {
       const items = await storage.getNewItems();
       res.json(items);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch items' });
     }
   });
   ```

### Frontend Components

1. **Create Page Component**
   ```typescript
   // client/src/pages/NewFeature.tsx
   import { useQuery } from '@tanstack/react-query';
   
   export default function NewFeature() {
     const { data: items, isLoading } = useQuery({
       queryKey: ['/api/new-items'],
     });
   
     if (isLoading) return <div>Loading...</div>;
   
     return (
       <div>
         <h1>New Feature</h1>
         {items?.map(item => (
           <div key={item.id}>{item.name}</div>
         ))}
       </div>
     );
   }
   ```

2. **Add Route**
   ```typescript
   // client/src/App.tsx
   import NewFeature from '@/pages/NewFeature';
   
   function Router() {
     return (
       <Switch>
         <Route path="/new-feature" component={NewFeature} />
         {/* ... other routes */}
       </Switch>
     );
   }
   ```

3. **Update Navigation**
   ```typescript
   // Add to sidebar or navigation component
   <Link href="/new-feature">New Feature</Link>
   ```

## Testing Strategy

### Unit Tests

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# API integration tests
npm run test:api

# Database integration tests
npm run test:db
```

### End-to-End Tests

```bash
# Full application tests
npm run test:e2e
```

### Test Examples

#### Backend API Test
```typescript
// tests/api/servers.test.ts
import request from 'supertest';
import { app } from '../server/index';

describe('Server API', () => {
  it('should list servers', async () => {
    const response = await request(app)
      .get('/api/vast-servers')
      .expect(200);
      
    expect(response.body).toBeInstanceOf(Array);
  });
});
```

#### Frontend Component Test
```typescript
// tests/components/ServerCard.test.tsx
import { render, screen } from '@testing-library/react';
import ServerCard from '@/components/ServerCard';

const mockServer = {
  id: 1,
  name: 'Test Server',
  status: 'running'
};

test('renders server information', () => {
  render(<ServerCard server={mockServer} />);
  expect(screen.getByText('Test Server')).toBeInTheDocument();
  expect(screen.getByText('running')).toBeInTheDocument();
});
```

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**
   ```typescript
   // Lazy load pages
   const LazyPage = lazy(() => import('@/pages/HeavyPage'));
   
   function App() {
     return (
       <Suspense fallback={<Loading />}>
         <LazyPage />
       </Suspense>
     );
   }
   ```

2. **React Query Optimization**
   ```typescript
   // Optimize queries with proper cache keys
   const { data } = useQuery({
     queryKey: ['/api/servers', filters],
     staleTime: 5 * 60 * 1000, // 5 minutes
     cacheTime: 10 * 60 * 1000, // 10 minutes
   });
   ```

3. **Component Optimization**
   ```typescript
   // Use React.memo for expensive components
   const ExpensiveComponent = memo(({ data }) => {
     const processedData = useMemo(() => 
       expensiveCalculation(data), [data]
     );
     
     return <div>{processedData}</div>;
   });
   ```

### Backend Optimization

1. **Database Queries**
   ```typescript
   // Use proper indexing and selective queries
   const servers = await db
     .select({
       id: vastServers.id,
       name: vastServers.name,
       status: vastServers.status
     })
     .from(vastServers)
     .where(eq(vastServers.isActive, true))
     .limit(50);
   ```

2. **Caching Strategy**
   ```typescript
   // Implement Redis caching for expensive operations
   const getCachedServers = async () => {
     const cached = await redis.get('servers');
     if (cached) return JSON.parse(cached);
     
     const servers = await storage.getVastServers();
     await redis.setex('servers', 300, JSON.stringify(servers));
     return servers;
   };
   ```

3. **API Rate Limiting**
   ```typescript
   // Implement rate limiting middleware
   const rateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   });
   ```

## Security Considerations

### Authentication & Authorization

1. **Session Management**
   ```typescript
   // Secure session configuration
   app.use(session({
     secret: process.env.SESSION_SECRET,
     resave: false,
     saveUninitialized: false,
     cookie: {
       secure: process.env.NODE_ENV === 'production',
       httpOnly: true,
       maxAge: 24 * 60 * 60 * 1000 // 24 hours
     }
   }));
   ```

2. **Input Validation**
   ```typescript
   // Use Zod for request validation
   const createServerSchema = z.object({
     name: z.string().min(1).max(100),
     gpu: z.string().min(1),
     pricePerHour: z.string().regex(/^\d+\.\d{2}$/)
   });
   
   app.post('/api/servers', (req, res) => {
     const validation = createServerSchema.safeParse(req.body);
     if (!validation.success) {
       return res.status(400).json({ error: validation.error });
     }
     // ... proceed with validated data
   });
   ```

3. **Environment Variables**
   ```typescript
   // Never expose sensitive data
   const config = {
     vastApiKey: process.env.VAST_API_KEY,
     openaiApiKey: process.env.OPENAI_API_KEY,
     // Never send these to frontend
   };
   ```

### Data Protection

1. **SQL Injection Prevention**
   ```typescript
   // Use parameterized queries (Drizzle handles this)
   const user = await db
     .select()
     .from(users)
     .where(eq(users.email, userEmail)); // Safe
   ```

2. **XSS Prevention**
   ```typescript
   // Sanitize user input
   import DOMPurify from 'dompurify';
   
   const sanitizedContent = DOMPurify.sanitize(userInput);
   ```

## Monitoring & Debugging

### Logging Strategy

```typescript
// server/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### Error Handling

```typescript
// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Internal server error' });
  } else {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});
```

### Performance Monitoring

```typescript
// Add request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      duration,
      status: res.statusCode
    });
  });
  
  next();
});
```

## Deployment

### Production Build

```bash
# Build frontend and backend
npm run build

# Start production server
npm start
```

### Environment Configuration

```env
# Production environment
NODE_ENV=production
DATABASE_URL=postgresql://prod-user:password@prod-host:5432/socialsync
VAST_API_KEY=production_key
SESSION_SECRET=strong_random_secret
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.select().from(users).limit(1);
    
    // Check external APIs
    const vastStatus = await checkVastApiHealth();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'up',
        vastApi: vastStatus ? 'up' : 'down'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## Contributing Guidelines

### Code Review Process

1. **Pre-Review Checklist**
   - [ ] Tests pass locally
   - [ ] Code follows style guidelines
   - [ ] Documentation updated
   - [ ] No console.log statements
   - [ ] Error handling implemented

2. **Review Criteria**
   - Code readability and maintainability
   - Performance implications
   - Security considerations
   - Test coverage
   - Documentation quality

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Test connection
psql -h localhost -U username -d socialsync
```

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

#### Runtime Errors
```bash
# Check logs
tail -f logs/error.log

# Debug mode
DEBUG=* npm run dev
```

### Development Tools

#### Database Studio
```bash
npm run db:studio
```

#### API Testing
```bash
# Use curl for API testing
curl -X GET http://localhost:5000/api/vast-servers

# Or use Postman/Insomnia collections
```

#### Performance Profiling
```bash
# Node.js profiling
node --inspect-brk server/index.ts

# React DevTools for frontend profiling
```

This guide provides the foundation for effective development on SocialSync. Keep it updated as the project evolves and new patterns emerge.