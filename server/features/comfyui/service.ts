import { Request, Response } from 'express';
import { storage } from '../../storage.js';
import { InsertComfyModel, InsertComfyWorkflow, InsertComfyGeneration } from '../../../shared/schema.js';
import { comfyWebSocketManager } from '../../comfy-websocket.js';

// ComfyUI HTTP Client for authentic API connections
class ComfyUIClient {
  constructor(private baseUrl: string) {}

  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async queuePrompt(workflow: any): Promise<{ prompt_id: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
        signal: AbortSignal.timeout(15000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return null;
    }
  }

  async getObjectInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/object_info`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return null;
    }
  }

  async getHistory(promptId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/history/${promptId}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      return null;
    }
  }
}

// Generate ComfyUI URL from server data
function getComfyUIUrl(server: any): string {
  const serverHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
  return `http://${serverHost}:8188`;
}

// Process workflow with dynamic parameters
function processWorkflow(workflow: any, options: {
  prompt?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
}): any {
  const processedWorkflow = JSON.parse(JSON.stringify(workflow));
  const seed = options.seed || Math.floor(Math.random() * 4294967295);
  
  for (const nodeId in processedWorkflow) {
    const node = processedWorkflow[nodeId];
    
    if (node.inputs) {
      if (node.class_type === 'KSampler') {
        if (options.steps) node.inputs.steps = options.steps;
        if (options.cfg) node.inputs.cfg = options.cfg;
        node.inputs.seed = seed;
      }
      
      if (node.class_type === 'EmptyLatentImage') {
        if (options.width) node.inputs.width = options.width;
        if (options.height) node.inputs.height = options.height;
      }
      
      if (node.class_type === 'CLIPTextEncode' && node.inputs.text) {
        if (!node.inputs.text.includes('blurry') && options.prompt) {
          node.inputs.text = options.prompt;
        } else if (node.inputs.text.includes('blurry') && options.negativePrompt) {
          node.inputs.text = options.negativePrompt;
        }
      }
    }
  }
  
  return processedWorkflow;
}

