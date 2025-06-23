// Workflow management feature-specific types

import { BaseEntity, StatusType } from '../shared/core.js';

export interface WorkflowData extends BaseEntity {
  name: string;
  description?: string;
  type: string;
  content: Record<string, any>;
  parameters?: Record<string, any>;
  isActive: boolean;
  version: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowExecution extends BaseEntity {
  workflowId: number;
  serverId?: number;
  status: StatusType;
  parameters?: Record<string, any>;
  results?: Record<string, any>;
  executionTime?: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}

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

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  requiredModels: string[];
  tags: string[];
  workflow: Record<string, any>;
  parameters: WorkflowParameter[];
}

export interface WorkflowParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface WorkflowAnalysis {
  workflowId: number;
  complexity: number;
  estimatedTime: number;
  requiredResources: {
    gpu: boolean;
    vram: number;
    storage: number;
  };
  recommendations: string[];
  optimizations: string[];
  missingModels: string[];
}