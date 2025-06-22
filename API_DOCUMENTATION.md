# API Documentation - ComfyUI & Vast.ai Integration

## Base URL
```
http://localhost:5000/api
```

## Authentication
All API endpoints require user authentication. Include the session token in requests.

## Vast.ai Server Management

### Create Server
```http
POST /vast-servers
Content-Type: application/json

{
  "name": "GPU Server 1",
  "gpu": "RTX 4090",
  "gpuCount": 1,
  "cpuCores": 8,
  "ram": 32,
  "disk": 100,
  "location": "US-East"
}
```

**Response:**
```json
{
  "id": 1,
  "vastId": "12345",
  "name": "GPU Server 1",
  "status": "creating",
  "pricePerHour": "0.50"
}
```

### List Servers
```http
GET /vast-servers
```

**Response:**
```json
[
  {
    "id": 1,
    "vastId": "12345",
    "name": "GPU Server 1",
    "gpu": "RTX 4090",
    "status": "running",
    "isLaunched": true,
    "pricePerHour": "0.50",
    "createdAt": "2024-01-01T12:00:00Z"
  }
]
```

### Start Server
```http
POST /vast-servers/start/{serverId}
```

**Response:**
```json
{
  "success": true,
  "message": "Server start initiated",
  "status": "starting"
}
```

### Stop Server
```http
POST /vast-servers/stop/{serverId}
```

**Response:**
```json
{
  "success": true,
  "message": "Server stop initiated",
  "status": "stopping"
}
```

### Delete Server
```http
DELETE /vast-servers/{serverId}
```

**Response:**
```json
{
  "success": true,
  "message": "Server deletion initiated"
}
```

## ComfyUI Setup & Management

### Initialize ComfyUI Setup
```http
POST /comfy/startup/{serverId}
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "ComfyUI auto-setup initiated",
  "executionId": 123,
  "estimatedTime": "2-3 minutes",
  "steps": [
    "Installing system dependencies",
    "Setting up Python environment",
    "Cloning ComfyUI repository",
    "Installing ComfyUI requirements",
    "Downloading basic models",
    "Starting ComfyUI server"
  ]
}
```

### Get Setup Progress
```http
GET /server-executions/{serverId}
```

**Response:**
```json
[
  {
    "id": 123,
    "serverId": 1,
    "scriptId": 1,
    "status": "running",
    "output": "Step 3/6: Cloning ComfyUI repository...",
    "startedAt": "2024-01-01T12:00:00Z",
    "estimatedCompletion": "2024-01-01T12:03:00Z"
  }
]
```

### Reset ComfyUI Setup
```http
POST /comfy/{serverId}/reset
```

**Response:**
```json
{
  "success": true,
  "message": "ComfyUI reset initiated",
  "executionId": 124
}
```

## Image Generation

### Generate Image
```http
POST /comfy/{serverId}/generate
Content-Type: application/json

{
  "prompt": "a beautiful landscape with mountains",
  "negativePrompt": "blurry, low quality",
  "workflowId": 1,
  "parameters": {
    "steps": 30,
    "cfg": 7.5,
    "seed": -1,
    "width": 1024,
    "height": 1024
  }
}
```

**Response:**
```json
{
  "success": true,
  "generationId": 456,
  "message": "Image generation started",
  "estimatedTime": "30-60 seconds",
  "queuePosition": 1
}
```

### Get Generation Status
```http
GET /comfy/progress/{generationId}
```

**Response:**
```json
{
  "generationId": 456,
  "status": "executing",
  "progress": 65,
  "currentNode": "KSampler",
  "totalNodes": 12,
  "completedNodes": 8,
  "previewImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "executionTime": 25.5,
  "estimatedTimeRemaining": 15.2
}
```

### Get All Active Generations
```http
GET /comfy/progress
```

**Response:**
```json
[
  {
    "generationId": 456,
    "serverId": 1,
    "status": "executing",
    "progress": 65,
    "prompt": "a beautiful landscape with mountains"
  }
]
```

