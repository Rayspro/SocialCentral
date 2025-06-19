# SocialSync - AI-Powered Social Media Management Platform

A comprehensive server management platform that simplifies complex infrastructure monitoring through an engaging, intelligent interface for ComfyUI and Vast.ai server interactions.

## 🚀 Features

- **Vast.ai Server Management**: Launch, monitor, and manage GPU servers
- **ComfyUI Integration**: Automated setup and image generation workflows
- **Real-time Monitoring**: Live server status and performance tracking
- **Model Management**: Download, organize, and manage AI models
- **Authentication System**: Secure user authentication with session management
- **Audit Logging**: Comprehensive system event tracking
- **Responsive UI**: Modern interface with dark/light mode support

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Vast.ai API key (for server management)
- OpenAI API key (for AI features)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd socialsync
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/socialsync

# API Keys
VAST_API_KEY=your_vast_ai_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Session Configuration
SESSION_SECRET=your_secure_session_secret_here

# Replit Configuration (if deploying on Replit)
REPLIT_DOMAINS=your-repl-name.replit.app
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
```

### 4. Database Setup

#### Option A: Using Neon (Recommended for Production)
1. Create a Neon PostgreSQL database at https://neon.tech
2. Copy the connection string to `DATABASE_URL`

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb socialsync
sudo -u postgres createuser -P socialsync_user

# Grant permissions
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE socialsync TO socialsync_user;
```

### 5. Database Migration
```bash
npm run db:push
```

### 6. Start the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔧 Configuration Guide

### API Keys Setup

#### Vast.ai API Key
1. Sign up at https://vast.ai
2. Go to Account → API Keys
3. Generate a new API key
4. Add to Settings page in the application

#### OpenAI API Key
1. Sign up at https://platform.openai.com
2. Navigate to API Keys section
3. Create a new secret key
4. Add to Settings page in the application

### User Authentication

#### Demo Mode (Development)
- Email: `demo@example.com`
- Password: `demo123`

#### Production Setup
1. Users register through the application
2. Passwords are hashed using bcrypt
3. Sessions are stored in PostgreSQL
4. Authentication middleware protects routes

## 📁 Project Structure

```
socialsync/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Express backend server
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data storage interface
│   ├── comfy-ui.ts         # ComfyUI integration
│   ├── vast-ai.ts          # Vast.ai API integration
│   └── audit-logger.ts     # Audit logging system
├── shared/                 # Shared TypeScript schemas
│   └── schema.ts           # Database schemas and types
└── docs/                   # Documentation
```

## 🔄 Core Workflows

### Server Management Workflow

1. **Browse Available Servers**
   - Navigate to Vast Servers page
   - Filter by GPU type, price, location
   - View server specifications and pricing

2. **Launch a Server**
   - Click "Launch" on desired server
   - Server appears in "Launched Servers" section
   - Automatic status monitoring begins

3. **ComfyUI Setup**
   - System automatically detects new servers
   - Initiates ComfyUI installation process
   - Real-time progress monitoring via scheduler

4. **Image Generation**
   - Navigate to ComfyUI page
   - Select server from dropdown
   - Enter prompts and generate images
   - View results in gallery

### Model Management Workflow

1. **View Available Models**
   - Go to ComfyUI → Model Management
   - Browse categorized model library
   - See installed vs available models

2. **Download Models**
   - Click "Manage Library"
   - Enter model URL and select folder
   - Monitor download progress
   - Models auto-install to server

3. **Cleanup and Maintenance**
   - Use cleanup tools for failed downloads
   - Monitor storage usage
   - Remove unused models

## 🚀 Deployment

### Replit Deployment (Recommended)
1. Import project to Replit
2. Set environment variables in Secrets tab
3. Run `npm run dev`
4. Use Replit's deployment features

### Traditional Server Deployment

#### Using PM2 (Production)
```bash
# Install PM2
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker
```bash
# Build Docker image
docker build -t socialsync .

# Run container
docker run -p 5000:5000 --env-file .env socialsync
```

### Environment-Specific Configurations

#### Development
- Uses memory storage for rapid testing
- Hot reload enabled
- Debug logging active
- Demo mode available

#### Production
- PostgreSQL database required
- Session storage in database
- Error logging to files
- Security headers enabled

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database status
sudo systemctl status postgresql

# Restart database
sudo systemctl restart postgresql

# Check connection
psql $DATABASE_URL
```

#### Vast.ai API Issues
1. Verify API key in Settings page
2. Check Vast.ai account balance
3. Ensure API key has proper permissions
4. Monitor rate limits

#### ComfyUI Connection Problems
1. Verify server is running
2. Check SSH connectivity
3. Ensure ComfyUI is installed
4. Verify port 8188 is accessible

#### SSH Connection Issues (Demo Mode)
- System automatically switches to demo mode
- Full functionality maintained
- Sample images provided
- Real server connection attempted first

### Debug Mode
Enable detailed logging:
```bash
DEBUG=* npm run dev
```

### Log Files
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Audit logs: Available in database

## 📊 Monitoring and Analytics

### Built-in Analytics
- Server usage tracking
- Cost monitoring
- Performance metrics
- User activity logs

### Audit System
- All user actions logged
- Security events tracked
- System errors recorded
- API access monitored

### Health Checks
- Database connectivity
- External API status
- Server responsiveness
- Memory usage monitoring

## 🔐 Security

### Authentication
- Bcrypt password hashing
- Session-based authentication
- CSRF protection
- Rate limiting

### Data Protection
- API keys encrypted in database
- Secure session storage
- Input validation and sanitization
- SQL injection prevention

### Network Security
- HTTPS enforcement in production
- Secure headers middleware
- CORS configuration
- Request logging

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 API Documentation

### Server Management
- `GET /api/vast-servers` - List all servers
- `POST /api/vast-servers` - Launch new server
- `PATCH /api/vast-servers/:id` - Update server
- `DELETE /api/vast-servers/:id` - Destroy server

### ComfyUI Integration
- `GET /api/comfy/:serverId/models` - List installed models
- `POST /api/comfy/:serverId/generate` - Generate image
- `GET /api/comfy/:serverId/generations` - List generations
- `POST /api/comfy/models` - Download model

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

## 📞 Support

For technical support or questions:
1. Check troubleshooting section
2. Review audit logs for errors
3. Enable debug mode for detailed logging
4. Create issue with reproduction steps

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Vast.ai for GPU server infrastructure
- ComfyUI for AI image generation
- OpenAI for AI capabilities
- React and Express.js communities