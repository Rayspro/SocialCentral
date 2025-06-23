// VAST AI feature-specific types

import { BaseEntity, StatusType } from '../shared/core.js';

export interface VastConfig {
  apiBaseUrl: string;
  maxInstances: number;
  defaultTimeout: number;
  minGpuRam: number;
  preferredRegions: string[];
  setupTimeout: number;
}

export interface VastServerData extends BaseEntity {
  vastId: string;
  name: string;
  status: StatusType;
  serverUrl?: string;
  setupStatus: StatusType;
  gpuName?: string;
  gpuCount?: number;
  ramGb?: number;
  diskGb?: number;
  costPerHour?: number;
  region?: string;
  metadata?: Record<string, any>;
}

export interface VastOffer {
  id: string;
  gpu_name: string;
  gpu_ram: number;
  num_gpus: number;
  cpu_cores: number;
  ram_gb: number;
  disk_gb: number;
  dph_total: number;
  reliability: number;
  datacenter: string;
  geolocation: string;
  inet_up: number;
  inet_down: number;
  verification: string;
  cuda_max_good: number;
  machine_id: string;
  hostname: string;
  rentable: boolean;
  rented: boolean;
}

export interface ServerExecution extends BaseEntity {
  serverId: number;
  scriptId: number;
  command?: string;
  status: StatusType;
  output: string;
  exitCode?: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface SetupScript {
  id: number;
  name: string;
  description: string;
  content: string;
  version: string;
  isActive: boolean;
}