### Get Generation History
```http
GET /comfy/generations/{serverId}
```

**Response:**
```json
[
  {
    "id": 456,
    "serverId": 1,
    "prompt": "a beautiful landscape with mountains",
    "status": "completed",
    "imageUrls": [
      "/api/comfy/images/456_1.png",
      "/api/comfy/images/456_2.png"
    ],
    "createdAt": "2024-01-01T12:00:00Z",
    "completedAt": "2024-01-01T12:01:30Z"
  }
]
```

## Model Management

### List Available Models
```http
GET /comfy/models/{serverId}
```

**Response:**
```json
{
  "checkpoints": [
    {
      "name": "sd_xl_base_1.0.safetensors",
      "size": "6.94 GB",
      "downloaded": true,
      "path": "/ComfyUI/models/checkpoints/"
    }
  ],
  "vae": [
    {
      "name": "sdxl_vae.safetensors",
      "size": "334 MB",
      "downloaded": true,
      "path": "/ComfyUI/models/vae/"
    }
  ],
  "loras": []
}
```

### Download Model
```http
POST /comfy/models/{serverId}/download
Content-Type: application/json

{
  "url": "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors",
  "folder": "checkpoints",
  "filename": "sd_xl_base_1.0.safetensors"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Model download started",
  "downloadId": 789,
  "estimatedTime": "5-10 minutes"
}
```

### Get Model Download Status
```http
GET /comfy/models/download/{downloadId}
```

**Response:**
```json
{
  "downloadId": 789,
  "status": "downloading",
  "progress": 45,
  "downloadedBytes": 3145728000,
  "totalBytes": 6979321856,
  "downloadSpeed": "10.5 MB/s",
  "estimatedTimeRemaining": "6m 32s"
}
```

## Workflow Management

### List Workflows
```http
GET /comfy/workflows/{serverId}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Text to Image - SDXL",
    "description": "Basic text-to-image generation using SDXL",
    "workflow": {
      "nodes": [...],
      "links": [...],
      "groups": []
    },
    "requiredModels": [
      "sd_xl_base_1.0.safetensors",
      "sdxl_vae.safetensors"
    ]
  }
]
```

### Create Workflow
```http
POST /comfy/workflows
Content-Type: application/json

{
  "name": "Custom Workflow",
  "description": "Custom image generation workflow",
  "workflow": {
    "nodes": [...],
    "links": [...],
    "groups": []
  },
  "tags": ["custom", "experimental"]
}
```

**Response:**
```json
{
  "id": 2,
  "name": "Custom Workflow",
  "message": "Workflow created successfully"
}
```

### Analyze Workflow
```http
POST /comfy/analyze-workflow/{serverId}
Content-Type: application/json

{
  "workflow": {
    "nodes": [...],
    "links": [...],
    "groups": []
  }
}
```

**Response:**
```json
{
  "analysisId": 101,
  "requiredModels": [
    {
      "name": "sd_xl_base_1.0.safetensors",
      "type": "checkpoint",
      "size": "6.94 GB",
      "available": true
    }
  ],
  "missingModels": [
    {
      "name": "control_v11p_sd15_canny.pth",
      "type": "controlnet",
      "size": "1.44 GB",
      "downloadUrl": "https://huggingface.co/..."
    }
  ],
  "complexity": "medium",
  "estimatedGenerationTime": "45-60 seconds",
  "warnings": []
}
```

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000');

