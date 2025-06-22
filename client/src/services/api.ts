import { API_ENDPOINTS } from '@/constants';
import { apiRequest } from '@/lib/queryClient';
import type {
  VastServer,
  ServerCreateForm,
  ComfyGeneration,
  GenerationForm,
  ServerExecution,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

// Server management
export const serverService = {
  async getAll(): Promise<VastServer[]> {
    const response = await fetch(API_ENDPOINTS.SERVERS.BASE);
    return response.json();
  },

  async getById(id: number): Promise<VastServer> {
    const response = await fetch(`${API_ENDPOINTS.SERVERS.BASE}/${id}`);
    return response.json();
  },

  async create(data: ServerCreateForm): Promise<ApiResponse<VastServer>> {
    return apiRequest(API_ENDPOINTS.SERVERS.BASE, 'POST', data);
  },

  async start(id: number): Promise<ApiResponse> {
    return apiRequest(API_ENDPOINTS.SERVERS.START(id), 'POST');
  },

  async stop(id: number): Promise<ApiResponse> {
    return apiRequest(API_ENDPOINTS.SERVERS.STOP(id), 'POST');
  },

  async delete(id: number): Promise<ApiResponse> {
    return apiRequest(`${API_ENDPOINTS.SERVERS.BASE}/${id}`, 'DELETE');
  },

  async getAvailable(): Promise<VastServer[]> {
    const response = await fetch(API_ENDPOINTS.SERVERS.AVAILABLE);
    return response.json();
  },
};

// ComfyUI service
export const comfyService = {
  async startSetup(serverId: number): Promise<ApiResponse<{ executionId: number }>> {
    return apiRequest(API_ENDPOINTS.COMFY.STARTUP(serverId), 'POST');
  },

  async generateImage(serverId: number, data: GenerationForm): Promise<ApiResponse<{ generationId: number }>> {
    return apiRequest(API_ENDPOINTS.COMFY.GENERATE(serverId), 'POST', data);
  },

  async getProgress(generationId: number) {
    const response = await fetch(API_ENDPOINTS.COMFY.PROGRESS(generationId));
    return response.json();
  },

  async getAllProgress() {
    const response = await fetch(API_ENDPOINTS.COMFY.ALL_PROGRESS);
    return response.json();
  },

  async getModels(serverId: number) {
    const response = await fetch(API_ENDPOINTS.COMFY.MODELS(serverId));
    return response.json();
  },

  async getWorkflows() {
    const response = await fetch(API_ENDPOINTS.COMFY.WORKFLOWS);
    return response.json();
  },

  async resetSetup(serverId: number): Promise<ApiResponse> {
    return apiRequest(API_ENDPOINTS.COMFY.RESET(serverId), 'POST');
  },
};

// Execution service
export const executionService = {
  async getByServer(serverId: number): Promise<ServerExecution[]> {
    const response = await fetch(API_ENDPOINTS.EXECUTIONS(serverId));
    return response.json();
  },
};

// Platform service
export const platformService = {
  async getAll() {
    const response = await fetch(API_ENDPOINTS.PLATFORMS);
    return response.json();
  },

  async getAccounts() {
    const response = await fetch(API_ENDPOINTS.ACCOUNTS);
    return response.json();
  },

  async getContent() {
    const response = await fetch(API_ENDPOINTS.CONTENT);
    return response.json();
  },
};

// Analytics service
export const analyticsService = {
  async getStats() {
    const response = await fetch(API_ENDPOINTS.STATS);
    return response.json();
  },

  async getServerAnalytics() {
    const response = await fetch(API_ENDPOINTS.ANALYTICS);
    return response.json();
  },

  async getAuditLogs() {
    const response = await fetch(API_ENDPOINTS.AUDIT_LOGS);
    return response.json();
  },
};

// Workflow service
export const workflowService = {
  async getAll() {
    const response = await fetch(API_ENDPOINTS.WORKFLOWS.BASE);
    return response.json();
  },

  async getWithModels() {
    const response = await fetch(API_ENDPOINTS.WORKFLOWS.WITH_MODELS);
    return response.json();
  },

  async syncModels(id: number): Promise<ApiResponse> {
    return apiRequest(API_ENDPOINTS.WORKFLOWS.SYNC_MODELS(id), 'POST');
  },

  async delete(id: number): Promise<ApiResponse> {
    return apiRequest(`${API_ENDPOINTS.WORKFLOWS.BASE}/${id}`, 'DELETE');
  },
};