import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause,
  Eye,
  Download,
  Zap
} from 'lucide-react';

interface ComfyUIProgress {
  generationId: number;
  serverId: number;
  status: 'queued' | 'executing' | 'completed' | 'failed';
  currentNode?: string;
  totalNodes?: number;
  completedNodes?: number;
  progress?: number;
  previewImage?: string;
  executionTime?: number;
  errorMessage?: string;
}

interface ComfyProgressMonitorProps {
  generationId?: number;
  className?: string;
}

export function ComfyProgressMonitor({ generationId, className }: ComfyProgressMonitorProps) {
  const [progressData, setProgressData] = useState<ComfyUIProgress | null>(null);
  const [allProgress, setAllProgress] = useState<ComfyUIProgress[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to ComfyUI progress WebSocket');
      setConnectionStatus('connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'comfy_progress') {
          const progress: ComfyUIProgress = message.data;
          
          // Update specific progress if watching one generation
          if (generationId && progress.generationId === generationId) {
            setProgressData(progress);
          }
          
          // Update all progress list
          setAllProgress(prev => {
            const index = prev.findIndex(p => p.generationId === progress.generationId);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = progress;
              return updated;
            } else {
              return [...prev, progress];
            }
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('ComfyUI progress WebSocket disconnected');
      setConnectionStatus('disconnected');
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error('ComfyUI progress WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    setConnectionStatus('connecting');

    return () => {
      ws.close();
    };
  }, [generationId]);

  // Fetch initial progress data
  useEffect(() => {
    if (generationId) {
      fetch(`/api/comfy/progress/${generationId}`)
        .then(res => res.json())
        .then(data => setProgressData(data))
        .catch(console.error);
    } else {
      fetch('/api/comfy/progress')
        .then(res => res.json())
        .then(data => setAllProgress(data))
        .catch(console.error);
    }
  }, [generationId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'executing':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Pause className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'executing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatExecutionTime = (startTime?: number) => {
    if (!startTime) return 'Unknown';
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const renderProgressCard = (progress: ComfyUIProgress) => (
    <Card key={progress.generationId} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Generation #{progress.generationId}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(progress.status)}>
              {getStatusIcon(progress.status)}
              <span className="ml-1 capitalize">{progress.status}</span>
            </Badge>
            {connectionStatus === 'connected' && (
              <Badge variant="outline" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Live
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {progress.status === 'executing' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress.progress || 0)}%</span>
            </div>
            <Progress 
              value={progress.progress || 0} 
              className="w-full"
            />
          </div>
        )}

        {/* Node Progress */}
        {progress.totalNodes && progress.completedNodes !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Nodes</span>
              <span>{progress.completedNodes}/{progress.totalNodes}</span>
            </div>
            <Progress 
              value={(progress.completedNodes / progress.totalNodes) * 100} 
              className="w-full"
            />
          </div>
        )}

        {/* Current Node */}
        {progress.currentNode && progress.status === 'executing' && (
          <div className="text-sm">
            <span className="text-muted-foreground">Current Node:</span>
            <span className="ml-2 font-mono text-xs bg-muted px-2 py-1 rounded">
              {progress.currentNode}
            </span>
          </div>
        )}

        {/* Terminal Progress Display */}
        {progress.status === 'executing' && (
          <div className="border rounded-lg bg-black text-green-400 p-3 font-mono text-xs overflow-hidden">
            <div className="flex items-center mb-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="ml-3 text-white">ComfyUI Terminal Output</span>
            </div>
            <div className="border-t border-gray-700 pt-2">
              <div className="space-y-1">
                <div>┌─────────────────────────────────────────────────────────────┐</div>
                <div>│ 🎨 ComfyUI Generation Progress - ID: {progress.generationId.toString().padEnd(15)} │</div>
                <div>├─────────────────────────────────────────────────────────────┤</div>
                <div>│ Server: {progress.serverId.toString().padEnd(8)} │ Progress: {Math.round(progress.progress || 0).toString().padEnd(3)}% │ Step: {progress.completedNodes || 0}/{progress.totalNodes || 'Unknown'} │</div>
                <div>│ Status: Processing    │ Current Node: {(progress.currentNode || 'Unknown').padEnd(15)} │</div>
                <div>├─────────────────────────────────────────────────────────────┤</div>
                <div className="flex">
                  <span>│ [</span>
                  <div className="flex-1 flex">
                    {Array.from({ length: 40 }, (_, i) => (
                      <span key={i} className={i < Math.round(((progress.progress || 0) / 100) * 40) ? 'text-green-400' : 'text-gray-600'}>
                        {i < Math.round(((progress.progress || 0) / 100) * 40) ? '█' : '░'}
                      </span>
                    ))}
                  </div>
                  <span>] {Math.round(progress.progress || 0)}% │</span>
                </div>
                <div>└─────────────────────────────────────────────────────────────┘</div>
                {progress.currentNode && (
                  <div className="text-yellow-400 mt-2">
                    🔥 [ComfyUI] Executing Node: {progress.currentNode} | Generation ID: {progress.generationId}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Execution Time */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Execution Time:</span>
          <span>{formatExecutionTime(progress.executionTime)}</span>
        </div>

        {/* Preview Image */}
        {progress.previewImage && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <Button size="sm" variant="outline" className="h-7 px-2">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            </div>
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <img 
                src={`/api/comfy/image/${progress.previewImage}`}
                alt="Generation preview"
                className="w-full h-32 object-cover"
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {progress.status === 'failed' && progress.errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                <p className="font-medium">Generation Failed</p>
                <p className="mt-1 text-xs font-mono">{progress.errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Actions */}
        {progress.status === 'completed' && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Eye className="w-3 h-3 mr-1" />
              View Images
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (generationId && progressData) {
    return (
      <div className={className}>
        {renderProgressCard(progressData)}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Active Generations</h3>
        <Badge 
          variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
          className="text-xs"
        >
          <Zap className="w-3 h-3 mr-1" />
          {connectionStatus === 'connected' ? 'Live Updates' : 'Disconnected'}
        </Badge>
      </div>

      {allProgress.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No active generations</p>
              <p className="text-xs mt-1">Start generating images to see progress here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allProgress
            .sort((a, b) => b.generationId - a.generationId)
            .map(renderProgressCard)}
        </div>
      )}
    </div>
  );
}