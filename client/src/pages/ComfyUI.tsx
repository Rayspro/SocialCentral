import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { LoadingSpinner, LoadingCard } from "@/components/ui/loading-spinner";
import { 
  Download, 
  Play, 
  Image as ImageIcon, 
  Settings, 
  Plus, 
  RefreshCw, 
  Server,
  Home,
  ChevronRight,
  User,
  LogOut,
  Bell,
  Wand2,
  Palette,
  Save,
  Eye,
  Trash2,
  Brain,
  Loader2
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VastServer, ComfyModel, ComfyWorkflow, ComfyGeneration } from "@shared/schema";

interface GenerationParams {
  seed: number;
  steps: number;
  cfg: number;
  width: number;
  height: number;
  model?: string;
}

export default function ComfyUI() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // State
  const [selectedServer, setSelectedServer] = useState<VastServer | null>(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [params, setParams] = useState<GenerationParams>({
    seed: Math.floor(Math.random() * 1000000),
    steps: 20,
    cfg: 8,
    width: 512,
    height: 512,
  });

  // Model management state
  const [newModelName, setNewModelName] = useState("");
  const [newModelUrl, setNewModelUrl] = useState("");
  const [newModelFolder, setNewModelFolder] = useState("checkpoints");
  const [newModelDescription, setNewModelDescription] = useState("");

  // Workflow management state
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [newWorkflowCategory, setNewWorkflowCategory] = useState("text-to-image");
  const [newWorkflowJson, setNewWorkflowJson] = useState("");

  // Workflow analyzer state
  const [analyzeWorkflowJson, setAnalyzeWorkflowJson] = useState("");
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Get running servers
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ["/api/vast-servers"],
  });

  const runningServers = Array.isArray(servers) ? servers.filter((server: VastServer) => 
    server.isLaunched && server.status === 'running'
  ) : [];

  // Get models for selected server
  const { data: models, isLoading: modelsLoading, refetch: refetchModels } = useQuery({
    queryKey: [`/api/comfy/${selectedServer?.id}/models`],
    enabled: !!selectedServer,
  });

  // Get available models from ComfyUI
  const { data: availableModels, isLoading: availableModelsLoading, refetch: refetchAvailableModels } = useQuery({
    queryKey: [`/api/comfy/${selectedServer?.id}/available-models`],
    enabled: !!selectedServer,
  });

  // Get workflows
  const { data: workflows, isLoading: workflowsLoading, refetch: refetchWorkflows } = useQuery({
    queryKey: ["/api/comfy/workflows"],
  });

  // Get generations for selected server
  const { data: generations, isLoading: generationsLoading, refetch: refetchGenerations } = useQuery({
    queryKey: [`/api/comfy/${selectedServer?.id}/generations`],
    enabled: !!selectedServer,
  });

  // Auto-select first running server
  useEffect(() => {
    if (runningServers.length > 0 && !selectedServer) {
      setSelectedServer(runningServers[0]);
    }
  }, [runningServers, selectedServer]);

  // WebSocket connection for real-time logs
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/workflow-logs`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected for workflow logs');
      setWsConnection(ws);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'workflow_log') {
        setLogs(prev => [...prev, data.log]);
      } else if (data.type === 'workflow_logs_history') {
        setLogs(data.logs);
      } else if (data.type === 'workflow_logs_cleared') {
        setLogs([]);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setWsConnection(null);
    };
    
    return () => {
      ws.close();
    };
  }, []);

  // Mutations
  const addModelMutation = useMutation({
    mutationFn: async (modelData: any) => {
      const response = await fetch(`/api/comfy/${selectedServer?.id}/models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modelData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchModels();
      setNewModelName("");
      setNewModelUrl("");
      setNewModelDescription("");
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (generationData: any) => {
      const response = await fetch(`/api/comfy/${selectedServer?.id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(generationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchGenerations();
      toast({
        title: "Success",
        description: "Image generation started successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start image generation",
        variant: "destructive",
      });
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (workflowData: any) => {
      const response = await fetch('/api/comfy/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflowData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchWorkflows();
      setShowWorkflowDialog(false);
      setNewWorkflowName("");
      setNewWorkflowDescription("");
      setNewWorkflowCategory("text-to-image");
      setNewWorkflowJson("");
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: number) => {
      const response = await fetch(`/api/comfy/models/${modelId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      refetchModels();
      toast({
        title: "Success",
        description: "Model deleted successfully",
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

  const analyzeWorkflowMutation = useMutation({
    mutationFn: async (workflowJson: any) => {
      const response = await fetch('/api/comfy/analyze-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflowJson }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      setIsAnalyzing(false);
    },
    onError: () => {
      setIsAnalyzing(false);
    },
  });

  const downloadRequirementsMutation = useMutation({
    mutationFn: async ({ serverId, analysis }: { serverId: number; analysis: any }) => {
      const response = await fetch(`/api/comfy/${serverId}/download-requirements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsDownloading(false);
      refetchModels();
    },
    onError: () => {
      setIsDownloading(false);
    },
  });

  const handleAddModel = () => {
    if (!newModelName || !newModelUrl || !selectedServer) return;
    
    // Check for duplicates
    if (checkDuplicateModel(newModelName, newModelUrl)) {
      toast({
        title: "Duplicate Model",
        description: "A model with this name or URL already exists",
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

  const handleGenerate = () => {
    if (!selectedServer || !prompt) return;

    generateMutation.mutate({
      prompt,
      negativePrompt,
      workflowId: selectedWorkflow,
      parameters: params,
    });
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflowName || !newWorkflowJson) return;

    let parsedWorkflow;
    try {
      parsedWorkflow = JSON.parse(newWorkflowJson);
    } catch (error) {
      alert("Invalid JSON format in workflow definition");
      return;
    }

    createWorkflowMutation.mutate({
      name: newWorkflowName,
      description: newWorkflowDescription,
      workflowJson: parsedWorkflow,
      category: newWorkflowCategory,
      serverId: selectedServer?.id,
      isTemplate: false,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-500';
      case 'downloading': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatProgress = (progress: number | null) => {
    if (!progress) return '0%';
    return `${progress}%`;
  };

  const handleDeleteModel = (modelId: number) => {
    deleteModelMutation.mutate(modelId);
  };

  const checkDuplicateModel = (name: string, url: string): boolean => {
    if (!models || !Array.isArray(models)) return false;
    return models.some((model: ComfyModel) => 
      model.name === name || model.url === url
    );
  };

  if (serversLoading) {
    return <LoadingCard />;
  }

  if (runningServers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 py-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-2 text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                <Home className="h-4 w-4" />
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400" />
              <span className="text-slate-900 dark:text-slate-100 font-medium flex items-center gap-1">
                <Wand2 className="h-4 w-4" />
                ComfyUI
              </span>
            </nav>
            
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <Button variant="ghost" size="sm" className="p-1.5">
                <Bell className="h-3.5 w-3.5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 w-7 h-7 rounded-full">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">JD</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/settings')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* No servers message */}
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Server className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Running Servers</h3>
                <p className="text-muted-foreground mb-4">
                  You need a running server to use ComfyUI. Launch a server first.
                </p>
                <Button onClick={() => setLocation('/vast-servers')}>
                  <Server className="h-4 w-4 mr-2" />
                  Launch Server
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              <Home className="h-4 w-4" />
            </span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 dark:text-slate-100 font-medium flex items-center gap-1">
              <Wand2 className="h-4 w-4" />
              ComfyUI
            </span>
          </nav>
          
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Button variant="ghost" size="sm" className="p-1.5">
              <Bell className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 w-7 h-7 rounded-full">
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">JD</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Server Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Server Selection</CardTitle>
            <CardDescription>Choose a running server for ComfyUI operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedServer?.id.toString() || ""} 
              onValueChange={(value) => {
                const server = runningServers.find(s => s.id.toString() === value);
                setSelectedServer(server || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a server" />
              </SelectTrigger>
              <SelectContent>
                {runningServers.map((server) => (
                  <SelectItem key={server.id} value={server.id.toString()}>
                    {server.name} - {server.gpu} ({server.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedServer && (
          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
              <TabsTrigger value="analyzer">Analyzer</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>

            {/* Generate Tab */}
            <TabsContent value="generate" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Generation Controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Text to Image
                      <Badge variant={availableModelsLoading ? "secondary" : "destructive"} className="text-xs">
                        {availableModelsLoading ? "Checking..." : "ComfyUI Offline"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Generate images using AI {!availableModelsLoading && "(ComfyUI server required)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="prompt">Prompt</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Describe the image you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="negative-prompt">Negative Prompt</Label>
                      <Textarea
                        id="negative-prompt"
                        placeholder="What you don't want in the image..."
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Width: {params.width}</Label>
                        <Slider
                          value={[params.width]}
                          onValueChange={([value]) => setParams({...params, width: value})}
                          min={256}
                          max={1024}
                          step={64}
                        />
                      </div>
                      <div>
                        <Label>Height: {params.height}</Label>
                        <Slider
                          value={[params.height]}
                          onValueChange={([value]) => setParams({...params, height: value})}
                          min={256}
                          max={1024}
                          step={64}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Steps: {params.steps}</Label>
                        <Slider
                          value={[params.steps]}
                          onValueChange={([value]) => setParams({...params, steps: value})}
                          min={1}
                          max={50}
                          step={1}
                        />
                      </div>
                      <div>
                        <Label>CFG: {params.cfg}</Label>
                        <Slider
                          value={[params.cfg]}
                          onValueChange={([value]) => setParams({...params, cfg: value})}
                          min={1}
                          max={20}
                          step={0.5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="seed">Seed</Label>
                        <Input
                          id="seed"
                          type="number"
                          value={params.seed}
                          onChange={(e) => setParams({...params, seed: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>

                    {workflows && Array.isArray(workflows) && workflows.length > 0 && (
                      <div>
                        <Label>Workflow (Optional)</Label>
                        <Select 
                          value={selectedWorkflow?.toString() || "default"} 
                          onValueChange={(value) => setSelectedWorkflow(value === "default" ? null : parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Use default workflow" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default Text-to-Image</SelectItem>
                            {(workflows as any[]).map((workflow: any) => (
                              <SelectItem key={workflow.id} value={workflow.id.toString()}>
                                {workflow.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Button 
                      onClick={handleGenerate} 
                      disabled={generateMutation.isPending || !prompt || availableModelsLoading}
                      className="w-full"
                    >
                      {generateMutation.isPending ? (
                        <LoadingSpinner size="sm" text="Generating..." />
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                    
                    {!availableModelsLoading && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-sm">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">ComfyUI Setup Required</h4>
                        <p className="text-yellow-700 dark:text-yellow-300 mb-3">
                          ComfyUI server is not running on your Vast.ai instance. To enable image generation:
                        </p>
                        <ol className="list-decimal list-inside text-yellow-700 dark:text-yellow-300 space-y-1">
                          <li>SSH into your Vast.ai server</li>
                          <li>Install ComfyUI: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">git clone https://github.com/comfyanonymous/ComfyUI.git</code></li>
                          <li>Install dependencies: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">pip install -r requirements.txt</code></li>
                          <li>Start ComfyUI: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">python main.py --listen 0.0.0.0 --port 8188</code></li>
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Available Models */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Available Models</CardTitle>
                        <CardDescription>Models loaded in ComfyUI</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchAvailableModels()}
                        disabled={availableModelsLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${availableModelsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {availableModelsLoading ? (
                      <LoadingCard />
                    ) : availableModels && typeof availableModels === 'object' ? (
                      <div className="space-y-4">
                        {(availableModels as any).checkpoints && Array.isArray((availableModels as any).checkpoints) && (
                          <div>
                            <h4 className="font-medium mb-2">Checkpoints</h4>
                            <div className="space-y-1">
                              {(availableModels as any).checkpoints.map((model: string, index: number) => (
                                <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  {model}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(availableModels as any).loras && Array.isArray((availableModels as any).loras) && (
                          <div>
                            <h4 className="font-medium mb-2">LoRAs</h4>
                            <div className="space-y-1">
                              {(availableModels as any).loras.map((model: string, index: number) => (
                                <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  {model}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(availableModels as any).vae && Array.isArray((availableModels as any).vae) && (
                          <div>
                            <h4 className="font-medium mb-2">VAE</h4>
                            <div className="space-y-1">
                              {(availableModels as any).vae.map((model: string, index: number) => (
                                <div key={index} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  {model}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        ComfyUI server not accessible
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Models Tab */}
            <TabsContent value="models" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Add Model */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add New Model</CardTitle>
                    <CardDescription>Download a model from URL</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="model-name">Model Name</Label>
                      <Input
                        id="model-name"
                        placeholder="e.g., Stable Diffusion 1.5"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="model-url">Download URL</Label>
                      <Input
                        id="model-url"
                        placeholder="https://..."
                        value={newModelUrl}
                        onChange={(e) => setNewModelUrl(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Folder</Label>
                      <Select value={newModelFolder} onValueChange={setNewModelFolder}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkpoints">Checkpoints</SelectItem>
                          <SelectItem value="loras">LoRAs</SelectItem>
                          <SelectItem value="vae">VAE</SelectItem>
                          <SelectItem value="embeddings">Embeddings</SelectItem>
                          <SelectItem value="controlnet">ControlNet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="model-description">Description (Optional)</Label>
                      <Textarea
                        id="model-description"
                        placeholder="Description of the model..."
                        value={newModelDescription}
                        onChange={(e) => setNewModelDescription(e.target.value)}
                      />
                    </div>

                    <Button 
                      onClick={handleAddModel}
                      disabled={addModelMutation.isPending || !newModelName || !newModelUrl}
                      className="w-full"
                    >
                      {addModelMutation.isPending ? (
                        <LoadingSpinner size="sm" text="Adding..." />
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Add Model
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Downloaded Models */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Downloaded Models</CardTitle>
                        <CardDescription>Models downloaded for this server</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetchModels()}
                        disabled={modelsLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${modelsLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {modelsLoading ? (
                      <LoadingCard />
                    ) : models && Array.isArray(models) && models.length > 0 ? (
                      <div className="space-y-3">
                        {models.map((model: ComfyModel) => (
                          <div key={model.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{model.name}</h4>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(model.status)}>
                                  {model.status}
                                </Badge>
                                {(model.status === 'completed' || model.status === 'failed') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteModel(model.id)}
                                    className="h-7 px-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              Folder: {model.folder}
                            </div>
                            {model.description && (
                              <div className="text-sm text-muted-foreground mb-2">
                                {model.description}
                              </div>
                            )}
                            {model.status === 'downloading' && (
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: formatProgress(model.downloadProgress) }}
                                ></div>
                              </div>
                            )}
                            {model.errorMessage && (
                              <div className="text-sm text-red-500 mt-2">
                                Error: {model.errorMessage}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No models downloaded yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Workflows Tab */}
            <TabsContent value="workflows" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Saved Workflows</CardTitle>
                      <CardDescription>Custom ComfyUI workflows</CardDescription>
                    </div>
                    <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Workflow
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create New Workflow</DialogTitle>
                          <DialogDescription>
                            Add a custom ComfyUI workflow for text-to-image generation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="workflow-name">Name</Label>
                            <Input
                              id="workflow-name"
                              value={newWorkflowName}
                              onChange={(e) => setNewWorkflowName(e.target.value)}
                              placeholder="Enter workflow name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="workflow-description">Description</Label>
                            <Textarea
                              id="workflow-description"
                              value={newWorkflowDescription}
                              onChange={(e) => setNewWorkflowDescription(e.target.value)}
                              placeholder="Describe your workflow"
                              rows={2}
                            />
                          </div>
                          <div>
                            <Label htmlFor="workflow-category">Category</Label>
                            <Select value={newWorkflowCategory} onValueChange={setNewWorkflowCategory}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text-to-image">Text to Image</SelectItem>
                                <SelectItem value="img2img">Image to Image</SelectItem>
                                <SelectItem value="inpainting">Inpainting</SelectItem>
                                <SelectItem value="upscaling">Upscaling</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="workflow-json">Workflow JSON</Label>
                            <Textarea
                              id="workflow-json"
                              value={newWorkflowJson}
                              onChange={(e) => setNewWorkflowJson(e.target.value)}
                              placeholder="Paste your ComfyUI workflow JSON here"
                              rows={5}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowWorkflowDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreateWorkflow}
                              disabled={!newWorkflowName || !newWorkflowJson || createWorkflowMutation.isPending}
                            >
                              {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {workflowsLoading ? (
                    <LoadingCard />
                  ) : workflows && Array.isArray(workflows) && workflows.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {workflows.map((workflow: ComfyWorkflow) => (
                        <div key={workflow.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{workflow.name}</h4>
                            <Badge variant="outline">{workflow.category}</Badge>
                          </div>
                          {workflow.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {workflow.description}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Save className="h-4 w-4 mr-1" />
                              Use
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No workflows saved yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analyzer Tab */}
            <TabsContent value="analyzer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workflow Analyzer</CardTitle>
                  <CardDescription>AI-powered workflow analysis with automatic dependency detection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Workflow JSON</label>
                    <Textarea
                      placeholder="Paste your ComfyUI workflow JSON here..."
                      value={analyzeWorkflowJson}
                      onChange={(e) => setAnalyzeWorkflowJson(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (!analyzeWorkflowJson.trim()) return;
                        setIsAnalyzing(true);
                        setAnalysisResult(null);
                        try {
                          const parsedJson = JSON.parse(analyzeWorkflowJson);
                          analyzeWorkflowMutation.mutate(parsedJson);
                        } catch (error) {
                          console.error('Invalid JSON:', error);
                          setIsAnalyzing(false);
                        }
                      }}
                      disabled={isAnalyzing || !analyzeWorkflowJson.trim()}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Analyze Workflow
                        </>
                      )}
                    </Button>
                    
                    {analysisResult && selectedServer && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDownloading(true);
                          downloadRequirementsMutation.mutate({
                            serverId: selectedServer.id,
                            analysis: analysisResult
                          });
                        }}
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Download Requirements
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      onClick={() => setLogs([])}
                      disabled={logs.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              {analysisResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis Results</CardTitle>
                    <CardDescription>
                      Complexity: <Badge variant="outline">{analysisResult.complexity}</Badge>
                      Download Size: <Badge variant="outline">{analysisResult.estimatedDownloadSize}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                    </div>
                    
                    {/* Required Models */}
                    {analysisResult.models && analysisResult.models.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Required Models ({analysisResult.models.length})</h4>
                        <div className="space-y-2">
                          {analysisResult.models.map((model: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{model.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Type: {model.type} • Folder: {model.folder}
                                  </div>
                                  {model.description && (
                                    <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {model.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                  {model.url && <Badge variant="outline" className="text-xs">URL Available</Badge>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Custom Nodes */}
                    {analysisResult.nodes && analysisResult.nodes.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Custom Nodes ({analysisResult.nodes.length})</h4>
                        <div className="space-y-2">
                          {analysisResult.nodes.map((node: any, index: number) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-sm">{node.name}</div>
                                  <div className="text-xs text-muted-foreground">Type: {node.type}</div>
                                  {node.description && (
                                    <div className="text-xs text-muted-foreground mt-1">{node.description}</div>
                                  )}
                                  {node.installCommand && (
                                    <code className="text-xs bg-muted px-1 rounded mt-1 block">{node.installCommand}</code>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {node.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                                  {node.gitUrl && <Badge variant="outline" className="text-xs">Git Available</Badge>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Real-time Logs */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Real-time Logs</CardTitle>
                      <CardDescription>Live progress updates during analysis and downloads</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${wsConnection ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-xs text-muted-foreground">
                        {wsConnection ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                    {logs.length > 0 ? (
                      logs.map((log, index) => (
                        <div key={index} className="flex gap-2 mb-1">
                          <span className="text-gray-500 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`shrink-0 ${
                            log.level === 'error' ? 'text-red-400' :
                            log.level === 'warning' ? 'text-yellow-400' :
                            log.level === 'success' ? 'text-green-400' :
                            'text-blue-400'
                          }`}>
                            [{log.level.toUpperCase()}]
                          </span>
                          <span>{log.message}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No logs yet. Start analyzing a workflow to see real-time progress...</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Generated Images</CardTitle>
                      <CardDescription>Your AI generated images</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchGenerations()}
                      disabled={generationsLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${generationsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {generationsLoading ? (
                    <LoadingCard />
                  ) : generations && Array.isArray(generations) && generations.length > 0 ? (
                    <div className="space-y-4">
                      {generations.map((generation: ComfyGeneration) => (
                        <div key={generation.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge className={getStatusColor(generation.status)}>
                              {generation.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {generation.createdAt ? new Date(generation.createdAt).toLocaleString() : 'Unknown'}
                            </span>
                          </div>
                          
                          {generation.prompt && (
                            <div className="mb-2">
                              <strong>Prompt:</strong> {generation.prompt}
                            </div>
                          )}
                          
                          {generation.imageUrls && Array.isArray(generation.imageUrls) && generation.imageUrls.length > 0 && (
                            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                              {generation.imageUrls.map((url: string, index: number) => (
                                <img 
                                  key={index} 
                                  src={url} 
                                  alt={`Generated image ${index + 1}`}
                                  className="w-full h-48 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                          
                          {generation.errorMessage && (
                            <div className="text-sm text-red-500 mt-2">
                              Error: {generation.errorMessage}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      No generations yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}