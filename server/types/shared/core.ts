// Core shared types used across the entire application

export type StatusType = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'ready' | 'installing' | 'available' | 'stopped';

export interface BaseConfig {
  port: number;
  host: string;
  nodeEnv: string;
}

export interface DatabaseConfig {
  url: string;
  connectionTimeout: number;
  queryTimeout: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TimeConstants {
  second: number;
  minute: number;
  hour: number;
  day: number;
  week: number;
}

export interface ErrorMessages {
  [key: string]: string;
}

export interface SuccessMessages {
  [key: string]: string;
}

export interface AuditContext {
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
  request?: any;
}

export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt?: Date;
}