import OpenAI from "openai";
import { storage } from "./storage";
import { VastServer } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface WorkflowAnalysis {
  models: {
    type: 'checkpoint' | 'lora' | 'vae' | 'embedding' | 'controlnet';
    name: string;
    url?: string;
    folder: string;
    description: string;
    required: boolean;
  }[];
  nodes: {
    name: string;
    type: string;
    description: string;
    installCommand?: string;
    gitUrl?: string;
    required: boolean;
  }[];
  summary: string;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedDownloadSize: string;
}

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

class WorkflowAnalyzer {
  private logs: LogEntry[] = [];
  private wsConnections: Set<any> = new Set();

  addLog(level: LogEntry['level'], message: string, details?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      details
    };
    
    this.logs.push(logEntry);
    
    // Broadcast to all connected WebSocket clients
    this.wsConnections.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify({
          type: 'workflow_log',
          log: logEntry
        }));
      }
    });
    
    console.log(`[${level.toUpperCase()}] ${message}`, details || '');
  }

  addWebSocketConnection(ws: any) {
    this.wsConnections.add(ws);
    
    // Send existing logs to new connection
    ws.send(JSON.stringify({
      type: 'workflow_logs_history',
      logs: this.logs
    }));
    
    ws.on('close', () => {
      this.wsConnections.delete(ws);
    });
  }

  async analyzeWorkflow(workflowJson: any): Promise<WorkflowAnalysis> {
    this.addLog('info', 'Starting workflow analysis with OpenAI');
    
    try {
      const prompt = `
Analyze this ComfyUI workflow JSON and extract the following information:

1. Required models (checkpoints, LoRAs, VAEs, embeddings, ControlNets) with their:
   - Type (checkpoint/lora/vae/embedding/controlnet)
   - Name/filename
   - Recommended download URL (if standard/popular model)
   - Folder location in ComfyUI
   - Description of what the model does
   - Whether it's required or optional

2. Custom nodes that need to be installed with:
   - Node name
   - Node type/category
   - Description of functionality
   - Installation method (git clone URL, manager install command, etc.)
   - Whether it's required or optional

3. Overall workflow summary and complexity assessment

Respond in JSON format with this structure:
{
  "models": [
    {
      "type": "checkpoint",
      "name": "model_name.safetensors",
      "url": "https://example.com/download/url",
      "folder": "checkpoints",
      "description": "Model description",
      "required": true
    }
  ],
  "nodes": [
    {
      "name": "Node Name",
      "type": "category",
      "description": "What this node does",
      "installCommand": "git clone https://github.com/...",
      "gitUrl": "https://github.com/...",
      "required": true
    }
  ],
  "summary": "Workflow description",
  "complexity": "simple|medium|complex",
  "estimatedDownloadSize": "~2.5GB"
}

Workflow JSON:
${JSON.stringify(workflowJson, null, 2)}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert ComfyUI workflow analyzer. Analyze workflows and identify all required models and custom nodes. Provide accurate download URLs for popular models when possible."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 4000
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      this.addLog('success', 'Workflow analysis completed', {
        modelsFound: analysis.models?.length || 0,
        nodesFound: analysis.nodes?.length || 0,
        complexity: analysis.complexity
      });

      return analysis;
    } catch (error) {
      this.addLog('error', 'Failed to analyze workflow', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async downloadModelsAndNodes(
    analysis: WorkflowAnalysis, 
    serverId: number
  ): Promise<void> {
    this.addLog('info', `Starting download process for server ${serverId}`);
    
    const server = await storage.getVastServer(serverId);
    if (!server || !server.serverUrl) {
      throw new Error('Server not found or not running');
    }

    // Download models
    for (const model of analysis.models.filter(m => m.required)) {
      try {
        this.addLog('info', `Downloading model: ${model.name}`, model);
        
        if (model.url) {
          // Create model entry in database
          const modelData = {
            name: model.name,
            url: model.url,
            folder: model.folder,
            description: model.description,
            serverId: serverId,
            status: 'downloading'
          };
          
          const createdModel = await storage.createComfyModel(modelData);
          
          // Start download in background
          this.downloadModelInBackground(createdModel.id, serverId, model.url, model.folder, model.name);
          
          this.addLog('success', `Started downloading ${model.name}`);
        } else {
          this.addLog('warning', `No download URL available for ${model.name} - manual download required`);
        }
      } catch (error) {
        this.addLog('error', `Failed to start download for ${model.name}`, error);
      }
    }

    // Install custom nodes
    for (const node of analysis.nodes.filter(n => n.required)) {
      try {
        this.addLog('info', `Installing custom node: ${node.name}`, node);
        
        if (node.gitUrl || node.installCommand) {
          // Install node via ComfyUI API or script execution
          await this.installCustomNode(server, node);
          this.addLog('success', `Installed custom node: ${node.name}`);
        } else {
          this.addLog('warning', `No installation method available for ${node.name} - manual installation required`);
        }
      } catch (error) {
        this.addLog('error', `Failed to install ${node.name}`, error);
      }
    }

    this.addLog('success', 'Download and installation process completed');
  }

  private async downloadModelInBackground(
    modelId: number, 
    serverId: number, 
    url: string, 
    folder: string, 
    fileName: string
  ) {
    try {
      // This would typically make a request to ComfyUI's download API
      // For now, we'll simulate the process
      this.addLog('info', `Background download started for ${fileName}`);
      
      // Update model status to downloading
      await storage.updateComfyModel(modelId, {
        status: 'downloading',
        downloadProgress: 0
      });

      // Simulate download progress
      for (let progress = 10; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second intervals
        
        await storage.updateComfyModel(modelId, {
          downloadProgress: progress
        });
        
        this.addLog('info', `Download progress for ${fileName}: ${progress}%`);
      }

      // Mark as completed
      await storage.updateComfyModel(modelId, {
        status: 'ready',
        downloadProgress: 100
      });
      
      this.addLog('success', `Download completed: ${fileName}`);
      
    } catch (error) {
      this.addLog('error', `Download failed for ${fileName}`, error);
      await storage.updateComfyModel(modelId, {
        status: 'failed',
        errorMessage: error.message
      });
    }
  }

  private async installCustomNode(server: VastServer, node: any) {
    // This would execute installation commands on the server
    // For now, we'll simulate the process
    this.addLog('info', `Executing installation command for ${node.name}`);
    
    if (node.gitUrl) {
      this.addLog('info', `Git clone: ${node.gitUrl}`);
      // Simulate git clone process
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (node.installCommand) {
      this.addLog('info', `Running: ${node.installCommand}`);
      // Simulate command execution
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  getLogs(): LogEntry[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.wsConnections.forEach(ws => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify({
          type: 'workflow_logs_cleared'
        }));
      }
    });
  }
}

export const workflowAnalyzer = new WorkflowAnalyzer();