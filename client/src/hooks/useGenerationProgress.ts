import { useState, useEffect, useCallback, useRef } from 'react';

interface GenerationProgress {
  generationId: number;
  serverId: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  currentNode?: string;
  totalNodes?: number;
  completedNodes?: number;
  progress?: number;
  previewImage?: string;
  executionTime?: number;
  errorMessage?: string;
}

interface UseGenerationProgressReturn {
  progress: GenerationProgress | null;
  isConnected: boolean;
  connectionError: string | null;
  startTracking: (generationId: number) => void;
  stopTracking: () => void;
}

export function useGenerationProgress(): UseGenerationProgressReturn {
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trackingGenerationId = useRef<number | null>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to ComfyUI progress WebSocket...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to ComfyUI progress WebSocket');
        setIsConnected(true);
        setConnectionError(null);
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Only update progress if we're tracking this generation
          if (data.generationId === trackingGenerationId.current) {
            console.log('Received progress update:', data);
            setProgress(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('ComfyUI progress WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect after 3 seconds if we were tracking something
        if (trackingGenerationId.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect to ComfyUI progress WebSocket...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('ComfyUI progress WebSocket error:', error);
        setConnectionError('WebSocket connection failed');
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionError('Failed to establish WebSocket connection');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setProgress(null);
    trackingGenerationId.current = null;
  }, []);

  const startTracking = useCallback((generationId: number) => {
    console.log(`Starting progress tracking for generation ${generationId}`);
    trackingGenerationId.current = generationId;
    
    // Reset progress state
    setProgress({
      generationId,
      serverId: 0, // Will be updated from WebSocket
      status: 'queued',
      progress: 0
    });
    
    // Connect to WebSocket if not already connected
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
    }
  }, [connect]);

  const stopTracking = useCallback(() => {
    console.log('Stopping progress tracking');
    trackingGenerationId.current = null;
    setProgress(null);
    disconnect();
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    progress,
    isConnected,
    connectionError,
    startTracking,
    stopTracking
  };
}