import { storage } from './storage';

// Direct ComfyUI connection testing system
export class ComfyUIDirectTester {
  
  // Test ComfyUI connection with manual URL testing
  async testDirectConnection(serverId: number): Promise<{
    success: boolean;
    workingUrl?: string;
    results: any[];
    recommendations: string[];
  }> {
    const server = await storage.getVastServer(serverId);
    if (!server) {
      return {
        success: false,
        results: [],
        recommendations: ['Server not found']
      };
    }

    const results = [];
    const recommendations = [];
    let workingUrl: string | undefined;

    // Test direct URLs manually
    const testUrls = this.generateTestUrls(server);
    
    for (const url of testUrls) {
      const result = await this.testSingleUrl(url);
      results.push({
        url,
        accessible: result.accessible,
        comfyUIDetected: result.comfyUIDetected,
        response: result.response,
        error: result.error
      });

      if (result.comfyUIDetected && !workingUrl) {
        workingUrl = url;
      }
    }

    // Generate recommendations
    if (!workingUrl) {
      recommendations.push('ComfyUI is not responding on any tested ports');
      recommendations.push('Try accessing your server directly via SSH and starting ComfyUI manually');
      recommendations.push('Command: cd /opt/ComfyUI && python main.py --listen 0.0.0.0 --port 8188');
      recommendations.push('Check if your Vast.ai server has sufficient resources and is not overloaded');
    } else {
      recommendations.push(`ComfyUI found at: ${workingUrl}`);
      recommendations.push('Connection successful - you can now generate images');
    }

    return {
      success: !!workingUrl,
      workingUrl,
      results,
      recommendations
    };
  }

  // Generate comprehensive test URLs for Vast.ai server
  private generateTestUrls(server: any): string[] {
    const host = server.sshConnection?.split('@')[1]?.split(' ')[0] || 'ssh7.vast.ai';
    const directPort = server.metadata?.vastData?.direct_port_start || 65535;
    
    return [
      // Most likely working URLs first
      `http://${host}:${directPort}`,
      `http://${host}:8188`,
      `https://${host}:${directPort}`,
      `https://${host}:8188`,
      
      // Sequential port testing
      `http://${host}:${directPort + 1}`,
      `http://${host}:${directPort + 2}`,
      `http://${host}:${directPort + 3}`,
      `http://${host}:${directPort + 4}`,
      `http://${host}:${directPort + 5}`,
      
      // Common alternative ports
      `http://${host}:65536`,
      `http://${host}:65537`,
      `http://${host}:65538`,
      `http://${host}:8080`,
      `http://${host}:3000`,
      `http://${host}:7860`,
      
      // With server URL prefix if available
      ...(server.serverUrl ? [
        server.serverUrl,
        `${server.serverUrl}:8188`,
        server.serverUrl.replace(/:\d+$/, ':8188')
      ] : [])
    ];
  }

  // Test a single URL for ComfyUI availability
  private async testSingleUrl(url: string): Promise<{
    accessible: boolean;
    comfyUIDetected: boolean;
    response?: string;
    error?: string;
  }> {
    try {
      // Test basic accessibility
      const basicResponse = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(8000)
      });

      if (!basicResponse.ok && basicResponse.status >= 500) {
        return {
          accessible: false,
          comfyUIDetected: false,
          error: `Server error: ${basicResponse.status}`
        };
      }

      // Test ComfyUI-specific endpoints
      const comfyEndpoints = ['/system_stats', '/object_info', '/queue', '/'];
      
      for (const endpoint of comfyEndpoints) {
        try {
          const comfyResponse = await fetch(`${url}${endpoint}`, {
            method: 'GET',
            signal: AbortSignal.timeout(8000),
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'SocialSync-ComfyUI-Test'
            }
          });

          if (comfyResponse.ok) {
            const responseText = await comfyResponse.text();
            
            // Check for ComfyUI-specific content
            if (responseText.includes('ComfyUI') || 
                responseText.includes('system_stats') || 
                responseText.includes('queue') ||
                endpoint === '/system_stats' ||
                endpoint === '/object_info') {
              return {
                accessible: true,
                comfyUIDetected: true,
                response: `ComfyUI detected via ${endpoint}`
              };
            }
          }
        } catch (endpointError) {
          continue;
        }
      }

      return {
        accessible: true,
        comfyUIDetected: false,
        response: 'Server accessible but ComfyUI not detected'
      };

    } catch (error) {
      return {
        accessible: false,
        comfyUIDetected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  // Generate manual connection instructions
  generateConnectionInstructions(server: any): string[] {
    const host = server.sshConnection?.split('@')[1]?.split(' ')[0] || 'ssh7.vast.ai';
    const directPort = server.metadata?.vastData?.direct_port_start || 65535;
    const sshPort = server.metadata?.vastData?.ssh_port || 36100;

    return [
      '## Manual ComfyUI Connection Instructions',
      '',
      '### 1. SSH into your server:',
      `ssh root@${host} -p ${sshPort}`,
      '',
      '### 2. Navigate to ComfyUI directory:',
      'cd /opt/ComfyUI',
      '',
      '### 3. Start ComfyUI manually:',
      'python main.py --listen 0.0.0.0 --port 8188',
      '',
      '### 4. Test these URLs in your browser:',
      `- http://${host}:${directPort}`,
      `- http://${host}:8188`,
      `- http://${host}:${directPort + 1}`,
      `- http://${host}:${directPort + 2}`,
      '',
      '### 5. If ComfyUI starts successfully, it should display:',
      '- "Starting server on port 8188"',
      '- "To see the GUI go to: http://0.0.0.0:8188"',
      '',
      '### Troubleshooting:',
      '- Check if Python is installed: python --version',
      '- Verify ComfyUI installation: ls -la /opt/ComfyUI',
      '- Check system resources: free -h && df -h',
      '- Kill existing processes: pkill -f python',
      ''
    ];
  }
}

export const comfyDirectTester = new ComfyUIDirectTester();