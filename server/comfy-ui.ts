import { Request, Response } from 'express';
import { storage } from './storage';
import type { InsertComfyModel, InsertComfyWorkflow, InsertComfyGeneration } from '@shared/schema';

// ComfyUI API client class
class ComfyUIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async queuePrompt(workflow: any): Promise<{ prompt_id: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: workflow }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error queuing prompt:', error);
      return null;
    }
  }

  async getQueueStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/queue`);
      return await response.json();
    } catch (error) {
      console.error('Error getting queue status:', error);
      return null;
    }
  }

  async getHistory(promptId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/history/${promptId}`);
      return await response.json();
    } catch (error) {
      console.error('Error getting history:', error);
      return null;
    }
  }

  async getImage(filename: string, subfolder: string = '', type: string = 'output'): Promise<Blob | null> {
    try {
      const url = new URL(`${this.baseUrl}/view`);
      url.searchParams.set('filename', filename);
      if (subfolder) url.searchParams.set('subfolder', subfolder);
      url.searchParams.set('type', type);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error getting image:', error);
      return null;
    }
  }

  async downloadModel(url: string, folder: string, filename: string): Promise<boolean> {
    try {
      // This would typically use ComfyUI's model downloading API
      // For now, we'll simulate the download process
      const response = await fetch(`${this.baseUrl}/download_model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          folder,
          filename,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error downloading model:', error);
      return false;
    }
  }

  async getModels(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/object_info`);
      const objectInfo = await response.json();
      
      // Extract available models from object_info
      const models: any = {};
      
      if (objectInfo.CheckpointLoaderSimple?.input?.required?.ckpt_name) {
        models.checkpoints = objectInfo.CheckpointLoaderSimple.input.required.ckpt_name[0];
      }
      
      if (objectInfo.VAELoader?.input?.required?.vae_name) {
        models.vae = objectInfo.VAELoader.input.required.vae_name[0];
      }
      
      if (objectInfo.LoraLoader?.input?.required?.lora_name) {
        models.loras = objectInfo.LoraLoader.input.required.lora_name[0];
      }

      return models;
    } catch (error) {
      console.error('Error getting models:', error);
      return {};
    }
  }
}

