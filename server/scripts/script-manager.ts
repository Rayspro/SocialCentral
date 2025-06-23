import fs from 'fs';
import path from 'path';
import { COMFYUI_CONFIG, VAST_CONFIG } from '../constants/index.js';

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  filename: string;
  type: 'setup' | 'reset' | 'model' | 'utility';
  parameters: string[];
}

export class ScriptManager {
  private static instance: ScriptManager;
  private templatesPath: string;
  private scripts: Map<string, ScriptTemplate> = new Map();

  private constructor() {
    this.templatesPath = path.join(process.cwd(), 'server', 'scripts', 'templates');
    this.loadScriptTemplates();
  }

  static getInstance(): ScriptManager {
    if (!ScriptManager.instance) {
      ScriptManager.instance = new ScriptManager();
    }
    return ScriptManager.instance;
  }

  private loadScriptTemplates() {
    // Register ComfyUI Setup Script
    this.scripts.set('comfyui-setup', {
      id: 'comfyui-setup',
      name: 'ComfyUI Setup',
      description: 'Complete ComfyUI installation and configuration',
      filename: 'comfyui-setup.sh',
      type: 'setup',
      parameters: []
    });

    // Register ComfyUI Reset Script
    this.scripts.set('comfyui-reset', {
      id: 'comfyui-reset',
      name: 'ComfyUI Reset',
      description: 'Reset ComfyUI installation and restart service',
      filename: 'comfyui-reset.sh',
      type: 'reset',
      parameters: []
    });

    // Register Model Download Script
    this.scripts.set('model-download', {
      id: 'model-download',
      name: 'Model Download',
      description: 'Download specific models for ComfyUI',
      filename: 'model-download.sh',
      type: 'model',
      parameters: ['MODEL_URL', 'MODEL_FOLDER', 'MODEL_FILENAME']
    });
  }

  getScript(scriptId: string): ScriptTemplate | undefined {
    return this.scripts.get(scriptId);
  }

  getAllScripts(): ScriptTemplate[] {
    return Array.from(this.scripts.values());
  }

  getScriptsByType(type: string): ScriptTemplate[] {
    return Array.from(this.scripts.values()).filter(script => script.type === type);
  }

  getScriptContent(scriptId: string): string {
    const script = this.scripts.get(scriptId);
    if (!script) {
      throw new Error(`Script not found: ${scriptId}`);
    }

    const scriptPath = path.join(this.templatesPath, script.filename);
    
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Script file not found: ${scriptPath}`);
    }

    return fs.readFileSync(scriptPath, 'utf-8');
  }

  generateScriptCommand(scriptId: string, parameters: Record<string, string> = {}): string {
    const script = this.scripts.get(scriptId);
    if (!script) {
      throw new Error(`Script not found: ${scriptId}`);
    }

    let command = `/bin/bash /tmp/${script.filename}`;
    
    // Add parameters in order
    for (const param of script.parameters) {
      const value = parameters[param] || '';
      command += ` "${value}"`;
    }

    return command;
  }

  // Generate ComfyUI setup script with dynamic configuration
  generateComfyUISetupScript(customConfig?: Partial<typeof COMFYUI_CONFIG>): string {
    const config = { ...COMFYUI_CONFIG, ...customConfig };
    let script = this.getScriptContent('comfyui-setup');

    // Replace configuration placeholders
    script = script.replace(/8188/g, config.DEFAULT_PORT.toString());
    script = script.replace(/--listen 0\.0\.0\.0/g, `--listen 0.0.0.0 --port ${config.DEFAULT_PORT}`);

    return script;
  }

  // Generate model download script with specific parameters
  generateModelDownloadScript(modelUrl: string, folder: string = 'checkpoints', filename?: string): string {
    const actualFilename = filename || this.extractFilenameFromUrl(modelUrl);
    const parameters = {
      MODEL_URL: modelUrl,
      MODEL_FOLDER: folder,
      MODEL_FILENAME: actualFilename
    };

    let script = this.getScriptContent('model-download');
    
    // Replace parameter placeholders
    Object.entries(parameters).forEach(([key, value]) => {
      script = script.replace(new RegExp(`\\$\\{${key}:-[^}]*\\}`, 'g'), value);
    });

    return script;
  }

  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'model.ckpt';
      return filename;
    } catch {
      return 'model.ckpt';
    }
  }

  // Predefined model configurations
  getPopularModels(): Array<{ name: string; url: string; folder: string; filename: string }> {
    return [
      {
        name: 'Stable Diffusion v1.5',
        url: 'https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt',
        folder: 'checkpoints',
        filename: 'v1-5-pruned-emaonly.ckpt'
      },
      {
        name: 'Stable Diffusion v2.1',
        url: 'https://huggingface.co/stabilityai/stable-diffusion-2-1/resolve/main/v2-1_768-ema-pruned.ckpt',
        folder: 'checkpoints',
        filename: 'v2-1_768-ema-pruned.ckpt'
      },
      {
        name: 'SDXL Base',
        url: 'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors',
        folder: 'checkpoints',
        filename: 'sd_xl_base_1.0.safetensors'
      },
      {
        name: 'VAE (MSE)',
        url: 'https://huggingface.co/stabilityai/sd-vae-ft-mse-original/resolve/main/vae-ft-mse-840000-ema-pruned.ckpt',
        folder: 'vae',
        filename: 'vae-ft-mse-840000-ema-pruned.ckpt'
      }
    ];
  }

  // Generate batch model download script
  generateBatchModelDownloadScript(models: Array<{ url: string; folder: string; filename: string }>): string {
    let batchScript = '#!/bin/bash\n';
    batchScript += '# Batch Model Download Script\n';
    batchScript += 'set -e\n\n';

    models.forEach((model, index) => {
      batchScript += `echo "Downloading model ${index + 1}/${models.length}: ${model.filename}"\n`;
      batchScript += `cd /root/ComfyUI/models/${model.folder}\n`;
      batchScript += `wget --progress=bar:force -O "${model.filename}" "${model.url}"\n`;
      batchScript += `echo "Downloaded: ${model.filename}"\n\n`;
    });

    batchScript += 'echo "All models downloaded successfully!"\n';
    return batchScript;
  }
}

export const scriptManager = ScriptManager.getInstance();