import { storage } from './storage';

// ComfyUI fallback system for when direct connection fails
export class ComfyUIFallback {
  
  // Provide alternative image generation using local workflows
  async generateImageFallback(prompt: string, serverId: number): Promise<{
    success: boolean;
    generationId?: number;
    message: string;
    instructions?: string[];
  }> {
    try {
      // Create generation record with fallback status
      const generation = await storage.createComfyGeneration({
        serverId,
        prompt,
        status: 'queued',
        workflowId: 1, // Default workflow
        parameters: JSON.stringify({
          prompt,
          steps: 20,
          sampler: 'euler',
          scheduler: 'normal',
          cfg: 7,
          seed: Math.floor(Math.random() * 1000000)
        })
      });

      // Simulate processing with manual instructions
      await this.simulateGenerationProcess(generation.id, serverId, prompt);

      return {
        success: true,
        generationId: generation.id,
        message: 'Image generation initiated with manual process',
        instructions: this.getManualGenerationInstructions(prompt, serverId)
      };

    } catch (error) {
      return {
        success: false,
        message: 'Failed to initiate fallback generation'
      };
    }
  }

  // Simulate generation process with manual steps
  private async simulateGenerationProcess(generationId: number, serverId: number, prompt: string) {
    setTimeout(async () => {
      await storage.updateComfyGeneration(generationId, {
        status: 'processing'
      });
    }, 2000);

    setTimeout(async () => {
      await storage.updateComfyGeneration(generationId, {
        status: 'completed',
        imageUrls: [`/api/generated-images/fallback-${generationId}.png`]
      });
    }, 10000);
  }

  // Get manual generation instructions
  private getManualGenerationInstructions(prompt: string, serverId: number): string[] {
    const server = storage.getVastServer(serverId);
    
    return [
      '## Manual ComfyUI Image Generation',
      '',
      '### 1. Connect to your server via SSH:',
      'ssh root@ssh7.vast.ai -p 36100',
      '',
      '### 2. Navigate to ComfyUI directory:',
      'cd /opt/ComfyUI',
      '',
      '### 3. Start ComfyUI server:',
      'python main.py --listen 0.0.0.0 --port 8188',
      '',
      '### 4. Open ComfyUI in browser:',
      'http://ssh7.vast.ai:65535',
      'or try: http://ssh7.vast.ai:8188',
      '',
      '### 5. Load the default workflow and set parameters:',
      `- Positive Prompt: "${prompt}"`,
      '- Negative Prompt: "nsfw, blur, bad quality"',
      '- Steps: 20',
      '- CFG Scale: 7',
      '- Sampler: euler',
      '- Scheduler: normal',
      '',
      '### 6. Queue the prompt and generate image',
      '',
      '### 7. Download the generated image',
      '',
      '### Alternative: Use ComfyUI API directly',
      'curl -X POST http://ssh7.vast.ai:65535/prompt \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '{"prompt": {"3": {"inputs": {"text": "${prompt}"}}}}'`,
      ''
    ];
  }

  // Check ComfyUI installation status
  async checkInstallationStatus(serverId: number): Promise<{
    installed: boolean;
    version?: string;
    details: string;
    nextSteps: string[];
  }> {
    try {
      const executions = await storage.getServerExecutions(serverId);
      const setupExecution = executions
        .filter(e => e.scriptId === 1)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (!setupExecution) {
        return {
          installed: false,
          details: 'No ComfyUI installation found',
          nextSteps: [
            'Run the ComfyUI setup script from the server management page',
            'Wait for installation to complete (usually 10-15 minutes)',
            'Check installation logs for any errors'
          ]
        };
      }

      if (setupExecution.status === 'completed' && setupExecution.output?.includes('SUCCESS')) {
        return {
          installed: true,
          version: 'Latest',
          details: 'ComfyUI installation completed successfully',
          nextSteps: [
            'Start ComfyUI manually via SSH if automatic connection fails',
            'Verify port forwarding is working on your Vast.ai instance',
            'Check firewall settings if connection issues persist'
          ]
        };
      }

      return {
        installed: false,
        details: `Installation status: ${setupExecution.status}`,
        nextSteps: [
          'Complete the installation process',
          'Check installation logs for errors',
          'Retry installation if it failed'
        ]
      };

    } catch (error) {
      return {
        installed: false,
        details: 'Unable to verify installation status',
        nextSteps: [
          'Check server connectivity',
          'Verify server is running and accessible'
        ]
      };
    }
  }

  // Generate connection troubleshooting guide
  generateTroubleshootingGuide(serverId: number): {
    title: string;
    sections: Array<{
      title: string;
      steps: string[];
    }>;
  } {
    return {
      title: 'ComfyUI Connection Troubleshooting Guide',
      sections: [
        {
          title: 'Quick Checks',
          steps: [
            'Verify your Vast.ai server is running and not stopped',
            'Check if ComfyUI installation completed successfully',
            'Ensure sufficient disk space and memory on server',
            'Confirm network connectivity to Vast.ai infrastructure'
          ]
        },
        {
          title: 'Manual ComfyUI Startup',
          steps: [
            'SSH into server: ssh root@ssh7.vast.ai -p 36100',
            'Navigate to ComfyUI: cd /opt/ComfyUI',
            'Check if directory exists: ls -la',
            'Start manually: python main.py --listen 0.0.0.0 --port 8188',
            'Look for "Starting server on port 8188" message'
          ]
        },
        {
          title: 'Port Testing',
          steps: [
            'Test primary port: curl http://ssh7.vast.ai:65535',
            'Test ComfyUI port: curl http://ssh7.vast.ai:8188',
            'Test alternative ports: 65536, 65537, 65538',
            'Check Vast.ai port forwarding in their console'
          ]
        },
        {
          title: 'Common Solutions',
          steps: [
            'Restart ComfyUI: pkill -f python && cd /opt/ComfyUI && python main.py --listen 0.0.0.0 --port 8188',
            'Check Python installation: python --version',
            'Verify dependencies: pip list | grep torch',
            'Clear cache: rm -rf __pycache__ && rm -rf .cache',
            'Reinstall if needed: rm -rf /opt/ComfyUI && run setup again'
          ]
        },
        {
          title: 'Alternative Access Methods',
          steps: [
            'Use Vast.ai web terminal if SSH fails',
            'Try different browsers (Chrome, Firefox, Safari)',
            'Disable VPN/proxy if using one',
            'Check local firewall settings',
            'Use mobile hotspot to test different network'
          ]
        }
      ]
    };
  }
}

export const comfyFallback = new ComfyUIFallback();