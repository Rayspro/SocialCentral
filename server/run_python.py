#!/usr/bin/env python3
"""
FastAPI server runner for SocialSync
Replaces the Express.js server with Python FastAPI
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add server directory to Python path
server_dir = Path(__file__).parent
sys.path.insert(0, str(server_dir))

def main():
    """Run the FastAPI server"""
    port = int(os.getenv("PORT", 5000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"[python] Starting FastAPI server on {host}:{port}")
    print("[python] Serving SocialSync API with Python FastAPI")
    
    # Import after path setup
    from main import app
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        reload=True,
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main()