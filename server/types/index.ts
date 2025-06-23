// Core Server Types
export interface ServerConfig {
  port: number;
  host: string;
  sessionSecret: string;
  nodeEnv: string;
}

export interface DatabaseConfig {
  url: string;
  connectionTimeout: number;
  queryTimeout: number;
}

// ComfyUI Related Types
export interface ComfyUIConfig {
  defaultPort: number;
  connectionTimeout: number;
  maxRetries: number;
  retryDelay: number;
  defaultWidth: number;
  defaultHeight: number;
  defaultSteps: number;
  defaultCfgScale: number;
  supportedFormats: string[];
  maxPromptLength: number;
}

export interface ComfyUIProgress {
  generationId: number;
  serverId: number;
  status: 'queued' | 'executing' | 'completed' | 'failed';
  currentNode?: string;
  totalNodes?: number;
  completedNodes?: number;
  progress?: number;
  previewImage?: string;
  executionTime?: number;
  errorMessage?: string;
}

export interface QueueStatus {
  exec_info: {
    queue_remaining: number;
  };
}

export interface HistoryEntry {
  prompt: any[];
  outputs: Record<string, any>;
  status: {
    status_str: string;
    completed: boolean;
    messages: string[];
  };
}

// VAST AI Types
export interface VastConfig {
  apiBaseUrl: string;
  maxInstances: number;
  defaultTimeout: number;
  minGpuRam: number;
  preferredRegions: string[];
  setupTimeout: number;
}

// OAuth Types
export interface OAuthCredentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface YouTubeUserInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
    };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

export interface InstagramUserInfo {
  id: string;
  username: string;
  account_type: string;
  media_count?: number;
  followers_count?: number;
}

// Platform Configuration Types
export interface PlatformConfig {
  youtube: {
    apiBaseUrl: string;
    oauthScope: string;
    maxResults: number;
  };
  instagram: {
    apiBaseUrl: string;
    oauthScope: string;
    maxResults: number;
  };
  twitter: {
    apiBaseUrl: string;
    maxTweetLength: number;
    maxMediaPerTweet: number;
  };
}

// Generation Configuration Types
export interface GenerationConfig {
  maxConcurrentGenerations: number;
  generationTimeout: number;
  maxQueueSize: number;
  defaultNegativePrompt: string;
  seedRange: {
    min: number;
    max: number;
  };
}

// Script Management Types
export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  filename: string;
  type: 'setup' | 'reset' | 'model' | 'utility';
  parameters: string[];
}

export interface ModelInfo {
  name: string;
  url: string;
  folder: string;
  filename: string;
}

// Authentication Types
export interface AuthConfig {
  bcryptRounds: number;
  passwordMinLength: number;
  usernameMinLength: number;
  sessionMaxAge: number;
  loginRateLimit: number;
  rateLimitWindow: number;
}

// API Configuration Types
export interface ApiConfig {
  defaultPageSize: number;
  maxPageSize: number;
  rateLimitRequests: number;
  rateLimitWindow: number;
  corsOrigins: string[];
}

// Upload Configuration Types
export interface UploadConfig {
  maxFileSize: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  uploadDir: string;
  tempDir: string;
}

// Audit Types
export interface AuditContext {
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  request?: Request;
}

// User Preferences Types
export interface UserPreferences {
  theme?: string;
  notifications?: boolean;
  autoSave?: boolean;
  preferredModels?: string[];
  defaultWorkflow?: number;
}

// Workflow Types
export interface WorkflowRecommendation {
  id: number;
  userId: number;
  workflowId: number;
  title: string;
  description: string;
  confidence: number;
  reason: string;
  metadata: any;
  createdAt: Date;
}

// Status Types
export type StatusType = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'ready' | 'installing' | 'available' | 'stopped';

// Error and Success Message Types
export interface ErrorMessages {
  [key: string]: string;
}

export interface SuccessMessages {
  [key: string]: string;
}

// WebSocket Event Types
export interface WebSocketEvents {
  [key: string]: string;
}

// Time Constants Types
export interface TimeConstants {
  second: number;
  minute: number;
  hour: number;
  day: number;
  week: number;
}