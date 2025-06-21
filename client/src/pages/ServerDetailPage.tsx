import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingMascot } from "@/components/ui/loading-mascot";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Server, 
  ArrowLeft,
  Clock, 
  HardDrive, 
  Cpu, 
  MemoryStick, 
  DollarSign, 
  MapPin, 
  Activity, 
  Wrench, 
  Loader2,
  BarChart3,
  Settings,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Square,
  FolderOpen,
  Brain,
  Package,
  Home,
  ChevronRight,
  User,
  LogOut,
  Bell
} from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ModelManager } from "@/components/ModelManager";
import { WorkflowAnalyzer } from "@/components/WorkflowAnalyzer";

export function ServerDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const queryClient = useQueryClient();
  const serverId = parseInt(params.id || "0");

  // Fetch server details
  const { data: server, isLoading: isLoadingServer } = useQuery({
    queryKey: [`/api/vast-servers/${serverId}`],
    refetchInterval: 3000,
  });

  // Type-safe server data access
  const serverData = server as any;

  // Fetch scheduler info
  const { data: schedulerInfo } = useQuery({
    queryKey: [`/api/server-scheduler/${serverId}`],
    refetchInterval: 2000,
  });

  // Fetch executions
  const { data: executions, isLoading: isLoadingExecutions } = useQuery({
    queryKey: [`/api/server-executions/${serverId}`],
    refetchInterval: 2000,
  });

  // Setup ComfyUI mutation
  const setupMutation = useMutation({
    mutationFn: async () => {
      return await fetch(`/api/comfy/startup/${serverId}`, {
        method: "POST",
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vast-servers/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/server-scheduler/${serverId}`] });
    },
  });

  // Stop server mutation
  const stopMutation = useMutation({
    mutationFn: async () => {
      return await fetch(`/api/vast-servers/${serverId}/stop`, {
        method: "POST",
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vast-servers/${serverId}`] });
    },
  });

  // Refresh server mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      return await fetch(`/api/vast-servers/${serverId}/refresh`, {
        method: "POST",
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/vast-servers/${serverId}`] });
    },
  });

  // WebSocket for real-time updates
  useEffect(() => {
    if (!serverData?.setupStatus || serverData.setupStatus === 'completed' || serverData.setupStatus === 'failed') {
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected for workflow logs");
      socket.send(JSON.stringify({ 
        type: 'subscribe', 
        serverId: serverId 
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'setup_progress' && data.serverId === serverId) {
          queryClient.invalidateQueries({ queryKey: [`/api/vast-servers/${serverId}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/server-scheduler/${serverId}`] });
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      socket.close();
    };
  }, [serverData?.setupStatus, serverId]);

  if (isLoadingServer) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingMascot task="loading" message="Loading server details..." />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Server not found</p>
        <Button 
          variant="outline" 
          onClick={() => setLocation("/vast-servers")}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Servers
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      running: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      stopped: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      starting: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      stopping: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getSetupStatusBadge = (setupStatus: string) => {
    const setupColors = {
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return setupColors[setupStatus as keyof typeof setupColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const isSetupInProgress = serverData?.setupStatus === 'pending' || serverData?.setupStatus === 'running';
  const needsSetup = serverData?.status === 'running' && (!serverData?.setupStatus || serverData?.setupStatus === 'failed');
  const isSetupComplete = serverData?.setupStatus === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-4 space-y-6">
        {/* Header with Breadcrumb and Profile */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => setLocation('/')}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </button>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <button 
              onClick={() => setLocation('/vast-servers')}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              Vast Servers
            </button>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {serverData?.name || `Server ${serverId}`}
            </span>
          </nav>
          
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            
            <Button variant="ghost" size="sm" className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Bell className="h-3.5 w-3.5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 w-7 h-7 rounded-full">
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs bg-slate-200 dark:bg-slate-700">
                      AD
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setLocation("/api/logout")}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-xl">
              <Server className="h-7 w-7 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {serverData?.name || `Server ${serverId}`}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Server ID: {serverData?.vastId} • {serverData?.location}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {serverData?.status === 'running' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
            >
              <Square className="h-4 w-4 mr-2" />
              Stop Server
            </Button>
          )}
        </div>

        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(serverData?.status || 'unknown')}`}>
                {serverData?.status || 'Unknown'}
              </div>
              {serverData?.setupStatus && (
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSetupStatusBadge(serverData.setupStatus)}`}>
                  Setup: {serverData.setupStatus}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {serverData?.launchedAt ? 
                (() => {
                  const launched = new Date(serverData.launchedAt);
                  const now = new Date();
                  const diffMs = now.getTime() - launched.getTime();
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  return `${diffHours}h ${diffMinutes}m`;
                })() : 
                'N/A'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Since {serverData?.launchedAt ? format(new Date(serverData.launchedAt), 'MMM dd, HH:mm') : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {serverData?.launchedAt && serverData?.pricePerHour ? 
                (() => {
                  const launched = new Date(serverData.launchedAt);
                  const now = new Date();
                  const diffHours = (now.getTime() - launched.getTime()) / (1000 * 60 * 60);
                  const cost = diffHours * parseFloat(serverData.pricePerHour);
                  return `$${cost.toFixed(2)}`;
                })() : 
                'N/A'
              }
            </p>
            <p className="text-xs text-muted-foreground">
              ${serverData?.pricePerHour || '0'}/hr
            </p>
          </CardContent>
        </Card>
        </div>

        {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="setup">ComfyUI Setup</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Hardware Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">GPU:</span>
                    </div>
                    <span className="font-medium">{serverData?.gpu} x{serverData?.gpuCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">CPU:</span>
                    </div>
                    <span className="font-medium">{serverData?.cpuCores} cores</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">RAM:</span>
                    </div>
                    <span className="font-medium">{serverData?.ram} GB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Disk:</span>
                    </div>
                    <span className="font-medium">{serverData?.disk} GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Server Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Location:</span>
                    </div>
                    <span className="font-medium">{serverData?.location || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Price:</span>
                    </div>
                    <span className="font-medium">${serverData?.pricePerHour}/hr</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Launched:</span>
                    </div>
                    <span className="font-medium">
                      {serverData?.launchedAt ? 
                        format(new Date(serverData.launchedAt), 'MMM dd, yyyy HH:mm') : 
                        'Not available'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {needsSetup && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Action Required
                </CardTitle>
                <CardDescription>
                  ComfyUI setup is required to use this server for AI workloads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setupMutation.mutate()}
                  disabled={setupMutation.isPending}
                  className="w-full"
                >
                  {setupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up ComfyUI...
                    </>
                  ) : (
                    <>
                      <Wrench className="mr-2 h-4 w-4" />
                      Setup ComfyUI Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ComfyUI Setup Status
              </CardTitle>
              <CardDescription>
                Status: <Badge variant={serverData?.status === 'running' ? 'default' : 'secondary'}>
                  {serverData?.status || 'Unknown'}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSetupInProgress && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Setup in progress...</span>
                  </div>
                  <Progress value={75} className="w-full" />
                </div>
              )}

              {needsSetup && serverData?.setupStatus !== 'running' && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      ComfyUI setup required
                    </p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                      Your server is running but ComfyUI needs to be installed and configured.
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => setupMutation.mutate()}
                    disabled={setupMutation.isPending}
                    className="w-full"
                  >
                    {setupMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting Setup...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Start ComfyUI Setup
                      </>
                    )}
                  </Button>
                </div>
              )}

              {isSetupComplete && (
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      ComfyUI is ready
                    </p>
                  </div>
                  {serverData?.serverUrl && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-green-600 dark:text-green-300">
                        ComfyUI URL: <a 
                          href={serverData.serverUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          {serverData.serverUrl}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <ModelManager serverId={serverId} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Runtime</p>
                    <p className="text-2xl font-bold">
                      {serverData?.launchedAt ? 
                        (() => {
                          const launched = new Date(serverData.launchedAt);
                          const now = new Date();
                          const diffMs = now.getTime() - launched.getTime();
                          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                          const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                          return `${diffHours}h ${diffMinutes}m`;
                        })() : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                    <p className="text-2xl font-bold">
                      {serverData?.launchedAt && serverData?.pricePerHour ? 
                        (() => {
                          const launched = new Date(serverData.launchedAt);
                          const now = new Date();
                          const diffHours = (now.getTime() - launched.getTime()) / (1000 * 60 * 60);
                          const cost = diffHours * parseFloat(serverData.pricePerHour);
                          return `$${cost.toFixed(2)}`;
                        })() : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Scheduler Status</h4>
                  {schedulerInfo ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${(schedulerInfo as any)?.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm">{(schedulerInfo as any)?.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Checks: {(schedulerInfo as any)?.checkCount || 0} | Status: {(schedulerInfo as any)?.lastStatus || 'None'}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No scheduler data available</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Execution Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingExecutions ? (
                <LoadingMascot task="loading" message="Loading execution logs..." />
              ) : (executions as any)?.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {(executions as any).map((execution: any, index: number) => (
                      <div key={index} className="p-3 border rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Execution #{execution.id}</span>
                          <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                            {execution.status}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground">
                          Started: {execution.startedAt ? format(new Date(execution.startedAt), 'MMM dd, HH:mm') : 'N/A'}
                        </div>
                        {execution.output && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            {execution.output}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No execution logs available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}