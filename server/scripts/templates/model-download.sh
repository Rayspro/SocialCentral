#!/bin/bash
# Model Download Script
# Downloads specific models for ComfyUI

set -e
set -u

MODEL_URL="${1:-}"
MODEL_FOLDER="${2:-checkpoints}"
MODEL_FILENAME="${3:-model.ckpt}"

if [ -z "$MODEL_URL" ]; then
    echo "Error: Model URL is required"
    echo "Usage: $0 <model_url> [folder] [filename]"
    exit 1
fi

echo "Downloading model: $MODEL_FILENAME"
echo "URL: $MODEL_URL"
echo "Folder: $MODEL_FOLDER"

# Navigate to ComfyUI models directory
cd /root/ComfyUI/models/$MODEL_FOLDER

# Download model with progress
wget --progress=bar:force -O "$MODEL_FILENAME" "$MODEL_URL"

# Verify download
if [ -f "$MODEL_FILENAME" ]; then
    FILE_SIZE=$(stat -c%s "$MODEL_FILENAME")
    echo "Download completed successfully!"
    echo "File size: $(($FILE_SIZE / 1024 / 1024)) MB"
else
    echo "Download failed!"
    exit 1
fi

echo "Model download script finished."