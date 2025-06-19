# API Documentation

Complete guide to the SocialSync REST API endpoints and usage.

## Authentication

All API endpoints require authentication via session cookies. Use the login endpoint to establish a session.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Logout
```http
POST /api/auth/logout
```

### Get Current User
```http
GET /api/auth/user
```

## Vast.ai Server Management

### List Available Servers
```http
GET /api/vast-offers?limit=50&offset=0&min_gpu=1&max_price=1.0&gpu_name=RTX
```

Response:
```json
{
  "offers": [
    {
      "id": "12345",
      "gpu_name": "RTX 4090",
      "num_gpus": 1,
      "cpu_cores": 16,
      "ram_gb": 64,
      "disk_gb": 500,
      "dph_total": 0.85,
      "geolocation": "US-East"
    }
  ],
  "total": 150
}
```

### List Launched Servers
```http
GET /api/vast-servers
```

Response:
```json
[
  {
    "id": 1,
    "vastId": "21401999",
    "name": "Server 21401999",
    "gpu": "RTX 4090",
    "gpuCount": 1,
    "cpuCores": 16,
    "ram": 64,
    "disk": 500,
    "pricePerHour": "0.85",
    "location": "US-East",
    "status": "running",
    "setupStatus": "ready",
    "serverUrl": "http://ssh8.vast.ai:65535",
    "sshConnection": "ssh root@ssh8.vast.ai -p 11998",
    "createdAt": "2025-06-19T17:29:30.271Z",
    "updatedAt": "2025-06-19T17:29:33.692Z"
  }
]
```

### Launch Server
```http
POST /api/vast-servers
Content-Type: application/json

{
  "vastId": "12345",
  "image": "pytorch/pytorch:latest",
  "disk": 50,
  "label": "My ComfyUI Server"
}
```

### Update Server
```http
PATCH /api/vast-servers/:id
Content-Type: application/json

{
  "setupStatus": "ready",
  "metadata": {
    "comfyUIStatus": "installed"
  }
}
```

### Destroy Server
```http
DELETE /api/vast-servers/:id
```

## ComfyUI Integration

### Get Available Models
```http
GET /api/comfy/:serverId/available-models
```

Response:
```json
{
  "models": {
    "checkpoints": [
      "v1-5-pruned-emaonly.ckpt",
      "sd_xl_base_1.0.safetensors"
    ],
    "loras": [
      "add_detail.safetensors",
      "epi_noiseoffset2.safetensors"
    ],
    "vae": [
      "vae-ft-mse-840000-ema-pruned.ckpt"
    ]
  }
}
```

### Get Installed Models
```http
GET /api/comfy/:serverId/models
```

### Download Model
```http
POST /api/comfy/models
Content-Type: application/json

{
  "name": "Stable Diffusion XL",
  "url": "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors",
  "folder": "checkpoints",
  "description": "SDXL base model",
  "serverId": 1
}
```

### Delete Model
```http
DELETE /api/comfy/models/:id
```

### Generate Image
```http
POST /api/comfy/:serverId/generate
Content-Type: application/json

{
  "prompt": "beautiful landscape with mountains and lakes",
  "negativePrompt": "blurry, low quality, distorted",
  "workflowId": null,
  "parameters": {
    "width": 1024,
    "height": 1024,
    "steps": 20,
    "cfg_scale": 7.5,
    "sampler": "euler"
  }
}
```

Response:
```json
{
  "success": true,
  "generationId": 1,
  "message": "Image generation started",
  "estimatedTime": "30-60 seconds",
  "queueId": "prompt_12345"
}
```

### Get Generation Status
```http
GET /api/comfy/:serverId/generations/:id
```

### List Generations
```http
GET /api/comfy/:serverId/generations
```

Response:
```json
[
  {
    "id": 1,
    "serverId": 1,
    "status": "completed",
    "prompt": "beautiful landscape",
    "negativePrompt": "blurry",
    "imageUrls": [
      "https://example.com/image1.png",
      "https://example.com/image2.png"
    ],
    "createdAt": "2025-06-19T17:30:00.000Z",
    "completedAt": "2025-06-19T17:30:45.000Z"
  }
]
```

## Workflow Management

### List Workflows
```http
GET /api/comfy/workflows
```

### Create Workflow
```http
POST /api/comfy/workflows
Content-Type: application/json

{
  "name": "Portrait Generator",
  "description": "High-quality portrait generation workflow",
  "workflowJson": {
    "nodes": [...],
    "links": [...],
    "config": {...}
  },
  "category": "portraits",
  "serverId": 1,
  "isTemplate": true
}
```

### Update Workflow
```http
PATCH /api/comfy/workflows/:id
Content-Type: application/json

{
  "name": "Updated Portrait Generator",
  "description": "Enhanced portrait workflow"
}
```

### Delete Workflow
```http
DELETE /api/comfy/workflows/:id
```

## Server Execution Monitoring

### Get Server Executions
```http
GET /api/server-executions/:serverId
```

Response:
```json
[
  {
    "id": 1,
    "serverId": 1,
    "scriptId": 1,
    "status": "completed",
    "output": "ComfyUI installation completed successfully",
    "startedAt": "2025-06-19T17:25:00.000Z",
    "completedAt": "2025-06-19T17:27:30.000Z"
  }
]
```

### Update Execution
```http
PUT /api/server-executions/:id
Content-Type: application/json

{
  "status": "completed",
  "output": "Installation finished successfully"
}
```

