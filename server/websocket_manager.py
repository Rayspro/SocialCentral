from typing import List, Dict, Any
from fastapi import WebSocket
import json
import asyncio

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.progress_data: Dict[int, Dict[str, Any]] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[websocket] Client connected. Total connections: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"[websocket] Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            print(f"[websocket] Error sending personal message: {e}")
            await self.disconnect(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                print(f"[websocket] Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            await self.disconnect(connection)

    async def broadcast_progress(self, generation_id: int, progress_data: Dict[str, Any]):
        """Broadcast ComfyUI generation progress to all connected clients"""
        message = {
            "type": "progress",
            "generationId": generation_id,
            "data": progress_data
        }
        await self.broadcast(json.dumps(message))

    async def broadcast_setup_progress(self, server_id: int, step: int, total_steps: int, message: str):
        """Broadcast ComfyUI setup progress to all connected clients"""
        progress_message = {
            "type": "setup_progress",
            "serverId": server_id,
            "step": step,
            "totalSteps": total_steps,
            "message": message,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.broadcast(json.dumps(progress_message))

    def store_progress(self, generation_id: int, progress_data: Dict[str, Any]):
        """Store progress data for a generation"""
        self.progress_data[generation_id] = progress_data

    def get_progress(self, generation_id: int) -> Dict[str, Any]:
        """Get stored progress data for a generation"""
        return self.progress_data.get(generation_id, {})

    def get_all_progress(self) -> Dict[int, Dict[str, Any]]:
        """Get all stored progress data"""
        return self.progress_data

    def clear_progress(self, generation_id: int):
        """Clear progress data for a generation"""
        if generation_id in self.progress_data:
            del self.progress_data[generation_id]