# Postman API Testing Guide for SocialSync

## Overview

This guide helps you set up and use the SocialSync Postman collection for comprehensive API testing. The collection includes all endpoints with proper documentation, examples, and automated testing scripts.

## Files Included

- `SocialSync_API.postman_collection.json` - Complete API collection
- `SocialSync_Environment.postman_environment.json` - Environment variables
- This setup guide with testing workflows

## Quick Setup

### 1. Import Collection and Environment

1. **Open Postman**
2. **Import Collection**:
   - Click "Import" button
   - Select `SocialSync_API.postman_collection.json`
   - Collection will appear in your workspace

3. **Import Environment**:
   - Click "Import" button
   - Select `SocialSync_Environment.postman_environment.json`
   - Environment will appear in environment dropdown

4. **Select Environment**:
   - Click environment dropdown (top right)
   - Select "SocialSync Environment"

### 2. Configure Environment Variables

Edit the environment variables to match your setup:

**Required Variables:**
- `baseUrl`: Your API base URL (default: `http://localhost:5000`)
- `serverId`: Default server ID for testing (default: `1`)

**Optional Variables:**
- `sessionToken`: For authenticated requests
- `vastApiKey`: For Vast.ai integration testing
- `openaiApiKey`: For OpenAI features testing

### 3. Start Testing

The collection is organized into folders:
- 🖥️ Server Management
- 🎨 ComfyUI Integration  
- 📦 Model Management
- 🔄 Workflow Management
- 📊 Analytics & Monitoring
- 🔧 Server Operations
- 🔑 API Key Management
- 🔍 Health & Diagnostics

## Testing Workflows

### Basic API Health Check

1. **Test API Availability**:
   ```
   GET /api/health
   ```
   - Should return 200 OK
   - Validates API is running

2. **Check API Version**:
   ```
   GET /api/version
   ```
   - Returns version info
   - Confirms API build

### Server Management Workflow

1. **List Available Servers**:
   ```
   GET /api/vast-servers/available
   ```

2. **Launch New Server**:
   ```
   POST /api/vast-servers
   Body: {
     "offerId": "12345",
     "image": "pytorch/pytorch:latest"
   }
   ```

3. **Monitor Server Status**:
   ```
   GET /api/vast-servers/{{serverId}}
   ```

4. **Update Server Configuration**:
   ```
   PATCH /api/vast-servers/{{serverId}}
   ```

5. **Delete Server** (when done):
   ```
   DELETE /api/vast-servers/{{serverId}}
   ```

### ComfyUI Testing Workflow

1. **Check ComfyUI Status**:
   ```
   GET /api/comfy/{{serverId}}/models
   ```

2. **Generate Image**:
   ```
   POST /api/comfy/{{serverId}}/generate
   Body: {
     "prompt": "beautiful landscape",
     "negativePrompt": "blurry"
   }
   ```

3. **Monitor Generation**:
   ```
   GET /api/comfy/{{serverId}}/generations/{{generationId}}
   ```

4. **Download Model**:
   ```
   POST /api/comfy/{{serverId}}/models
   Body: {
     "name": "Stable Diffusion v1.5",
     "url": "https://huggingface.co/model.safetensors"
   }
   ```

### Analytics Testing

1. **Dashboard Stats**:
   ```
   GET /api/stats
   ```

2. **Server Analytics**:
   ```
   GET /api/server-analytics?period=7d
   ```

3. **Audit Logs**:
   ```
   GET /api/audit-logs?limit=50
   ```

## Automated Testing Features

### Pre-request Scripts

The collection includes global pre-request scripts that:
- Add User-Agent headers
- Set request timestamps
- Log request details
- Prepare authentication if needed

### Test Scripts

Global test scripts validate:
- Response times (< 5 seconds)
- Valid status codes
- JSON response format
- Store response data for chaining

### Variable Auto-population

The collection automatically stores:
- `lastServerId` from server creation
- `lastGenerationId` from image generation
- `lastModelId` from model downloads
- Request timestamps

## Advanced Usage

