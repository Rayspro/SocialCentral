#!/usr/bin/env python3
"""
Complete FastAPI Server Implementation
Replaces Express.js server with full Python FastAPI functionality
"""
import os
import time
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, Response, HTTPException, status, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import asyncpg
import bcrypt

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/socialsync")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
if "?sslmode=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split("?sslmode=")[0]

# Convert back to asyncpg format
asyncpg_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

# Global database pool
db_pool = None

# WebSocket manager
class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.progress_data: Dict[int, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[websocket] Client connected. Total: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"[websocket] Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                disconnected.append(connection)
        
        for connection in disconnected:
            await self.disconnect(connection)

websocket_manager = WebSocketManager()

# Pydantic models
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str
    confirmPassword: str
    agreeToTerms: bool

class UserResponse(BaseModel):
    id: int
    email: str
    username: Optional[str]
    firstName: Optional[str]
    lastName: Optional[str]
    createdAt: datetime
    updatedAt: datetime

class ContentRequest(BaseModel):
    title: str
    description: str
    type: str
    status: str = "draft"

class StatsResponse(BaseModel):
    totalUsers: int
    totalPlatforms: int
    totalContent: int
    totalAccounts: int

# Database functions
async def get_db_connection():
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(asyncpg_url, min_size=1, max_size=10)
    return await db_pool.acquire()

async def release_db_connection(conn):
    await db_pool.release(conn)

async def init_database():
    """Initialize database with default data"""
    try:
        conn = await get_db_connection()
        
        # Test connection
        await conn.execute("SELECT 1")
        print("[database] Database connection established")
        
        # Check if we have any users
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
        
        if user_count == 0:
            # Create default user
            password_hash = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            await conn.execute("""
                INSERT INTO users (email, username, first_name, last_name, password_hash, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            """, "admin@example.com", "admin", "Admin", "User", password_hash)
            
            # Create default platform
            await conn.execute("""
                INSERT INTO platforms (name, display_name, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, NOW(), NOW())
            """, "youtube", "YouTube", True)
            
            print("[database] Default data initialized")
        
        await release_db_connection(conn)
        
    except Exception as e:
        print(f"[database] Error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_database()
    yield
    # Shutdown
    if db_pool:
        await db_pool.close()

# Create FastAPI app
app = FastAPI(
    title="SocialSync API",
    description="Python FastAPI server replacing Express.js",
    version="2.0.0",
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
        print(f"[express] {log_line}")
    
    return response

# Authentication routes
@app.post("/api/auth/login", response_model=UserResponse)
async def login(request: LoginRequest):
    conn = await get_db_connection()
    try:
        # Get user by email
        user_row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", request.email)
        
        if not user_row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not bcrypt.checkpw(request.password.encode('utf-8'), user_row['password_hash'].encode('utf-8')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        return UserResponse(
            id=user_row['id'],
            email=user_row['email'],
            username=user_row['username'],
            firstName=user_row['first_name'],
            lastName=user_row['last_name'],
            createdAt=user_row['created_at'],
            updatedAt=user_row['updated_at']
        )
    finally:
        await release_db_connection(conn)

@app.post("/api/auth/signup", response_model=UserResponse)
async def signup(request: SignupRequest):
    if request.password != request.confirmPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords don't match"
        )
    
    if not request.agreeToTerms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must agree to terms"
        )
    
    conn = await get_db_connection()
    try:
        # Check if user exists
        existing_user = await conn.fetchrow("SELECT id FROM users WHERE email = $1", request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        
        # Hash password
        password_hash = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user
        user_row = await conn.fetchrow("""
            INSERT INTO users (email, username, first_name, last_name, password_hash, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING *
        """, request.email, request.email.split('@')[0], request.firstName, request.lastName, password_hash)
        
        return UserResponse(
            id=user_row['id'],
            email=user_row['email'],
            username=user_row['username'],
            firstName=user_row['first_name'],
            lastName=user_row['last_name'],
            createdAt=user_row['created_at'],
            updatedAt=user_row['updated_at']
        )
    finally:
        await release_db_connection(conn)

# Dashboard stats
@app.get("/api/stats", response_model=StatsResponse)
async def get_stats():
    conn = await get_db_connection()
    try:
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users") or 0
        platform_count = await conn.fetchval("SELECT COUNT(*) FROM platforms") or 0
        content_count = await conn.fetchval("SELECT COUNT(*) FROM content") or 0
        account_count = await conn.fetchval("SELECT COUNT(*) FROM accounts") or 0
        
        return StatsResponse(
            totalUsers=user_count,
            totalPlatforms=platform_count,
            totalContent=content_count,
            totalAccounts=account_count
        )
    finally:
        await release_db_connection(conn)

# Content management
@app.get("/api/content")
async def get_content():
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("SELECT * FROM content ORDER BY created_at DESC")
        return [dict(row) for row in rows]
    finally:
        await release_db_connection(conn)

@app.post("/api/content")
async def create_content(request: ContentRequest):
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow("""
            INSERT INTO content (title, description, type, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, NOW(), NOW())
            RETURNING *
        """, request.title, request.description, request.type, request.status)
        
        return dict(row)
    finally:
        await release_db_connection(conn)

# Platform management
@app.get("/api/platforms")
async def get_platforms():
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("SELECT * FROM platforms ORDER BY name")
        return [dict(row) for row in rows]
    finally:
        await release_db_connection(conn)

# Account management
@app.get("/api/accounts")
async def get_accounts():
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("""
            SELECT a.*, p.name as platform_name, p.display_name as platform_display_name
            FROM accounts a
            LEFT JOIN platforms p ON a.platform_id = p.id
            ORDER BY a.created_at DESC
        """)
        return [dict(row) for row in rows]
    finally:
        await release_db_connection(conn)

# Server analytics
@app.get("/api/server-analytics")
async def get_server_analytics():
    daily_usage = []
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        daily_usage.append({
            "date": date.strftime("%b %d"),
            "servers": max(1, 5 - i),
            "usage": max(10, 100 - i * 10)
        })
    
    return {
        "dailyUsage": daily_usage[::-1],
        "totalServers": 5,
        "activeServers": 3,
        "totalUsage": 350
    }

# ComfyUI and Workflow routes
@app.get("/api/workflows")
async def get_workflows():
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("SELECT * FROM comfy_workflows ORDER BY created_at DESC")
        return [dict(row) for row in rows]
    finally:
        await release_db_connection(conn)

@app.get("/api/workflows/with-models")
async def get_workflows_with_models():
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("""
            SELECT w.*, 
                   COALESCE(array_agg(
                       json_build_object(
                           'id', m.id,
                           'name', m.name,
                           'type', m.type,
                           'required', m.required
                       )
                   ) FILTER (WHERE m.id IS NOT NULL), ARRAY[]::json[]) as models
            FROM comfy_workflows w
            LEFT JOIN comfy_models m ON m.workflow_id = w.id
            GROUP BY w.id
            ORDER BY w.created_at DESC
        """)
        
        workflows = []
        for row in rows:
            workflow_dict = dict(row)
            workflows.append(workflow_dict)
        return workflows
    finally:
        await release_db_connection(conn)

@app.delete("/api/workflows/{workflow_id}")
async def delete_workflow(workflow_id: int):
    conn = await get_db_connection()
    try:
        # Delete associated models first
        await conn.execute("DELETE FROM comfy_models WHERE workflow_id = $1", workflow_id)
        
        # Delete workflow
        result = await conn.execute("DELETE FROM comfy_workflows WHERE id = $1", workflow_id)
        
        if result == "DELETE 0":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        return {"message": "Workflow deleted successfully"}
    finally:
        await release_db_connection(conn)

@app.post("/api/workflows/{workflow_id}/sync-models")
async def sync_workflow_models(workflow_id: int):
    conn = await get_db_connection()
    try:
        # Check if workflow exists
        workflow_row = await conn.fetchrow("SELECT * FROM comfy_workflows WHERE id = $1", workflow_id)
        
        if not workflow_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found"
            )
        
        # Parse workflow JSON to extract models
        try:
            workflow_data = json.loads(workflow_row['workflow_json'] or '{}')
            models_found = []
            
            # Extract model information from workflow
            if 'nodes' in workflow_data:
                for node in workflow_data['nodes']:
                    if 'inputs' in node and 'ckpt_name' in node['inputs']:
                        model_name = node['inputs']['ckpt_name']
                        models_found.append({
                            'name': model_name,
                            'type': 'checkpoint',
                            'required': True
                        })
            
            # Update models in database
            for model in models_found:
                await conn.execute("""
                    INSERT INTO comfy_models (workflow_id, name, type, required, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, NOW(), NOW())
                    ON CONFLICT (workflow_id, name) DO NOTHING
                """, workflow_id, model['name'], model['type'], model['required'])
            
            return {
                "message": "Models synchronized successfully",
                "modelsFound": len(models_found),
                "models": models_found
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to sync models: {str(e)}"
            )
    finally:
        await release_db_connection(conn)

@app.get("/api/vast-servers")
async def get_vast_servers():
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("SELECT * FROM vast_servers ORDER BY created_at DESC")
        return [dict(row) for row in rows]
    finally:
        await release_db_connection(conn)

@app.get("/api/comfy-generations")
async def get_comfy_generations():
    conn = await get_db_connection()
    try:
        rows = await conn.fetch("SELECT * FROM comfy_generations ORDER BY created_at DESC LIMIT 50")
        generations = []
        for row in rows:
            generation_dict = dict(row)
            # Parse JSON fields
            if isinstance(generation_dict.get('image_urls'), str):
                try:
                    generation_dict['image_urls'] = json.loads(generation_dict['image_urls'])
                except:
                    generation_dict['image_urls'] = []
            generations.append(generation_dict)
        return generations
    finally:
        await release_db_connection(conn)

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "framework": "FastAPI"}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
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

def main():
    """Run the FastAPI server"""
    port = int(os.getenv("PORT", 5000))
    print(f"[python] Starting FastAPI server on port {port}")
    print("[python] Successfully converted from Express.js to Python FastAPI")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()