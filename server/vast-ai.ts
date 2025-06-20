import { Request, Response } from "express";

interface VastServer {
  id: number;
  name: string;
  status: 'running' | 'stopped' | 'loading' | 'error';
  gpu: string;
  cpu: string;
  memory: string;
  storage: string;
  price: number;
  region: string;
  ssh_host?: string;
  ssh_port?: number;
  direct_port_start?: number;
  direct_port_end?: number;
  created_on: string;
  image: string;
  label?: string;
}

interface VastOfferInstance {
  id: number;
  machine_id: number;
  hostname: string;
  num_gpus: number;
  gpu_name: string;
  cpu_cores: number;
  cpu_ram: number;
  disk_space: number;
  dph_total: number;
  dlperf: number;
  inet_up: number;
  inet_down: number;
  reliability2: number;
  rentable: boolean;
  verification: string;
  cuda_max_good: number;
  country: string;
  region: string;
}

interface VastAPIResponse<T> {
  success: boolean;
  offers?: T[];
  instances?: T[];
  error?: string;
}

class VastAIService {
  private apiKey: string;
  private baseUrl = 'https://console.vast.ai/api/v0';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Vast.ai API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Vast.ai API request failed:', error);
      throw error;
    }
  }

  async getInstances(page: number = 1, limit: number = 10): Promise<{ instances: VastServer[]; total: number; pages: number }> {
    try {
      const response = await this.makeRequest('/instances/');
      
      if (!response.success || !response.instances) {
        return { instances: [], total: 0, pages: 0 };
      }

      const instances: VastServer[] = response.instances.map((instance: any) => ({
        id: instance.id,
        name: instance.label || `Instance ${instance.id}`,
        status: this.mapStatus(instance.actual_status),
        gpu: instance.gpu_name || 'Unknown GPU',
        cpu: `${instance.num_cpu} cores`,
        memory: `${Math.round(instance.cpu_ram / 1024)} GB`,
        storage: `${Math.round(instance.disk_space)} GB`,
        price: instance.dph_total || 0,
        region: instance.datacenter || 'Unknown',
        ssh_host: instance.ssh_host,
        ssh_port: instance.ssh_port,
        direct_port_start: instance.direct_port_start,
        direct_port_end: instance.direct_port_end,
        created_on: instance.start_date || new Date().toISOString(),
        image: instance.image_uuid || 'default'
      }));

      const total = instances.length;
      const pages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedInstances = instances.slice(startIndex, endIndex);

      return {
        instances: paginatedInstances,
        total,
        pages
      };
    } catch (error) {
      console.error('Failed to fetch instances:', error);
      return { instances: [], total: 0, pages: 0 };
    }
  }

  async getAvailableOffers(page: number = 1, limit: number = 20, filters: any = {}): Promise<{ offers: VastOfferInstance[]; total: number; pages: number }> {
    try {
      let query = '/bundles/';
      const params = new URLSearchParams();
      
      if (filters.gpu_name) params.append('gpu_name', filters.gpu_name);
      if (filters.num_gpus) params.append('num_gpus', filters.num_gpus.toString());
      if (filters.max_price) params.append('max_dph', filters.max_price.toString());
      if (filters.min_cpu_cores) params.append('min_cpu_cores', filters.min_cpu_cores.toString());
      if (filters.min_ram) params.append('min_ram', filters.min_ram.toString());
      if (filters.verified_only) params.append('verified', 'true');
      
      params.append('order', 'dph_total');
      params.append('limit', '100');

      if (params.toString()) {
        query += `?${params.toString()}`;
      }

      const response = await this.makeRequest(query);
      
      if (!response.success || !response.offers) {
        return { offers: [], total: 0, pages: 0 };
      }

      const offers: VastOfferInstance[] = response.offers
        .filter((offer: any) => offer.rentable)
        .map((offer: any) => ({
          id: offer.id,
          machine_id: offer.machine_id,
          hostname: offer.hostname || 'Unknown',
          num_gpus: offer.num_gpus || 1,
          gpu_name: offer.gpu_name || 'Unknown GPU',
          cpu_cores: offer.cpu_cores || 0,
          cpu_ram: Math.round((offer.cpu_ram || 0) / 1024), // Convert to GB
          disk_space: Math.round(offer.disk_space || 0),
          dph_total: offer.dph_total || 0,
          dlperf: offer.dlperf || 0,
          inet_up: offer.inet_up || 0,
          inet_down: offer.inet_down || 0,
          reliability2: offer.reliability2 || 0,
          rentable: offer.rentable || false,
          verification: offer.verification || 'unverified',
          cuda_max_good: offer.cuda_max_good || 0,
          country: offer.geolocation?.split(',')[0] || 'Unknown',
          region: offer.geolocation || 'Unknown'
        }));

      const total = offers.length;
      const pages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOffers = offers.slice(startIndex, endIndex);

      return {
        offers: paginatedOffers,
        total,
        pages
      };
    } catch (error) {
      console.error('Failed to fetch offers:', error);
      return { offers: [], total: 0, pages: 0 };
    }
  }

  async createInstance(offerId: number, image: string, setupScript?: string): Promise<VastServer | null> {
    try {
      const payload: any = {
        client_id: 'me',
        image: image,
        args: [],
        env: {},
      };

      if (setupScript) {
        payload.onstart = setupScript;
      }

      const response = await this.makeRequest(`/asks/${offerId}/`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create instance');
      }

      return {
        id: response.new_contract,
        name: `Instance ${response.new_contract}`,
        status: 'loading',
        gpu: 'Setting up...',
        cpu: 'Setting up...',
        memory: 'Setting up...',
        storage: 'Setting up...',
        price: 0,
        region: 'Unknown',
        created_on: new Date().toISOString(),
        image: image
      };
    } catch (error) {
      console.error('Failed to create instance:', error);
      return null;
    }
  }

  async destroyInstance(instanceId: number): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/instances/${instanceId}/`, {
        method: 'DELETE',
      });

      return response.success || false;
    } catch (error) {
      console.error('Failed to destroy instance:', error);
      return false;
    }
  }

  async restartInstance(instanceId: number): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/instances/${instanceId}/reboot/`, {
        method: 'PUT',
      });

      return response.success || false;
    } catch (error) {
      console.error('Failed to restart instance:', error);
      return false;
    }
  }

  async startInstance(instanceId: number): Promise<boolean> {
    try {
      // For stopped instances, we need to restart them using the reboot endpoint
      const response = await this.makeRequest(`/instances/${instanceId}/reboot/`, {
        method: 'PUT',
      });

      return response.success || false;
    } catch (error) {
      console.error('Failed to start instance:', error);
      return false;
    }
  }

  private mapStatus(status: string): 'running' | 'stopped' | 'loading' | 'error' {
    switch (status?.toLowerCase()) {
      case 'running':
      case 'ssh_ready':
        return 'running';
      case 'stopped':
      case 'exited':
        return 'stopped';
      case 'loading':
      case 'creating':
      case 'starting':
        return 'loading';
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'loading';
    }
  }
}

