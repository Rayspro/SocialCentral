import { WebSocket } from 'ws';
import { storage } from './storage';

interface ComfyUIProgress {
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

interface QueueStatus {
  exec_info: {
    queue_remaining: number;
  };
}

interface HistoryEntry {
  prompt: any[];
  outputs: Record<string, any>;
  status: {
    status_str: string;
    completed: boolean;
    messages: string[];
  };
}

class ComfyUIWebSocketManager {
  private connections: Map<string, WebSocket> = new Map();
  private clientSockets: Set<WebSocket> = new Set();
  private progressData: Map<number, ComfyUIProgress> = new Map();

  addClientSocket(socket: WebSocket) {
    this.clientSockets.add(socket);
    
    socket.on('close', () => {
      this.clientSockets.delete(socket);
    });
  }

  async connectToComfyUI(serverId: number, baseUrl: string): Promise<boolean> {
    try {
      const server = await storage.getVastServer(serverId);
      if (!server) return false;

      const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log(`Connected to ComfyUI WebSocket for server ${serverId}`);
        this.connections.set(serverId.toString(), ws);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleComfyUIMessage(serverId, message);
        } catch (error) {
          console.error('Error parsing ComfyUI WebSocket message:', error);
        }
      });

      ws.on('error', (error) => {
        console.error(`ComfyUI WebSocket error for server ${serverId}:`, error);
        this.connections.delete(serverId.toString());
      });

      ws.on('close', () => {
        console.log(`ComfyUI WebSocket closed for server ${serverId}`);
        this.connections.delete(serverId.toString());
      });