## Server Scheduler

### Get Scheduler Status
```http
GET /api/server-scheduler/:serverId
```

### Start Monitoring
```http
POST /api/server-scheduler/:serverId/start
```

### Stop Monitoring
```http
POST /api/server-scheduler/:serverId/stop
```

## Workflow Analysis

### Analyze Workflow
```http
POST /api/comfy/analyze-workflow
Content-Type: application/json

{
  "workflowJson": {
    "nodes": [...],
    "links": [...]
  }
}
```

Response:
```json
{
  "isValid": true,
  "requirements": {
    "models": ["v1-5-pruned-emaonly.ckpt"],
    "customNodes": ["ComfyUI-Manager"],
    "estimatedVRAM": "8GB"
  },
  "compatibility": {
    "comfyUIVersion": ">=0.1.0",
    "pythonVersion": ">=3.8"
  }
}
```

### Download Requirements
```http
POST /api/comfy/:serverId/download-requirements
Content-Type: application/json

{
  "requirements": {
    "models": ["model1.ckpt", "model2.safetensors"],
    "customNodes": ["ComfyUI-Manager"]
  }
}
```

### Get Analysis Logs
```http
GET /api/comfy/analysis-logs
```

### Clear Analysis Logs
```http
DELETE /api/comfy/analysis-logs
```

## API Key Management

### List API Keys
```http
GET /api/api-keys
```

### Create API Key
```http
POST /api/api-keys
Content-Type: application/json

{
  "service": "vast",
  "keyName": "VAST_API_KEY",
  "keyValue": "your_api_key_here"
}
```

### Update API Key
```http
PATCH /api/api-keys/:id
Content-Type: application/json

{
  "keyValue": "new_api_key_value"
}
```

### Delete API Key
```http
DELETE /api/api-keys/:id
```

## Audit Logging

### Get Audit Logs
```http
GET /api/audit-logs?limit=100&offset=0&category=user_action
```

Response:
```json
[
  {
    "id": 1,
    "category": "user_action",
    "userId": 1,
    "action": "server_launched",
    "resource": "vast_server",
    "resourceId": "1",
    "details": {
      "serverName": "Demo Server",
      "gpu": "RTX 4090"
    },
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-06-19T17:30:00.000Z",
    "severity": "info"
  }
]
```

### Get Audit Summary
```http
GET /api/audit-logs/summary
```

Response:
```json
{
  "totalEvents": 150,
  "securityEvents": 5,
  "errorEvents": 2,
  "recentActivity": 25,
  "topActions": [
    {
      "action": "server_launched",
      "count": 12
    },
    {
      "action": "image_generated",
      "count": 8
    }
  ]
}
```

## Analytics and Statistics

### Get Dashboard Stats
```http
GET /api/stats
```

Response:
```json
{
  "connectedAccounts": 4,
  "pendingApprovals": 1,
  "postsThisMonth": 15,
  "generatedMedia": 42
}
```

### Get Server Analytics
```http
GET /api/server-analytics
```

Response:
```json
{
  "dailyUsage": [
    {
      "date": "Jun 19",
      "servers": 3,
      "cost": 25.50,
      "uptime": 18.5
    }
  ],
  "costBreakdown": [
    {
      "category": "GPU Servers",
      "cost": 180.00,
      "percentage": 75
    }
  ],
  "performanceMetrics": [
    {
      "metric": "Average Response Time",
      "value": "1.2s",
      "trend": "improving"
    }
  ]
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

Error responses include details:
```json
{
  "error": "Server not found",
  "message": "The requested server does not exist",
  "code": "SERVER_NOT_FOUND"
}
```

## Rate Limiting

API endpoints are rate limited:
- General endpoints: 100 requests per minute
- Image generation: 10 requests per minute
- Server operations: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## WebSocket Events

Real-time updates are available via WebSocket connection at `/ws`:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
```

### Events
- `server_status_update` - Server status changes
- `generation_progress` - Image generation progress
- `execution_update` - Script execution updates
- `audit_event` - New audit log entries

### Example Event
```json
{
  "type": "server_status_update",
  "data": {
    "serverId": 1,
    "status": "running",
    "setupStatus": "ready"
  },
  "timestamp": "2025-06-19T17:30:00.000Z"
}
```

## SDK Usage Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true
});

// Login
await client.post('/auth/login', {
  email: 'demo@example.com',
  password: 'demo123'
});

// Launch server
const server = await client.post('/vast-servers', {
  vastId: '12345',
  image: 'pytorch/pytorch:latest'
});

// Generate image
const generation = await client.post(`/comfy/${server.data.id}/generate`, {
  prompt: 'beautiful landscape',
  negativePrompt: 'blurry'
});
```

### Python
```python
import requests

session = requests.Session()
session.headers.update({'Content-Type': 'application/json'})

# Login
session.post('http://localhost:5000/api/auth/login', json={
    'email': 'demo@example.com',
    'password': 'demo123'
})

# Launch server
server = session.post('http://localhost:5000/api/vast-servers', json={
    'vastId': '12345',
    'image': 'pytorch/pytorch:latest'
}).json()

# Generate image
generation = session.post(f'http://localhost:5000/api/comfy/{server["id"]}/generate', json={
    'prompt': 'beautiful landscape',
    'negativePrompt': 'blurry'
}).json()
```

This API documentation provides comprehensive coverage of all SocialSync endpoints with examples and error handling information.