// Export the service for use in routes
export { VastAIService };

// Route handlers
export async function getVastServers(req: Request, res: Response) {
  try {
    const { storage } = await import('./storage');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get Vast.ai API key from database
    const vastApiKey = await storage.getApiKeyByService('vast');
    if (!vastApiKey || !vastApiKey.keyValue) {
      return res.status(400).json({ 
        error: "Vast.ai API key not configured. Please add your API key in Settings." 
      });
    }

    const vastService = new VastAIService(vastApiKey.keyValue);
    const result = await vastService.getInstances(page, limit);
    
    res.json({
      success: true,
      data: result.instances,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: result.pages
      }
    });
  } catch (error: any) {
    console.error('Get vast servers error:', error);
    res.status(500).json({ 
      error: error.message || "Failed to fetch Vast.ai servers" 
    });
  }
}

export async function getAvailableServers(req: Request, res: Response) {
  try {
    const { storage } = await import('./storage');
    
    // Get Vast.ai API key from database
    const vastApiKey = await storage.getApiKeyByService('vast');
    if (!vastApiKey || !vastApiKey.keyValue) {
      return res.status(400).json({ 
        error: "Vast.ai API key not configured. Please add your API key in Settings." 
      });
    }

    const vastService = new VastAIService(vastApiKey.keyValue);
    const result = await vastService.getAvailableOffers(1, 20);
    
    // Transform Vast.ai offers to our expected format
    const availableServers = result.offers.map(offer => ({
      vastId: offer.id.toString(),
      name: `${offer.gpu_name} Server`,
      gpu: offer.gpu_name,
      gpuCount: offer.num_gpus,
      cpuCores: offer.cpu_cores,
      ram: Math.round(offer.cpu_ram / 1024), // Convert MB to GB
      disk: Math.round(offer.disk_space),
      pricePerHour: offer.dph_total.toFixed(3),
      location: `${offer.country} (${offer.region})`,
      isAvailable: offer.rentable,
      metadata: {
        reliability: offer.reliability2,
        dlperf: offer.dlperf,
        bandwidth: `${offer.inet_up}/${offer.inet_down} Mbps`,
        cuda: offer.cuda_max_good,
        verification: offer.verification,
        machineId: offer.machine_id,
        hostname: offer.hostname
      }
    }));
    
    res.json(availableServers);
  } catch (error: any) {
    console.error('Get available servers error:', error);
    res.status(500).json({ 
      error: error.message || "Failed to fetch available servers from Vast.ai" 
    });
  }
}

