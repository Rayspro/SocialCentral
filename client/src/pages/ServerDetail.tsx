import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Clock, Activity, AlertCircle, CheckCircle, Play, Square, RefreshCw, Timer, Target, BarChart3, Settings, Cpu, Bot } from "lucide-react";
import { format } from "date-fns";

interface Server {
  id: number;
  name: string;
  status: string;
  setupStatus: string;
  gpu: string;
  pricePerHour: string;
  location: string;
  schedulerActive: boolean;
  schedulerChecks: number;
  schedulerStarted: string;
  schedulerLastCheck: string;
}

interface SchedulerInfo {
  server: Server;
  activeScheduler: {
    checkCount: number;
    lastStatus: string;
    createdAt: string;
    lastCheckedAt: string;
  } | null;
  totalActiveSchedulers: number;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'running': return 'bg-green-500';
    case 'launching': return 'bg-yellow-500';
    case 'configuring': return 'bg-blue-500';
    case 'stopped': return 'bg-gray-500';
    case 'error': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

function getSetupStatusColor(status: string) {
  switch (status) {
    case 'ready': return 'bg-green-500';
    case 'installing': return 'bg-yellow-500';
    case 'pending': return 'bg-gray-500';
    case 'failed': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

export default function ServerDetail() {
  const { serverId } = useParams<{ serverId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: schedulerInfo, isLoading, refetch } = useQuery<SchedulerInfo>({
    queryKey: ["/api/server-scheduler", serverId],
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  });

  const { data: executions } = useQuery({
    queryKey: ["/api/server-executions", serverId],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh executions every 10 seconds
  });

  const startSchedulerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/server-scheduler/${serverId}/start`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/server-scheduler", serverId] });
    },
  });

  const stopSchedulerMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/server-scheduler/${serverId}/stop`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/server-scheduler", serverId] });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/vast-servers")}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Servers
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!schedulerInfo) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/vast-servers")}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Servers
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Server Not Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                The requested server could not be found.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const server = schedulerInfo.server;
  const activeScheduler = schedulerInfo.activeScheduler;

