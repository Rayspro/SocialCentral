from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, EmailStr
import bcrypt
import json
import asyncio
import httpx
from datetime import datetime, timedelta
import os

from database import get_db

router = APIRouter()

# Security
security = HTTPBearer()

# Pydantic models for requests/responses
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

class PlatformResponse(BaseModel):
    id: int
    name: str
    displayName: str
    isActive: bool

class StatsResponse(BaseModel):
    totalUsers: int
    totalPlatforms: int
    totalContent: int
    totalAccounts: int

# Authentication routes
@router.post("/auth/login", response_model=UserResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    # Get user by email
    result = await db.execute(
        text("SELECT * FROM users WHERE email = :email"),
        {"email": request.email}
    )
    user_row = result.fetchone()
    
    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Convert row to dict
    user = dict(user_row._mapping)
    
    # Verify password
    if not bcrypt.checkpw(request.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Return user data without password
    return UserResponse(
        id=user['id'],
        email=user['email'],
        username=user['username'],
        firstName=user['first_name'],
        lastName=user['last_name'],
        createdAt=user['created_at'],
        updatedAt=user['updated_at']
    )

@router.post("/auth/signup", response_model=UserResponse)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Validate passwords match
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
    
    # Check if user exists
    result = await db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": request.email}
    )
    if result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User with this email already exists"
        )
    
    # Hash password
    password_hash = bcrypt.hashpw(request.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create user
    result = await db.execute(
        text("""
            INSERT INTO users (email, username, first_name, last_name, password_hash, created_at, updated_at)
            VALUES (:email, :username, :first_name, :last_name, :password_hash, NOW(), NOW())
            RETURNING *
        """),
        {
            "email": request.email,
            "username": request.email.split('@')[0],
            "first_name": request.firstName,
            "last_name": request.lastName,
            "password_hash": password_hash
        }
    )
    user_row = result.fetchone()
    await db.commit()
    
    if not user_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )
    
    user = dict(user_row._mapping)
    
    return UserResponse(
        id=user['id'],
        email=user['email'],
        username=user['username'],
        firstName=user['first_name'],
        lastName=user['last_name'],
        createdAt=user['created_at'],
        updatedAt=user['updated_at']
    )

# Dashboard stats
@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)):
    # Get counts from database
    user_count_result = await db.execute(text("SELECT COUNT(*) FROM users"))
    user_count = user_count_result.scalar() or 0
    
    platform_count_result = await db.execute(text("SELECT COUNT(*) FROM platforms"))
    platform_count = platform_count_result.scalar() or 0
    
    content_count_result = await db.execute(text("SELECT COUNT(*) FROM content"))
    content_count = content_count_result.scalar() or 0
    
    account_count_result = await db.execute(text("SELECT COUNT(*) FROM accounts"))
    account_count = account_count_result.scalar() or 0
    
    return StatsResponse(
        totalUsers=user_count,
        totalPlatforms=platform_count,
        totalContent=content_count,
        totalAccounts=account_count
    )

# Content management
@router.get("/content")
async def get_content(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM content ORDER BY created_at DESC"))
    content_list = []
    for row in result.fetchall():
        content_list.append(dict(row._mapping))
    return content_list

@router.post("/content")
async def create_content(request: ContentRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            INSERT INTO content (title, description, type, status, created_at, updated_at)
            VALUES (:title, :description, :type, :status, NOW(), NOW())
            RETURNING *
        """),
        {
            "title": request.title,
            "description": request.description,
            "type": request.type,
            "status": request.status
        }
    )
    content_row = result.fetchone()
    await db.commit()
    
    if not content_row:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create content"
        )
    
    return dict(content_row._mapping)

# Platform management
@router.get("/platforms")
async def get_platforms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM platforms ORDER BY name"))
    platforms = []
    for row in result.fetchall():
        platforms.append(dict(row._mapping))
    return platforms

# Account management
@router.get("/accounts")
async def get_accounts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT a.*, p.name as platform_name, p.display_name as platform_display_name
            FROM accounts a
            LEFT JOIN platforms p ON a.platform_id = p.id
            ORDER BY a.created_at DESC
        """)
    )
    accounts = []
    for row in result.fetchall():
        accounts.append(dict(row._mapping))
    return accounts

