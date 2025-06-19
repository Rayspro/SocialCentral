import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Server, Cpu, HardDrive, Wifi, Clock, Activity, Terminal, Settings, RefreshCw } from "lucide-react";
import type { VastServer } from "@shared/schema";

interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
  processes: number;
}

interface ServerExecution {
  id: number;
  serverId: number;
  scriptId: number;
  status: string;
  output?: string;
  errorLog?: string;
  startedAt?: string;
  completedAt?: string;
}

export default function ServerDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const serverId = parseInt(params.id || "0");

  // Fetch server details
  const { data: server, isLoading } = useQuery<VastServer>({
    queryKey: ['/api/vast-servers', serverId],
    queryFn: async () => {
      const response = await fetch(`/api/vast-servers/${serverId}`);
      if (!response.ok) throw new Error('Server not found');
      return response.json();
    },
    enabled: !!serverId,
  });

  // Mock metrics data (in real app, this would come from monitoring API)
  const [metrics, setMetrics] = useState<ServerMetrics>({
    cpuUsage: 45,
    memoryUsage: 68,
    diskUsage: 32,
    networkIn: 1250,
    networkOut: 890,
    uptime: 14400, // 4 hours
    processes: 87,
  });

  // Fetch server executions
  const { data: executions } = useQuery<ServerExecution[]>({
    queryKey: ['/api/server-executions', serverId],
    queryFn: () => 
      fetch(`/api/server-executions/${serverId}`).then(res => res.json()),
    enabled: !!serverId,
  });

  // Simulate real-time metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(95, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        networkIn: Math.max(0, prev.networkIn + (Math.random() - 0.5) * 500),
        networkOut: Math.max(0, prev.networkOut + (Math.random() - 0.5) * 300),
        uptime: prev.uptime + 5,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500 text-white';
      case 'launching': return 'bg-blue-500 text-white';
      case 'configuring': return 'bg-purple-500 text-white';
      case 'stopping': return 'bg-orange-500 text-white';
      case 'stopped': return 'bg-red-500 text-white';
      case 'available': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Server Not Found</h2>
          <Button onClick={() => setLocation('/vast-servers')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Servers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/vast-servers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{server.name}</h1>
            <p className="text-muted-foreground">
              {server.gpu} × {server.gpuCount} | {server.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(server.status)}>
            {server.status}
          </Badge>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Server Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cpuUsage.toFixed(1)}%</div>
            <Progress value={metrics.cpuUsage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
            <Progress value={metrics.memoryUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics.memoryUsage / 100) * server.ram).toFixed(1)} GB / {server.ram} GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.diskUsage.toFixed(1)}%</div>
            <Progress value={metrics.diskUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics.diskUsage / 100) * server.disk).toFixed(1)} GB / {server.disk} GB
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUptime(metrics.uptime)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Since {server.launchedAt ? new Date(server.launchedAt).toLocaleString() : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Server Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>GPU:</span>
                  <span className="font-medium">{server.gpu} × {server.gpuCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>CPU Cores:</span>
                  <span className="font-medium">{server.cpuCores}</span>
                </div>
                <div className="flex justify-between">
                  <span>RAM:</span>
                  <span className="font-medium">{server.ram} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage:</span>
                  <span className="font-medium">{server.disk} GB</span>
                </div>
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="font-medium">{server.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost per Hour:</span>
                  <span className="font-medium">${parseFloat(server.pricePerHour).toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {server.serverUrl && (
                  <div>
                    <span className="text-sm text-muted-foreground">Server URL:</span>
                    <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {server.serverUrl}
                    </p>
                  </div>
                )}
                {server.sshConnection && (
                  <div>
                    <span className="text-sm text-muted-foreground">SSH Command:</span>
                    <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {server.sshConnection}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">ComfyUI Port:</span>
                  <p className="font-medium">{server.comfyuiPort}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Setup Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {server.setupStatus || 'pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Usage</CardTitle>
                <CardDescription>Real-time system metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>CPU Usage</span>
                    <span>{metrics.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.cpuUsage} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Memory Usage</span>
                    <span>{metrics.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Disk Usage</span>
                    <span>{metrics.diskUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.diskUsage} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Active Processes:</span>
                  <span className="font-medium">{metrics.processes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-medium">{formatUptime(metrics.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Server Status:</span>
                  <Badge className={getStatusColor(server.status)}>
                    {server.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Activity</CardTitle>
              <CardDescription>Real-time network throughput</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span>Network In</span>
                  </div>
                  <div className="text-2xl font-bold">{formatBytes(metrics.networkIn)}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-blue-500" />
                    <span>Network Out</span>
                  </div>
                  <div className="text-2xl font-bold">{formatBytes(metrics.networkOut)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Script Executions</CardTitle>
              <CardDescription>History of executed setup scripts</CardDescription>
            </CardHeader>
            <CardContent>
              {executions && executions.length > 0 ? (
                <div className="space-y-3">
                  {executions.map((execution) => (
                    <div key={execution.id} className="border rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Script #{execution.scriptId}</span>
                        <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                          {execution.status}
                        </Badge>
                      </div>
                      {execution.startedAt && (
                        <p className="text-sm text-muted-foreground">
                          Started: {new Date(execution.startedAt).toLocaleString()}
                        </p>
                      )}
                      {execution.completedAt && (
                        <p className="text-sm text-muted-foreground">
                          Completed: {new Date(execution.completedAt).toLocaleString()}
                        </p>
                      )}
                      {execution.output && (
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded mt-2 overflow-x-auto">
                          {execution.output}
                        </pre>
                      )}
                      {execution.errorLog && (
                        <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded mt-2 overflow-x-auto">
                          {execution.errorLog}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Terminal className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No script executions yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}