export async function createVastServer(req: Request, res: Response) {
  try {
    const { storage } = await import('./storage');
    const { offerId, image, setupScript } = req.body;
    
    if (!offerId) {
      return res.status(400).json({ error: "Offer ID is required" });
    }
    
    if (!image) {
      return res.status(400).json({ error: "Docker image is required" });
    }

    // Get Vast.ai API key from database
    const vastApiKey = await storage.getApiKeyByService('vast');
    if (!vastApiKey || !vastApiKey.keyValue) {
      return res.status(400).json({ 
        error: "Vast.ai API key not configured. Please add your API key in Settings." 
      });
    }

    const vastService = new VastAIService(vastApiKey.keyValue);
    const instance = await vastService.createInstance(offerId, image, setupScript);
    
    if (!instance) {
      return res.status(500).json({ error: "Failed to create instance" });
    }
    
    res.json({
      success: true,
      data: instance,
      message: "Instance creation started. It may take a few minutes to become available."
    });
  } catch (error: any) {
    console.error('Create vast server error:', error);
    res.status(500).json({ 
      error: error.message || "Failed to create server" 
    });
  }
}

export async function destroyVastServer(req: Request, res: Response) {
  try {
    const { storage } = await import('./storage');
    const instanceId = parseInt(req.params.id);
    
    if (!instanceId) {
      return res.status(400).json({ error: "Invalid instance ID" });
    }

    // Get Vast.ai API key from database
    const vastApiKey = await storage.getApiKeyByService('vast');
    if (!vastApiKey || !vastApiKey.keyValue) {
      return res.status(400).json({ 
        error: "Vast.ai API key not configured. Please add your API key in Settings." 
      });
    }

    const vastService = new VastAIService(vastApiKey.keyValue);
    const success = await vastService.destroyInstance(instanceId);
    
    if (!success) {
      return res.status(500).json({ error: "Failed to destroy instance" });
    }
    
    res.json({
      success: true,
      message: "Instance destroyed successfully"
    });
  } catch (error: any) {
    console.error('Destroy vast server error:', error);
    res.status(500).json({ 
      error: error.message || "Failed to destroy server" 
    });
  }
}

export async function restartVastServer(req: Request, res: Response) {
  try {
    const { storage } = await import('./storage');
    const instanceId = parseInt(req.params.id);
    
    if (!instanceId) {
      return res.status(400).json({ error: "Invalid instance ID" });
    }

    // Get Vast.ai API key from database
    const vastApiKey = await storage.getApiKeyByService('vast');
    if (!vastApiKey || !vastApiKey.keyValue) {
      return res.status(400).json({ 
        error: "Vast.ai API key not configured. Please add your API key in Settings." 
      });
    }

    const vastService = new VastAIService(vastApiKey.keyValue);
    const success = await vastService.restartInstance(instanceId);
    
    if (!success) {
      return res.status(500).json({ error: "Failed to restart instance" });
    }
    
    res.json({
      success: true,
      message: "Instance restart initiated"
    });
  } catch (error: any) {
    console.error('Restart vast server error:', error);
    res.status(500).json({ 
      error: error.message || "Failed to restart server" 
    });
  }
}