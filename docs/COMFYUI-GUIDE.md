# ComfyUI Integration Guide

Complete guide for using ComfyUI features within SocialSync for AI image generation and model management.

## Overview

SocialSync provides comprehensive ComfyUI integration with automated setup, model management, workflow creation, and image generation capabilities. The system automatically detects and configures ComfyUI on your Vast.ai servers.

## Getting Started

### 1. Server Setup

First, launch a GPU server from the Vast Servers page:

1. Navigate to **Vast Servers** → **Available Servers**
2. Filter by desired GPU (RTX 4090, A100, etc.)
3. Click **Launch** on your preferred server
4. Wait for server to reach "Running" status

### 2. Automatic ComfyUI Installation

The system automatically triggers ComfyUI setup when servers become ready:

- **Detection**: System monitors new servers every 30 seconds
- **Installation**: Automated script installs ComfyUI and dependencies
- **Models**: Downloads essential Stable Diffusion models
- **Status**: Real-time progress updates in Server Details page

### 3. Manual Setup (Alternative)

If automatic setup fails, use manual installation:

```bash
# SSH into your server
ssh root@your-server.vast.ai -p PORT

# Clone ComfyUI
cd /workspace
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install dependencies
pip install -r requirements.txt

# Download base model
cd models/checkpoints
wget https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt

# Start ComfyUI server
cd /workspace/ComfyUI
python main.py --listen 0.0.0.0 --port 8188
```

## Model Management

### Available Model Categories

#### Checkpoints (Base Models)
- **v1-5-pruned-emaonly.ckpt**: Stable Diffusion 1.5 base model
- **sd_xl_base_1.0.safetensors**: Stable Diffusion XL base model
- **dreamshaper_8.safetensors**: Enhanced artistic model
- **realisticVisionV60_B1_VAE.safetensors**: Photorealistic model

#### LoRA Models (Style Adapters)
- **add_detail.safetensors**: Enhanced detail generation
- **epi_noiseoffset2.safetensors**: Improved contrast and lighting
- **LowRA.safetensors**: Low-resolution enhancement
- **more_art-full.safetensors**: Artistic style enhancement

#### VAE (Visual Autoencoders)
- **vae-ft-mse-840000-ema-pruned.ckpt**: Standard VAE
- **kl-f8-anime2.ckpt**: Anime-optimized VAE
- **orangemix.vae.pt**: Enhanced color VAE

### Downloading Models

#### From Model Library
1. Go to **ComfyUI** → **Model Management**
2. Click **Manage Library** → **Download Models**
3. Enter model details:
   - **Name**: Descriptive model name
   - **URL**: Direct download link (HuggingFace, CivitAI, etc.)
   - **Folder**: Select appropriate category
   - **Description**: Optional model description
4. Click **Download Model**

#### Example URLs
```
# HuggingFace Models
https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors

# CivitAI Models  
https://civitai.com/api/download/models/128713

# Custom Models
https://example.com/path/to/model.safetensors
```

### Managing Installed Models

#### View Installed Models
1. Navigate to **Model Management** → **Manage Library**
2. Switch to **Installed Models** tab
3. View model details, file sizes, and status

#### Delete Models
1. Find model in **Installed Models** list
2. Click **Delete** button
3. Confirm deletion to free storage space

### Cleanup Tools

#### Failed Downloads
- **Clear Failed Downloads**: Remove incomplete model downloads
- **Retry Failed**: Attempt to redownload failed models
- **View Error Logs**: Check detailed error messages

#### Storage Management
- **Storage Usage**: Monitor total model storage usage
- **Large Files**: Identify and manage large model files
- **Duplicate Detection**: Find and remove duplicate models

## Image Generation

### Text to Image Generation

#### Basic Generation
1. Navigate to **ComfyUI** → **Text to Image**
2. Select your server from dropdown
3. Enter generation parameters:
   - **Prompt**: Describe desired image
   - **Negative Prompt**: Specify unwanted elements
   - **Model**: Choose checkpoint model
   - **Steps**: Generation steps (20-50 recommended)
   - **CFG Scale**: Prompt adherence (7-12 recommended)
   - **Width/Height**: Image dimensions

#### Example Prompts
```
Positive Prompt:
"beautiful landscape, mountain lake at sunset, dramatic clouds, highly detailed, photorealistic, 8k resolution"

Negative Prompt:
"blurry, low quality, distorted, watermark, text, signature, cropped"
```

#### Advanced Parameters
- **Sampler**: Algorithm for generation (euler, dpmpp_2m, etc.)
- **Scheduler**: Noise scheduling method
- **Seed**: Random seed for reproducibility
- **Batch Size**: Number of images to generate
- **LoRA Models**: Additional style modifications

### Workflow System

#### Using Predefined Workflows
1. Access **Workflow** tab in ComfyUI interface
2. Browse available workflow templates
3. Select appropriate workflow for your needs
4. Customize parameters as needed

