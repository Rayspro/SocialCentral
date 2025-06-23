// ComfyUI feature-specific types

import { BaseEntity, StatusType } from '../shared/core.js';

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

export interface ComfyWorkflowNode {
  inputs: Record<string, any>;
  class_type: string;
  _meta?: {
    title: string;
  };
}

export interface ComfyWorkflow {
  [nodeId: string]: ComfyWorkflowNode;
}

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

export interface ModelInfo {
  name: string;
  url: string;
  folder: string;
  filename: string;
  type?: string;
}

export interface ComfyModelData extends BaseEntity {
  serverId: number;
  name: string;
  url: string;
  folder: string;
  fileName: string;
  fileSize?: number;
  downloadProgress: number;
  status: StatusType;
  description?: string;
  errorMessage?: string;
}

export interface ComfyGenerationData extends BaseEntity {
  serverId: number;
  workflowId?: number;
  prompt: string;
  negativePrompt?: string;
  parameters?: Record<string, any>;
  status: StatusType;
  progress: number;
  imageUrls?: string[];
  errorMessage?: string;
  executionTime?: number;
}