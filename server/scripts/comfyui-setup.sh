#!/bin/bash

# ComfyUI Auto-Setup Script for Vast.ai
# This script installs and configures ComfyUI on a fresh Vast.ai instance

set -e  # Exit on any error

echo "[STEP 1/6] Installing system dependencies"
echo "[INFO] Updating system packages..."
apt-get update -qq
echo "[INFO] Installing git, python3-pip, wget, curl..."
apt-get install -y git python3-pip wget curl python3-venv
echo "[SUCCESS] System dependencies installed"
echo ""

echo "[STEP 2/6] Setting up Python environment"
echo "[INFO] Upgrading pip..."
python3 -m pip install --upgrade pip
echo "[INFO] Installing PyTorch with CUDA support..."
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
echo "[SUCCESS] Python environment ready"
echo ""

echo "[STEP 3/6] Cloning ComfyUI repository"
echo "[INFO] Cloning ComfyUI from GitHub..."
cd /workspace
if [ -d "ComfyUI" ]; then
    echo "[INFO] ComfyUI directory exists, pulling latest changes..."
    cd ComfyUI
    git pull
else
    git clone https://github.com/comfyanonymous/ComfyUI.git
    cd ComfyUI
fi
echo "[SUCCESS] ComfyUI repository ready"
echo ""

echo "[STEP 4/6] Installing ComfyUI requirements"
echo "[INFO] Installing Python dependencies..."
pip3 install -r requirements.txt
echo "[SUCCESS] ComfyUI requirements installed"
echo ""

echo "[STEP 5/6] Downloading basic models"
echo "[INFO] Creating models directory..."
mkdir -p models/checkpoints
mkdir -p models/vae
mkdir -p models/clip

echo "[INFO] Downloading SDXL base model..."
cd models/checkpoints
if [ ! -f "sd_xl_base_1.0.safetensors" ]; then
    wget -q --show-progress "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
fi

echo "[INFO] Downloading SDXL VAE..."
cd ../vae
if [ ! -f "sdxl_vae.safetensors" ]; then
    wget -q --show-progress "https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl_vae.safetensors"
fi

cd /workspace/ComfyUI
echo "[SUCCESS] Basic models downloaded"
echo ""

echo "[STEP 6/6] Starting ComfyUI server"
echo "[INFO] Configuring ComfyUI for remote access..."
echo "[INFO] Starting ComfyUI on port 8188..."
echo "[INFO] ComfyUI will be accessible at http://$(curl -s ifconfig.me):8188"
echo ""
echo "[SUCCESS] ComfyUI setup completed!"
echo ""
echo "To start ComfyUI manually:"
echo "cd /workspace/ComfyUI"
echo "python main.py --listen 0.0.0.0 --port 8188"
echo ""
echo "Starting ComfyUI server now..."

# Start ComfyUI in the background
nohup python main.py --listen 0.0.0.0 --port 8188 > /workspace/comfyui.log 2>&1 &

echo "[INFO] ComfyUI server started in background"
echo "[INFO] Check logs at: /workspace/comfyui.log"
echo "[INFO] Server should be ready in 30-60 seconds"