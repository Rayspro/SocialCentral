import { storage } from "./storage";
import { ComfyModel, InsertComfyModel, WorkflowAnalysis, InsertWorkflowAnalysis } from "@shared/schema";

interface ModelRequirement {
  name: string;
  type: string; // checkpoint, lora, vae, etc.
  url?: string;
  description?: string;
  required: boolean;
}

interface WorkflowNode {
  class_type: string;
  inputs: Record<string, any>;
  _meta?: {
    title?: string;
  };
}

interface WorkflowData {
  [nodeId: string]: WorkflowNode;
}

export class WorkflowAnalyzer {
  // Model mapping database with popular ComfyUI models
  private modelDatabase: Record<string, ModelRequirement> = {
    // Checkpoints
    "sd_xl_base_1.0.safetensors": {
      name: "SDXL Base 1.0",
      type: "checkpoints",
      url: "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors",
      description: "Stable Diffusion XL Base Model",
      required: true
    },
    "sd_xl_refiner_1.0.safetensors": {
      name: "SDXL Refiner 1.0",
      type: "checkpoints", 
      url: "https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0/resolve/main/sd_xl_refiner_1.0.safetensors",
      description: "Stable Diffusion XL Refiner Model",
      required: false
    },
    "v1-5-pruned-emaonly.ckpt": {
      name: "Stable Diffusion 1.5",
      type: "checkpoints",
      url: "https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt",
      description: "Stable Diffusion v1.5 Base Model",
      required: true
    },
    "realisticVisionV60B1_v60B1VAE.safetensors": {
      name: "Realistic Vision v6.0",
      type: "checkpoints",
      url: "https://civitai.com/api/download/models/245598",
      description: "Photorealistic checkpoint model",
      required: false
    },
    
    // VAE Models
    "sdxl_vae.safetensors": {
      name: "SDXL VAE",
      type: "vae",
      url: "https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl_vae.safetensors",
      description: "SDXL Variational Autoencoder",
      required: true
    },
    "vae-ft-mse-840000-ema-pruned.safetensors": {
      name: "SD 1.5 VAE",
      type: "vae",
      url: "https://huggingface.co/stabilityai/sd-vae-ft-mse-original/resolve/main/vae-ft-mse-840000-ema-pruned.safetensors",
      description: "SD 1.5 Fine-tuned VAE",
      required: true
    },

    // LoRA Models
    "detail_tweaker_lora.safetensors": {
      name: "Detail Tweaker LoRA",
      type: "loras",
      url: "https://civitai.com/api/download/models/62833",
      description: "Enhances fine details in generated images",
      required: false
    },
    
    // ControlNet Models
    "control_v11p_sd15_openpose.pth": {
      name: "OpenPose ControlNet",
      type: "controlnet",
      url: "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/control_v11p_sd15_openpose.pth",
      description: "OpenPose pose detection control model",
      required: false
    },
    
    // Upscale Models
    "RealESRGAN_x4plus.pth": {
      name: "RealESRGAN x4",
      type: "upscale_models",
      url: "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
      description: "4x upscaling model",
      required: false
    }
  };

  async analyzeWorkflow(serverId: number, workflowName: string, workflowJson: string): Promise<WorkflowAnalysis> {
    try {
      const workflow: WorkflowData = JSON.parse(workflowJson);
      const requiredModels = this.extractModelRequirements(workflow);
      const installedModels = await storage.getComfyModelsByServer(serverId);
      const missingModels = this.findMissingModels(requiredModels, installedModels);

      // Create workflow analysis record
      const analysis = await storage.createWorkflowAnalysis({
        serverId,
        workflowName,
        workflowJson,
        requiredModels: requiredModels as any,
        missingModels: missingModels as any,
        analysisStatus: 'completed',
        downloadStatus: missingModels.length > 0 ? 'pending' : 'completed'
      });

      // Auto-download missing models if any
      if (missingModels.length > 0) {
        this.downloadMissingModels(serverId, missingModels, analysis.id);
      }

      return analysis;
    } catch (error) {
      console.error('Workflow analysis failed:', error);
      
      // Create failed analysis record
      return await storage.createWorkflowAnalysis({
        serverId,
        workflowName,
        workflowJson,
        requiredModels: [] as any,
        missingModels: [] as any,
        analysisStatus: 'failed',
        downloadStatus: 'failed'
      });
    }
  }