#### Creating Custom Workflows
1. Click **Create New Workflow**
2. Design workflow in ComfyUI interface
3. Save workflow with descriptive name
4. Set as template for reuse

#### Workflow Categories
- **Basic**: Simple text-to-image generation
- **Advanced**: Multi-step generation with refinement
- **Artistic**: Style-specific workflows
- **Photorealistic**: Photography-focused workflows
- **Upscaling**: Image enhancement and upscaling

### Generation Gallery

#### Viewing Results
- **Gallery Tab**: View all generated images
- **Filter Options**: Sort by date, model, or status
- **Download**: Save images locally
- **Metadata**: View generation parameters

#### Image Management
- **Favorites**: Mark best generations
- **Collections**: Organize images by theme
- **Sharing**: Export image with metadata
- **Regeneration**: Use same parameters again

## Server Connection Management

### Connection Status Types

#### Ready (Live Connection)
- Direct SSH connection to ComfyUI server
- Real-time image generation
- Full model management capabilities
- Live progress monitoring

#### Ready (Demo)
- SSH connection unavailable
- Demo mode with sample generations
- Full interface functionality
- Simulated generation process

#### Setting Up
- ComfyUI installation in progress
- Real-time progress monitoring
- Estimated completion times
- Step-by-step installation logs

#### Failed
- Setup encountered errors
- Detailed error messages
- Troubleshooting suggestions
- Retry options available

### Troubleshooting Connections

#### Connection Issues
1. **Check Server Status**: Verify server is running
2. **SSH Access**: Confirm SSH port is accessible
3. **ComfyUI Port**: Ensure port 8188 is open
4. **Firewall**: Check firewall settings

#### Common Solutions
```bash
# Test SSH connection
ssh root@server.vast.ai -p PORT

# Check ComfyUI process
ps aux | grep comfyui

# Restart ComfyUI
cd /workspace/ComfyUI
python main.py --listen 0.0.0.0 --port 8188

# Check port availability
netstat -tlnp | grep 8188
```

### Demo Mode Benefits

When SSH connections aren't available, demo mode provides:
- **Full Interface**: Complete ComfyUI interface
- **Model Simulation**: Realistic model management
- **Generation Testing**: Sample image generation
- **Workflow Testing**: Test workflow creation
- **Learning Tool**: Practice without server costs

## Workflow Analysis

### Automatic Analysis
The system analyzes workflows for:
- **Model Requirements**: Required checkpoint and LoRA models
- **Custom Nodes**: Additional ComfyUI extensions needed
- **Compatibility**: ComfyUI version requirements
- **VRAM Usage**: Estimated memory requirements

### Requirements Detection
```json
{
  "models": [
    "v1-5-pruned-emaonly.ckpt",
    "add_detail.safetensors"
  ],
  "customNodes": [
    "ComfyUI-Manager",
    "ComfyUI-Custom-Scripts"
  ],
  "estimatedVRAM": "8GB",
  "comfyUIVersion": ">=0.1.0"
}
```

### Automatic Downloads
System can automatically download required:
- **Missing Models**: Download models from detected URLs
- **Custom Nodes**: Install required extensions
- **Dependencies**: Install Python packages

## Best Practices

### Model Organization
- **Naming**: Use descriptive model names
- **Categories**: Organize models by type and use case
- **Storage**: Regularly clean up unused models
- **Backup**: Keep copies of favorite models

### Generation Optimization
- **Parameters**: Start with recommended settings
- **Iteration**: Refine prompts based on results
- **Batch Generation**: Generate multiple variations
- **Seed Management**: Save seeds for good results

### Server Management
- **Monitoring**: Check server status regularly
- **Costs**: Monitor usage to control expenses
- **Shutdown**: Stop servers when not in use
- **Backup**: Save important workflows and models

### Workflow Development
- **Testing**: Test workflows with different inputs
- **Documentation**: Document workflow purposes
- **Sharing**: Share successful workflows with team
- **Versioning**: Keep track of workflow changes

## Advanced Features

### Custom Node Integration
- **Installation**: Automatic custom node detection
- **Management**: Enable/disable custom nodes
- **Updates**: Keep custom nodes updated
- **Compatibility**: Check node compatibility

### Batch Processing
- **Queue Management**: Handle multiple generations
- **Priority Settings**: Set generation priorities
- **Progress Tracking**: Monitor batch progress
- **Results Organization**: Organize batch results

### Performance Monitoring
- **Generation Times**: Track average generation times
- **Resource Usage**: Monitor VRAM and CPU usage
- **Error Tracking**: Log and analyze errors
- **Optimization**: Identify performance bottlenecks

### Integration APIs
- **REST Endpoints**: API access to generation
- **WebSocket**: Real-time updates
- **Webhooks**: Notification integration
- **Automation**: Scheduled generation tasks

This comprehensive guide covers all aspects of ComfyUI integration within SocialSync, from basic setup to advanced workflow management.