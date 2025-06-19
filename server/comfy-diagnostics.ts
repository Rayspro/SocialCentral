import { storage } from './storage';

// ComfyUI diagnostic and troubleshooting system
export class ComfyUIDiagnostics {
  
  // Comprehensive connection diagnostic
  async runDiagnostics(serverId: number): Promise<{
    status: 'connected' | 'disconnected' | 'partial';
    workingUrl?: string;
    diagnostics: any[];
    recommendations: string[];
  }> {
    const server = await storage.getVastServer(serverId);
    if (!server) {
      return {
        status: 'disconnected',
        diagnostics: [],
        recommendations: ['Server not found in database']
      };
    }

    const diagnostics = [];
    const recommendations = [];
    let workingUrl: string | undefined;

    // Test 1: Server basic connectivity
    const serverReachable = await this.testServerReachability(server);
    diagnostics.push({
      test: 'Server Reachability',
      status: serverReachable ? 'pass' : 'fail',
      details: serverReachable ? 'Server is responding' : 'Server unreachable'
    });

    if (!serverReachable) {
      recommendations.push('Check if your Vast.ai server is running and accessible');
      recommendations.push('Verify the server hasn\'t been stopped or terminated');
    }

    // Test 2: Port accessibility
    const portTests = await this.testComfyUIPorts(server);
    diagnostics.push({
      test: 'Port Accessibility',
      status: portTests.workingPorts.length > 0 ? 'pass' : 'fail',
      details: `Tested ${portTests.totalPorts} ports, ${portTests.workingPorts.length} accessible`,
      workingPorts: portTests.workingPorts
    });

    if (portTests.workingPorts.length === 0) {
      recommendations.push('ComfyUI may not be running on the expected ports');
      recommendations.push('Try manually starting ComfyUI on your server');
    }

    // Test 3: ComfyUI service detection
    const comfyUIDetected = await this.detectComfyUIService(server);
    diagnostics.push({
      test: 'ComfyUI Service Detection',
      status: comfyUIDetected.found ? 'pass' : 'fail',
      details: comfyUIDetected.found ? `Found at ${comfyUIDetected.url}` : 'ComfyUI service not detected'
    });

    if (comfyUIDetected.found) {
      workingUrl = comfyUIDetected.url;
    } else {
      recommendations.push('ComfyUI service not responding - may need restart');
      recommendations.push('Check ComfyUI logs on your server for errors');
    }

    // Test 4: Installation verification
    const installationCheck = await this.verifyInstallation(serverId);
    diagnostics.push({
      test: 'Installation Verification',
      status: installationCheck.completed ? 'pass' : 'fail',
      details: installationCheck.details
    });

    if (!installationCheck.completed) {
      recommendations.push('ComfyUI installation may be incomplete or failed');
      recommendations.push('Consider running the setup process again');
    }

    // Determine overall status
    let status: 'connected' | 'disconnected' | 'partial';
    if (workingUrl && comfyUIDetected.found) {
      status = 'connected';
    } else if (serverReachable || portTests.workingPorts.length > 0) {
      status = 'partial';
    } else {
      status = 'disconnected';
    }

    return {
      status,
      workingUrl,
      diagnostics,
      recommendations
    };
  }

  // Test basic server reachability
  private async testServerReachability(server: any): Promise<boolean> {
    try {
      const baseUrl = server.serverUrl || `http://${server.sshConnection?.split('@')[1]?.split(' ')[0]}:${server.metadata?.vastData?.direct_port_start || 65535}`;
      const response = await fetch(baseUrl, { 
        method: 'HEAD', 
        signal: AbortSignal.timeout(5000) 
      });
      return response.ok || response.status < 500;
    } catch {
      return false;
    }
  }

  // Test ComfyUI on various ports
  private async testComfyUIPorts(server: any): Promise<{
    totalPorts: number;
    workingPorts: string[];
  }> {
    const host = server.sshConnection?.split('@')[1]?.split(' ')[0] || 'ssh7.vast.ai';
    const directPort = server.metadata?.vastData?.direct_port_start || 65535;
    
    const portsToTest = [
      directPort,
      8188,
      directPort + 1,
      directPort + 2,
      directPort + 3,
      65536,
      65537,
      65538
    ];

    const workingPorts: string[] = [];
    
    for (const port of portsToTest) {
      try {
        const url = `http://${host}:${port}`;
        const response = await fetch(url, { 
          method: 'HEAD', 
          signal: AbortSignal.timeout(3000) 
        });
        if (response.ok) {
          workingPorts.push(url);
        }
      } catch {
        // Port not accessible
      }
    }

    return {
      totalPorts: portsToTest.length,
      workingPorts
    };
  }

  // Detect ComfyUI service specifically
  private async detectComfyUIService(server: any): Promise<{
    found: boolean;
    url?: string;
  }> {
    const host = server.sshConnection?.split('@')[1]?.split(' ')[0] || 'ssh7.vast.ai';
    const directPort = server.metadata?.vastData?.direct_port_start || 65535;
    
    const urlsToTest = [
      `http://${host}:${directPort}`,
      `http://${host}:8188`,
      `http://${host}:${directPort + 1}`,
      `http://${host}:${directPort + 2}`
    ];

    for (const url of urlsToTest) {
      try {
        // Test ComfyUI-specific endpoints
        const endpoints = ['/system_stats', '/object_info', '/queue'];
        
        for (const endpoint of endpoints) {
          const response = await fetch(`${url}${endpoint}`, { 
            signal: AbortSignal.timeout(5000),
            headers: {
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            return { found: true, url };
          }
        }
      } catch {
        continue;
      }
    }

    return { found: false };
  }

  // Verify ComfyUI installation status
  private async verifyInstallation(serverId: number): Promise<{
    completed: boolean;
    details: string;
  }> {
    try {
      const executions = await storage.getServerExecutions(serverId);
      const latestExecution = executions
        .filter(e => e.scriptId === 1) // ComfyUI setup script
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (!latestExecution) {
        return {
          completed: false,
          details: 'No installation record found'
        };
      }

      if (latestExecution.status === 'completed' && latestExecution.output?.includes('SUCCESS')) {
        return {
          completed: true,
          details: 'Installation completed successfully'
        };
      }

      return {
        completed: false,
        details: `Installation status: ${latestExecution.status}`
      };
    } catch {
      return {
        completed: false,
        details: 'Unable to verify installation'
      };
    }
  }
}

export const comfyDiagnostics = new ComfyUIDiagnostics();