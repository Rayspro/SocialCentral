#!/bin/bash
# ComfyUI Setup Script
# This script installs and configures ComfyUI on a fresh Ubuntu instance

set -e
set -u

echo "Starting ComfyUI setup..."

# Update system packages
echo "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install Python and pip
echo "Installing Python dependencies..."
apt-get install -y python3 python3-pip python3-venv git wget curl

# Install CUDA and GPU drivers if available
echo "Checking for GPU availability..."
if command -v nvidia-smi &> /dev/null; then
    echo "GPU detected, installing CUDA toolkit..."
    apt-get install -y nvidia-cuda-toolkit
else
    echo "No GPU detected, proceeding with CPU-only setup..."
fi

# Create ComfyUI directory
echo "Setting up ComfyUI directory..."
cd /root
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install PyTorch
echo "Installing PyTorch..."
if command -v nvidia-smi &> /dev/null; then
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
else
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
fi

# Install ComfyUI requirements
echo "Installing ComfyUI requirements..."
pip install -r requirements.txt

# Create models directories
echo "Creating model directories..."
mkdir -p models/checkpoints
mkdir -p models/vae
mkdir -p models/loras
mkdir -p models/embeddings
mkdir -p models/upscale_models
mkdir -p models/controlnet

# Download essential models
echo "Downloading essential models..."
cd models/checkpoints
wget -O v1-5-pruned-emaonly.ckpt "https://huggingface.co/runwayml/stable-diffusion-v1-5/resolve/main/v1-5-pruned-emaonly.ckpt"

# Create startup script
echo "Creating startup script..."
cat > /root/start_comfyui.sh << 'EOF'
#!/bin/bash
cd /root/ComfyUI
source venv/bin/activate
python main.py --listen 0.0.0.0 --port 8188
EOF

chmod +x /root/start_comfyui.sh

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/comfyui.service << 'EOF'
[Unit]
Description=ComfyUI Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/ComfyUI
ExecStart=/root/start_comfyui.sh
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
echo "Enabling ComfyUI service..."
systemctl daemon-reload
systemctl enable comfyui
systemctl start comfyui

# Verify installation
echo "Verifying ComfyUI installation..."
sleep 10
if systemctl is-active --quiet comfyui; then
    echo "ComfyUI setup completed successfully!"
    echo "ComfyUI is running on port 8188"
else
    echo "ComfyUI setup completed but service failed to start"
    systemctl status comfyui
fi

echo "Setup script finished."