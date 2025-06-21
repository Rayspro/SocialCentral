import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  Trash2, 
  Server, 
  Calendar,
  PlayCircle,
  Settings,
  FileText,
  Workflow,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface WorkflowWithModels {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  serverId: number | null;
  workflowJson: string;
  isTemplate: boolean | null;
  createdAt: string;
  updatedAt: string;
  server?: {
    id: number;
    name: string;
    status: string;
  };
  modelInstances: {
    id: number;
    name: string;
    status: string;
    serverId: number | null;
    downloadProgress: number | null;
    errorMessage: string | null;
  }[];
  analysisResults?: {
    id: number;
    requiredModels: any[];
    missingModels: any[];
    analysisStatus: string;
    downloadStatus: string;
  }[];
}

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowWithModels | null>(null);
  const queryClient = useQueryClient();

  // Breadcrumb navigation
  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Workflows", href: "/workflows" }
  ];

  // Fetch all workflows with their model instances
  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["/api/workflows/with-models"],
    queryFn: async () => {
      const response = await fetch("/api/workflows/with-models");
      if (!response.ok) throw new Error("Failed to fetch workflows");
      return response.json();
    }
  });

  // Fetch all servers for context
  const { data: servers = [] } = useQuery({
    queryKey: ["/api/vast-servers"]
  });

  // Sync workflow models mutation
  const syncModelsMutation = useMutation({
    mutationFn: async (workflowId: number) => {
      return apiRequest(`/api/workflows/${workflowId}/sync-models`, {
        method: "POST"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows/with-models"] });
      toast({
        title: "Models Synced",
        description: "Workflow model instances have been synchronized."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: async (workflowId: number) => {
      return apiRequest(`/api/workflows/${workflowId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows/with-models"] });
      toast({
        title: "Workflow Deleted",
        description: "Workflow has been removed successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Filter workflows based on search and category
  const filteredWorkflows = workflows.filter((workflow: WorkflowWithModels) => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || workflow.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(workflows.map((w: WorkflowWithModels) => w.category).filter(Boolean)));

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      downloading: { variant: "secondary" as const, icon: RefreshCw, color: "text-blue-600" },
      error: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
      failed: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center">
                  {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-gray-900 dark:text-gray-100">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link href="/workflow-composer">
                  <Workflow className="h-4 w-4 mr-2" />
                  Create Workflow
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Workflow className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Workflow Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage all your ComfyUI workflows and their model dependencies
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Workflows Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No workflows found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Create your first workflow to get started"
                }
              </p>
              <Button asChild>
                <Link href="/workflow-composer">
                  <Workflow className="h-4 w-4 mr-2" />
                  Create Workflow
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow: WorkflowWithModels) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1 line-clamp-1">
                        {workflow.name}
                      </CardTitle>
                      {workflow.category && (
                        <Badge variant="outline" className="text-xs">
                          {workflow.category}
                        </Badge>
                      )}
                    </div>
                    {workflow.isTemplate && (
                      <Badge variant="secondary" className="ml-2">
                        Template
                      </Badge>
                    )}
                  </div>
                  {workflow.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-2">
                      {workflow.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Server Info */}
                  {workflow.server && (
                    <div className="flex items-center gap-2 text-sm">
                      <Server className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {workflow.server.name}
                      </span>
                      {getStatusBadge(workflow.server.status)}
                    </div>
                  )}

                  {/* Model Instances Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Model Dependencies
                      </span>
                      <span className="text-gray-500">
                        {workflow.modelInstances.length} models
                      </span>
                    </div>
                    
                    {workflow.modelInstances.length > 0 && (
                      <div className="grid grid-cols-2 gap-1">
                        {workflow.modelInstances.slice(0, 4).map((model) => (
                          <div key={model.id} className="flex items-center gap-1 text-xs">
                            {getStatusBadge(model.status)}
                            <span className="truncate">{model.name}</span>
                          </div>
                        ))}
                        {workflow.modelInstances.length > 4 && (
                          <div className="text-xs text-gray-500 col-span-2">
                            +{workflow.modelInstances.length - 4} more...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Workflow Details: {selectedWorkflow?.name}</DialogTitle>
                        </DialogHeader>
                        {selectedWorkflow && (
                          <WorkflowDetailsModal 
                            workflow={selectedWorkflow} 
                            onSync={() => syncModelsMutation.mutate(selectedWorkflow.id)}
                            syncPending={syncModelsMutation.isPending}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncModelsMutation.mutate(workflow.id)}
                      disabled={syncModelsMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncModelsMutation.isPending ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteWorkflowMutation.mutate(workflow.id)}
                      disabled={deleteWorkflowMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-500 flex items-center gap-2 pt-2">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(workflow.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Workflow Details Modal Component
function WorkflowDetailsModal({ 
  workflow, 
  onSync, 
  syncPending 
}: { 
  workflow: WorkflowWithModels; 
  onSync: () => void; 
  syncPending: boolean; 
}) {
  return (
    <div className="space-y-6">
      {/* Workflow Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Basic Information</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Name:</strong> {workflow.name}</div>
            <div><strong>Category:</strong> {workflow.category || "Uncategorized"}</div>
            <div><strong>Template:</strong> {workflow.isTemplate ? "Yes" : "No"}</div>
            {workflow.server && (
              <div><strong>Server:</strong> {workflow.server.name}</div>
            )}
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {workflow.description || "No description provided"}
          </p>
        </div>
      </div>

      {/* Model Dependencies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium">Model Dependencies ({workflow.modelInstances.length})</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={syncPending}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${syncPending ? 'animate-spin' : ''}`} />
            Sync Models
          </Button>
        </div>
        
        {workflow.modelInstances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No model dependencies found
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {workflow.modelInstances.map((model) => (
              <Card key={model.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{model.name}</span>
                  {getStatusBadge(model.status)}
                </div>
                {model.downloadProgress !== null && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${model.downloadProgress}%` }}
                    ></div>
                  </div>
                )}
                {model.errorMessage && (
                  <div className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {model.errorMessage}
                  </div>
                )}
                {model.serverId && (
                  <div className="text-xs text-gray-500 mt-1">
                    Server ID: {model.serverId}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {workflow.analysisResults && workflow.analysisResults.length > 0 && (
        <div>
          <h4 className="font-medium mb-4">Analysis History</h4>
          <div className="space-y-3">
            {workflow.analysisResults.map((analysis) => (
              <Card key={analysis.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">Analysis #{analysis.id}</span>
                  <div className="flex gap-2">
                    {getStatusBadge(analysis.analysisStatus)}
                    {getStatusBadge(analysis.downloadStatus)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Required Models:</strong> {analysis.requiredModels.length}
                  </div>
                  <div>
                    <strong>Missing Models:</strong> {analysis.missingModels.length}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Workflow JSON Preview */}
      <div>
        <h4 className="font-medium mb-2">Workflow JSON</h4>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 max-h-60 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify(JSON.parse(workflow.workflowJson), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status: string) {
  const statusConfig = {
    completed: { variant: "default" as const, icon: CheckCircle, color: "text-green-600" },
    pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
    downloading: { variant: "secondary" as const, icon: RefreshCw, color: "text-blue-600" },
    error: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" },
    failed: { variant: "destructive" as const, icon: AlertCircle, color: "text-red-600" }
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1 text-xs">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {status}
    </Badge>
  );
}