  private extractModelRequirements(workflow: WorkflowData): ModelRequirement[] {
    const models: ModelRequirement[] = [];
    const foundModels = new Set<string>();

    for (const [nodeId, node] of Object.entries(workflow)) {
      // Extract models from different node types
      switch (node.class_type) {
        case 'CheckpointLoaderSimple':
        case 'CheckpointLoader':
          this.extractCheckpointModel(node, models, foundModels);
          break;
          
        case 'VAELoader':
          this.extractVAEModel(node, models, foundModels);
          break;
          
        case 'LoraLoader':
          this.extractLoRAModel(node, models, foundModels);
          break;
          
        case 'ControlNetLoader':
          this.extractControlNetModel(node, models, foundModels);
          break;
          
        case 'UpscaleModelLoader':
          this.extractUpscaleModel(node, models, foundModels);
          break;
      }
    }

    return models;
  }

  private extractCheckpointModel(node: WorkflowNode, models: ModelRequirement[], foundModels: Set<string>) {
    const modelName = node.inputs?.ckpt_name;
    if (modelName && !foundModels.has(modelName)) {
      foundModels.add(modelName);
      
      const knownModel = this.modelDatabase[modelName];
      models.push({
        name: knownModel?.name || modelName,
        type: 'checkpoints',
        url: knownModel?.url,
        description: knownModel?.description || 'Checkpoint model',
        required: true
      });
    }
  }

  private extractVAEModel(node: WorkflowNode, models: ModelRequirement[], foundModels: Set<string>) {
    const modelName = node.inputs?.vae_name;
    if (modelName && !foundModels.has(modelName)) {
      foundModels.add(modelName);
      
      const knownModel = this.modelDatabase[modelName];
      models.push({
        name: knownModel?.name || modelName,
        type: 'vae',
        url: knownModel?.url,
        description: knownModel?.description || 'VAE model',
        required: true
      });
    }
  }

  private extractLoRAModel(node: WorkflowNode, models: ModelRequirement[], foundModels: Set<string>) {
    const modelName = node.inputs?.lora_name;
    if (modelName && !foundModels.has(modelName)) {
      foundModels.add(modelName);
      
      const knownModel = this.modelDatabase[modelName];
      models.push({
        name: knownModel?.name || modelName,
        type: 'loras',
        url: knownModel?.url,
        description: knownModel?.description || 'LoRA model',
        required: false
      });
    }
  }

  private extractControlNetModel(node: WorkflowNode, models: ModelRequirement[], foundModels: Set<string>) {
    const modelName = node.inputs?.control_net_name;
    if (modelName && !foundModels.has(modelName)) {
      foundModels.add(modelName);
      
      const knownModel = this.modelDatabase[modelName];
      models.push({
        name: knownModel?.name || modelName,
        type: 'controlnet',
        url: knownModel?.url,
        description: knownModel?.description || 'ControlNet model',
        required: false
      });
    }
  }

  private extractUpscaleModel(node: WorkflowNode, models: ModelRequirement[], foundModels: Set<string>) {
    const modelName = node.inputs?.model_name;
    if (modelName && !foundModels.has(modelName)) {
      foundModels.add(modelName);
      
      const knownModel = this.modelDatabase[modelName];
      models.push({
        name: knownModel?.name || modelName,
        type: 'upscale_models',
        url: knownModel?.url,
        description: knownModel?.description || 'Upscale model',
        required: false
      });
    }
  }

  private findMissingModels(requiredModels: ModelRequirement[], installedModels: ComfyModel[]): ModelRequirement[] {
    const installedNames = new Set(installedModels.map(m => m.name));
    
    return requiredModels.filter(model => {
      // Check if model is already installed (by name or filename)
      const isInstalled = installedNames.has(model.name) || 
                         installedModels.some(installed => 
                           installed.fileName === model.name ||
                           installed.url === model.url
                         );
      
      return !isInstalled;
    });
  }

  private async downloadMissingModels(serverId: number, missingModels: ModelRequirement[], analysisId: number) {
    try {
      await storage.updateWorkflowAnalysis(analysisId, { downloadStatus: 'downloading' });

      for (const model of missingModels) {
        if (!model.url) {
          console.log(`Skipping ${model.name}: No download URL available`);
          continue;
        }

        // Check if model is already being downloaded or exists
        const existingModel = await storage.getComfyModelByNameAndServer(model.name, serverId);
        if (existingModel) {
          console.log(`Model ${model.name} already exists, skipping download`);
          continue;
        }

        // Create model record and start download
        const modelRecord: InsertComfyModel = {
          serverId,
          name: model.name,
          url: model.url,
          folder: model.type,
          description: model.description,
          status: 'downloading',
          fileName: this.extractFilenameFromUrl(model.url),
          downloadProgress: 0
        };

        const createdModel = await storage.createComfyModel(modelRecord);
        console.log(`Started downloading model: ${model.name}`);

        // Simulate download progress (in real implementation, this would be actual download)
        this.simulateDownload(createdModel.id, model.name);
      }

      await storage.updateWorkflowAnalysis(analysisId, { downloadStatus: 'completed' });
    } catch (error) {
      console.error('Error downloading missing models:', error);
      await storage.updateWorkflowAnalysis(analysisId, { downloadStatus: 'failed' });
    }
  }

