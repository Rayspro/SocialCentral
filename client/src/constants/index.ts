// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
  },

  // Vast.ai servers
  SERVERS: {
    BASE: '/api/vast-servers',
    START: (id: number) => `/api/vast-servers/start/${id}`,
    STOP: (id: number) => `/api/vast-servers/stop/${id}`,
    AVAILABLE: '/api/vast-servers/available',
  },

  // ComfyUI
  COMFY: {
    STARTUP: (serverId: number) => `/api/comfy/startup/${serverId}`,
    GENERATE: (serverId: number) => `/api/comfy/${serverId}/generate`,
    PROGRESS: (generationId: number) => `/api/comfy/progress/${generationId}`,
    ALL_PROGRESS: '/api/comfy/progress',
    MODELS: (serverId: number) => `/api/comfy/models/${serverId}`,
    WORKFLOWS: '/api/comfy/workflows',
    RESET: (serverId: number) => `/api/comfy/${serverId}/reset`,
  },

  // Server executions
  EXECUTIONS: (serverId: number) => `/api/server-executions/${serverId}`,
  
  // Server scheduler
  SCHEDULER: {
    GET: (serverId: number) => `/api/server-scheduler/${serverId}`,
    START: (serverId: number) => `/api/server-scheduler/${serverId}/start`,
    STOP: (serverId: number) => `/api/server-scheduler/${serverId}/stop`,
  },

  // Platforms and accounts
  PLATFORMS: '/api/platforms',
  ACCOUNTS: '/api/accounts',
  CONTENT: '/api/content',
  SCHEDULES: '/api/schedules',

  // Analytics and stats
  STATS: '/api/stats',
  ANALYTICS: '/api/server-analytics',
  AUDIT_LOGS: '/api/audit-logs',

  // Workflows
  WORKFLOWS: {
    BASE: '/api/workflows',
    WITH_MODELS: '/api/workflows/with-models',
    SYNC_MODELS: (id: number) => `/api/workflows/${id}/sync-models`,
  },

  // Setup scripts
  SETUP_SCRIPTS: '/api/setup-scripts',
} as const;

// Status constants
export const SERVER_STATUS = {
  PENDING: 'pending',
  CREATING: 'creating',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  FAILED: 'failed',
  DESTROYED: 'destroyed',
} as const;

export const GENERATION_STATUS = {
  PENDING: 'pending',
  QUEUED: 'queued',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const EXECUTION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// UI constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const TOAST_VARIANTS = {
  DEFAULT: 'default',
  DESTRUCTIVE: 'destructive',
  SUCCESS: 'success',
} as const;

// Form validation constants
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MESSAGE: 'Password must be at least 8 characters long',
  },
  SERVER_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    MESSAGE: 'Server name must be between 3 and 50 characters',
  },
  PROMPT: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 1000,
    MESSAGE: 'Prompt must be between 5 and 1000 characters',
  },
} as const;

// GPU configurations
export const GPU_OPTIONS = [
  { value: 'RTX 4090', label: 'RTX 4090', vram: '24GB' },
  { value: 'RTX 4080', label: 'RTX 4080', vram: '16GB' },
  { value: 'RTX 3090', label: 'RTX 3090', vram: '24GB' },
  { value: 'RTX 3080', label: 'RTX 3080', vram: '10GB' },
  { value: 'A100', label: 'A100', vram: '40GB' },
  { value: 'V100', label: 'V100', vram: '16GB' },
] as const;

// Location options
export const LOCATION_OPTIONS = [
  { value: 'US-East', label: 'US East' },
  { value: 'US-West', label: 'US West' },
  { value: 'EU-Central', label: 'EU Central' },
  { value: 'Asia-Pacific', label: 'Asia Pacific' },
] as const;

// Content types
export const CONTENT_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  TEXT: 'text',
} as const;

// Platform names
export const PLATFORMS = {
  YOUTUBE: 'youtube',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  FACEBOOK: 'facebook',
} as const;

// WebSocket events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  PROGRESS: 'progress',
  COMPLETE: 'complete',
  ERROR: 'error',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
} as const;

// Query keys for React Query
export const QUERY_KEYS = {
  SERVERS: ['servers'],
  SERVER: (id: number) => ['server', id],
  EXECUTIONS: (serverId: number) => ['executions', serverId],
  GENERATIONS: (serverId: number) => ['generations', serverId],
  PROGRESS: (generationId: number) => ['progress', generationId],
  ALL_PROGRESS: ['progress'],
  PLATFORMS: ['platforms'],
  ACCOUNTS: ['accounts'],
  CONTENT: ['content'],
  WORKFLOWS: ['workflows'],
  STATS: ['stats'],
  ANALYTICS: ['analytics'],
  AUDIT_LOGS: ['audit-logs'],
} as const;

// Default values
export const DEFAULTS = {
  GENERATION_PARAMETERS: {
    steps: 30,
    cfg: 7.5,
    seed: -1,
    width: 1024,
    height: 1024,
  },
  SERVER_CONFIG: {
    cpuCores: 4,
    ram: 16,
    disk: 100,
    gpuCount: 1,
  },
  PAGINATION: {
    limit: 20,
    page: 1,
  },
  REFRESH_INTERVALS: {
    PROGRESS: 1000, // 1 second
    EXECUTIONS: 5000, // 5 seconds
    SERVERS: 10000, // 10 seconds
  },
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  RATE_LIMIT: 'Too many requests. Please wait and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SERVER_CREATED: 'Server created successfully',
  SERVER_STARTED: 'Server started successfully',
  SERVER_STOPPED: 'Server stopped successfully',
  GENERATION_STARTED: 'Image generation started',
  SETUP_INITIATED: 'ComfyUI setup initiated',
  WORKFLOW_SAVED: 'Workflow saved successfully',
  CONTENT_PUBLISHED: 'Content published successfully',
} as const;