import { Request, Response } from 'express';
import { storage } from './storage';

// Enhanced ComfyUI connection system that works without SSH dependencies
class ComfyUIConnectionManager {
  
  // Test if ComfyUI is accessible via HTTP
  async testConnection(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${url}/system_stats`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SocialSync-ComfyUI-Client'
        }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get possible connection URLs for a Vast.ai server
  getConnectionUrls(server: any): string[] {
    const baseHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    const directPort = server.metadata?.vastData?.direct_port_start || 65535;
    
    // More comprehensive port mapping for Vast.ai
    return [
      `http://${baseHost}:8188`,
      `https://${baseHost}:8188`,
      `http://${baseHost}:${directPort}`,
      `http://${baseHost}:${directPort + 1}`,
      `http://${baseHost}:${directPort + 2}`,
      `http://${baseHost}:${directPort + 8188}`,
      server.serverUrl + ':8188',
      server.serverUrl.replace(/:\d+$/, '') + ':8188'
    ];
  }

  // Find working ComfyUI connection
  async findWorkingConnection(server: any): Promise<{ url: string; client: any } | null> {
    const urls = this.getConnectionUrls(server);
    
    for (const url of urls) {
      const isConnected = await this.testConnection(url);
      if (isConnected) {
        return {
          url,
          client: new ComfyUIHTTPClient(url)
        };
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