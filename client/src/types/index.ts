// Core application types
export interface User {
  id: number;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VastServer {
  id: number;
  vastId: string;
  name: string;
  gpu: string;
  gpuCount: number;
  cpuCores: number;
  ram: number;
  disk: number;
  pricePerHour: string;
  location: string;
  status: string;
  isAvailable: boolean;
  isLaunched: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComfyGeneration {
  id: number;
  serverId: number;
  workflowId?: number;
  prompt: string;
  negativePrompt?: string;
  parameters?: Record<string, any>;
  status: 'pending' | 'queued' | 'executing' | 'completed' | 'failed';
  imageUrls?: string[];
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComfyWorkflow {
  id: number;
  userId: number;
  name: string;
  description?: string;
  workflow: Record<string, any>;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerExecution {
  id: number;
  serverId: number;
  scriptId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  errorLog?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface Platform {
  id: number;
  name: string;
  displayName: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface Account {
  id: number;
  platformId: number;
  name: string;
  username?: string;
  isConnected: boolean;
  lastSync?: Date;
  createdAt: Date;
}

export interface Content {
  id: number;
  title: string;
  description?: string;
  type: 'image' | 'video' | 'text';
  status: 'draft' | 'scheduled' | 'published';
  platforms: string[];
  scheduledAt?: Date;
  createdAt: Date;
}

// Progress and monitoring types
export interface GenerationProgress {
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

export interface WorkflowAnalysis {
  id: number;
  serverId: number;
  workflowData: Record<string, any>;
  requiredModels: string[];
  missingModels: string[];
  complexity: 'low' | 'medium' | 'high';
  estimatedTime: number;
  status: 'analyzing' | 'completed' | 'failed';
  createdAt: Date;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface ServerCreateForm {
  name: string;
  gpu: string;
  gpuCount: number;
  cpuCores: number;
  ram: number;
  disk: number;
  location: string;
}

export interface GenerationForm {
  prompt: string;
  negativePrompt?: string;
  workflowId?: number;
  parameters?: {
    steps?: number;
    cfg?: number;
    seed?: number;
    width?: number;
    height?: number;
  };
}

export interface ContentForm {
  title: string;
  description?: string;
  type: 'image' | 'video' | 'text';
  platforms: string[];
  scheduledAt?: Date;
}

// Theme and UI types
export type Theme = 'light' | 'dark' | 'system';

export interface TabConfig {
  id: string;
  label: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}