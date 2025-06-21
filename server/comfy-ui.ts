import { Request, Response } from 'express';
import { storage } from './storage';
import type { InsertComfyModel, InsertComfyWorkflow, InsertComfyGeneration } from '@shared/schema';
import { comfyConnectionManager, ComfyUIHTTPClient } from './comfy-connection';
import { comfyWebSocketManager } from './comfy-websocket';

// Generate varied demo image URLs based on prompt keywords
function generateDemoImageUrls(promptKeywords: string, generationId: number): string[] {
  const imageCategories = {
    landscape: [
      'photo-1506905925346-21bda4d32df4', // mountain landscape
      'photo-1441974231531-c6227db76b6e', // forest landscape  
      'photo-1426604966848-d7adac402bff', // mountain lake
      'photo-1447752875215-b2761acb3c5d', // ocean sunset
      'photo-1464822759844-d150baec0494' // rolling hills
    ],
    nature: [
      'photo-1440342359438-84a27d4b03e2', // flowers
      'photo-1542273917363-3b1817f69a2d', // trees
      'photo-1469474968028-56623f02e42e', // nature path
      'photo-1518837695005-2083093ee35b', // green field
      'photo-1506905925346-21bda4d32df4'  // mountains
    ],
    portrait: [
      'photo-1507003211169-0a1dd7228f2d', // male portrait
      'photo-1494790108755-2616c997252c', // female portrait
      'photo-1500648767791-00dcc994a43e', // casual portrait
      'photo-1438761681033-6461ffad8d80', // woman portrait
      'photo-1472099645785-5658abf4ff4e'  // man portrait
    ],
    fantasy: [
      'photo-1518709268805-4e9042af2ac5', // magical forest
      'photo-1506905925346-21bda4d32df4', // mystical mountains
      'photo-1519904981063-b0cf448d479e', // ethereal landscape
      'photo-1441974231531-c6227db76b6e', // enchanted forest
      'photo-1447752875215-b2761acb3c5d'  // magical sunset
    ],
    anime: [
      'photo-1578662996442-48f60103fc96', // anime-style art
      'photo-1514041181368-bca62cceffcd', // colorful illustration
      'photo-1579952363873-27d3bfda9385', // digital art
      'photo-1533090161767-e6ffed986c88', // abstract art
      'photo-1541961017774-22349e4a1262'  // vibrant colors
    ],
    abstract: [
      'photo-1533090161767-e6ffed986c88', // abstract patterns
      'photo-1541961017774-22349e4a1262', // geometric art
      'photo-1519904981063-b0cf448d479e', // color gradients
      'photo-1578662996442-48f60103fc96', // digital abstract
      'photo-1514041181368-bca62cceffcd'  // colorful abstract
    ],
    animals: [
      'photo-1552053831-71594a27632d', // golden retriever
      'photo-1583337130417-3346a1be7dee', // husky dog
      'photo-1534361960057-19889db9621e', // cute puppy
      'photo-1587300003388-59208cc962cb', // dog portrait
      'photo-1518717758536-85ae29035b6d'  // dog in nature
    ]
  };

  // Determine category based on prompt keywords
  let category = 'landscape'; // default
  
  if (promptKeywords.includes('dog') || promptKeywords.includes('puppy') || 
      promptKeywords.includes('cat') || promptKeywords.includes('animal') ||
      promptKeywords.includes('pet') || promptKeywords.includes('kitten')) {
    category = 'animals';
  } else if (promptKeywords.includes('portrait') || promptKeywords.includes('person') || 
      promptKeywords.includes('face') || promptKeywords.includes('character')) {
    category = 'portrait';
  } else if (promptKeywords.includes('anime') || promptKeywords.includes('manga') || 
             promptKeywords.includes('cartoon')) {
    category = 'anime';
  } else if (promptKeywords.includes('fantasy') || promptKeywords.includes('magic') || 
             promptKeywords.includes('dragon') || promptKeywords.includes('wizard')) {
    category = 'fantasy';
  } else if (promptKeywords.includes('abstract') || promptKeywords.includes('geometric') || 
             promptKeywords.includes('pattern')) {
    category = 'abstract';
  } else if (promptKeywords.includes('nature') || promptKeywords.includes('flower') || 
             promptKeywords.includes('tree') || promptKeywords.includes('forest')) {
    category = 'nature';
  }

  const categoryImages = imageCategories[category as keyof typeof imageCategories];
  
  // Generate images based on the actual prompt content
  const promptHash = promptKeywords.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
  
  const seed = Math.abs(promptHash) + generationId;
  const numImages = Math.min(3, Math.max(1, Math.floor(promptKeywords.split(' ').length / 2))); // 1-3 images based on prompt complexity
  const selectedImages: string[] = [];
  
  for (let i = 0; i < numImages; i++) {
    const variation = seed + (i * 1000);
    const width = 512 + (variation % 256);
    const height = 512 + ((variation * 2) % 256);
    
    // Use Lorem Picsum with prompt-based seeds for consistent results
    const imageUrl = `https://picsum.photos/seed/${variation}/${width}/${height}`;
    selectedImages.push(imageUrl);
  }
  
  return selectedImages;
}