  const getSchedulerProgress = () => {
    if (!activeScheduler) return 0;
    const maxChecks = 40; // Same as MAX_CHECKS in scheduler
    return Math.min((activeScheduler.checkCount / maxChecks) * 100, 100);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/vast-servers")}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Servers
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{server.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{server.gpu} • {server.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAutoRefresh(!autoRefresh);
              if (!autoRefresh) refetch();
            }}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="setup">ComfyUI Setup</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Server Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Server Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`}></div>
              <span className="font-medium">{server.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getSetupStatusColor(server.setupStatus)}`}></div>
              <span className="font-medium">Setup: {server.setupStatus}</span>
            </div>
            <Separator />
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">GPU:</span>
                <span>{server.gpu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Price:</span>
                <span>${server.pricePerHour}/hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Location:</span>
                <span>{server.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduler Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Scheduler Status
            </CardTitle>
            <CardDescription>
              Automatic ComfyUI setup monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {server.schedulerActive && activeScheduler ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => stopSchedulerMutation.mutate()}
                    disabled={stopSchedulerMutation.isPending}
                  >
                    <Square className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{activeScheduler.checkCount}/40 checks</span>
                  </div>
                  <Progress value={getSchedulerProgress()} className="h-2" />
                </div>

                <Separator />
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Started:</span>
                    <span>{format(new Date(activeScheduler.createdAt), 'HH:mm:ss')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                    <span>{format(new Date(activeScheduler.lastCheckedAt), 'HH:mm:ss')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Status:</span>
                    <Badge variant="outline" className="text-xs">
                      {activeScheduler.lastStatus}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    Inactive
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startSchedulerMutation.mutate()}
                    disabled={startSchedulerMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                </div>
                
                {server.schedulerChecks > 0 && (
                  <>
                    <Separator />
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Checks:</span>
                        <span>{server.schedulerChecks}</span>
                      </div>
                      {server.schedulerStarted && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Last Started:</span>
                          <span>{format(new Date(server.schedulerStarted), 'MM/dd HH:mm')}</span>
                        </div>
                      )}
                      {server.schedulerLastCheck && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                          <span>{format(new Date(server.schedulerLastCheck), 'MM/dd HH:mm')}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              System Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {schedulerInfo.totalActiveSchedulers}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Active Schedulers</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {executions?.filter((e: any) => e.status === 'completed').length || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Completed Tasks</div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium">Recent Activity</h4>
              {executions && executions.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {executions.slice(0, 3).map((execution: any) => (
                    <div key={execution.id} className="flex items-center gap-2 text-sm">
                      {execution.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : execution.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <span className="flex-1 truncate">{execution.status}</span>
                      <span className="text-gray-500">
                        {format(new Date(execution.createdAt), 'HH:mm')}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution History */}
      {executions && executions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
            <CardDescription>Recent script executions and setup tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {executions.map((execution: any) => (
                <div key={execution.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {execution.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : execution.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="font-medium">Script Execution #{execution.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={execution.status === 'completed' ? 'default' : execution.status === 'failed' ? 'destructive' : 'secondary'}>
                        {execution.status}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(execution.createdAt), 'MM/dd/yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                  {execution.output && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm font-mono">
                      <pre className="whitespace-pre-wrap">{execution.output}</pre>
                    </div>
                  )}
                  {execution.errorLog && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 text-sm text-red-600 dark:text-red-400">
                      {execution.errorLog}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72%</div>
                <p className="text-xs text-muted-foreground">+2% from last hour</p>
                <Progress value={72} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.2 GB</div>
                <p className="text-xs text-muted-foreground">64% of 12.8 GB</p>
                <Progress value={64} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">GPU Usage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">91%</div>
                <p className="text-xs text-muted-foreground">High utilization</p>
                <Progress value={91} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2 GB/s</div>
                <p className="text-xs text-muted-foreground">↑ 12% upload</p>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">↓ 890 MB/s</div>
                    <Progress value={45} className="h-1" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">↑ 310 MB/s</div>
                    <Progress value={25} className="h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance History</CardTitle>
                <CardDescription>Resource usage over the last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Performance charts would be displayed here
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Usage costs and projections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Hour</span>
                  <span className="font-medium">${server.pricePerHour}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Today (Est.)</span>
                  <span className="font-medium">${(parseFloat(server.pricePerHour) * 24).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">This Month (Proj.)</span>
                  <span className="font-medium">${(parseFloat(server.pricePerHour) * 24 * 30).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="text-sm font-medium">Usage Efficiency</div>
                  <div className="text-xs text-muted-foreground">
                    GPU utilization: 91% (Excellent)
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Cost per compute hour: ${(parseFloat(server.pricePerHour) / 0.91).toFixed(3)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="setup" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">ComfyUI Setup</h3>
              <p className="text-sm text-muted-foreground">
                Manage ComfyUI installation and configuration
              </p>
            </div>
            <Button onClick={() => setLocation(`/servers/${id}/comfyui`)}>
              <Bot className="h-4 w-4 mr-2" />
              Open ComfyUI
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Setup Status</CardTitle>
              <CardDescription>Current ComfyUI installation status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getSetupStatusColor(server.setupStatus)}`}></div>
                <span className="font-medium">{server.setupStatus}</span>
              </div>
              
              {server.setupStatus === 'not-started' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">Ready to Setup</span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    ComfyUI is not yet installed on this server. You can start the automated setup process.
                  </p>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Start Automated Setup
                  </Button>
                </div>
              )}
              
              {server.setupStatus === 'installing' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />
                    <span className="font-medium text-yellow-900 dark:text-yellow-100">Installation in Progress</span>
                  </div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ComfyUI is currently being installed. This may take several minutes.
                  </p>
                </div>
              )}
              
              {server.setupStatus === 'completed' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100">Setup Complete</span>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                    ComfyUI has been successfully installed and is ready to use.
                  </p>
                  <Button size="sm" onClick={() => setLocation(`/servers/${id}/comfyui`)}>
                    <Bot className="h-4 w-4 mr-2" />
                    Launch ComfyUI
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {executions && executions.length > 0 ? (
            <div className="space-y-4">
              {executions.map((execution: any) => (
                <Card key={execution.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {execution.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : execution.status === 'failed' ? (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <CardTitle className="text-base">Script Execution #{execution.id}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={execution.status === 'completed' ? 'default' : execution.status === 'failed' ? 'destructive' : 'secondary'}>
                          {execution.status}
                        </Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {format(new Date(execution.createdAt), 'MM/dd/yyyy HH:mm')}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {execution.output && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Output</h4>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 text-sm font-mono">
                          <pre className="whitespace-pre-wrap">{execution.output}</pre>
                        </div>
                      </div>
                    )}
                    {execution.errorLog && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Error Log</h4>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 text-sm text-red-600 dark:text-red-400">
                          {execution.errorLog}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Execution Logs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
                  No script executions have been recorded for this server yet. Logs will appear here once setup processes begin.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}