  private extractFilenameFromUrl(url: string): string {
    try {
      const urlPath = new URL(url).pathname;
      return urlPath.split('/').pop() || 'unknown_model';
    } catch {
      return 'unknown_model';
    }
  }

  private async simulateDownload(modelId: number, modelName: string) {
    // Simulate download progress over time
    const progressSteps = [10, 25, 40, 60, 80, 95, 100];
    
    for (let i = 0; i < progressSteps.length; i++) {
      setTimeout(async () => {
        const progress = progressSteps[i];
        
        if (progress === 100) {
          await storage.updateComfyModel(modelId, {
            status: 'ready',
            downloadProgress: 100
          });
          console.log(`Model ${modelName} download completed`);
        } else {
          await storage.updateComfyModel(modelId, {
            downloadProgress: progress
          });
        }
      }, (i + 1) * 2000); // 2 second intervals
    }
  }

  async getModelLibraryStatus(serverId: number): Promise<{
    totalModels: number;
    readyModels: number;
    downloadingModels: number;
    failedModels: number;
    storageUsed: string;
  }> {
    const models = await storage.getComfyModelsByServer(serverId);
    
    const totalModels = models.length;
    const readyModels = models.filter(m => m.status === 'ready').length;
    const downloadingModels = models.filter(m => m.status === 'downloading').length;
    const failedModels = models.filter(m => m.status === 'failed').length;
    
    const totalSize = models.reduce((sum, model) => sum + (model.fileSize || 0), 0);
    const storageUsed = this.formatBytes(totalSize);

    return {
      totalModels,
      readyModels,
      downloadingModels,
      failedModels,
      storageUsed
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async cleanupFailedDownloads(serverId: number): Promise<number> {
    const failedModels = await storage.getModelsByStatus('failed');
    const serverFailedModels = failedModels.filter(m => m.serverId === serverId);
    
    let deletedCount = 0;
    for (const model of serverFailedModels) {
      const deleted = await storage.deleteComfyModel(model.id);
      if (deleted) deletedCount++;
    }
    
    return deletedCount;
  }

  // WebSocket connection management
  private wsConnections: Set<any> = new Set();

  addWebSocketConnection(ws: any): void {
    this.wsConnections.add(ws);
    
    ws.on('close', () => {
      this.wsConnections.delete(ws);
    });
  }

  // Download models and nodes based on analysis
  async downloadModelsAndNodes(analysisId: number): Promise<void> {
    const analysis = await storage.getWorkflowAnalysis(analysisId);
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    const missingModels = Array.isArray(analysis.missingModels) 
      ? analysis.missingModels 
      : JSON.parse(analysis.missingModels as string || '[]');

    // Start downloads for missing models
    for (const model of missingModels) {
      if (model.url) {
        const modelData: InsertComfyModel = {
          name: model.name,
          serverId: analysis.serverId,
          folder: model.type || 'checkpoints',
          url: model.url,
          description: model.description || '',
          status: 'downloading',
          fileSize: 0
        };
        
        await storage.createComfyModel(modelData);
      }
    }

    // Update analysis status
    await storage.updateWorkflowAnalysis(analysisId, {
      downloadStatus: 'in_progress'
    });
  }

  // Logging system
  private logs: Array<{ timestamp: Date; message: string; level: string }> = [];

  addLog(message: string, level: string = 'info'): void {
    this.logs.push({
      timestamp: new Date(),
      message,
      level
    });

    // Broadcast to WebSocket connections
    const logEntry = {
      type: 'log',
      timestamp: new Date().toISOString(),
      message,
      level
    };

    this.wsConnections.forEach(ws => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(JSON.stringify(logEntry));
      }
    });

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  getLogs(): Array<{ timestamp: Date; message: string; level: string }> {
    return this.logs;
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Additional storage helper methods
  async getWorkflowAnalysis(analysisId: number): Promise<any> {
    return await storage.getWorkflowAnalysisById(analysisId);
  }

  async updateWorkflowAnalysis(analysisId: number, data: any): Promise<void> {
    await storage.updateWorkflowAnalysis(analysisId, data);
  }
}

export const workflowAnalyzer = new WorkflowAnalyzer();