      return true;
    } catch (error) {
      console.error(`Failed to connect to ComfyUI WebSocket for server ${serverId}:`, error);
      return false;
    }
  }

  private handleComfyUIMessage(serverId: number, message: any) {
    const { type, data } = message;

    switch (type) {
      case 'status':
        this.handleStatusUpdate(serverId, data);
        break;
      case 'progress':
        this.handleProgressUpdate(serverId, data);
        break;
      case 'executing':
        this.handleExecutingUpdate(serverId, data);
        break;
      case 'executed':
        this.handleExecutedUpdate(serverId, data);
        break;
      case 'execution_start':
        this.handleExecutionStart(serverId, data);
        break;
      case 'execution_cached':
        this.handleExecutionCached(serverId, data);
        break;
      case 'execution_error':
        this.handleExecutionError(serverId, data);
        break;
      default:
        console.log(`Unhandled ComfyUI message type: ${type}`, data);
    }
  }

  private handleStatusUpdate(serverId: number, data: any) {
    // Handle queue status updates
    console.log(`Status update for server ${serverId}:`, data);
  }

  private handleProgressUpdate(serverId: number, data: any) {
    const { value, max } = data;
    const progress = max > 0 ? (value / max) * 100 : 0;
    
    // Find active generation for this server
    const activeGeneration = Array.from(this.progressData.values())
      .find(gen => gen.serverId === serverId && gen.status === 'executing');
    
    if (activeGeneration) {
      activeGeneration.progress = progress;
      activeGeneration.completedNodes = value;
      activeGeneration.totalNodes = max;
      
      // Enhanced terminal output for real-time monitoring
      console.log(`\n┌─────────────────────────────────────────────────────────────┐`);
      console.log(`│ 🎨 ComfyUI Generation Progress - ID: ${activeGeneration.generationId.toString().padEnd(15)} │`);
      console.log(`├─────────────────────────────────────────────────────────────┤`);
      console.log(`│ Server: ${serverId.toString().padEnd(8)} │ Progress: ${Math.round(progress).toString().padEnd(3)}% │ Step: ${value}/${max} │`);
      console.log(`│ Status: Processing    │ Current Node: ${(activeGeneration.currentNode || 'Unknown').padEnd(15)} │`);
      console.log(`├─────────────────────────────────────────────────────────────┤`);
      
      // ASCII progress bar
      const barLength = 40;
      const filledLength = Math.round((progress / 100) * barLength);
      const progressBar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
      console.log(`│ [${progressBar}] ${Math.round(progress)}% │`);
      console.log(`└─────────────────────────────────────────────────────────────┘\n`);
      
      this.broadcastProgress(activeGeneration);
    }
  }

  private handleExecutingUpdate(serverId: number, data: any) {
    const { node } = data;
    
    // Find active generation for this server
    const activeGeneration = Array.from(this.progressData.values())
      .find(gen => gen.serverId === serverId && gen.status === 'executing');
    
    if (activeGeneration) {
      activeGeneration.currentNode = node;
      activeGeneration.completedNodes = (activeGeneration.completedNodes || 0) + 1;
      
      // Enhanced terminal logging for node execution
      console.log(`🔥 [ComfyUI] Executing Node: ${node} | Generation ID: ${activeGeneration.generationId}`);
      console.log(`📊 [ComfyUI] Completed Nodes: ${activeGeneration.completedNodes}/${activeGeneration.totalNodes || 'Unknown'}`);
      
      this.broadcastProgress(activeGeneration);
    }
  }

  private handleExecutedUpdate(serverId: number, data: any) {
    const { node, output } = data;
    
    // Check if this execution produced images
    if (output && output.images) {
      const activeGeneration = Array.from(this.progressData.values())
        .find(gen => gen.serverId === serverId && gen.status === 'executing');
      
      if (activeGeneration) {
        // Store preview image
        activeGeneration.previewImage = output.images[0]?.filename;
        this.broadcastProgress(activeGeneration);
      }
    }
  }

  private handleExecutionStart(serverId: number, data: any) {
    const { prompt_id } = data;
    
    // Find generation by prompt ID or create new tracking
    const activeGeneration = Array.from(this.progressData.values())
      .find(gen => gen.serverId === serverId && gen.status === 'queued');
    
    if (activeGeneration) {
      activeGeneration.status = 'executing';
      activeGeneration.progress = 0;
      activeGeneration.completedNodes = 0;
      this.broadcastProgress(activeGeneration);
    }
  }

  private handleExecutionCached(serverId: number, data: any) {
    const { nodes } = data;
    
    const activeGeneration = Array.from(this.progressData.values())
      .find(gen => gen.serverId === serverId && gen.status === 'executing');
    
    if (activeGeneration) {
      // Cached nodes are instantly "completed"
      activeGeneration.completedNodes = (activeGeneration.completedNodes || 0) + nodes.length;
      this.broadcastProgress(activeGeneration);
    }
  }

  private handleExecutionError(serverId: number, data: any) {
    const { error, node_id } = data;
    
    const activeGeneration = Array.from(this.progressData.values())
      .find(gen => gen.serverId === serverId && gen.status === 'executing');
    
    if (activeGeneration) {
      activeGeneration.status = 'failed';
      activeGeneration.errorMessage = error || 'Execution failed';
      this.broadcastProgress(activeGeneration);
      
      // Update database
      this.updateGenerationStatus(activeGeneration.generationId, 'failed', error);
    }
  }

  startTracking(generationId: number, serverId: number, totalNodes?: number) {
    const progress: ComfyUIProgress = {
      generationId,
      serverId,
      status: 'queued',
      totalNodes,
      completedNodes: 0,
      progress: 0,
      executionTime: Date.now()
    };

    this.progressData.set(generationId, progress);
    this.broadcastProgress(progress);

    // Auto-cleanup after 10 minutes
    setTimeout(() => {
      this.progressData.delete(generationId);
    }, 10 * 60 * 1000);
  }

  completeGeneration(generationId: number, imageUrls: string[]) {
    const progress = this.progressData.get(generationId);
    if (progress) {
      progress.status = 'completed';
      progress.progress = 100;
      progress.executionTime = Date.now() - (progress.executionTime || Date.now());
      this.broadcastProgress(progress);
      
      // Update database
      this.updateGenerationStatus(generationId, 'completed', null, imageUrls);
    }
  }

  broadcastProgress(progress: ComfyUIProgress) {
    const message = JSON.stringify({
      type: 'comfy_progress',
      data: progress
    });

    console.log(`📡 [WebSocket] Broadcasting progress for generation ${progress.generationId} to ${this.clientSockets.size} clients`);
    
    // Clean up closed connections and send to active ones
    const closedSockets = new Set<WebSocket>();
    
    this.clientSockets.forEach(socket => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(message);
        } catch (error) {
          console.error('📡 [WebSocket] Error sending message:', error);
          closedSockets.add(socket);
        }
      } else {
        closedSockets.add(socket);
      }
    });
    
    // Remove closed connections
    closedSockets.forEach(socket => {
      this.clientSockets.delete(socket);
    });
  }

  private async updateGenerationStatus(generationId: number, status: string, errorMessage?: string, imageUrls?: string[]) {
    try {
      const generation = await storage.getComfyGeneration(generationId);
      if (generation) {
        await storage.updateComfyGeneration(generationId, {
          status,
          errorMessage: errorMessage || null,
          imageUrls: imageUrls || null,
          completedAt: status === 'completed' || status === 'failed' ? new Date() : null
        });
      }
    } catch (error) {
      console.error('Error updating generation status:', error);
    }
  }

  async getQueueStatus(serverId: number): Promise<QueueStatus | null> {
    try {
      const server = await storage.getVastServer(serverId);
      if (!server) return null;

      const response = await fetch(`http://${server.sshHost}:8188/queue`);
      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Error fetching queue status:', error);
      return null;
    }
  }

  async getHistory(serverId: number, promptId: string): Promise<HistoryEntry | null> {
    try {
      const server = await storage.getVastServer(serverId);
      if (!server) return null;

      const response = await fetch(`http://${server.sshHost}:8188/history/${promptId}`);
      if (!response.ok) return null;

      const history = await response.json();
      return history[promptId] || null;
    } catch (error) {
      console.error('Error fetching history:', error);
      return null;
    }
  }

  getProgress(generationId: number): ComfyUIProgress | null {
    return this.progressData.get(generationId) || null;
  }

  getAllProgress(): ComfyUIProgress[] {
    return Array.from(this.progressData.values());
  }
}

export const comfyWebSocketManager = new ComfyUIWebSocketManager();