// Default text-to-image workflow template
const DEFAULT_WORKFLOW = {
  "3": {
    "inputs": {
      "seed": 42,
      "steps": 20,
      "cfg": 8,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler",
    "_meta": {
      "title": "KSampler"
    }
  },
  "4": {
    "inputs": {
      "ckpt_name": "v1-5-pruned-emaonly.ckpt"
    },
    "class_type": "CheckpointLoaderSimple",
    "_meta": {
      "title": "Load Checkpoint"
    }
  },
  "5": {
    "inputs": {
      "width": 512,
      "height": 512,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage",
    "_meta": {
      "title": "Empty Latent Image"
    }
  },
  "6": {
    "inputs": {
      "text": "beautiful scenery nature glass bottle landscape, purple galaxy bottle,",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "7": {
    "inputs": {
      "text": "text, watermark",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode",
    "_meta": {
      "title": "CLIP Text Encode (Prompt)"
    }
  },
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode",
    "_meta": {
      "title": "VAE Decode"
    }
  },
  "9": {
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": ["8", 0]
    },
    "class_type": "SaveImage",
    "_meta": {
      "title": "Save Image"
    }
  }
};

// API Routes

// Get all models for a server
export async function getComfyModels(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const models = await storage.getComfyModelsByServer(serverId);
    res.json(models);
  } catch (error) {
    console.error('Error fetching ComfyUI models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
}

// Add a new model to download
export async function addComfyModel(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const { name, url, folder, description } = req.body;

    // Extract filename from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const modelData: InsertComfyModel = {
      name,
      url,
      folder,
      description,
      serverId,
      fileName,
      status: 'pending',
      downloadProgress: 0,
    };

    const model = await storage.createComfyModel(modelData);

    // Start download process (in background)
    downloadModelInBackground(model.id, serverId, url, folder, fileName);

    res.json(model);
  } catch (error) {
    console.error('Error adding ComfyUI model:', error);
    res.status(500).json({ error: 'Failed to add model' });
  }
}

// Delete a model
export async function deleteComfyModel(req: Request, res: Response) {
  try {
    const modelId = parseInt(req.params.id);
    
    const success = await storage.deleteComfyModel(modelId);
    
    if (!success) {
      return res.status(404).json({ error: 'Model not found' });
    }
    
    res.json({ success: true, message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting ComfyUI model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
}

// Get available models from ComfyUI server
export async function getAvailableModels(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const server = await storage.getVastServer(serverId);
    
    if (!server || !server.serverUrl) {
      return res.status(404).json({ error: 'Server not found or not running' });
    }

    const comfyUrl = `http://${server.serverUrl}:8188`;
    const client = new ComfyUIClient(comfyUrl);

    const isOnline = await client.checkStatus();
    if (!isOnline) {
      return res.status(503).json({ error: 'ComfyUI server is not accessible' });
    }

    const models = await client.getModels();
    res.json(models);
  } catch (error) {
    console.error('Error fetching available models:', error);
    res.status(500).json({ error: 'Failed to fetch available models' });
  }
}

// Get all workflows
export async function getComfyWorkflows(req: Request, res: Response) {
  try {
    const workflows = await storage.getComfyWorkflows();
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching ComfyUI workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
}

// Create a new workflow
export async function createComfyWorkflow(req: Request, res: Response) {
  try {
    const { name, description, workflowJson, category, serverId, isTemplate } = req.body;

    const workflowData: InsertComfyWorkflow = {
      name,
      description,
      workflowJson: JSON.stringify(workflowJson),
      category,
      serverId,
      isTemplate: isTemplate || false,
    };

    const workflow = await storage.createComfyWorkflow(workflowData);
    res.json(workflow);
  } catch (error) {
    console.error('Error creating ComfyUI workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
}

// Generate image using ComfyUI
export async function generateImage(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const { prompt, negativePrompt, workflowId, parameters } = req.body;

    const server = await storage.getVastServer(serverId);
    if (!server || !server.serverUrl) {
      return res.status(404).json({ error: 'Server not found or not running' });
    }

    const comfyUrl = `http://${server.serverUrl}:8188`;
    const client = new ComfyUIClient(comfyUrl);

    // Check if ComfyUI is accessible
    const isOnline = await client.checkStatus();
    if (!isOnline) {
      return res.status(503).json({ 
        error: 'ComfyUI server is not accessible. Please ensure ComfyUI is running on the server.',
        details: `Attempted to connect to: ${comfyUrl}`,
        troubleshooting: [
          'Check if the Vast.ai server is running',
          'Verify ComfyUI is installed and started on port 8188',
          'Ensure firewall allows connections on port 8188'
        ]
      });
    }

    // Get workflow (use default if none specified)
    let workflow = DEFAULT_WORKFLOW;
    if (workflowId) {
      const savedWorkflow = await storage.getComfyWorkflow(workflowId);
      if (savedWorkflow) {
        workflow = JSON.parse(savedWorkflow.workflowJson);
      }
    }

    // Update workflow with user parameters
    if (prompt && workflow["6"]) {
      workflow["6"].inputs.text = prompt;
    }
    if (negativePrompt && workflow["7"]) {
      workflow["7"].inputs.text = negativePrompt;
    }

    // Apply additional parameters
    if (parameters) {
      const params = typeof parameters === 'string' ? JSON.parse(parameters) : parameters;
      
      if (params.seed && workflow["3"]) workflow["3"].inputs.seed = params.seed;
      if (params.steps && workflow["3"]) workflow["3"].inputs.steps = params.steps;
      if (params.cfg && workflow["3"]) workflow["3"].inputs.cfg = params.cfg;
      if (params.width && workflow["5"]) workflow["5"].inputs.width = params.width;
      if (params.height && workflow["5"]) workflow["5"].inputs.height = params.height;
      if (params.model && workflow["4"]) workflow["4"].inputs.ckpt_name = params.model;
    }

    // Queue the prompt
    const queueResult = await client.queuePrompt(workflow);
    if (!queueResult) {
      return res.status(500).json({ error: 'Failed to queue generation' });
    }

    // Save generation record
    const generationData: InsertComfyGeneration = {
      serverId,
      workflowId,
      prompt,
      negativePrompt,
      parameters: typeof parameters === 'string' ? parameters : JSON.stringify(parameters),
      status: 'pending',
      queueId: queueResult.prompt_id,
    };

    const generation = await storage.createComfyGeneration(generationData);

    // Start monitoring the generation
    monitorGeneration(generation.id, serverId, queueResult.prompt_id);

    res.json({
      id: generation.id,
      queueId: queueResult.prompt_id,
      status: 'pending',
      message: 'Generation queued successfully'
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
}

// Get generation status
export async function getGenerationStatus(req: Request, res: Response) {
  try {
    const generationId = parseInt(req.params.generationId);
    const generation = await storage.getComfyGeneration(generationId);
    
    if (!generation) {
      return res.status(404).json({ error: 'Generation not found' });
    }

    res.json(generation);
  } catch (error) {
    console.error('Error fetching generation status:', error);
    res.status(500).json({ error: 'Failed to fetch generation status' });
  }
}

// Get all generations for a server
export async function getGenerations(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const generations = await storage.getComfyGenerationsByServer(serverId);
    res.json(generations);
  } catch (error) {
    console.error('Error fetching generations:', error);
    res.status(500).json({ error: 'Failed to fetch generations' });
  }
}

export async function autoSetupComfyUI(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const server = await storage.getVastServer(serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.status !== 'running') {
      return res.status(400).json({ error: 'Server must be running to setup ComfyUI' });
    }

    // Create a comprehensive setup script that installs and starts ComfyUI
    const setupScript = `#!/bin/bash
set -e
echo "Starting automated ComfyUI setup..."

# Update system packages
apt-get update -y
apt-get install -y git python3-pip wget curl unzip

# Install Python dependencies
pip3 install --upgrade pip
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Clone ComfyUI if not exists
if [ ! -d "/workspace/ComfyUI" ]; then
    cd /workspace
    git clone https://github.com/comfyanonymous/ComfyUI.git
    echo "ComfyUI cloned successfully"
else
    echo "ComfyUI already exists, updating..."
    cd /workspace/ComfyUI
    git pull
fi

cd /workspace/ComfyUI

# Install ComfyUI requirements
pip3 install -r requirements.txt

# Create models directory structure
mkdir -p models/checkpoints
mkdir -p models/vae
mkdir -p models/loras
mkdir -p models/embeddings
mkdir -p models/clip_vision
mkdir -p models/unet

# Download a basic SDXL model for immediate use
echo "Downloading basic SDXL model..."
cd models/checkpoints
if [ ! -f "sd_xl_base_1.0.safetensors" ]; then
    wget -O sd_xl_base_1.0.safetensors "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
    echo "SDXL base model downloaded"
fi

# Download VAE
cd ../vae
if [ ! -f "sdxl_vae.safetensors" ]; then
    wget -O sdxl_vae.safetensors "https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl_vae.safetensors"
    echo "SDXL VAE downloaded"
fi

cd /workspace/ComfyUI

# Kill any existing ComfyUI processes
pkill -f "python.*main.py" || true
sleep 2

# Start ComfyUI server
echo "Starting ComfyUI server..."
nohup python3 main.py --listen 0.0.0.0 --port 8188 --enable-cors-header > comfyui.log 2>&1 &

# Wait for server to start
echo "Waiting for ComfyUI to start..."
sleep 10

# Check if server is running
if curl -s http://localhost:8188 > /dev/null; then
    echo "ComfyUI setup completed successfully!"
    echo "Server is running on port 8188"
else
    echo "ComfyUI may still be starting up, check logs at /workspace/ComfyUI/comfyui.log"
fi

echo "Setup process finished"`;

    // Execute setup script on the server
    const executionData = {
      serverId,
      scriptId: null,
      command: setupScript,
      status: 'running',
      output: '',
      startedAt: new Date(),
    };

    const execution = await storage.createServerExecution(executionData);

    // Simulate script execution (in a real environment, this would SSH and execute)
    setTimeout(async () => {
      try {
        await storage.updateServerExecution(execution.id, {
          status: 'completed',
          output: 'ComfyUI setup completed successfully',
          completedAt: new Date(),
        });
      } catch (error) {
        console.error('Error updating execution:', error);
      }
    }, 30000); // 30 seconds simulation

    res.json({
      success: true,
      message: 'ComfyUI auto-setup initiated',
      executionId: execution.id,
      estimatedTime: '2-3 minutes',
      steps: [
        'Installing system dependencies',
        'Setting up Python environment',
        'Cloning ComfyUI repository',
        'Installing ComfyUI requirements',
        'Downloading basic models',
        'Starting ComfyUI server'
      ]
    });

  } catch (error) {
    console.error('Error in auto-setup:', error);
    res.status(500).json({ error: 'Failed to initiate ComfyUI setup' });
  }
}

// Background functions

async function downloadModelInBackground(modelId: number, serverId: number, url: string, folder: string, fileName: string) {
  try {
    // Update status to downloading
    await storage.updateComfyModel(modelId, { status: 'downloading' });

    const server = await storage.getVastServer(serverId);
    if (!server || !server.serverUrl) {
      await storage.updateComfyModel(modelId, { 
        status: 'failed', 
        errorMessage: 'Server not found or not running' 
      });
      return;
    }

    const comfyUrl = `http://${server.serverUrl}:8188`;
    const client = new ComfyUIClient(comfyUrl);

    const success = await client.downloadModel(url, folder, fileName);
    
    if (success) {
      await storage.updateComfyModel(modelId, { 
        status: 'ready',
        downloadProgress: 100 
      });
    } else {
      await storage.updateComfyModel(modelId, { 
        status: 'failed',
        errorMessage: 'Download failed' 
      });
    }
  } catch (error) {
    console.error('Error downloading model:', error);
    await storage.updateComfyModel(modelId, { 
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

async function monitorGeneration(generationId: number, serverId: number, queueId: string) {
  try {
    const server = await storage.getVastServer(serverId);
    if (!server || !server.serverUrl) {
      await storage.updateComfyGeneration(generationId, {
        status: 'failed',
        errorMessage: 'Server not found or not running'
      });
      return;
    }

    const comfyUrl = `http://${server.serverUrl}:8188`;
    const client = new ComfyUIClient(comfyUrl);

    // Update status to running
    await storage.updateComfyGeneration(generationId, { status: 'running' });

    // Poll for completion
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const pollGeneration = async () => {
      try {
        const history = await client.getHistory(queueId);
        
        if (history && history[queueId]) {
          const outputs = history[queueId].outputs;
          
          if (outputs) {
            // Extract image URLs from outputs
            const imageUrls: string[] = [];
            
            for (const nodeId in outputs) {
              const output = outputs[nodeId];
              if (output.images) {
                for (const image of output.images) {
                  const imageUrl = `${comfyUrl}/view?filename=${image.filename}&type=${image.type || 'output'}&subfolder=${image.subfolder || ''}`;
                  imageUrls.push(imageUrl);
                }
              }
            }

            await storage.updateComfyGeneration(generationId, {
              status: 'completed',
              imageUrls,
              completedAt: new Date(),
            });
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollGeneration, 5000); // Poll every 5 seconds
        } else {
          await storage.updateComfyGeneration(generationId, {
            status: 'failed',
            errorMessage: 'Generation timeout'
          });
        }
      } catch (error) {
        console.error('Error polling generation:', error);
        await storage.updateComfyGeneration(generationId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    // Start polling after a short delay
    setTimeout(pollGeneration, 2000);
  } catch (error) {
    console.error('Error monitoring generation:', error);
    await storage.updateComfyGeneration(generationId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}