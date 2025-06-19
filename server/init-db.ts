import { db } from "./db";
import { platforms, accounts, content, schedules, apiKeys, setupScripts } from "@shared/schema";

export async function initializeDatabase() {
  try {
    // Check if platforms exist, if not create default ones
    const existingPlatforms = await db.select().from(platforms);
    
    if (existingPlatforms.length === 0) {
      await db.insert(platforms).values([
        {
          name: "youtube",
          displayName: "YouTube",
          icon: "🎥",
          color: "bg-red-500",
          isActive: true,
        },
        {
          name: "instagram",
          displayName: "Instagram",
          icon: "📷",
          color: "bg-pink-500",
          isActive: true,
        },
        {
          name: "twitter",
          displayName: "Twitter",
          icon: "🐦",
          color: "bg-blue-500",
          isActive: true,
        },
        {
          name: "linkedin",
          displayName: "LinkedIn",
          icon: "💼",
          color: "bg-blue-600",
          isActive: true,
        },
      ]);

      // Add sample accounts
      await db.insert(accounts).values([
        {
          platformId: 1,
          name: "Tech Channel",
          username: "@techchannel",
          isActive: true,
          metadata: { subscribers: 15000 },
        },
        {
          platformId: 1,
          name: "Gaming Content",
          username: "@gamingcontent",
          isActive: true,
          metadata: { subscribers: 8500 },
        },
        {
          platformId: 2,
          name: "Travel Stories",
          username: "@travelstories",
          isActive: true,
          metadata: { followers: 12000 },
        },
        {
          platformId: 3,
          name: "Business Updates",
          username: "@businessupdates",
          isActive: true,
          metadata: { followers: 5000 },
        },
      ]);

      // Add sample content
      await db.insert(content).values([
        {
          title: "Travel Video Story",
          description: "Amazing journey through the mountains",
          type: "video",
          status: "pending",
          sourceText: "Create a video about mountain adventure",
          generationPrompt: "Mountain adventure with scenic views",
          platformId: 1,
          accountId: 1,
          metadata: { duration: 120 },
        },
        {
          title: "Tech Review Image",
          description: "Latest smartphone review",
          type: "image",
          status: "approved",
          generationPrompt: "Modern smartphone with sleek design",
          platformId: 2,
          accountId: 3,
          metadata: { resolution: "1080x1080" },
        },
        {
          title: "Business Infographic",
          description: "Q4 performance metrics",
          type: "image",
          status: "draft",
          generationPrompt: "Professional business charts and graphs",
          platformId: 4,
          accountId: 4,
          metadata: { format: "infographic" },
        },
      ]);

      // Add sample API keys for development
      const existingApiKeys = await db.select().from(apiKeys);
      if (existingApiKeys.length === 0) {
        await db.insert(apiKeys).values([
          {
            service: "openai",
            keyName: "OPENAI_API_KEY",
            keyValue: "sk-demo-key-replace-with-real-key",
            isActive: false,
          },
          {
            service: "vast",
            keyName: "VAST_API_KEY", 
            keyValue: "vast-demo-key-replace-with-real-key",
            isActive: true,
          }
        ]);
      }

      // Add default setup scripts for ComfyUI and model downloads
      const existingScripts = await db.select().from(setupScripts);
      if (existingScripts.length === 0) {
        await db.insert(setupScripts).values([
          {
            name: "ComfyUI Base Installation",
            description: "Install ComfyUI with essential dependencies and basic setup",
            category: "comfyui",
            estimatedTime: 15,
            script: `#!/bin/bash
set -e

echo "Starting ComfyUI installation..."

# Update system
apt-get update
apt-get install -y python3 python3-pip git wget curl

# Clone ComfyUI
cd /root
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install Python dependencies
pip3 install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118
pip3 install -r requirements.txt

# Create models directory structure
mkdir -p models/checkpoints
mkdir -p models/vae
mkdir -p models/loras
mkdir -p models/controlnet
mkdir -p models/clip_vision
mkdir -p models/upscale_models

# Set up service to run ComfyUI
cat > /etc/systemd/system/comfyui.service << EOF
[Unit]
Description=ComfyUI Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/ComfyUI
ExecStart=/usr/bin/python3 main.py --listen 0.0.0.0 --port 8188
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable comfyui
systemctl start comfyui

echo "ComfyUI installation completed successfully!"
echo "ComfyUI is running on port 8188"`,
            requirements: { minRam: 8, minDisk: 20, gpu: true }
          },
          {
            name: "Download SDXL Base Model",
            description: "Download Stable Diffusion XL base model for ComfyUI",
            category: "comfyui",
            estimatedTime: 10,
            script: `#!/bin/bash
set -e

echo "Downloading SDXL Base Model..."

cd /root/ComfyUI/models/checkpoints

# Download SDXL Base model
wget -O "sd_xl_base_1.0.safetensors" "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"

echo "SDXL Base model downloaded successfully!"`,
            requirements: { minDisk: 10, bandwidth: "1Gbps" }
          },
          {
            name: "Download Popular LoRA Models",
            description: "Download popular LoRA models for enhanced image generation",
            category: "comfyui",
            estimatedTime: 8,
            script: `#!/bin/bash
set -e

echo "Downloading popular LoRA models..."

cd /root/ComfyUI/models/loras

# Download popular LoRA models
wget -O "lcm-lora-sdxl.safetensors" "https://huggingface.co/latent-consistency/lcm-lora-sdxl/resolve/main/pytorch_lora_weights.safetensors"

echo "LoRA models downloaded successfully!"`,
            requirements: { minDisk: 5 }
          },
          {
            name: "Download VAE Models",
            description: "Download VAE models for better image quality",
            category: "comfyui",
            estimatedTime: 5,
            script: `#!/bin/bash
set -e

echo "Downloading VAE models..."

cd /root/ComfyUI/models/vae

# Download SDXL VAE
wget -O "sdxl_vae.safetensors" "https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl_vae.safetensors"

echo "VAE models downloaded successfully!"`,
            requirements: { minDisk: 2 }
          },
          {
            name: "Complete ComfyUI Setup",
            description: "Full ComfyUI setup with base models and essential add-ons",
            category: "comfyui",
            estimatedTime: 25,
            script: `#!/bin/bash
set -e

echo "Starting complete ComfyUI setup..."

# Update system
apt-get update
apt-get install -y python3 python3-pip git wget curl unzip

# Clone ComfyUI
cd /root
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Install Python dependencies
pip3 install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118
pip3 install -r requirements.txt

# Create models directory structure
mkdir -p models/checkpoints models/vae models/loras models/controlnet models/clip_vision models/upscale_models

# Download SDXL Base model
cd models/checkpoints
wget -O "sd_xl_base_1.0.safetensors" "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"

# Download VAE
cd ../vae
wget -O "sdxl_vae.safetensors" "https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl_vae.safetensors"

# Download LoRA
cd ../loras
wget -O "lcm-lora-sdxl.safetensors" "https://huggingface.co/latent-consistency/lcm-lora-sdxl/resolve/main/pytorch_lora_weights.safetensors"

# Set up service
cd /root/ComfyUI
cat > /etc/systemd/system/comfyui.service << EOF
[Unit]
Description=ComfyUI Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/ComfyUI
ExecStart=/usr/bin/python3 main.py --listen 0.0.0.0 --port 8188
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable comfyui
systemctl start comfyui

echo "Complete ComfyUI setup finished successfully!"
echo "ComfyUI is running on port 8188"
echo "Access it at: http://YOUR_SERVER_IP:8188"`,
            requirements: { minRam: 16, minDisk: 30, gpu: true, bandwidth: "1Gbps" }
          }
        ]);
      }

      console.log("Database initialized with default data");
    }
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}