### Environment Switching

Create multiple environments for different stages:

**Development Environment:**
```json
{
  "baseUrl": "http://localhost:5000",
  "serverId": "1"
}
```

**Staging Environment:**
```json
{
  "baseUrl": "https://staging.yourdomain.com",
  "serverId": "1"
}
```

**Production Environment:**
```json
{
  "baseUrl": "https://api.yourdomain.com",
  "serverId": "1"
}
```

### Custom Test Scripts

Add endpoint-specific tests:

```javascript
// Test successful server launch
pm.test("Server launched successfully", function () {
    const responseJson = pm.response.json();
    pm.expect(responseJson.status).to.eql("launching");
    pm.expect(responseJson.vastId).to.exist;
});

// Test image generation response
pm.test("Generation started", function () {
    const responseJson = pm.response.json();
    pm.expect(responseJson.success).to.be.true;
    pm.expect(responseJson.generationId).to.exist;
    pm.expect(responseJson.queueId).to.exist;
});
```

### Workflow Automation

Create test suites for complete workflows:

1. **Server Lifecycle Test**:
   - Launch server
   - Wait for ready status
   - Setup ComfyUI
   - Generate images
   - Clean up

2. **Model Management Test**:
   - List available models
   - Download new model
   - Verify installation
   - Delete model

## Error Handling

### Common Response Codes

- `200 OK`: Successful request
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Debugging Failed Requests

1. **Check Environment Variables**:
   - Verify `baseUrl` is correct
   - Ensure required variables are set

2. **Review Request Body**:
   - Validate JSON syntax
   - Check required fields

3. **Examine Response**:
   - Look at error messages
   - Check response headers

4. **Server Logs**:
   - Check application logs
   - Verify server is running

## Performance Testing

### Load Testing Setup

Use Postman's collection runner for load testing:

1. **Select Collection**
2. **Configure Iterations**: 10-100 requests
3. **Set Delay**: 100-1000ms between requests
4. **Monitor Results**: Response times, error rates

### Metrics to Monitor

- **Response Time**: < 2000ms for most endpoints
- **Success Rate**: > 95% for stable endpoints
- **Error Patterns**: Identify common failure points

## Integration with CI/CD

### Newman CLI

Run collection from command line:

```bash
# Install Newman
npm install -g newman

# Run collection
newman run SocialSync_API.postman_collection.json \
  -e SocialSync_Environment.postman_environment.json \
  --reporters cli,json \
  --reporter-json-export results.json
```

### GitHub Actions

```yaml
name: API Tests
on: [push, pull_request]
jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g newman
      - run: newman run SocialSync_API.postman_collection.json
```

## Best Practices

### Organization

- Use folders to group related endpoints
- Add descriptions to all requests
- Include example responses
- Document expected behavior

### Variables

- Use environment variables for dynamic values
- Store sensitive data in environment secrets
- Auto-populate IDs for request chaining
- Use descriptive variable names

### Testing

- Add meaningful test assertions
- Test both success and error cases
- Validate response structure
- Check response times

### Documentation

- Include request/response examples
- Document required parameters
- Explain authentication requirements
- Provide usage scenarios

## Troubleshooting

### Collection Not Working

1. **Verify File Import**: Re-import collection and environment
2. **Check Environment**: Ensure correct environment is selected
3. **Update Variables**: Verify all required variables are set
4. **Test Individual Requests**: Start with simple GET requests

### Server Connection Issues

1. **Verify Server**: Ensure SocialSync server is running
2. **Check URL**: Confirm `baseUrl` matches server address
3. **Network**: Test basic connectivity with ping/curl
4. **Firewall**: Ensure ports are accessible

### Authentication Problems

1. **Session Token**: Update `sessionToken` if using authentication
2. **API Keys**: Verify external service keys are valid
3. **Permissions**: Check user permissions for endpoints
4. **Headers**: Ensure required headers are included

This guide provides everything needed to effectively test the SocialSync API using Postman. The collection includes comprehensive endpoint coverage with automated testing capabilities for reliable API validation.