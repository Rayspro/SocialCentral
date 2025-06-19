import { spawn, ChildProcess } from 'child_process';

interface TunnelConnection {
  process: ChildProcess;
  localPort: number;
  isConnected: boolean;
}

class SSHTunnelManager {
  private tunnels: Map<string, TunnelConnection> = new Map();
  private basePort = 18188; // Start from 18188 for ComfyUI tunnels

  async createTunnel(serverId: string, sshHost: string, sshPort: number, remotePort: number = 8188): Promise<number> {
    const tunnelKey = `${serverId}-${remotePort}`;
    
    // Check if tunnel already exists
    if (this.tunnels.has(tunnelKey)) {
      const existing = this.tunnels.get(tunnelKey)!;
      if (existing.isConnected) {
        return existing.localPort;
      }
    }

    const localPort = this.basePort + parseInt(serverId);
    
    // Create SSH tunnel: ssh -L localPort:localhost:8188 root@sshHost -p sshPort -N
    const sshProcess = spawn('ssh', [
      '-L', `${localPort}:localhost:${remotePort}`,
      `root@${sshHost}`,
      '-p', sshPort.toString(),
      '-N', // Don't execute remote command
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-o', 'ServerAliveInterval=30',
      '-o', 'ServerAliveCountMax=3'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const tunnel: TunnelConnection = {
      process: sshProcess,
      localPort,
      isConnected: false
    };

    // Wait for tunnel to establish (give it 5 seconds)
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        tunnel.isConnected = true;
        resolve();
      }, 5000);

      sshProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      sshProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Connection established') || output.includes('Forwarding')) {
          tunnel.isConnected = true;
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    this.tunnels.set(tunnelKey, tunnel);
    
    // Clean up on process exit
    sshProcess.on('exit', () => {
      this.tunnels.delete(tunnelKey);
    });

    return localPort;
  }

  async closeTunnel(serverId: string, remotePort: number = 8188): Promise<void> {
    const tunnelKey = `${serverId}-${remotePort}`;
    const tunnel = this.tunnels.get(tunnelKey);
    
    if (tunnel) {
      tunnel.process.kill();
      this.tunnels.delete(tunnelKey);
    }
  }

  getTunnelPort(serverId: string, remotePort: number = 8188): number | null {
    const tunnelKey = `${serverId}-${remotePort}`;
    const tunnel = this.tunnels.get(tunnelKey);
    return tunnel?.isConnected ? tunnel.localPort : null;
  }
}

export const sshTunnelManager = new SSHTunnelManager();