// Subscribe to generation progress
ws.send(JSON.stringify({
  type: 'subscribe',
  generationId: 456
}));
```

### Progress Events
```json
{
  "type": "progress",
  "generationId": 456,
  "data": {
    "status": "executing",
    "progress": 65,
    "currentNode": "KSampler",
    "previewImage": "data:image/png;base64,..."
  }
}
```

### Completion Events
```json
{
  "type": "complete",
  "generationId": 456,
  "data": {
    "status": "completed",
    "imageUrls": [
      "/api/comfy/images/456_1.png"
    ],
    "executionTime": 45.2
  }
}
```

### Error Events
```json
{
  "type": "error",
  "generationId": 456,
  "data": {
    "error": "Out of memory",
    "node": "KSampler",
    "details": "CUDA out of memory. Tried to allocate 2.00 GiB"
  }
}
```

## Server Scheduler

### Get Server Schedule
```http
GET /server-scheduler/{serverId}
```

**Response:**
```json
{
  "server": {
    "id": 1,
    "name": "GPU Server 1",
    "status": "running"
  },
  "schedule": {
    "autoStart": true,
    "autoStop": true,
    "startTime": "09:00",
    "stopTime": "18:00",
    "timezone": "UTC",
    "weekdays": [1, 2, 3, 4, 5]
  },
  "nextAction": {
    "action": "stop",
    "scheduledTime": "2024-01-01T18:00:00Z"
  }
}
```

### Update Server Schedule
```http
POST /server-scheduler/{serverId}/start
POST /server-scheduler/{serverId}/stop
Content-Type: application/json

{
  "schedule": {
    "autoStart": true,
    "startTime": "08:00",
    "timezone": "America/New_York"
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### Common Error Codes
- `VAST_API_ERROR` - Vast.ai API communication failed
- `SERVER_NOT_FOUND` - Requested server doesn't exist
- `SERVER_NOT_RUNNING` - Server is not in running state
- `COMFY_CONNECTION_FAILED` - Cannot connect to ComfyUI instance
- `GENERATION_FAILED` - Image generation process failed
- `MODEL_NOT_FOUND` - Required model is not available
- `WORKFLOW_INVALID` - Workflow JSON is malformed
- `INSUFFICIENT_RESOURCES` - Server lacks required resources

## Rate Limits

### Generation Limits
- 10 generations per minute per user
- 100 generations per hour per user
- 1000 generations per day per user

### API Limits
- 1000 requests per minute per user
- 10000 requests per hour per user

### Model Download Limits
- 5 concurrent downloads per server
- 100GB total downloads per day per user

## Examples

### Complete Generation Workflow
```javascript
// 1. Create server
const server = await fetch('/api/vast-servers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My GPU Server',
    gpu: 'RTX 4090',
    gpuCount: 1
  })
});

// 2. Setup ComfyUI
const setup = await fetch(`/api/comfy/startup/${server.id}`, {
  method: 'POST'
});

// 3. Wait for setup completion
const checkSetup = async () => {
  const status = await fetch(`/api/server-executions/${server.id}`);
  const executions = await status.json();
  return executions[0].status === 'completed';
};

// 4. Generate image
const generation = await fetch(`/api/comfy/${server.id}/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'a beautiful sunset over the ocean',
    workflowId: 1
  })
});

// 5. Monitor progress via WebSocket
const ws = new WebSocket('ws://localhost:5000');
ws.send(JSON.stringify({
  type: 'subscribe',
  generationId: generation.generationId
}));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'complete') {
    console.log('Images ready:', data.data.imageUrls);
  }
};
```

### Batch Model Download
```javascript
const models = [
  {
    url: 'https://huggingface.co/model1.safetensors',
    folder: 'checkpoints',
    filename: 'model1.safetensors'
  },
  {
    url: 'https://huggingface.co/model2.safetensors',
    folder: 'loras',
    filename: 'model2.safetensors'
  }
];

const downloads = await Promise.all(
  models.map(model => 
    fetch(`/api/comfy/models/${serverId}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(model)
    })
  )
);

// Monitor all downloads
downloads.forEach(async (download, index) => {
  const downloadId = (await download.json()).downloadId;
  
  const checkProgress = setInterval(async () => {
    const progress = await fetch(`/api/comfy/models/download/${downloadId}`);
    const data = await progress.json();
    
    console.log(`Model ${index + 1}: ${data.progress}%`);
    
    if (data.status === 'completed') {
      clearInterval(checkProgress);
      console.log(`Model ${index + 1} download complete`);
    }
  }, 1000);
});
```

This API documentation provides comprehensive coverage of all ComfyUI, Vast.ai, and image generation endpoints with practical examples and detailed response formats.