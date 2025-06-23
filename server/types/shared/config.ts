// Shared configuration types used across multiple features

export interface ServerConfig {
  port: number;
  host: string;
  sessionSecret: string;
  nodeEnv: string;
}

export interface ApiConfig {
  defaultPageSize: number;
  maxPageSize: number;
  rateLimitRequests: number;
  rateLimitWindow: number;
  corsOrigins: string[];
}

export interface AuthConfig {
  bcryptRounds: number;
  passwordMinLength: number;
  usernameMinLength: number;
  sessionMaxAge: number;
  loginRateLimit: number;
  rateLimitWindow: number;
}

export interface UploadConfig {
  maxFileSize: number;
  allowedImageTypes: string[];
  allowedVideoTypes: string[];
  uploadDir: string;
  tempDir: string;
}

export interface WebSocketEvents {
  [key: string]: string;
}