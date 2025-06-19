# API Documentation

## Overview

The SocialSync API provides RESTful endpoints for managing servers, AI content generation, and system monitoring. All endpoints return JSON responses and follow standard HTTP status codes.

## Base URL

```
https://your-domain.com/api
```

## Authentication

Currently, the API uses session-based authentication. Future versions will support API key authentication.

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "error": "Error description",
  "details": "Additional error details",
  "code": "ERROR_CODE"
}
```

## Endpoints

### Server Management

#### Get All Servers
```http
GET /api/vast-servers
```

Returns a list of all managed servers.

**Response:**
```json
[
  {
    "id": 1,
    "vastId": "12345",
    "name": "GPU Server 1",
    "gpu": "RTX 4090",
    "gpuCount": 1,
    "cpuCores": 16,
    "ram": 32,
    "disk": 100,
    "pricePerHour": "0.50",
    "location": "US-East",
    "status": "running",
    "setupStatus": "ready",
    "serverUrl": "https://ssh.vast.ai:22",
    "sshConnection": "ssh root@ssh.vast.ai -p 22",
    "metadata": {},
    "createdAt": "2025-06-19T10:00:00Z",
    "updatedAt": "2025-06-19T10:00:00Z"
  }
]
```

#### Launch New Server
```http
POST /api/vast-servers
```

Launches a new server instance from available offers.

**Request Body:**
```json
{
  "offerId": "12345",
  "image": "pytorch/pytorch:latest",
  "onStartScript": "optional startup script"
}
```

**Response:**
```json
{
  "id": 1,
  "vastId": "12345",
  "status": "launching",
  "message": "Server launch initiated"
}
```

#### Update Server
```http
PATCH /api/vast-servers/:id
```

Updates server configuration or status.

**Request Body:**
```json
{
  "setupStatus": "ready",
  "metadata": {
    "comfyUIStatus": "installed"
  }
}
```

#### Delete Server
```http
DELETE /api/vast-servers/:id
```

Destroys the server instance and removes it from management.

**Response:**
```json
{
  "success": true,
  "message": "Server destroyed successfully"
}
```

### ComfyUI Integration

#### Generate Image
```http
POST /api/comfy/:serverId/generate
```

Initiates image generation using ComfyUI.

**Request Body:**
```json
{
  "prompt": "beautiful landscape mountain view",
  "negativePrompt": "blurry, low quality",
  "workflowId": 1,
  "parameters": {
    "width": 512,
    "height": 512,
    "steps": 20,
    "cfg_scale": 7.5,
    "sampler": "euler_a"
  }
}
```

**Response:**
```json
{
  "success": true,
  "generationId": 123,
  "queueId": "queue_abc123",
  "message": "Image generation started",
  "estimatedTime": "30-60 seconds"
}
```

#### Get Generations
```http
GET /api/comfy/:serverId/generations
```

Returns list of image generations for a server.

**Query Parameters:**
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (processing, completed, failed)

**Response:**
```json
[
  {
    "id": 123,
    "serverId": 1,
    "prompt": "beautiful landscape",
    "status": "completed",
    "imageUrls": [
      "https://example.com/image1.png",
      "https://example.com/image2.png"
    ],
    "createdAt": "2025-06-19T10:00:00Z",
    "completedAt": "2025-06-19T10:01:30Z"
  }
]
```

#### Model Management

##### List Models
```http
GET /api/comfy/:serverId/models
```

Returns installed models on the server.

##### Download Model
```http
POST /api/comfy/:serverId/models
```

**Request Body:**
```json
{
  "name": "Stable Diffusion v1.5",
  "url": "https://huggingface.co/model.safetensors",
  "folder": "checkpoints",
  "description": "Base model for image generation"
}
```

##### Get Available Models
```http
GET /api/comfy/:serverId/available-models
```

Returns categorized list of available models for download.

### Analytics & Monitoring

#### Server Analytics
```http
GET /api/server-analytics
```

Returns aggregated server usage and performance data.

#### Audit Logs
```http
GET /api/audit-logs
```

Returns system audit logs with filtering options.

#### Dashboard Stats
```http
GET /api/stats
```

Returns key metrics for the dashboard.

## WebSocket Events

The application uses WebSocket for real-time updates on `/ws`.

### Event Types

#### Server Status Updates
```json
{
  "type": "server_status",
  "data": {
    "serverId": 1,
    "status": "running",
    "setupStatus": "ready"
  }
}
```

#### Generation Progress
```json
{
  "type": "generation_progress",
  "data": {
    "generationId": 123,
    "progress": 75,
    "status": "processing"
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `SERVER_NOT_FOUND` | Server instance not found |
| `INVALID_API_KEY` | API key is invalid or expired |
| `GENERATION_FAILED` | Image generation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `SERVER_NOT_READY` | Server is not ready for operations |

## Rate Limiting

API endpoints are rate limited:
- Authentication endpoints: 5 requests per minute
- Server management: 10 requests per minute
- Image generation: 5 requests per minute
- Other endpoints: 60 requests per minute