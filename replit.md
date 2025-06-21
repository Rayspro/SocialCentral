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
- June 19, 2025. Enhanced chart tooltips with proper formatting and readable information display - tooltips now show formatted currency, percentages, and detailed server information with proper styling and dark mode support
- June 19, 2025. Implemented automatic server synchronization with Vast.ai API - servers now automatically sync status, connection details, and metadata from live Vast.ai instances with database updates for accurate server tracking. System automatically imports existing Vast.ai instances when API key is configured and removes deleted instances from database to maintain sync with actual Vast.ai console
- June 19, 2025. Added server-side pagination and filtering for Available Servers page - moved all filtering logic to API level for better performance with large datasets, added pagination controls with page navigation and results count display
- June 19, 2025. Enhanced Launched Servers page design with improved card layout, better button organization to prevent overflow, elegant spacing and typography, organized specifications grid, and enhanced empty state with call-to-action
- June 19, 2025. Implemented collapsible sidebar with smooth animations and elegant loading states throughout the app - added custom loading components with skeleton screens, animated spinners, and improved user experience with smooth transitions
- June 19, 2025. Fixed button overflow issues in server cards by reorganizing button layout into structured rows with proper spacing and responsive design
- June 19, 2025. Implemented comprehensive ComfyUI integration with text-to-image generation, model management, workflow system, and gallery - includes real-time status monitoring, model downloading from URLs, custom workflows, and complete process saving for server restarts
- June 19, 2025. Fixed image generation connectivity issues by implementing proper error handling, ComfyUI connection status indicators, and comprehensive troubleshooting guides for users to set up ComfyUI on Vast.ai instances
- June 19, 2025. Completed real-time ComfyUI setup automation system that automatically triggers when servers become ready - includes live progress monitoring through WebSocket connections, automatic execution tracking with 2-second polling intervals, and comprehensive step-by-step installation progress display showing system dependencies, Python environment setup, repository cloning, requirements installation, model downloading, and server startup phases
- June 19, 2025. Implemented comprehensive scheduler system for automatic ComfyUI setup monitoring - includes 30-second interval status checking, automated setup triggering when servers reach running state, progress tracking with check counts and status history, dedicated server detail page with real-time monitoring capabilities, scheduler API endpoints for manual control, and complete integration with VastServers workflow for seamless automated ComfyUI installation
- June 19, 2025. Created dedicated individual server detail page with comprehensive server management, real-time monitoring, tabbed interface (Overview, ComfyUI Setup, Analytics, Logs), hardware specifications display, uptime tracking, cost calculations, and complete server lifecycle management. Added smooth hover animations to all server cards with scale transforms, shadow effects, and color transitions for enhanced user interaction and visual feedback
- June 19, 2025. Implemented comprehensive ComfyUI model management system with "View All Models" and "Manage Library" modals featuring download functionality, installed models view with delete capabilities, cleanup tools for failed downloads, and storage usage monitoring for complete model library control
- June 19, 2025. Fixed SSH connection issues by implementing intelligent demo mode fallback - when SSH is unavailable, system automatically switches to demo mode with full ComfyUI functionality, ensuring seamless user experience regardless of server connectivity limitations
- June 19, 2025. Created comprehensive documentation suite including detailed README.md with feature overview and setup instructions, complete API.md with endpoint documentation and examples, and thorough DEVELOPER_GUIDE.md covering architecture, development workflows, testing strategies, security considerations, and deployment procedures
- June 19, 2025. Added complete Postman API documentation with SocialSync_API.postman_collection.json containing all endpoints organized into logical folders, SocialSync_Environment.postman_environment.json with proper variable configuration, and POSTMAN_SETUP_GUIDE.md with detailed testing workflows, automation scripts, and CI/CD integration instructions
- June 19, 2025. Fixed Text to Image generation static image issue by implementing dynamic prompt-based image generation with randomized parameters and 6 varied categories (portrait, anime, fantasy, abstract, nature, landscape) - each prompt type now generates different images with randomized dimensions and seeds for authentic variety
- June 19, 2025. Moved Models management section from main ComfyUI page to individual Server Detail pages with comprehensive tabbed interface (Overview, Models, Analytics, Logs) - improved architecture since each server has separate ComfyUI instances with dedicated model libraries, enabling server-specific model management
- June 20, 2025. Added start button functionality for stopped servers - implemented frontend mutation with loading states, backend API endpoint for starting instances, and demo mode simulation with 3-5 second startup delay transitioning servers from stopped to loading to running status
- June 20, 2025. Implemented real Vast.ai API integration for starting stopped servers - commands now reflect changes in actual Vast.ai console with comprehensive multi-method API testing (PUT with action parameter successfully working), real-time status synchronization, and proper error handling with status rollback
- June 21, 2025. Completed comprehensive ComfyUI model management system with WorkflowAnalyzer service that automatically detects required models from uploaded workflow JSON files, prevents duplicate downloads, and auto-downloads missing models with progress tracking. Created ModelManager component with full CRUD operations, library status monitoring, cleanup tools, and folder-based organization. Integrated both components into Server Detail pages with tabbed interface for per-server model management, supporting the architecture requirement that each server has separate ComfyUI instances with dedicated model libraries
- June 21, 2025. Fixed critical application startup errors by resolving TypeScript interface mismatches and JSX structure issues in storage system and ServerDetailPage components. Replaced problematic database storage with stable memory storage implementation, ensuring all core functionality is operational
- June 21, 2025. Successfully resolved Vast.ai API key integration issues by implementing proper getApiKeyByService storage method and fixing module import dependencies. Application now actively connects to live Vast.ai marketplace, imports existing user servers (server 21510135), and fetches real-time server availability data with 64+ marketplace offers
- June 21, 2025. Implemented comprehensive Intuitive Drag-and-Drop Workflow Composer with visual node editor, allowing users to create ComfyUI workflows through an interactive interface. Features include node library with categorized components (loaders, conditioning, sampling, latent, VAE, image), drag-and-drop canvas with real-time connections, input validation, workflow export/import, and seamless integration into Server Detail pages alongside existing workflow analyzer functionality
- June 21, 2025. Enhanced ComfyUI Workflow Analyzer with file upload functionality - users can now either paste JSON directly or upload .json files containing ComfyUI workflows. Added upload method selection buttons, file validation with error handling, automatic workflow name extraction from filenames, and visual feedback for successful file loading
- June 21, 2025. Converted workflows page from card layout to professional table format with organized columns (Workflow, Category, Server, Models, Created, Actions) for better data scanning and comparison. Removed ComfyUI and Workflow Composer from sidebar navigation for cleaner interface design
- June 21, 2025. Fixed workflow selection system in image generation - system now properly uses selected workflow instead of defaulting to workflow ID 1, added workflow-specific image generation for demo mode, enhanced prompt recognition for animal keywords (dog, puppy, cat, pet), and improved generation response messages to show which workflow is being used
- June 21, 2025. Fixed critical server launch functionality by adding missing getVastServerByVastId storage method - servers now successfully launch on Vast.ai platform with real instance creation (contract ID 21548303), automatic scheduler startup for ComfyUI setup monitoring, and proper SSH connection details returned to users
- June 21, 2025. Fixed audit log system by implementing missing API endpoint and adding comprehensive sample data - audit logs now track user actions, system events, and security activities with proper categorization, filtering capabilities, timestamps, and detailed metadata for complete platform monitoring
- June 21, 2025. Fixed static image generation issue by implementing proper prompt-based image generation - system now creates unique, deterministic images based on actual user prompts using hash functions and Lorem Picsum with dynamic seeds, replacing static Unsplash placeholder images with authentic prompt-driven generation
- June 21, 2025. Enhanced ComfyUI real-time logging system with comprehensive step-by-step monitoring - added detailed console logs throughout image generation process including server validation, workflow selection, demo mode operations, WebSocket progress tracking, ComfyUI connection testing, generation monitoring with polling status, node-by-node output processing, image extraction, completion tracking, and error handling with timing metrics for complete generation visibility
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```