// Default workflow template
const DEFAULT_WORKFLOW = {
  "3": {
    "inputs": {
      "seed": 156680208700286,
      "steps": 20,
      "cfg": 7.5,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1,
      "model": ["4", 0],
      "positive": ["6", 0],
      "negative": ["7", 0],
      "latent_image": ["5", 0]
    },
    "class_type": "KSampler"
  },
  "4": {
    "inputs": {
      "ckpt_name": "v1-5-pruned-emaonly.ckpt"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "5": {
    "inputs": {
      "width": 512,
      "height": 512,
      "batch_size": 1
    },
    "class_type": "EmptyLatentImage"
  },
  "6": {
    "inputs": {
      "text": "beautiful scenery",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "7": {
    "inputs": {
      "text": "blurry, low quality",
      "clip": ["4", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "8": {
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    },
    "class_type": "VAEDecode"
  },
  "9": {
    "inputs": {
      "filename_prefix": "ComfyUI",
      "images": ["8", 0]
    },
    "class_type": "SaveImage"
  }
};

export async function generateImage(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const { prompt, negativePrompt, parameters, workflowId } = req.body;

    console.log('Starting authentic ComfyUI image generation');
    console.log('Server ID:', serverId);
    console.log('Prompt:', prompt);

    const server = await storage.getVastServer(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (server.setupStatus !== 'completed') {
      return res.status(400).json({
        error: 'ComfyUI setup required',
        message: 'Selected instance must have ComfyUI setup completed before image generation',
        setupStatus: server.setupStatus
      });
    }

    if (!server.serverUrl) {
      return res.status(400).json({
        error: 'Server not accessible',
        message: 'Server must be running and accessible'
      });
    }

    const comfyUrl = getComfyUIUrl(server);
    const client = new ComfyUIClient(comfyUrl);

    console.log('Testing ComfyUI connectivity at:', comfyUrl);
    const isAccessible = await client.checkStatus();
    
    if (!isAccessible) {
      return res.status(503).json({
        error: 'ComfyUI not accessible',
        message: 'ComfyUI server is not responding. Please ensure ComfyUI is running on the instance.',
        serverUrl: comfyUrl,
        troubleshooting: [
          'Verify ComfyUI setup is completed',
          'Check if ComfyUI service is running',
          'Ensure port 8188 is accessible',
          'Try restarting ComfyUI service'
        ]
      });
    }

    console.log('ComfyUI is accessible, processing workflow');

    let workflow = DEFAULT_WORKFLOW;
    if (workflowId) {
      const customWorkflow = await storage.getComfyWorkflow(parseInt(workflowId));
      if (customWorkflow && customWorkflow.workflow) {
        workflow = JSON.parse(customWorkflow.workflow);
      }
    }

    const processedWorkflow = processWorkflow(workflow, {
      prompt: prompt || 'beautiful scenery nature glass bottle landscape',
      negativePrompt: negativePrompt || 'blurry, low quality',
      ...parameters
    });

    console.log('Submitting workflow to ComfyUI API');
    const queueResult = await client.queuePrompt(processedWorkflow);
    
    if (!queueResult || !queueResult.prompt_id) {
      return res.status(500).json({
        error: 'Failed to queue prompt',
        message: 'ComfyUI rejected the workflow submission'
      });
    }

    console.log('Workflow queued successfully with ID:', queueResult.prompt_id);

    const generationData: InsertComfyGeneration = {
      serverId,
      workflowId: workflowId ? parseInt(workflowId) : null,
      prompt: prompt || 'beautiful scenery nature glass bottle landscape',
      negativePrompt: negativePrompt || '',
      parameters: JSON.stringify(parameters || {}),
      status: 'queued',
      queueId: queueResult.prompt_id
    };

    const generation = await storage.createComfyGeneration(generationData);
    
    // Start WebSocket monitoring
    comfyWebSocketManager.startTracking(generation.id, serverId);

    return res.json({
      success: true,
      generationId: generation.id,
      message: 'Authentic ComfyUI generation started',
      queueId: queueResult.prompt_id,
      status: 'queued'
    });
  } catch (error) {
    console.error('Error in authentic ComfyUI generation:', error);
    res.status(500).json({ 
      error: 'Image generation failed', 
      message: 'An error occurred during the authentic ComfyUI generation process' 
    });
  }
}

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

export async function addComfyModel(req: Request, res: Response) {
  try {
    const { name, url, folder, description, serverId } = req.body;

    const modelData: InsertComfyModel = {
      serverId,
      name,
      url,
      folder,
      description,
      status: 'pending',
      fileName: url.split('/').pop() || name,
      fileSize: null,
      downloadProgress: 0,
      isRequired: false
    };

    const model = await storage.createComfyModel(modelData);
    res.status(201).json(model);
  } catch (error) {
    console.error('Error adding ComfyUI model:', error);
    res.status(500).json({ error: 'Failed to add model' });
  }
}

export async function deleteComfyModel(req: Request, res: Response) {
  try {
    const modelId = parseInt(req.params.id);
    const success = await storage.deleteComfyModel(modelId);
    
    if (!success) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting ComfyUI model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
}

export async function getComfyWorkflows(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const workflows = await storage.getComfyWorkflowsByServer(serverId);
    res.json(workflows);
  } catch (error) {
    console.error('Error fetching ComfyUI workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
}

export async function createComfyWorkflow(req: Request, res: Response) {
  try {
    const { name, description, workflow, serverId } = req.body;

    const workflowData: InsertComfyWorkflow = {
      serverId,
      name,
      description,
      workflow: typeof workflow === 'string' ? workflow : JSON.stringify(workflow),
      isActive: true
    };

    const newWorkflow = await storage.createComfyWorkflow(workflowData);
    res.status(201).json(newWorkflow);
  } catch (error) {
    console.error('Error creating ComfyUI workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
}

export async function autoSetupComfyUI(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const server = await storage.getVastServer(serverId);
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (!server.isLaunched || server.status !== 'running') {
      return res.status(400).json({ 
        error: 'Server must be running',
        message: 'Please ensure the server is launched and running before setup'
      });
    }

    // Update server status to indicate setup is starting
    await storage.updateVastServer(serverId, { 
      setupStatus: 'installing',
      comfyUIStatus: 'installing'
    });

    res.json({
      success: true,
      message: 'ComfyUI setup initiated',
      serverId,
      status: 'installing'
    });
  } catch (error) {
    console.error('Error in ComfyUI setup:', error);
    res.status(500).json({ error: 'Failed to start ComfyUI setup' });
  }
}