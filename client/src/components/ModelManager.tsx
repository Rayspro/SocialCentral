import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Trash2,
  FolderOpen,
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  HardDrive,
  Package,
  ExternalLink,
  Filter,
  SortAsc,
  Server,
  Database,
  MoreVertical,
  Edit2,
  Calendar,
  FileText,
} from "lucide-react";
import { ComfyModel } from "@shared/schema";

interface ModelManagerProps {
  serverId: number;
}

interface InstalledModel {
  name: string;
  type: string;
  size: string;
  path: string;
  lastModified: string;
  status: 'ready' | 'downloading' | 'error' | 'pending';
  progress?: number;
  downloadDate?: string;
}

export function ModelManager({ serverId }: ModelManagerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingModel, setEditingModel] = useState<InstalledModel | null>(null);
  const [deleteModel, setDeleteModel] = useState<InstalledModel | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    folder: "checkpoints",
    description: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch downloaded models from database
  const { data: downloadedModels = [], isLoading: loadingDownloaded } = useQuery({
    queryKey: [`/api/comfy/models/${serverId}`],
  });

  // Fetch installed models from ComfyUI instance
  const { data: installedModels = [], isLoading: loadingInstalled } = useQuery({
    queryKey: [`/api/comfy/models/${serverId}/installed`],
  });

  // Fetch library status
  const { data: libraryStatus, isLoading: loadingStatus } = useQuery({
    queryKey: [`/api/comfy/models/${serverId}/library-status`],
  });

  const addModelMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/comfy/models/${serverId}/download`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to start model download: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}`] });
      setShowAddForm(false);
      setFormData({
        name: "",
        url: "",
        folder: "checkpoints",
        description: "",
      });
      toast({
        title: "Model Download Started",
        description: "The model is being downloaded in the background.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: number) => {
      const response = await fetch(`/api/comfy/models/${modelId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete model");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}`] });
      toast({
        title: "Model Deleted",
        description: "The model has been removed from the server.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/comfy/models/${serverId}/refresh`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to refresh models");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}/installed`] });
      toast({
        title: "Models Refreshed",
        description: "Model list has been updated from ComfyUI instance.",
      });
    },
  });

  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/comfy/models/${serverId}/cleanup-failed`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to cleanup models");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}`] });
      toast({
        title: "Cleanup Complete",
        description: "Failed model downloads have been cleaned up.",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    addModelMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "downloading":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "downloading":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const folders = ["all", "checkpoints", "loras", "vae", "controlnet", "upscale_models", "embeddings"];

  const filteredDownloadedModels = Array.isArray(downloadedModels) 
    ? downloadedModels.filter((model: ComfyModel) => {
        const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFolder = selectedFolder === "all" || model.folder === selectedFolder;
        return matchesSearch && matchesFolder;
      })
    : [];

  const filteredInstalledModels = Array.isArray(installedModels)
    ? installedModels.filter((model: InstalledModel) => {
        const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFolder = selectedFolder === "all" || model.type === selectedFolder;
        return matchesSearch && matchesFolder;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header with Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDownloadedModels.length + filteredInstalledModels.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredDownloadedModels.length} downloaded, {filteredInstalledModels.length} installed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(libraryStatus as any)?.storageUsed || "0 B"}</div>
            <p className="text-xs text-muted-foreground">
              Across all model types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready Models</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(libraryStatus as any)?.readyModels || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available for use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloading</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(libraryStatus as any)?.downloadingModels || 0}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-full sm:w-[300px]"
            />
          </div>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder === "all" ? "All Types" : folder.charAt(0).toUpperCase() + folder.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Failed
          </Button>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>
      </div>

      {/* Add Model Form */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">Add New Model</CardTitle>
            <CardDescription>
              Download a model from URL to your ComfyUI instance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Model Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., SDXL Base 1.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="folder">Model Type *</Label>
                  <select
                    id="folder"
                    value={formData.folder}
                    onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                  >
                    <option value="checkpoints">Checkpoints</option>
                    <option value="loras">LoRAs</option>
                    <option value="vae">VAE</option>
                    <option value="controlnet">ControlNet</option>
                    <option value="upscale_models">Upscale Models</option>
                    <option value="embeddings">Embeddings</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="url">Download URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://huggingface.co/..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the model"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={addModelMutation.isPending}
                  className="min-w-[120px]"
                >
                  {addModelMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Start Download
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Model Lists */}
      <Tabs defaultValue="installed" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="installed" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Installed Models ({filteredInstalledModels.length})
          </TabsTrigger>
          <TabsTrigger value="downloaded" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Downloaded Models ({filteredDownloadedModels.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="space-y-4">
          {loadingInstalled ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : filteredInstalledModels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Installed Models Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? 'No models match your search criteria.' : 'No models are currently installed in your ComfyUI instance.'}
                </p>
                <Button onClick={() => refreshMutation.mutate()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh List
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[100px]">Size</TableHead>
                    <TableHead className="w-[140px]">Date</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstalledModels.map((model: InstalledModel, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge 
                          variant={model.status === 'ready' ? 'default' : 
                                  model.status === 'downloading' ? 'secondary' : 
                                  model.status === 'error' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {model.status === 'ready' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {model.status === 'downloading' && <Clock className="h-3 w-3 mr-1" />}
                          {model.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {model.status || 'ready'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm truncate max-w-[200px]" title={model.name}>
                            {model.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={model.path}>
                            {model.path}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm capitalize">{model.type}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{model.size}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{model.downloadDate || model.lastModified}</span>
                          <span className="text-xs text-muted-foreground">Modified</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingModel(model)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteModel(model)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="downloaded" className="space-y-4">
          {loadingDownloaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDownloadedModels.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Download className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Downloaded Models</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ? 'No models match your search criteria.' : 'Start by downloading models from URLs to build your library.'}
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Model
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDownloadedModels.map((model: ComfyModel) => (
                <Card key={model.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium truncate">{model.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {model.folder} • {model.fileSize ? `${(model.fileSize / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(model.status)}
                        <Badge className={`text-xs ${getStatusColor(model.status)}`}>
                          {model.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {model.status === 'downloading' && (
                      <div className="mb-3">
                        <Progress value={model.downloadProgress || 0} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {model.downloadProgress || 0}% complete
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2 text-xs text-muted-foreground mb-3">
                      {model.description && (
                        <p className="line-clamp-2">{model.description}</p>
                      )}
                      {model.url && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-3 w-3" />
                          <a href={model.url} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 hover:underline truncate">
                            View Source
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteModelMutation.mutate(model.id)}
                        disabled={deleteModelMutation.isPending}
                        className="flex-1"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Rename Model Dialog */}
      <Dialog open={!!editingModel} onOpenChange={() => setEditingModel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Model</DialogTitle>
            <DialogDescription>
              Enter a new name for the model "{editingModel?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-name" className="text-right">
                Name
              </Label>
              <Input
                id="new-name"
                defaultValue={editingModel?.name}
                className="col-span-3"
                placeholder="Enter new model name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModel(null)}>
              Cancel
            </Button>
            <Button onClick={() => {
              // TODO: Implement rename functionality
              toast({
                title: "Feature Coming Soon",
                description: "Model renaming will be available in a future update.",
              });
              setEditingModel(null);
            }}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Model Dialog */}
      <Dialog open={!!deleteModel} onOpenChange={() => setDeleteModel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Model</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteModel?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">This will permanently remove:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Model file from ComfyUI instance</li>
                  <li>• All associated data and configurations</li>
                  <li>• Any workflows that depend on this model</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModel(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                // TODO: Implement delete functionality
                toast({
                  title: "Feature Coming Soon",
                  description: "Model deletion will be available in a future update.",
                });
                setDeleteModel(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}