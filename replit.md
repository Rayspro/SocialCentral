# SocialSync - AI-Powered Social Media Management Platform

## Overview

SocialSync is a full-stack web application for managing social media content across multiple platforms. It provides AI-powered content generation, scheduling, approval workflows, and analytics for social media managers and content creators.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight React router alternative)
- **Tailwind CSS** with **shadcn/ui** components for styling
- **TanStack Query** for server state management and API caching
- **React Hook Form** with **Zod** for form validation
- **Dark/Light theme support** with system preference detection

### Backend Architecture
- **Express.js** server with TypeScript
- **REST API** design pattern for client-server communication
- **Middleware-based** request processing with logging and error handling
- **OpenAI integration** for AI content generation capabilities
- **Session-based** architecture (ready for authentication implementation)

### Database Layer
- **PostgreSQL** as the primary database (configured for Neon serverless)
- **Drizzle ORM** for type-safe database operations
- **Schema-first** approach with TypeScript integration
- **Automated migrations** through Drizzle Kit

## Key Components

### Data Models
- **Platforms**: Social media platforms (YouTube, Instagram, Twitter, LinkedIn)
- **Accounts**: Connected social media accounts per platform
- **Content**: Generated content with approval workflow states
- **Schedules**: Content scheduling and publishing management
- **Users**: User management system (schema defined, not fully implemented)
- **API Keys**: Secure storage for external service credentials
- **Vast Servers**: GPU server instances for AI workloads with pricing and status tracking

### Content Management System
- **AI Content Generation**: Text and image generation using OpenAI API
- **Multi-platform Support**: Content optimization for different social platforms
- **Approval Workflow**: Draft → Pending → Approved/Rejected → Published states
- **Media Library**: Centralized content storage and management
- **Image Editor**: Built-in image editing capabilities with filters and adjustments

### User Interface Components
- **Dashboard**: Analytics overview with stats and quick actions
- **Platform Manager**: Connect and manage social media accounts
- **Content Creator**: AI-powered content generation tools
- **Approval System**: Review and approve pending content
- **Scheduler**: Calendar-based content scheduling
- **Vast.ai Server Manager**: Browse, launch, and manage GPU servers for AI workloads
- **Settings**: API key management and platform configuration

## Data Flow

1. **Content Creation**: Users generate content using AI tools or manual input
2. **Platform Targeting**: Content is tagged for specific social media platforms
3. **Approval Workflow**: Content enters pending state for review
4. **Scheduling**: Approved content can be scheduled for publishing
5. **Publishing**: Scheduled content is published to connected social accounts
6. **Analytics**: Performance data is collected and displayed in dashboard

## External Dependencies

### Core Framework Dependencies
- **React ecosystem**: React, React DOM, TypeScript support
- **UI Components**: Radix UI primitives, Lucide icons
- **State Management**: TanStack Query for server state
- **Form Handling**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Neon PostgreSQL serverless, Drizzle ORM
- **AI Services**: OpenAI API for content generation
- **Development**: TSX for TypeScript execution, ESBuild for production builds

### Development Tools
- **Vite plugins**: React support, Replit integration, error overlay
- **Code Quality**: TypeScript strict mode, ESLint configuration
- **Build Tools**: PostCSS with Tailwind, automatic asset optimization

## Deployment Strategy

### Development Environment
- **Replit-optimized**: Configured for Replit development environment
- **Hot Reload**: Vite development server with HMR
- **Port Configuration**: Server runs on port 5000, exposed as port 80

### Production Build
- **Client Build**: Vite builds React app with optimizations
- **Server Build**: ESBuild bundles Express server with external packages
- **Static Assets**: Client assets served from Express server
- **Database**: Automated schema migrations on deployment

### Environment Configuration
- **Database URL**: PostgreSQL connection string (required)
- **OpenAI API Key**: Required for AI content generation
- **Session Management**: Uses connect-pg-simple for PostgreSQL session storage

## Changelog

```
Changelog:
- June 18, 2025. Initial setup
- June 19, 2025. Added comprehensive Vast.ai server management system with filterable table view, pricing display, and launch capabilities
- June 19, 2025. Implemented ComfyUI shell script execution system with predefined setup scripts for automated model downloads and server configuration
- June 19, 2025. Fixed server startup crashes by implementing complete MemStorage interface with all required Vast.ai and setup script methods
- June 19, 2025. Resolved VastServers page crashes with proper array validation and API error handling
- June 19, 2025. Fixed API key management system - keys now save and display correctly in settings page
- June 19, 2025. Fixed Vast.ai API integration to use database-stored API keys instead of environment variables, enabling real server launches on Vast.ai platform
- June 19, 2025. Fixed "Failed to create instance" error by implementing proper demo mode for server launches with fallback to real API integration
- June 19, 2025. Resolved duplicate route handler conflicts that were preventing demo server launches from working correctly
- June 19, 2025. Implemented full real Vast.ai API integration - app now fetches live server offers and creates actual instances on Vast.ai platform
- June 19, 2025. Replaced mock data system with authentic Vast.ai marketplace data - servers launched will appear in user's Vast.ai console
- June 19, 2025. Fixed server synchronization issues - delete and stop operations now properly destroy actual Vast.ai instances
- June 19, 2025. Implemented proper contract ID tracking for bidirectional sync between app and Vast.ai console status
- June 19, 2025. Fixed UI issues - added refresh button for server status updates, corrected stop button visibility, and improved status display with accurate color coding
- June 19, 2025. Enhanced server cards with individual refresh icons and proper setupStatus display in headers with color-coded badges
- June 19, 2025. Added comprehensive server analytics page with real-time metrics, performance monitoring, and detailed server information
- June 19, 2025. Implemented animated status indicators, loading states, and enhanced server cards with all status types and connection details
- June 19, 2025. Redesigned server analytics with professional enterprise-grade charts, replacing childish visuals with sophisticated data visualization
- June 19, 2025. Enhanced metric cards with modern gradients, proper typography, and professional color schemes for production-ready appearance
- June 19, 2025. Implemented elegant breadcrumb navigation system throughout the app with improved page padding and professional layout design
- June 19, 2025. Optimized chart padding and reduced header sizes for better space utilization and cleaner visual hierarchy
- June 19, 2025. Fixed text overlapping issues and improved layout spacing for enhanced readability and professional appearance
- June 19, 2025. Applied consistent compact design across entire app - reduced header sizes, smaller padding, optimized spacing throughout all components and pages
- June 19, 2025. Completed comprehensive UI redesign with Vast.ai server header pattern applied consistently across all pages (Dashboard, CreateContent, Platforms, Schedule, Approvals, MediaLibrary, Settings) with breadcrumb navigation and professional styling
- June 19, 2025. Added profile and logout options to all page headers with breadcrumb navigation - profile dropdown now appears on opposite side from breadcrumbs with consistent styling and functionality across all pages
- June 19, 2025. Implemented complete authentication system with real credential validation - replaced mock authentication with secure bcrypt password hashing, proper route protection, and API validation that prevents unauthorized access with random credentials
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```