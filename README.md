# SocialSync - AI-Powered Social Media Management Platform

## Overview

SocialSync is a comprehensive server management platform that simplifies complex infrastructure monitoring through an engaging, intelligent interface for ComfyUI and Vast.ai server interactions. Built with modern web technologies, it provides seamless AI-powered content generation, server management, and real-time monitoring capabilities.

## Features

### 🖥️ **Server Management**
- Launch and manage GPU servers through Vast.ai integration
- Real-time server status monitoring and analytics
- Automated ComfyUI setup and configuration
- SSH connection management with intelligent fallback systems
- Cost tracking and performance monitoring

### 🎨 **AI Content Generation**
- ComfyUI integration for text-to-image generation
- Model management system with download capabilities
- Custom workflow creation and templates
- Demo mode for development and testing
- Real-time generation progress tracking

### 📊 **Analytics & Monitoring**
- Interactive server performance dashboards
- Resource usage tracking (CPU, GPU, RAM)
- Cost analysis and optimization insights
- Comprehensive audit logging
- Real-time status updates via WebSocket

### 🔧 **Automation Features**
- Automated server setup scheduling
- Background model downloads
- Server lifecycle management
- Intelligent error handling and recovery
- Progress tracking for long-running operations

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for lightweight routing
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **WebSocket** for real-time updates
- **OpenAI API** integration
- **Vast.ai API** for server management

### Infrastructure
- **Replit** deployment ready
- **Docker** support
- **Neon** serverless PostgreSQL
- **Environment-based configuration**

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Vast.ai API key
- OpenAI API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd socialsync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   VAST_API_KEY=your_vast_ai_api_key
   OPENAI_API_KEY=your_openai_api_key (optional)
   SESSION_SECRET=your_session_secret
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Usage Guide

### Server Management

1. **Connect Vast.ai Account**
   - Navigate to Settings → API Keys
   - Add your Vast.ai API key
   - The system will automatically import existing instances

2. **Launch New Server**
   - Go to Vast Servers → Available Servers
   - Browse and filter available GPU instances
   - Click "Launch" on desired server configuration
   - Monitor setup progress in real-time

3. **ComfyUI Setup**
   - Newly launched servers automatically trigger ComfyUI installation
   - Monitor progress in the server detail page
   - Setup includes dependencies, models, and service configuration

### AI Content Generation

1. **Access ComfyUI Interface**
   - Navigate to ComfyUI from the main menu
   - Select a server with "Ready" or "Demo" status
   - Use the Text to Image generation tool

2. **Model Management**
   - Click "View All Models" to see available models
   - Use "Manage Library" to download new models
   - Organize models by categories (checkpoints, LoRAs, VAE)

3. **Generate Images**
   - Enter your prompt and negative prompt
   - Select model and parameters
   - Monitor generation progress
   - View results in the gallery

### Monitoring & Analytics

1. **Server Dashboard**
   - View all launched servers and their status
   - Monitor resource usage and costs
   - Access individual server detail pages

2. **Performance Analytics**
   - Navigate to Performance Story for detailed insights
   - View usage trends and cost analysis
   - Export data for reporting

## API Documentation

### Core Endpoints

#### Server Management
```
GET    /api/vast-servers          # List all servers
POST   /api/vast-servers          # Launch new server
PATCH  /api/vast-servers/:id      # Update server
DELETE /api/vast-servers/:id      # Destroy server
```

#### ComfyUI Integration
```
GET    /api/comfy/:id/models      # List installed models
POST   /api/comfy/:id/models      # Download new model
POST   /api/comfy/:id/generate    # Generate image
GET    /api/comfy/:id/generations # List generations
```

#### Analytics
```
GET    /api/server-analytics      # Server usage analytics
GET    /api/audit-logs           # System audit logs
GET    /api/stats                # Dashboard statistics
```

### WebSocket Events

Real-time updates for:
- Server status changes
- Setup progress
- Generation completion
- Error notifications

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `VAST_API_KEY` | Vast.ai API authentication | Yes |
| `OPENAI_API_KEY` | OpenAI API for AI features | No |
| `SESSION_SECRET` | Session encryption key | Yes |
| `NODE_ENV` | Environment (development/production) | No |

### Database Schema

The application uses Drizzle ORM with PostgreSQL. Key tables:
- `users` - User accounts and authentication
- `vast_servers` - Server instances and metadata
- `comfy_models` - AI model management
- `comfy_generations` - Generation history
- `audit_logs` - System activity tracking

## Deployment

### Replit Deployment

1. Connect your Replit account
2. Import the project repository
3. Configure environment variables in Replit Secrets
4. Click "Deploy" to create production deployment

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

3. **Configure reverse proxy** (nginx/Apache)
4. **Set up SSL certificates**
5. **Configure monitoring and logging**

## Development

### Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
├── server/                # Express backend
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data access layer
│   ├── comfy-ui.ts        # ComfyUI integration
│   └── vast-ai.ts         # Vast.ai API client
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
└── docs/                  # Documentation
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema changes to database
npm run db:studio    # Open database studio
npm run type-check   # Run TypeScript checks
npm run lint         # Run ESLint
```

### Adding New Features

1. **Database Changes**
   - Update `shared/schema.ts`
   - Run `npm run db:push`

2. **API Endpoints**
   - Add routes in `server/routes.ts`
   - Update storage interface in `server/storage.ts`

3. **Frontend Pages**
   - Create component in `client/src/pages/`
   - Add route in `client/src/App.tsx`

## Troubleshooting

### Common Issues

**Server Connection Failed**
- Verify Vast.ai API key is correct
- Check server status in Vast.ai console
- Ensure firewall allows port 8188

**ComfyUI Setup Stuck**
- Check server logs for errors
- Verify SSH connectivity
- System automatically falls back to demo mode

**Generation Not Working**
- Confirm server is in "Ready" or "Demo" status
- Check model availability
- Review error logs in browser console

### Demo Mode

When SSH connections are unavailable, the system automatically activates demo mode:
- Provides full UI functionality
- Uses sample images for generation
- Maintains all interface features
- Perfect for development and testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Open an issue on GitHub
- Contact the development team

---

**SocialSync** - Simplifying AI-powered content creation and server management.