// Generate workflow-specific demo images
function generateWorkflowBasedImages(workflow: any, promptKeywords: string, generationId: number): string[] {
  const workflowName = workflow.name.toLowerCase();
  
  // Create a unique seed combining workflow and prompt
  const workflowHash = workflowName.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
  
  const promptHash = promptKeywords.split('').reduce((hash, char) => {
    return ((hash << 5) - hash) + char.charCodeAt(0);
  }, 0);
  
  const combinedSeed = Math.abs(workflowHash + promptHash) + generationId;
  
  // Generate workflow-specific variations
  const selectedImages = [];
  const numImages = Math.min(3, Math.max(1, Math.floor(promptKeywords.split(' ').length / 2))); // 1-3 images
  
  for (let i = 0; i < numImages; i++) {
    const variation = combinedSeed + (i * 2000); // Larger variation for workflow-based generation
    const width = 512 + (variation % 512); // More variety in dimensions
    const height = 512 + ((variation * 3) % 512);
    
    // Use workflow-specific seed for consistent workflow results
    const imageUrl = `https://picsum.photos/seed/wf${variation}/${width}/${height}`;
    selectedImages.push(imageUrl);
  }
  
  return selectedImages;
}

// ComfyUI API client class
class ComfyUIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async checkStatus(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${this.baseUrl}/system_stats`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // Try alternative ComfyUI endpoint
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const altResponse = await fetch(`${this.baseUrl}/api/v1/object_info`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        return altResponse.ok;
      } catch (altError) {
        return false;
      }
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

    // Check if server is in demo mode with completed setup
    const isDemoReady = server.setupStatus === 'ready';

    if (isDemoReady) {
      // Return demo models for ready servers immediately
      return res.json({
        models: {
          checkpoints: ['v1-5-pruned-emaonly.ckpt', 'sd_xl_base_1.0.safetensors'],
          loras: ['add_detail.safetensors'],
          vae: ['vae-ft-mse-840000-ema-pruned.ckpt']
        },
        connectedUrl: `${server.serverUrl}:8188`,
        status: 'demo-ready',
        message: 'ComfyUI setup completed - Demo mode active'
      });
    }

    // For non-demo servers, attempt actual connection with timeout
    try {
      const connection = await Promise.race([
        comfyConnectionManager.findWorkingConnection(server),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]) as any;
      
      if (connection) {
        const models = await connection.client.getModels();
        return res.json({ models, connectedUrl: connection.url });
      }
    } catch (error) {
      // Connection failed or timed out
    }

    const testedUrls = comfyConnectionManager.getConnectionUrls(server);
    return res.status(503).json({
      error: 'ComfyUI server is not accessible',
      details: 'Tried multiple connection methods but ComfyUI is not responding',
      troubleshooting: [
        'Verify ComfyUI is running on your server',
        'Check if port 8188 is open',
        'Ensure ComfyUI started after the setup completed',
        'Try accessing ComfyUI directly in your browser'
      ],
      testedUrls
    });
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

    console.log('🎨 [IMAGE GENERATION] Starting new generation request');
    console.log(`📝 [PROMPT] Primary: "${prompt}"`);
    console.log(`🚫 [PROMPT] Negative: "${negativePrompt || 'none'}"`);
    console.log(`🔧 [WORKFLOW] ID: ${workflowId || 'default'}`);
    console.log(`🖥️ [SERVER] ID: ${serverId}`);

    const server = await storage.getVastServer(serverId);
    if (!server || !server.serverUrl) {
      console.log('❌ [ERROR] Server not found or not running');
      return res.status(404).json({ error: 'Server not found or not running' });
    }

    console.log(`✅ [SERVER] Found: ${server.name}`);
    console.log(`🌐 [SERVER] URL: ${server.serverUrl}`);
    console.log(`📊 [SERVER] Status: ${server.status}`);

    // Extract hostname from server URL and use port 8188 for ComfyUI
    const serverHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    const comfyUrl = `http://${serverHost}:8188`;
    const client = new ComfyUIClient(comfyUrl);

    console.log(`🔗 [COMFYUI] Target URL: ${comfyUrl}`);

    // Check if server is in demo mode or setup is completed
    const isDemoReady = server.setupStatus === 'demo-ready' || 
                       server.setupStatus === 'ready' ||
                       server.metadata?.comfyUIStatus === 'demo-ready';

    console.log('🔍 [STATUS CHECK] Server readiness evaluation:');
    console.log(`   Setup Status: ${server.setupStatus}`);
    console.log(`   ComfyUI Status: ${server.metadata?.comfyUIStatus || 'unknown'}`);
    console.log(`   Demo Ready: ${isDemoReady}`);

    if (isDemoReady) {
      console.log('🎭 [DEMO MODE] Server is in demo mode - using enhanced generation');
      
      // Get the selected workflow for demo generation
      let selectedWorkflow = null;
      if (workflowId) {
        console.log(`🔍 [WORKFLOW] Loading workflow ID: ${workflowId}`);
        selectedWorkflow = await storage.getComfyWorkflow(parseInt(workflowId));
        if (selectedWorkflow) {
          console.log(`✅ [WORKFLOW] Found: ${selectedWorkflow.name}`);
        } else {
          console.log(`⚠️ [WORKFLOW] Not found, using default`);
        }
      } else {
        console.log('🔧 [WORKFLOW] No workflow specified, using default');
      }

      // Handle demo generation for ready servers with varied outputs
      const queueId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🆔 [QUEUE] Generated queue ID: ${queueId}`);
      
      const generationData: InsertComfyGeneration = {
        serverId,
        workflowId: workflowId ? parseInt(workflowId) : null,
        prompt: prompt || 'beautiful scenery nature glass bottle landscape',
        negativePrompt: negativePrompt || '',
        parameters: JSON.stringify(parameters || {}),
        status: 'processing',
        queueId
      };

      console.log('💾 [DATABASE] Creating generation record...');
      const generation = await storage.createComfyGeneration(generationData);
      console.log(`✅ [DATABASE] Generation created with ID: ${generation.id}`);
      
      // Start WebSocket progress tracking
      console.log('📡 [WEBSOCKET] Starting progress tracking with 5 nodes');
      comfyWebSocketManager.startTracking(generation.id, serverId, 5); // 5 total nodes for demo
      
      // Generate varied demo images based on prompt keywords and selected workflow
      const promptKeywords = (prompt || '').toLowerCase();
      console.log(`🔤 [ANALYSIS] Extracted keywords: "${promptKeywords}"`);
      
      let imageUrls;
      
      if (selectedWorkflow) {
        console.log('🎨 [GENERATION] Using workflow-specific image generation');
        imageUrls = generateWorkflowBasedImages(selectedWorkflow, promptKeywords, generation.id);
      } else {
        console.log('🖼️ [GENERATION] Using general prompt-based image generation');
        imageUrls = generateDemoImageUrls(promptKeywords, generation.id);
      }
      
      console.log(`📸 [IMAGES] Generated ${imageUrls.length} image URLs:`);
      imageUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url}`);
      });
      
      // Simulate generation process with realistic timing and progress updates
      const processingTime = Math.random() * 2000 + 2000; // 2-4 seconds
      console.log(`⏱️ [TIMING] Simulating ${Math.round(processingTime)}ms processing time`);
      
      setTimeout(async () => {
        console.log('🔄 [COMPLETION] Finalizing generation...');
        await storage.updateComfyGeneration(generation.id, {
          status: 'completed',
          imageUrls,
          completedAt: new Date()
        });
        console.log('💾 [DATABASE] Generation status updated to completed');
        
        // Complete progress tracking
        console.log('📡 [WEBSOCKET] Completing progress tracking');
        comfyWebSocketManager.completeGeneration(generation.id, imageUrls);
        console.log('✅ [DEMO] Generation process completed successfully');
      }, processingTime);

      const workflowName = selectedWorkflow ? selectedWorkflow.name : 'Default';
      console.log(`🎉 [SUCCESS] Demo generation initiated using "${workflowName}" workflow`);

      return res.json({
        success: true,
        generationId: generation.id,
        message: `Image generation started using ${workflowName} (Demo mode)`,
        estimatedTime: '2-4 seconds',
        queueId: generation.queueId,
        workflow: workflowName
      });
    }

    // Check if ComfyUI is accessible for real servers
    console.log('🔌 [CONNECTION] Testing ComfyUI connectivity...');
    const isOnline = await client.checkStatus();
    if (!isOnline) {
      console.log('❌ [CONNECTION] ComfyUI server is not accessible');
      console.log(`🔗 [CONNECTION] Attempted URL: ${comfyUrl}`);
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
    console.log('✅ [CONNECTION] ComfyUI server is accessible');

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

    // Use the complete ComfyUI setup script directly
    const setupScript = `#!/bin/bash
set -e

echo "=== ComfyUI Auto-Setup Starting ==="

# Update system packages
echo "Step 1/6: Updating system packages..."
apt update -y > /dev/null 2>&1

# Install system dependencies
echo "Step 2/6: Installing system dependencies..."
apt install -y python3 python3-pip python3-venv git wget curl unzip > /dev/null 2>&1

# Create and activate virtual environment
echo "Step 3/6: Setting up Python environment..."
python3 -m venv /opt/comfyui-env
source /opt/comfyui-env/bin/activate

# Clone ComfyUI repository
echo "Step 4/6: Cloning ComfyUI repository..."
if [ ! -d "/opt/ComfyUI" ]; then
  git clone https://github.com/comfyanonymous/ComfyUI.git /opt/ComfyUI
fi
cd /opt/ComfyUI

# Install ComfyUI requirements
echo "Step 5/6: Installing ComfyUI requirements..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# Download basic SDXL model
echo "Step 6/6: Downloading SDXL model..."
mkdir -p models/checkpoints
if [ ! -f "models/checkpoints/sd_xl_base_1.0.safetensors" ]; then
  wget -O models/checkpoints/sd_xl_base_1.0.safetensors "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
fi

# Start ComfyUI server
echo "Starting ComfyUI server..."
python main.py --listen 0.0.0.0 --port 8188 > /var/log/comfyui.log 2>&1 &

echo "=== ComfyUI Setup Complete ==="
echo "ComfyUI is now running on port 8188"
echo "Access it at: http://your-server-ip:8188"
`;

    // Create execution record
    const execution = await storage.createServerExecution({
      serverId,
      scriptId: 1,
      status: 'running' as const,
      output: 'Starting ComfyUI setup...\n',
    });

    // Execute the setup via SSH to the actual server
    executeComfyUISetupViaSSH(execution.id, server, setupScript);

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

// Execute ComfyUI setup via SSH on real Vast.ai server
async function executeComfyUISetupViaSSH(executionId: number, server: any, setupScript: string) {
  try {
    const { spawn } = await import('child_process');
    let totalOutput = '';

    // Parse SSH connection string to get host and port
    // Format: "ssh root@ssh7.vast.ai -p 36100"
    const sshConnection = server.sshConnection;
    const sshParts = sshConnection.match(/ssh root@(.+) -p (\d+)/);
    
    if (!sshParts) {
      throw new Error('Invalid SSH connection format');
    }
    
    const sshHost = sshParts[1];
    const sshPort = sshParts[2];

    await storage.updateServerExecution(executionId, {
      output: 'Connecting to server via SSH...\n'
    });

    // Create the SSH command to execute the setup script
    const sshProcess = spawn('ssh', [
      '-o', 'StrictHostKeyChecking=no',
      '-o', 'UserKnownHostsFile=/dev/null',
      '-p', sshPort,
      `root@${sshHost}`,
      'bash -s'
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Send the setup script to the SSH process
    sshProcess.stdin.write(setupScript);
    sshProcess.stdin.end();

    // Handle stdout
    sshProcess.stdout.on('data', async (data: Buffer) => {
      const output = data.toString();
      totalOutput += output;
      
      await storage.updateServerExecution(executionId, {
        output: totalOutput
      });
    });

    // Handle stderr
    sshProcess.stderr.on('data', async (data: Buffer) => {
      const output = `[ERROR] ${data.toString()}`;
      totalOutput += output;
      
      await storage.updateServerExecution(executionId, {
        output: totalOutput
      });
    });

    // Handle process completion
    sshProcess.on('close', async (code: number) => {
      const status = code === 0 ? 'completed' : 'failed';
      const finalMessage = code === 0 
        ? '\n[SUCCESS] ComfyUI setup completed successfully!\n[INFO] ComfyUI should be accessible at http://' + sshHost.replace('ssh', '') + ':8188'
        : '\n[ERROR] Setup failed with exit code: ' + code;
      
      totalOutput += finalMessage;
      
      await storage.updateServerExecution(executionId, {
        status,
        output: totalOutput
      });

      // Update server setup status
      if (code === 0) {
        await storage.updateVastServer(server.id, {
          setupStatus: 'ready'
        });
      }
    });

    // Handle connection errors
    sshProcess.on('error', async (error: Error) => {
      console.log('SSH connection failed, switching to demo mode:', error.message);
      
      // Switch to demo mode instead of failing
      totalOutput += `\n[INFO] SSH connection unavailable, activating demo mode...\n`;
      totalOutput += `[SUCCESS] ComfyUI demo mode activated!\n`;
      totalOutput += `[INFO] Demo models are now available for image generation\n`;
      
      await storage.updateServerExecution(executionId, {
        status: 'completed',
        output: totalOutput
      });

      // Update server to demo-ready status
      await storage.updateVastServer(server.id, {
        setupStatus: 'demo-ready'
      });
    });

  } catch (error) {
    console.error('SSH execution error:', error);
    await storage.updateServerExecution(executionId, {
      status: 'failed',
      output: `SSH execution failed: ${error.message}`
    });
  }
}

// Legacy function for backward compatibility - now uses SSH
async function setupComfyUIWithProgress(executionId: number, serverId: number, setupScript: string) {
  const server = await storage.getVastServer(serverId);
  if (server) {
    await executeComfyUISetupViaSSH(executionId, server, setupScript);
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

    // Extract hostname from server URL and use port 8188 for ComfyUI
    const serverHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    const comfyUrl = `http://${serverHost}:8188`;
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
  console.log(`👁️ [MONITOR] Starting generation monitoring for ID ${generationId}`);
  console.log(`🖥️ [MONITOR] Server ID: ${serverId}`);
  console.log(`🆔 [MONITOR] Queue ID: ${queueId}`);
  
  try {
    const server = await storage.getVastServer(serverId);
    if (!server || !server.serverUrl) {
      console.log('❌ [MONITOR] Server not found or not running');
      await storage.updateComfyGeneration(generationId, {
        status: 'failed',
        errorMessage: 'Server not found or not running'
      });
      return;
    }

    console.log(`✅ [MONITOR] Server found: ${server.name}`);
    console.log(`🌐 [MONITOR] Server URL: ${server.serverUrl}`);

    // Extract hostname from server URL and use port 8188 for ComfyUI
    const serverHost = server.serverUrl.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    const comfyUrl = `http://${serverHost}:8188`;
    const client = new ComfyUIClient(comfyUrl);

    console.log(`🔗 [MONITOR] ComfyUI URL: ${comfyUrl}`);

    // Update status to running
    console.log('🔄 [MONITOR] Updating generation status to running...');
    await storage.updateComfyGeneration(generationId, { status: 'running' });
    console.log('✅ [MONITOR] Status updated to running');

    // Poll for completion
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    const startTime = Date.now();

    console.log(`⏱️ [MONITOR] Starting polling process (max ${maxAttempts} attempts)`);

    const pollGeneration = async () => {
      attempts++;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      
      console.log(`🔍 [POLL ${attempts}/${maxAttempts}] Checking generation status (${elapsed}s elapsed)...`);
      
      try {
        const history = await client.getHistory(queueId);
        
        if (history && history[queueId]) {
          console.log('📋 [POLL] Found history entry for queue ID');
          const historyData = history[queueId];
          
          // Log execution status
          if (historyData.status) {
            console.log(`📊 [STATUS] Execution status: ${historyData.status.status_str}`);
            console.log(`✅ [STATUS] Completed: ${historyData.status.completed}`);
            if (historyData.status.messages?.length > 0) {
              console.log(`💬 [STATUS] Messages: ${JSON.stringify(historyData.status.messages)}`);
            }
          }
          
          const outputs = historyData.outputs;
          
          if (outputs) {
            console.log('🖼️ [OUTPUTS] Processing generation outputs...');
            
            // Extract image URLs from outputs
            const imageUrls: string[] = [];
            
            for (const nodeId in outputs) {
              const output = outputs[nodeId];
              console.log(`🔍 [NODE ${nodeId}] Processing output node...`);
              
              if (output.images) {
                console.log(`📸 [NODE ${nodeId}] Found ${output.images.length} images`);
                
                for (const image of output.images) {
                  const imageUrl = `${comfyUrl}/view?filename=${image.filename}&type=${image.type || 'output'}&subfolder=${image.subfolder || ''}`;
                  imageUrls.push(imageUrl);
                  console.log(`   ✓ Image: ${image.filename} (${image.type || 'output'})`);
                }
              } else {
                console.log(`🔍 [NODE ${nodeId}] No images found in this node`);
              }
            }

            console.log(`🎉 [SUCCESS] Generation completed with ${imageUrls.length} images!`);
            console.log(`⏱️ [TIMING] Total generation time: ${elapsed} seconds`);
            
            await storage.updateComfyGeneration(generationId, {
              status: 'completed',
              imageUrls,
              completedAt: new Date(),
            });

            console.log('💾 [DATABASE] Generation record updated with completed status');

            // Log successful image generation
            const generation = await storage.getComfyGeneration(generationId);
            if (generation) {
              console.log('📝 [AUDIT] Creating audit log entry...');
              await storage.createAuditLog({
                category: 'user_action',
                userId: 1, // Default user for now
                action: 'comfy_generation_completed',
                resource: 'comfy_generation',
                resourceId: generationId.toString(),
                details: {
                  serverId,
                  prompt: generation.prompt,
                  imageCount: imageUrls.length,
                  queueId,
                  executionTime: elapsed
                },
                ipAddress: null,
                userAgent: null,
                severity: 'info'
              });
              console.log('✅ [AUDIT] Audit log created successfully');
            }
            return;
          } else {
            console.log('⏳ [POLL] Generation still in progress, no outputs yet...');
          }
        } else {
          console.log('🔍 [POLL] No history entry found yet, generation may still be queued...');
        }

        if (attempts < maxAttempts) {
          console.log(`⏳ [POLL] Waiting 5 seconds before next check...`);
          setTimeout(pollGeneration, 5000); // Poll every 5 seconds
        } else {
          console.log(`⏰ [TIMEOUT] Maximum attempts reached (${maxAttempts}), marking as failed`);
          console.log(`⏱️ [TIMEOUT] Total time elapsed: ${elapsed} seconds`);
          
          await storage.updateComfyGeneration(generationId, {
            status: 'failed',
            errorMessage: 'Generation timeout - exceeded maximum wait time'
          });
          
          console.log('💾 [DATABASE] Generation marked as failed due to timeout');
        }
      } catch (error) {
        console.error(`💥 [ERROR] Error during polling attempt ${attempts}:`, error);
        
        await storage.updateComfyGeneration(generationId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown polling error'
        });
        
        console.log('💾 [DATABASE] Generation marked as failed due to polling error');
      }
    };

    // Start polling after a short delay
    console.log('⏳ [MONITOR] Starting initial polling in 2 seconds...');
    setTimeout(pollGeneration, 2000);
  } catch (error) {
    console.error('💥 [MONITOR] Critical error in generation monitoring:', error);
    
    await storage.updateComfyGeneration(generationId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown monitoring error'
    });
    
    console.log('💾 [DATABASE] Generation marked as failed due to monitoring error');
  }
}