#!/bin/bash
# ComfyUI Reset Script
# This script resets ComfyUI installation and restarts the service

set -e
set -u

echo "Starting ComfyUI reset..."

# Stop ComfyUI service
echo "Stopping ComfyUI service..."
systemctl stop comfyui || true

# Remove existing ComfyUI installation
echo "Removing existing ComfyUI installation..."
rm -rf /root/ComfyUI

# Clean up any leftover processes
echo "Cleaning up processes..."
pkill -f "python.*main.py" || true

# Remove virtual environment cache
echo "Cleaning Python cache..."
rm -rf /root/.cache/pip

# Restart with fresh installation
echo "Starting fresh ComfyUI installation..."
cd /root
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Create new virtual environment
echo "Creating new virtual environment..."
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

# Restart ComfyUI service
echo "Restarting ComfyUI service..."
systemctl start comfyui

# Verify reset
echo "Verifying ComfyUI reset..."
sleep 10
if systemctl is-active --quiet comfyui; then
    echo "ComfyUI reset completed successfully!"
    echo "ComfyUI is running on port 8188"
else
    echo "ComfyUI reset completed but service failed to start"
    systemctl status comfyui
fi

echo "Reset script finished."