#!/usr/bin/env python3
"""
Python FastAPI Server Startup Script
Replaces Express.js with Python FastAPI for SocialSync
"""
import os
import sys
import subprocess
from pathlib import Path

def main():
    """Start the Python FastAPI server"""
    # Set environment variables
    os.environ["PORT"] = "5000"
    os.environ["HOST"] = "0.0.0.0"
    
    # Change to server directory
    server_dir = Path(__file__).parent / "server"
    os.chdir(server_dir)
    
    # Add server directory to Python path
    sys.path.insert(0, str(server_dir))
    
    print("[python] SocialSync - Starting Python FastAPI Server")
    print("[python] Replacing Express.js with Python FastAPI")
    print("[python] Server starting on port 5000...")
    
    # Start the FastAPI server
    try:
        subprocess.run([
            sys.executable, "-c",
            """
import uvicorn
import sys
import os
sys.path.insert(0, '.')
from main import app
uvicorn.run(app, host='0.0.0.0', port=5000, reload=True, log_level='info')
            """
        ])
    except KeyboardInterrupt:
        print("[python] Server stopped")
    except Exception as e:
        print(f"[python] Error starting server: {e}")

if __name__ == "__main__":
    main()