# Server analytics
@router.get("/server-analytics")
async def get_server_analytics(db: AsyncSession = Depends(get_db)):
    # Generate sample analytics data
    daily_usage = []
    for i in range(7):
        date = datetime.now() - timedelta(days=i)
        daily_usage.append({
            "date": date.strftime("%b %d"),
            "servers": max(1, 5 - i),
            "usage": max(10, 100 - i * 10)
        })
    
    return {
        "dailyUsage": daily_usage[::-1],  # Reverse to show chronological order
        "totalServers": 5,
        "activeServers": 3,
        "totalUsage": 350
    }

# ComfyUI and Workflow routes
@router.get("/comfy-models")
async def get_comfy_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM comfy_models ORDER BY created_at DESC"))
    models = []
    for row in result.fetchall():
        models.append(dict(row._mapping))
    return models

@router.get("/workflows")
async def get_workflows(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM comfy_workflows ORDER BY created_at DESC"))
    workflows = []
    for row in result.fetchall():
        workflows.append(dict(row._mapping))
    return workflows

@router.get("/workflows/with-models")
async def get_workflows_with_models(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT w.*, 
                   COALESCE(json_agg(m.*) FILTER (WHERE m.id IS NOT NULL), '[]') as models
            FROM comfy_workflows w
            LEFT JOIN comfy_models m ON m.workflow_id = w.id
            GROUP BY w.id
            ORDER BY w.created_at DESC
        """)
    )
    workflows = []
    for row in result.fetchall():
        workflow_dict = dict(row._mapping)
        # Parse models JSON if it's a string
        if isinstance(workflow_dict.get('models'), str):
            try:
                workflow_dict['models'] = json.loads(workflow_dict['models'])
            except:
                workflow_dict['models'] = []
        workflows.append(workflow_dict)
    return workflows

@router.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: int, db: AsyncSession = Depends(get_db)):
    # Delete associated models first
    await db.execute(
        text("DELETE FROM comfy_models WHERE workflow_id = :workflow_id"),
        {"workflow_id": workflow_id}
    )
    
    # Delete workflow
    result = await db.execute(
        text("DELETE FROM comfy_workflows WHERE id = :workflow_id"),
        {"workflow_id": workflow_id}
    )
    await db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    return {"message": "Workflow deleted successfully"}

@router.post("/workflows/{workflow_id}/sync-models")
async def sync_workflow_models(workflow_id: int, db: AsyncSession = Depends(get_db)):
    # Check if workflow exists
    result = await db.execute(
        text("SELECT * FROM comfy_workflows WHERE id = :workflow_id"),
        {"workflow_id": workflow_id}
    )
    workflow_row = result.fetchone()
    
    if not workflow_row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found"
        )
    
    workflow = dict(workflow_row._mapping)
    
    # Parse workflow JSON to extract models
    try:
        workflow_data = json.loads(workflow.get('workflow_json', '{}'))
        # Extract model information from workflow
        models_found = []
        
        # This is a simplified model extraction - in reality you'd parse the ComfyUI workflow JSON
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
            await db.execute(
                text("""
                    INSERT INTO comfy_models (workflow_id, name, type, required, created_at, updated_at)
                    VALUES (:workflow_id, :name, :type, :required, NOW(), NOW())
                    ON CONFLICT (workflow_id, name) DO NOTHING
                """),
                {
                    "workflow_id": workflow_id,
                    "name": model['name'],
                    "type": model['type'],
                    "required": model['required']
                }
            )
        
        await db.commit()
        
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

# Vast.ai server management
@router.get("/vast-servers")
async def get_vast_servers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM vast_servers ORDER BY created_at DESC"))
    servers = []
    for row in result.fetchall():
        servers.append(dict(row._mapping))
    return servers

# ComfyUI generations
@router.get("/comfy-generations")
async def get_comfy_generations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM comfy_generations ORDER BY created_at DESC LIMIT 50"))
    generations = []
    for row in result.fetchall():
        generation_dict = dict(row._mapping)
        # Parse JSON fields
        if isinstance(generation_dict.get('image_urls'), str):
            try:
                generation_dict['image_urls'] = json.loads(generation_dict['image_urls'])
            except:
                generation_dict['image_urls'] = []
        generations.append(generation_dict)
    return generations

# Health check
@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}