// Server Configuration Constants
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 5000,
  HOST: '0.0.0.0',
  SESSION_SECRET: process.env.SESSION_SECRET || 'default-session-secret',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;

// Database Constants
export const DATABASE_CONFIG = {
  URL: process.env.DATABASE_URL || '',
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 10000,
} as const;

// ComfyUI Constants
export const COMFYUI_CONFIG = {
  DEFAULT_PORT: 8188,
  CONNECTION_TIMEOUT: 8000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
  DEFAULT_WIDTH: 512,
  DEFAULT_HEIGHT: 512,
  DEFAULT_STEPS: 20,
  DEFAULT_CFG_SCALE: 7.0,
  SUPPORTED_FORMATS: ['png', 'jpg', 'jpeg', 'webp'],
  MAX_PROMPT_LENGTH: 1000,
} as const;

// VAST AI Constants
export const VAST_CONFIG = {
  API_BASE_URL: 'https://console.vast.ai/api/v0',
  MAX_INSTANCES: 10,
  DEFAULT_TIMEOUT: 30000,
  MIN_GPU_RAM: 8, // GB
  PREFERRED_REGIONS: ['US-West', 'US-East', 'EU-Central'],
  SETUP_TIMEOUT: 900000, // 15 minutes
} as const;

// File Upload Constants
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/avi', 'video/mov'],
  UPLOAD_DIR: './uploads',
  TEMP_DIR: './temp',
} as const;

// Authentication Constants
export const AUTH_CONFIG = {
  BCRYPT_ROUNDS: 10,
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  SESSION_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  LOGIN_RATE_LIMIT: 5, // attempts per window
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
} as const;

// API Constants
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
} as const;

// Content Generation Constants
export const GENERATION_CONFIG = {
  MAX_CONCURRENT_GENERATIONS: 3,
  GENERATION_TIMEOUT: 300000, // 5 minutes
  MAX_QUEUE_SIZE: 50,
  DEFAULT_NEGATIVE_PROMPT: 'blurry, low quality, distorted, deformed',
  SEED_RANGE: {
    MIN: 1,
    MAX: 2147483647,
  },
} as const;

// Platform Integration Constants
export const PLATFORM_CONFIG = {
  YOUTUBE: {
    API_BASE_URL: 'https://www.googleapis.com/youtube/v3',
    OAUTH_SCOPE: 'https://www.googleapis.com/auth/youtube.readonly',
    MAX_RESULTS: 50,
  },
  INSTAGRAM: {
    API_BASE_URL: 'https://graph.instagram.com',
    OAUTH_SCOPE: 'user_profile,user_media',
    MAX_RESULTS: 25,
  },
  TWITTER: {
    API_BASE_URL: 'https://api.twitter.com/2',
    MAX_TWEET_LENGTH: 280,
    MAX_MEDIA_PER_TWEET: 4,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid username or password',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  USER_EXISTS: 'User already exists',
  WEAK_PASSWORD: 'Password must be at least 6 characters',
  
  // Server Management
  SERVER_NOT_FOUND: 'Server not found',
  SERVER_CREATION_FAILED: 'Failed to create server',
  SERVER_DELETION_FAILED: 'Failed to delete server',
  INVALID_SERVER_CONFIG: 'Invalid server configuration',
  
  // ComfyUI
  COMFYUI_NOT_ACCESSIBLE: 'ComfyUI server is not responding',
  COMFYUI_SETUP_REQUIRED: 'ComfyUI setup must be completed before use',
  INVALID_WORKFLOW: 'Invalid workflow configuration',
  GENERATION_FAILED: 'Image generation failed',
  MISSING_MODELS: 'Required models are not installed',
  
  // General
  INTERNAL_ERROR: 'Internal server error',
  INVALID_INPUT: 'Invalid input data',
  NOT_FOUND: 'Resource not found',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User account created successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  SERVER_CREATED: 'Server created successfully',
  SERVER_DELETED: 'Server deleted successfully',
  GENERATION_STARTED: 'Image generation started',
  SETUP_INITIATED: 'Setup process initiated',
  MODEL_INSTALLED: 'Model installed successfully',
} as const;

// Status Constants
export const STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  READY: 'ready',
  INSTALLING: 'installing',
  AVAILABLE: 'available',
  STOPPED: 'stopped',
} as const;

// Audit Log Actions
export const AUDIT_ACTIONS = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  SERVER_CREATE: 'server_create',
  SERVER_DELETE: 'server_delete',
  SERVER_START: 'server_start',
  SERVER_STOP: 'server_stop',
  COMFY_GENERATION: 'comfy_generation',
  API_KEY_CREATE: 'api_key_create',
  API_KEY_UPDATE: 'api_key_update',
  API_KEY_DELETE: 'api_key_delete',
  SECURITY_EVENT: 'security_event',
  SYSTEM_ERROR: 'system_error',
} as const;

// WebSocket Events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PROGRESS_UPDATE: 'progress_update',
  GENERATION_COMPLETE: 'generation_complete',
  ERROR: 'error',
  STATUS_CHANGE: 'status_change',
} as const;

// Time Constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;