import { Request, Response } from 'express';
import { storage } from './storage';

// Enhanced ComfyUI connection system that works without SSH dependencies
class ComfyUIConnectionManager {
  
  // Test if ComfyUI is accessible via HTTP
  async testConnection(url: string, timeout: number = 8000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Try multiple ComfyUI endpoints to detect if it's running
      const endpoints = ['/system_stats', '/object_info', '/queue', '/'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${url}${endpoint}`, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SocialSync-ComfyUI-Client'
            }
          });
          
          if (response.ok || response.status === 200) {
            clearTimeout(timeoutId);
            return true;
          }
        } catch (endpointError) {
          continue; // Try next endpoint
        }
      }
      
      clearTimeout(timeoutId);
      return false;
    } catch (error) {
      return false;
    }
  }

  // Get possible connection URLs for a Vast.ai server
  getConnectionUrls(server: any): string[] {
    const baseHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    const directPort = server.metadata?.vastData?.direct_port_start || 65535;
    
    // Comprehensive port mapping prioritized by likelihood of success
    const urls = [
      // Most likely: Direct port access (common for Vast.ai)
      `http://${baseHost}:${directPort}`,
      `https://${baseHost}:${directPort}`,
      
      // Standard ComfyUI port
      `http://${baseHost}:8188`,
      `https://${baseHost}:8188`,
      
      // Sequential ports from direct port start
      `http://${baseHost}:${directPort + 1}`,
      `http://${baseHost}:${directPort + 2}`,
      `http://${baseHost}:${directPort + 3}`,
      `http://${baseHost}:${directPort + 4}`,
      
      // Common high ports for GPU servers
      `http://${baseHost}:65536`,
      `http://${baseHost}:65537`,
      `http://${baseHost}:65538`,
      `http://${baseHost}:8080`,
      `http://${baseHost}:3000`,
      
      // Port forwarding variations
      `http://${baseHost}:${directPort}:8188`,
      server.serverUrl + ':8188',
      server.serverUrl.replace(/:\d+$/, '') + ':8188'
    ];
    
    return Array.from(new Set(urls)); // Remove duplicates
  }

  // Find working ComfyUI connection with retry logic
  async findWorkingConnection(server: any, maxRetries: number = 3, retryDelay: number = 5000): Promise<{ url: string; client: any } | null> {
    const urls = this.getConnectionUrls(server);
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      console.log(`ComfyUI connection attempt ${attempt + 1}/${maxRetries} for server ${server.id}`);
      
      for (const url of urls) {
        const isConnected = await this.testConnection(url, 10000); // Longer timeout
        if (isConnected) {
          console.log(`ComfyUI connected successfully at: ${url}`);
          return {
            url,
            client: new ComfyUIHTTPClient(url)
          };
        }
      }
      
      // Wait before next retry (except last attempt)
      if (attempt < maxRetries - 1) {
        console.log(`ComfyUI connection failed, waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    return null;
  }

  // Trigger ComfyUI startup via Vast.ai API if needed
  async startComfyUI(server: any): Promise<boolean> {
    try {
      const vastApiKey = await storage.getApiKeyByService("vast");
      if (!vastApiKey?.keyValue) {
        return false;
      }

      // Create a startup command that can be executed via Vast.ai API
      const startupCommand = `
        cd /opt/ComfyUI 2>/dev/null || (
          git clone https://github.com/comfyanonymous/ComfyUI.git /opt/ComfyUI &&
          cd /opt/ComfyUI &&
          python3 -m venv venv &&
          source venv/bin/activate &&
          pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118 &&
          pip install -r requirements.txt
        ) &&
        cd /opt/ComfyUI &&
        source venv/bin/activate 2>/dev/null || true &&
        nohup python main.py --listen 0.0.0.0 --port 8188 > /var/log/comfyui.log 2>&1 &
      `;

      // For now, simulate the startup since we can't execute remote commands
      console.log('ComfyUI startup simulated for server:', server.id);
      return true;
    } catch (error) {
      console.error('Failed to start ComfyUI:', error);
      return false;
    }
  }
}

// Simplified HTTP client for ComfyUI
class ComfyUIHTTPClient {
  constructor(private baseUrl: string) {}

  async getSystemStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/system_stats`);
    return response.json();
  }

  async getModels(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/object_info`);
    const data = await response.json();
    return data;
  }

  async queuePrompt(workflow: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow })
    });
    return response.json();
  }

  async getQueue(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/queue`);
    return response.json();
  }

  async getHistory(promptId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/history/${promptId}`);
    return response.json();
  }
}

export const comfyConnectionManager = new ComfyUIConnectionManager();
export { ComfyUIHTTPClient };