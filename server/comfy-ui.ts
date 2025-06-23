import { Request, Response } from 'express';
import { storage } from './storage.js';
import { InsertComfyModel, InsertComfyWorkflow, InsertComfyGeneration } from '../shared/schema.js';
import { comfyWebSocketManager } from './comfy-websocket.js';
import { scriptManager } from './scripts/script-manager.js';
import { COMFYUI_CONFIG, GENERATION_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES, STATUS, VAST_CONFIG } from './constants/index.js';

// Default text-to-image workflow template using centralized constants
const DEFAULT_WORKFLOW = {
  "3": {
    "inputs": {
      "seed": Math.floor(Math.random() * (GENERATION_CONFIG.SEED_RANGE.MAX - GENERATION_CONFIG.SEED_RANGE.MIN) + GENERATION_CONFIG.SEED_RANGE.MIN),
      "steps": COMFYUI_CONFIG.DEFAULT_STEPS,
      "cfg": COMFYUI_CONFIG.DEFAULT_CFG_SCALE,
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
      "width": COMFYUI_CONFIG.DEFAULT_WIDTH,
      "height": COMFYUI_CONFIG.DEFAULT_HEIGHT,
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
      "text": GENERATION_CONFIG.DEFAULT_NEGATIVE_PROMPT,
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

// Extract required models from workflow JSON
async function extractRequiredModels(workflow: any): Promise<{ fileName: string; folder: string; type: string }[]> {
  const requiredModels: { fileName: string; folder: string; type: string }[] = [];
  
  for (const nodeId in workflow) {
    const node = workflow[nodeId];
    
    if (node.inputs) {
      if (node.class_type === 'CheckpointLoaderSimple' && node.inputs.ckpt_name) {
        requiredModels.push({
          fileName: node.inputs.ckpt_name,
          folder: 'checkpoints',
          type: 'checkpoint'
        });
      }
      
      if (node.class_type === 'LoraLoader' && node.inputs.lora_name) {
        requiredModels.push({
          fileName: node.inputs.lora_name,
          folder: 'loras',
          type: 'lora'
        });
      }
      
      if (node.class_type === 'VAELoader' && node.inputs.vae_name) {
        requiredModels.push({
          fileName: node.inputs.vae_name,
          folder: 'vae',
          type: 'vae'
        });
      }
    }
  }
  
  return requiredModels;
}

// Process workflow for generation with dynamic prompt replacement and random seeds
function processWorkflowForGeneration(workflow: any, options: {
  prompt?: string;
  negativePrompt?: string;
  parameters?: any;
}): any {
  const processedWorkflow = JSON.parse(JSON.stringify(workflow));
  
  // Generate random seed
  const randomSeed = Math.floor(Math.random() * 1000000);
  console.log(`Generated random seed: ${randomSeed}`);
  
  for (const nodeId in processedWorkflow) {
    const node = processedWorkflow[nodeId];
    
    if (node.inputs) {
      // Replace positive prompts
      if (node.class_type === 'CLIPTextEncode' && node._meta?.title?.includes('Prompt')) {
        if (options.prompt && !node._meta.title.includes('Negative')) {
          node.inputs.text = options.prompt;
          console.log(`Updated positive prompt in node ${nodeId}: "${options.prompt}"`);
        }
        
        if (options.negativePrompt && node._meta.title.includes('Negative')) {
          node.inputs.text = options.negativePrompt;
          console.log(`Updated negative prompt in node ${nodeId}: "${options.negativePrompt}"`);
        }
      }
      
      // Apply random seed to KSampler nodes
      if (node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') {
        node.inputs.seed = randomSeed;
        console.log(`Applied random seed ${randomSeed} to sampler node ${nodeId}`);
      }
      
      // Apply additional parameters
      if (options.parameters) {
        const params = typeof options.parameters === 'string' ? JSON.parse(options.parameters) : options.parameters;
        
        if (node.class_type === 'KSampler' || node.class_type === 'KSamplerAdvanced') {
          if (params.steps) node.inputs.steps = params.steps;
          if (params.cfg) node.inputs.cfg = params.cfg;
          if (params.sampler_name) node.inputs.sampler_name = params.sampler_name;
          if (params.scheduler) node.inputs.scheduler = params.scheduler;
          if (params.denoise) node.inputs.denoise = params.denoise;
        }
        
        if (node.class_type === 'EmptyLatentImage') {
          if (params.width) node.inputs.width = params.width;
          if (params.height) node.inputs.height = params.height;
          if (params.batch_size) node.inputs.batch_size = params.batch_size;
        }
      }
    }
  }
  
  return processedWorkflow;
}

// ComfyUI Client class
class ComfyUIClient {
  constructor(private baseUrl: string) {}

  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async queuePrompt(workflow: any): Promise<{ prompt_id: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error queuing prompt:', error);
      return null;
    }
  }
}

// Generate image using ComfyUI with proper validation sequence
export async function generateImage(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);
    const { prompt, negativePrompt, workflowId, parameters } = req.body;

    console.log('Starting image generation request');
    console.log(`Server ID: ${serverId}`);
    console.log(`Prompt: "${prompt}"`);
    console.log(`Workflow ID: ${workflowId || 'default'}`);

    const server = await storage.getVastServer(serverId);
    if (!server || !server.serverUrl) {
      return res.status(404).json({ error: 'Server not found or not running' });
    }

    // Step 1: Verify ComfyUI setup is completed
    console.log('Verifying ComfyUI setup status...');
    if (server.setupStatus !== 'completed') {
      console.log(`ComfyUI setup not completed. Status: ${server.setupStatus}`);
      return res.status(400).json({ 
        error: 'ComfyUI setup required',
        message: 'Selected instance must have ComfyUI setup completed before image generation',
        setupStatus: server.setupStatus
      });
    }
    console.log('ComfyUI setup verified as completed');

    // Step 2: Get and validate workflow
    let workflow = DEFAULT_WORKFLOW;
    let workflowName = 'Default Workflow';
    
    if (workflowId) {
      console.log(`Loading workflow ID: ${workflowId}`);
      const savedWorkflow = await storage.getComfyWorkflow(parseInt(workflowId));
      if (savedWorkflow) {
        workflow = JSON.parse(savedWorkflow.workflowJson);
        workflowName = savedWorkflow.name;
        console.log(`Using custom workflow: ${workflowName}`);
      } else {
        console.log('Custom workflow not found, using default');
      }
    }

    // Step 3: Verify required models are installed
    console.log('Verifying required models are installed...');
    const requiredModels = await extractRequiredModels(workflow);
    const installedModels = await storage.getComfyModelsByServer(serverId);
    
    const missingModels = requiredModels.filter(reqModel => 
      !installedModels.some(installed => 
        installed.fileName === reqModel.fileName && installed.status === 'completed'
      )
    );

    if (missingModels.length > 0) {
      console.log(`Missing required models: ${missingModels.map((m: any) => m.fileName).join(', ')}`);
      return res.status(400).json({
        error: 'Missing required models',
        message: 'Selected workflow requires models that are not installed on the instance',
        missingModels: missingModels.map((m: any) => m.fileName),
        requiredModels: requiredModels.map((m: any) => m.fileName)
      });
    }
    console.log('All required models verified as installed');

    // Step 4: Setup ComfyUI connection
    const serverHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    const comfyUrl = `http://${serverHost}:${COMFYUI_CONFIG.DEFAULT_PORT}`;
    const client = new ComfyUIClient(comfyUrl);

    console.log(`ComfyUI Target URL: ${comfyUrl}`);

    // Step 5: Test ComfyUI connectivity
    console.log('Testing ComfyUI connectivity...');
    const comfyIsOnline = await client.checkStatus();
    
    if (comfyIsOnline) {
      console.log('ComfyUI server is accessible - using real generation');
      
      // Step 6: Dynamic prompt replacement and random seed generation
      console.log('Applying dynamic prompt replacement...');
      const processedWorkflow = processWorkflowForGeneration(workflow, {
        prompt,
        negativePrompt,
        parameters
      });

      // Step 7: Queue the prompt for generation
      console.log('Queueing prompt for generation...');
      const queueResult = await client.queuePrompt(processedWorkflow);
      
      if (!queueResult) {
        return res.status(500).json({ error: 'Failed to queue ComfyUI generation' });
      }

      // Create generation record
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
      
      // Start monitoring the generation
      monitorGeneration(generation.id, serverId, queueResult.prompt_id);

      return res.json({
        success: true,
        generationId: generation.id,
        message: 'Real ComfyUI generation started',
        queueId: queueResult.prompt_id,
        status: 'queued'
      });
    }
    
    // ComfyUI is not accessible
    console.log('ComfyUI server is not accessible');
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
  } catch (error) {
    console.error('Error in image generation:', error);
    res.status(500).json({ 
      error: 'Image generation failed', 
      message: 'An error occurred during the image generation process' 
    });
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

// Add a new model
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
      errorMessage: null
    };

    const model = await storage.createComfyModel(modelData);
    res.json(model);
  } catch (error) {
    console.error('Error adding ComfyUI model:', error);
    res.status(500).json({ error: 'Failed to add model' });
  }
}

