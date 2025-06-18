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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```