import os
import time
import json
from datetime import datetime
from typing import Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn

try:
    from database import init_database
    from routes import router as api_router
    from websocket_manager import WebSocketManager
except ImportError as e:
    print(f"Import error: {e}")
    # Fallback minimal imports
    async def init_database():
        print("[database] Mock database initialization")
    
    from fastapi import APIRouter
    api_router = APIRouter()
    
    class WebSocketManager:
        async def connect(self, websocket): pass
        async def disconnect(self, websocket): pass

# Initialize WebSocket manager
websocket_manager = WebSocketManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_database()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="SocialSync API",
    description="A cutting-edge server management and authentication platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    if request.url.path.startswith("/api"):
        log_line = f"{request.method} {request.url.path} {response.status_code} in {int(process_time * 1000)}ms"
        
        # Try to capture response body for logging (limited)
        if hasattr(response, 'body'):
            try:
                body_str = response.body.decode() if response.body else ""
                if len(body_str) > 80:
                    body_str = body_str[:79] + "…"
                if body_str:
                    log_line += f" :: {body_str}"
            except:
                pass
        
        print(f"[express] {log_line}")
    
    return response

# Include API routes
app.include_router(api_router, prefix="/api")

# WebSocket endpoint for ComfyUI progress
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Echo back or handle specific commands if needed
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        await websocket_manager.disconnect(websocket)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    status_code = getattr(exc, 'status_code', 500)
    message = str(exc) if str(exc) else "Internal Server Error"
    
    return JSONResponse(
        status_code=status_code,
        content={"message": message}
    )

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )