import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  X,
  RefreshCw,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ComfyModel } from "@shared/schema";

interface ModelManagerProps {
  serverId: number;
  trigger?: React.ReactNode;
}

interface ModelLibraryStatus {
  totalModels: number;
  readyModels: number;
  downloadingModels: number;
  failedModels: number;
  storageUsed: string;
}

const MODEL_FOLDERS = [
  { value: "checkpoints", label: "Checkpoints" },
  { value: "loras", label: "LoRAs" },
  { value: "vae", label: "VAE Models" },
  { value: "controlnet", label: "ControlNet" },
  { value: "upscale_models", label: "Upscale Models" },
  { value: "embeddings", label: "Embeddings" },
];

export function ModelManager({ serverId, trigger }: ModelManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModel, setShowAddModel] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all models for the server
  const { data: models = [], isLoading } = useQuery({
    queryKey: [`/api/comfy/models/${serverId}`],
    enabled: isOpen,
  });

  // Fetch library status
  const { data: libraryStatus } = useQuery<ModelLibraryStatus>({
    queryKey: [`/api/comfy/models/${serverId}/library-status`],
    enabled: isOpen,
  });

  // Delete model mutation
  const deleteModelMutation = useMutation({
    mutationFn: async (modelId: number) => {
      await apiRequest(`/api/comfy/models/${modelId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}/library-status`] });
      toast({
        title: "Success",
        description: "Model deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cleanup failed downloads mutation
  const cleanupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/comfy/models/${serverId}/cleanup-failed`, {
        method: "POST",
      });
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}/library-status`] });
      toast({
        title: "Cleanup Complete",
        description: `Removed ${data.deletedCount} failed downloads`,
      });
    },
  });

  // Filter models based on folder and search
  const filteredModels = models.filter((model: ComfyModel) => {
    const folderMatch = selectedFolder === "all" || model.folder === selectedFolder;
    const searchMatch = searchQuery === "" || 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return folderMatch && searchMatch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "downloading":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>;
      case "downloading":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Downloading</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-2" />
            Manage Models
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Model Library - Server {serverId}
          </DialogTitle>
        </DialogHeader>

        {/* Library Status Cards */}
        {libraryStatus && (
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Models</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {libraryStatus.totalModels}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Ready</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {libraryStatus.readyModels}
              </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
              <div className="text-sm text-yellow-600 dark:text-yellow-400">Downloading</div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {libraryStatus.downloadingModels}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {libraryStatus.failedModels}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-sm text-purple-600 dark:text-purple-400">Storage Used</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {libraryStatus.storageUsed}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
          
          <Select value={selectedFolder} onValueChange={setSelectedFolder}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {MODEL_FOLDERS.map((folder) => (
                <SelectItem key={folder.value} value={folder.value}>
                  {folder.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button
            variant="outline"
            size="sm"
            onClick={() => cleanupMutation.mutate()}
            disabled={cleanupMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Cleanup Failed
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddModel(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </Button>
        </div>

        {/* Models Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading models...
                  </TableCell>
                </TableRow>
              ) : filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No models found
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model: ComfyModel) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        {model.description && (
                          <div className="text-sm text-muted-foreground">
                            {model.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MODEL_FOLDERS.find(f => f.value === model.folder)?.label || model.folder}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(model.status)}
                        {getStatusBadge(model.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {model.status === "downloading" && model.downloadProgress !== null ? (
                        <div className="space-y-1">
                          <Progress value={model.downloadProgress} className="w-20" />
                          <div className="text-xs text-muted-foreground">
                            {model.downloadProgress}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatFileSize(model.fileSize)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteModelMutation.mutate(model.id)}
                        disabled={deleteModelMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Add Model Dialog */}
        {showAddModel && (
          <AddModelDialog
            serverId={serverId}
            onClose={() => setShowAddModel(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}`] });
              queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}/library-status`] });
              setShowAddModel(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AddModelDialogProps {
  serverId: number;
  onClose: () => void;
  onSuccess: () => void;
}

function AddModelDialog({ serverId, onClose, onSuccess }: AddModelDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    folder: "checkpoints",
    description: "",
  });
  const { toast } = useToast();

  const addModelMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      await apiRequest(`/api/comfy/models/${serverId}/download`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Model download started",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addModelMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Model</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Model Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="url">Download URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="folder">Folder</Label>
            <Select
              value={formData.folder}
              onValueChange={(value) => setFormData({ ...formData, folder: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_FOLDERS.map((folder) => (
                  <SelectItem key={folder.value} value={folder.value}>
                    {folder.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addModelMutation.isPending}>
              {addModelMutation.isPending ? "Adding..." : "Add Model"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}