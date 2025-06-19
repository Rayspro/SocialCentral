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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Clock, Activity, AlertCircle, CheckCircle, Play, Square, RefreshCw, Timer, Target, Package, Download, Trash2, Eye, HardDrive } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [showModelsDialog, setShowModelsDialog] = useState(false);
  const [showAddModelDialog, setShowAddModelDialog] = useState(false);
  const [newModelUrl, setNewModelUrl] = useState("");
  const [newModelFolder, setNewModelFolder] = useState("checkpoints");
  const [newModelName, setNewModelName] = useState("");
  const [newModelDescription, setNewModelDescription] = useState("");
  const { toast } = useToast();

  const { data: schedulerInfo, isLoading, refetch } = useQuery<SchedulerInfo>({
    queryKey: ["/api/server-scheduler", serverId],
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  });

  const { data: executions } = useQuery({
    queryKey: ["/api/server-executions", serverId],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh executions every 10 seconds
  });

  // Models queries
  const { data: models } = useQuery({
    queryKey: ["/api/comfy", serverId, "models"],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh models every 30 seconds
  });

  const { data: availableModels } = useQuery({
    queryKey: ["/api/comfy", serverId, "available-models"],
    refetchInterval: autoRefresh ? 60000 : false, // Refresh available models every minute
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

  // Model management mutations
  const addModelMutation = useMutation({
    mutationFn: async (modelData: any) => {
      return apiRequest(`/api/comfy/models`, {
        method: "POST",
        body: JSON.stringify({ ...modelData, serverId: parseInt(serverId!) }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comfy", serverId, "models"] });
      setShowAddModelDialog(false);
      setNewModelUrl("");
      setNewModelName("");
      setNewModelDescription("");
      toast({
        title: "Model Added",
        description: "Model download started successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add model",
        variant: "destructive",
      });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: number) => {
      return apiRequest(`/api/comfy/models/${modelId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comfy", serverId, "models"] });
      toast({
        title: "Model Deleted",
        description: "Model removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete model",
        variant: "destructive",
      });
    },
  });

  const handleAddModel = () => {
    if (!newModelUrl || !newModelName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addModelMutation.mutate({
      name: newModelName,
      url: newModelUrl,
      folder: newModelFolder,
      description: newModelDescription,
    });
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">ComfyUI Models</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage AI models for this server's ComfyUI instance
              </p>
            </div>
            <div className="flex gap-2">
              <Dialog open={showModelsDialog} onOpenChange={setShowModelsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View All Models
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Available ComfyUI Models</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {availableModels && Object.entries(availableModels.models || {}).map(([category, modelList]) => (
                      <div key={category}>
                        <h4 className="font-medium capitalize mb-2">{category}</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {(modelList as string[]).map((model) => (
                            <div key={model} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                              {model}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showAddModelDialog} onOpenChange={setShowAddModelDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Add Model
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Download New Model</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="modelName">Model Name</Label>
                      <Input
                        id="modelName"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        placeholder="Enter model name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="modelUrl">Download URL</Label>
                      <Input
                        id="modelUrl"
                        value={newModelUrl}
                        onChange={(e) => setNewModelUrl(e.target.value)}
                        placeholder="https://example.com/model.safetensors"
                      />
                    </div>
                    <div>
                      <Label htmlFor="modelFolder">Folder</Label>
                      <Select value={newModelFolder} onValueChange={setNewModelFolder}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkpoints">checkpoints</SelectItem>
                          <SelectItem value="loras">loras</SelectItem>
                          <SelectItem value="vae">vae</SelectItem>
                          <SelectItem value="controlnet">controlnet</SelectItem>
                          <SelectItem value="upscale_models">upscale_models</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="modelDescription">Description (Optional)</Label>
                      <Textarea
                        id="modelDescription"
                        value={newModelDescription}
                        onChange={(e) => setNewModelDescription(e.target.value)}
                        placeholder="Model description"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAddModelDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddModel}
                        disabled={addModelMutation.isPending}
                      >
                        {addModelMutation.isPending ? "Adding..." : "Add Model"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Installed Models */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Installed Models
              </CardTitle>
              <CardDescription>
                Models currently available on this server
              </CardDescription>
            </CardHeader>
            <CardContent>
              {models && models.length > 0 ? (
                <div className="space-y-4">
                  {models.map((model: any) => (
                    <div key={model.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{model.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {model.folder}
                            </Badge>
                            <Badge 
                              variant={model.status === 'completed' ? 'default' : 
                                     model.status === 'failed' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {model.status}
                            </Badge>
                          </div>
                          {model.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {model.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            {model.fileSize && (
                              <span>
                                <HardDrive className="h-3 w-3 inline mr-1" />
                                {(model.fileSize / (1024 * 1024 * 1024)).toFixed(2)} GB
                              </span>
                            )}
                            <span>Added {format(new Date(model.createdAt), 'MM/dd/yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {model.downloadProgress !== null && model.downloadProgress < 100 && (
                            <div className="flex items-center gap-2">
                              <Progress value={model.downloadProgress} className="w-24" />
                              <span className="text-sm">{model.downloadProgress}%</span>
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteModelMutation.mutate(model.id)}
                            disabled={deleteModelMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {model.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-600 dark:text-red-400">
                          {model.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No models installed</p>
                  <p className="text-sm text-gray-500 mt-1">Add models to get started with ComfyUI</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Server Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Analytics coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          {/* Execution History */}
          {executions && executions.length > 0 ? (
            <Card>
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Execution History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No execution history</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}