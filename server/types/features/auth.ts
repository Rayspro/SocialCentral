// Authentication feature-specific types

import { BaseEntity } from '../shared/core.js';

export interface UserData extends BaseEntity {
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
}

export interface SessionData {
  userId: number;
  sessionId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface UserPreferences extends BaseEntity {
  userId: number;
  theme?: string;
  notifications?: boolean;
  autoSave?: boolean;
  preferredModels?: string[];
  defaultWorkflow?: number;
  settings?: Record<string, any>;
}