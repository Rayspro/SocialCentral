import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingMascot } from "@/components/ui/loading-mascot";
import { 
  Settings, 
  Activity, 
  Server, 
  Clock, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Loader2,
  Play,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ServerAnalyticsProps {
  serverId: number;
  onClose: () => void;
}

export function ServerAnalytics({ serverId, onClose }: ServerAnalyticsProps) {
  const queryClient = useQueryClient();
  const [setupProgress, setSetupProgress] = useState(0);
  const [setupLogs, setSetupLogs] = useState<string[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Fetch server details
  const { data: server, isLoading: isLoadingServer } = useQuery({
    queryKey: [`/api/vast-servers/${serverId}`],
    refetchInterval: 5000,
  });

  // Fetch server executions
  const { data: executions, isLoading: isLoadingExecutions } = useQuery({
    queryKey: [`/api/server-executions/${serverId}`],
  });

  // Fetch scheduler info
  const { data: schedulerInfo } = useQuery({
    queryKey: [`/api/server-scheduler/${serverId}`],
    refetchInterval: 2000,
  });

  // Setup ComfyUI mutation
  const setupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/vast-servers/${serverId}/setup`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vast-servers/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/server-scheduler/${serverId}`] });
    },
  });

  // WebSocket connection for real-time logs
  useEffect(() => {
    if (server?.setupStatus === 'installing' || schedulerInfo?.isActive) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected for server analytics");
        setWsConnection(ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'setup_progress' && data.serverId === serverId) {
          setSetupProgress(data.progress);
          if (data.log) {
            setSetupLogs(prev => [...prev, data.log]);
          }
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
        setWsConnection(null);
      };

      return () => {
        ws.close();
      };
    }
  }, [server?.setupStatus, schedulerInfo?.isActive, serverId]);

  if (isLoadingServer) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingMascot message="Loading server details..." />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Server not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'installing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const needsSetup = server.status === 'running' && (!server.setupStatus || server.setupStatus === 'pending');
  const setupInProgress = server.setupStatus === 'installing' || schedulerInfo?.isActive;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">{server.name}</h2>
              <p className="text-sm text-muted-foreground">Server Analytics & Setup</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="setup">ComfyUI Setup</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Server className="h-4 w-4" />
                      Server Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Status:</span>
                        <Badge className={getStatusColor(server.status)}>
                          {server.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Setup Status:</span>
                        <Badge className={getStatusColor(server.setupStatus || 'pending')}>
                          {server.setupStatus || 'pending'}
                        </Badge>
                      </div>
                      {server.launchedAt && (
                        <div className="flex items-center justify-between">
                          <span>Launched:</span>
                          <span className="text-sm">{new Date(server.launchedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Cpu className="h-4 w-4" />
                      Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>GPU:</span>
                        <span>{server.gpu} × {server.gpuCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>CPU Cores:</span>
                        <span>{server.cpuCores}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>RAM:</span>
                        <span>{server.ram} GB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Storage:</span>
                        <span>{server.disk} GB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Cost:</span>
                        <span className="font-semibold">${server.pricePerHour}/hr</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    ComfyUI Setup
                  </CardTitle>
                  <CardDescription>
                    Install and configure ComfyUI on your server
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {needsSetup && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Your server is ready for ComfyUI installation. Click the button below to start the automated setup process.
                        </p>
                      </div>
                      <Button 
                        onClick={() => setupMutation.mutate()}
                        disabled={setupMutation.isPending}
                        className="w-full"
                      >
                        {setupMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Starting Setup...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start ComfyUI Setup
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {setupInProgress && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          ComfyUI setup is in progress...
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{setupProgress}%</span>
                        </div>
                        <Progress value={setupProgress} className="w-full" />
                      </div>

                      {setupLogs.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Real-time Logs</h4>
                          <div className="bg-black text-green-400 p-3 rounded-lg text-xs font-mono max-h-40 overflow-y-auto">
                            {setupLogs.map((log, index) => (
                              <div key={index}>{log}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {server.setupStatus === 'completed' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          ComfyUI setup completed successfully!
                        </span>
                      </div>
                      
                      {server.serverUrl && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Connection Details</h4>
                          <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {server.serverUrl}:8188
                          </code>
                        </div>
                      )}
                    </div>
                  )}

                  {server.setupStatus === 'failed' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          ComfyUI setup failed. Please try again.
                        </span>
                      </div>
                      
                      <Button 
                        onClick={() => setupMutation.mutate()}
                        disabled={setupMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Retry Setup
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4" />
                      Server Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Uptime:</span>
                        <span>{server.launchedAt ? 
                          Math.floor((Date.now() - new Date(server.launchedAt).getTime()) / (1000 * 60 * 60)) + 'h' : 
                          'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Total Cost:</span>
                        <span className="font-semibold">
                          ${server.launchedAt ? 
                            (((Date.now() - new Date(server.launchedAt).getTime()) / (1000 * 60 * 60)) * parseFloat(server.pricePerHour)).toFixed(2) : 
                            '0.00'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Location:</span>
                        <span>{server.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4" />
                      Scheduler Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {schedulerInfo ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Status:</span>
                          <Badge variant={schedulerInfo.isActive ? "default" : "secondary"}>
                            {schedulerInfo.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Checks:</span>
                          <span>{schedulerInfo.checkCount}/40</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Last Status:</span>
                          <span>{schedulerInfo.lastStatus}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No scheduler information available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-4 w-4" />
                    Execution History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingExecutions ? (
                    <div className="flex items-center justify-center h-32">
                      <LoadingMascot message="Loading logs..." />
                    </div>
                  ) : executions && executions.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {executions.map((execution: any) => (
                        <div key={execution.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(execution.status)}>
                              {execution.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(execution.startedAt).toLocaleString()}
                            </span>
                          </div>
                          {execution.output && (
                            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs font-mono">
                              {execution.output.slice(0, 200)}...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No execution logs available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}