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
import { LoadingMascot, MascotPresets } from "@/components/ui/loading-mascot";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Loader2,
  AlertTriangle
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

interface GenerationParams {
  seed: number;
  steps: number;
  cfg: number;
  width: number;
  height: number;
  model?: string;
}

interface VastServer {
  id: number;
  vastId: string;
  name: string;
  gpu: string;
  gpuCount: number;
  cpuCores: number;
  ram: number;
  disk: number;
  pricePerHour: string;
  location: string;
  status: string;
  isLaunched: boolean;
  setupStatus?: string;
  contractId?: string;
  sshConnection?: string;
  publicIp?: string;
  sshPort?: number;
  directSshPort?: number;
  comfyUIUrl?: string;
  comfyUIStatus?: string;
}

interface ComfyWorkflow {
  id: number;
  name: string;
  description?: string;
  category?: string;
  workflowJson: string;
  isTemplate: boolean;
}

interface ComfyGeneration {
  id: number;
  status: string;
  prompt?: string;
  negativePrompt?: string;
  parameters?: string;
  imageUrls?: string[];
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  serverId: number;
}

export default function ComfyUI() {
  const { logout } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [selectedServer, setSelectedServer] = useState<VastServer | null>(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [params, setParams] = useState<GenerationParams>({
    seed: Math.floor(Math.random() * 1000000),
    steps: 20,
    cfg: 7,
    width: 512,
    height: 512
  });
  
  // Workflow state
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [newWorkflowCategory, setNewWorkflowCategory] = useState("text-to-image");
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");

  // Queries
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ["/api/vast-servers"],
    refetchInterval: 5000,
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/comfy/workflows"],
  });

  const { data: generations, isLoading: generationsLoading } = useQuery({
    queryKey: ["/api/comfy/generations", selectedServer?.id],
    enabled: !!selectedServer,
  });

  const { data: availableModels, isLoading: availableModelsLoading, error: availableModelsError } = useQuery({
    queryKey: ["/api/comfy/available-models", selectedServer?.id],
    enabled: !!selectedServer,
    retry: 1,
  });

  // Mutations
  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; negativePrompt: string; params: GenerationParams; workflowId?: number }) => {
      return apiRequest(`/api/comfy/generate`, {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer?.id,
          ...data
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comfy/generations"] });
      toast({
        title: "Generation Started",
        description: "Your image is being generated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start generation",
        variant: "destructive",
      });
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; category: string; workflowJson: string }) => {
      return apiRequest(`/api/comfy/workflows`, {
        method: "POST",
        body: JSON.stringify({
          serverId: selectedServer?.id,
          ...data
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/comfy/workflows"] });
      setShowWorkflowDialog(false);
      setNewWorkflowName("");
      setNewWorkflowDescription("");
      setNewWorkflowCategory("text-to-image");
      toast({
        title: "Workflow Created",
        description: "New workflow has been saved",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Workflow",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const autoSetupMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/comfy/auto-setup`, {
        method: "POST",
        body: JSON.stringify({ serverId: selectedServer?.id }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vast-servers"] });
      toast({
        title: "ComfyUI Setup Started",
        description: "ComfyUI is being installed automatically",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to start ComfyUI setup",
        variant: "destructive",
      });
    },
  });

  // Functions
  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt for image generation",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      prompt,
      negativePrompt,
      params,
      workflowId: selectedWorkflow ? parseInt(selectedWorkflow) : undefined,
    });
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a workflow name",
        variant: "destructive",
      });
      return;
    }

    const workflowJson = JSON.stringify({
      prompt,
      negativePrompt,
      parameters: params,
    });

    createWorkflowMutation.mutate({
      name: newWorkflowName,
      description: newWorkflowDescription,
      category: newWorkflowCategory,
      workflowJson,
    });
  };

  const handleAutoSetupComfyUI = () => {
    if (!selectedServer) {
      toast({
        title: "No Server Selected",
        description: "Please select a server first",
        variant: "destructive",
      });
      return;
    }
    autoSetupMutation.mutate();
  };

  const runningServers = Array.isArray(servers) ? servers.filter((server: VastServer) => 
    server.isLaunched && (server.status === 'running' || server.status === 'loaded')
  ) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'downloading': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-14 items-center px-6">
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="h-auto p-1 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">ComfyUI</span>
          </nav>
          
          <div className="ml-auto flex items-center space-x-2">
            <ThemeSwitcher />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Profile
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
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
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">ComfyUI - AI Image Generation</h1>
          <p className="text-muted-foreground">
            Generate stunning images using ComfyUI on your Vast.ai servers
          </p>
        </div>

        {/* Server Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Server Selection</CardTitle>
            <CardDescription>Choose a running server for ComfyUI operations</CardDescription>
          </CardHeader>
          <CardContent>
            {serversLoading ? (
              <LoadingCard />
            ) : runningServers.length === 0 ? (
              <div className="text-center py-8">
                <Server className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No running servers available</p>
                <p className="text-sm text-gray-500 mt-1">Launch a server from the Vast Servers page</p>
                <Button 
                  onClick={() => navigate("/vast-servers")} 
                  className="mt-3"
                  variant="outline"
                >
                  Go to Servers
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {runningServers.map((server: VastServer) => (
                  <div
                    key={server.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedServer?.id === server.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedServer(server)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{server.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {server.gpu} • {server.ram}GB RAM • {server.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={server.status === 'running' ? 'default' : 'secondary'}>
                          {server.status}
                        </Badge>
                        {server.setupStatus && (
                          <Badge variant={
                            server.setupStatus === 'completed' ? 'default' :
                            server.setupStatus === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {server.setupStatus}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ComfyUI Auto Setup */}
        {selectedServer && !selectedServer.comfyUIStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ComfyUI Setup Required</CardTitle>
              <CardDescription>Install ComfyUI automatically on your server</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedServer.setupStatus === 'in_progress' ? (
                <div className="text-center py-6">
                  <MascotPresets.ComfySetup 
                    status="loading"
                    size="lg"
                    className="mx-auto mb-4"
                  />
                  <h3 className="text-lg font-medium mb-2">Setting up ComfyUI...</h3>
                  <p className="text-muted-foreground">This may take several minutes</p>
                </div>
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Automatic ComfyUI Installation
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    This will install ComfyUI, download essential models, and configure everything automatically.
                  </p>
                  <Button 
                    onClick={() => handleAutoSetupComfyUI()}
                    disabled={autoSetupMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {autoSetupMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Setting up ComfyUI...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Auto-Install ComfyUI
                      </>
                    )}
                  </Button>
                  
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      This will install ComfyUI, download basic models, and start the server automatically.
                    </p>
                  </div>
                  
                  {/* Show mascot during ComfyUI setup */}
                  {autoSetupMutation.isPending && (
                    <div className="mt-4">
                      <MascotPresets.ComfySetup 
                        status="loading"
                        size="md"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedServer && (
          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="generate">Generate</TabsTrigger>
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
                      <Badge variant={
                        availableModelsLoading ? "secondary" : 
                        (availableModels?.status === 'demo-ready' ? "default" : "destructive")
                      } className="text-xs">
                        {availableModelsLoading ? "Checking..." : 
                         availableModels?.status === 'demo-ready' ? "Ready (Demo)" :
                         availableModels?.connectedUrl ? "Connected" : "ComfyUI Offline"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Generate images using AI
                      {availableModels?.message && (
                        <span className="text-green-600 dark:text-green-400"> - {availableModels.message}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {availableModelsError && selectedServer && availableModels?.status !== 'demo-ready' && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>ComfyUI Setup Required</AlertTitle>
                        <AlertDescription className="space-y-3 mt-2">
                          <p>ComfyUI installation completed but server needs to be started manually:</p>
                          
                          <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                            <p><strong>1. Connect to your server:</strong></p>
                            <code className="bg-background p-1 rounded text-xs block">
                              {selectedServer.sshConnection}
                            </code>
                            
                            <p><strong>2. Start ComfyUI:</strong></p>
                            <code className="bg-background p-1 rounded text-xs block">
                              cd ComfyUI && python main.py --listen 0.0.0.0 --port 8188
                            </code>
                            
                            <p><strong>3. ComfyUI will be available at:</strong></p>
                            <code className="bg-background p-1 rounded text-xs block">
                              {selectedServer.comfyUIUrl || `http://${selectedServer.publicIp}:8188`}
                            </code>
                          </div>
                          
                          <p className="text-sm">
                            For model management, visit the server detail page where you can download and manage AI models.
                          </p>
                          
                          <Button
                            onClick={() => navigate(`/server-detail/${selectedServer.id}`)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Go to Server Detail Page
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="prompt">Prompt</Label>
                      <Textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the image you want to generate..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                      <Textarea
                        id="negative-prompt"
                        value={negativePrompt}
                        onChange={(e) => setNegativePrompt(e.target.value)}
                        placeholder="What you don't want in the image..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Width: {params.width}</Label>
                        <Slider
                          value={[params.width]}
                          onValueChange={(value) => setParams({...params, width: value[0]})}
                          max={1024}
                          min={256}
                          step={64}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Height: {params.height}</Label>
                        <Slider
                          value={[params.height]}
                          onValueChange={(value) => setParams({...params, height: value[0]})}
                          max={1024}
                          min={256}
                          step={64}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Steps: {params.steps}</Label>
                        <Slider
                          value={[params.steps]}
                          onValueChange={(value) => setParams({...params, steps: value[0]})}
                          max={50}
                          min={1}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>CFG: {params.cfg}</Label>
                        <Slider
                          value={[params.cfg]}
                          onValueChange={(value) => setParams({...params, cfg: value[0]})}
                          max={20}
                          min={1}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label>Seed</Label>
                        <Input
                          type="number"
                          value={params.seed}
                          onChange={(e) => setParams({...params, seed: parseInt(e.target.value) || 0})}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    {workflows && Array.isArray(workflows) && workflows.length > 0 && (
                      <div>
                        <Label>Workflow (Optional)</Label>
                        <Select value={selectedWorkflow} onValueChange={setSelectedWorkflow}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Choose a workflow" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Default</SelectItem>
                            {workflows.map((workflow: ComfyWorkflow) => (
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
                      disabled={generateMutation.isPending || !prompt.trim()}
                      className="w-full"
                    >
                      {generateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Generation Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Preview</CardTitle>
                    <CardDescription>Generated image will appear here</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generateMutation.isPending ? (
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <LoadingSpinner size="lg" className="mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">Generating image...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Generated image will appear here</p>
                        </div>
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
                                <SelectItem value="image-to-image">Image to Image</SelectItem>
                                <SelectItem value="upscaling">Upscaling</SelectItem>
                                <SelectItem value="inpainting">Inpainting</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowWorkflowDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleCreateWorkflow} disabled={createWorkflowMutation.isPending}>
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
                    <div className="grid gap-4">
                      {workflows.map((workflow: ComfyWorkflow) => (
                        <div key={workflow.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{workflow.name}</h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {workflow.description}
                              </p>
                              <Badge variant="outline" className="mt-2">
                                {workflow.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Palette className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No workflows created yet</p>
                      <p className="text-sm text-gray-500 mt-1">Create custom workflows for repeated use</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analyzer Tab */}
            <TabsContent value="analyzer" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Workflow Analyzer
                  </CardTitle>
                  <CardDescription>
                    Analyze ComfyUI workflows and get optimization suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">AI Workflow Analysis</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload ComfyUI workflows to get intelligent analysis and optimization suggestions powered by AI.
                    </p>
                    <Button disabled>
                      <Brain className="h-4 w-4 mr-2" />
                      Coming Soon
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generation Gallery</CardTitle>
                  <CardDescription>View your generated images</CardDescription>
                </CardHeader>
                <CardContent>
                  {generationsLoading ? (
                    <LoadingCard />
                  ) : generations && Array.isArray(generations) && generations.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {generations.map((generation: ComfyGeneration) => (
                        <div key={generation.id} className="border rounded-lg p-4">
                          <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
                            {generation.imageUrls && generation.imageUrls.length > 0 ? (
                              <img
                                src={generation.imageUrls[0]}
                                alt="Generated"
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant={generation.status === 'completed' ? 'default' : 
                                           generation.status === 'failed' ? 'destructive' : 'secondary'}>
                                {generation.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(generation.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {generation.prompt && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {generation.prompt}
                              </p>
                            )}
                            {generation.errorMessage && (
                              <p className="text-sm text-red-500">
                                {generation.errorMessage}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No generations yet</p>
                      <p className="text-sm text-gray-500 mt-1">Generated images will appear here</p>
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