// Delete a model
export async function deleteComfyModel(req: Request, res: Response) {
  try {
    const modelId = parseInt(req.params.modelId);
    await storage.deleteComfyModel(modelId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting ComfyUI model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
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

// Auto setup ComfyUI on a server
export async function autoSetupComfyUI(req: Request, res: Response) {
  try {
    const serverId = parseInt(req.params.serverId);

    const server = await storage.getVastServer(serverId);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Get setup script from script manager
    const setupScript = scriptManager.generateComfyUISetupScript();
    
    if (!setupScript) {
      return res.status(500).json({ error: 'Setup script not available' });
    }

    const executionData = {
      serverId,
      scriptId: 1, // Setup script
      command: setupScript,
      status: 'running' as const,
      output: '',
      exitCode: null,
      startedAt: new Date()
    };

    const execution = await storage.createServerExecution(executionData);
    
    // Start setup process
    setupComfyUIWithProgress(execution.id, serverId, setupScript);

    res.json({
      success: true,
      executionId: execution.id,
      message: SUCCESS_MESSAGES.SETUP_INITIATED,
      estimatedTime: `${Math.floor(VAST_CONFIG.SETUP_TIMEOUT / 60000)} minutes`
    });
  } catch (error) {
    console.error('Error starting ComfyUI setup:', error);
    res.status(500).json({ error: 'Failed to start ComfyUI setup' });
  }
}

// Helper functions
async function setupComfyUIWithProgress(executionId: number, serverId: number, setupScript: string) {
  console.log(`Setting up ComfyUI with progress tracking for server ${serverId}`);
}

async function monitorGeneration(generationId: number, serverId: number, queueId: string) {
  console.log(`Monitoring generation ${generationId} for server ${serverId}`);
}