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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Brain,
  Package,
  Play,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { WorkflowAnalysis } from "@shared/schema";

interface WorkflowAnalyzerProps {
  serverId: number;
  trigger?: React.ReactNode;
}

interface ModelRequirement {
  name: string;
  type: string;
  url?: string;
  description?: string;
  required: boolean;
}

export function WorkflowAnalyzer({ serverId, trigger }: WorkflowAnalyzerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflow analyses for the server
  const { data: analyses = [], isLoading } = useQuery({
    queryKey: [`/api/comfy/workflow-analysis/${serverId}`],
    enabled: isOpen,
  });

  // Delete analysis mutation
  const deleteAnalysisMutation = useMutation({
    mutationFn: async (analysisId: number) => {
      const response = await fetch(`/api/comfy/workflow-analysis/${analysisId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete analysis: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/workflow-analysis/${serverId}`] });
      toast({
        title: "Success",
        description: "Analysis deleted successfully",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDownloadStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Complete</Badge>;
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            Workflow Analyzer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Workflow Analyzer - Server {serverId}
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Intelligent Workflow Analysis
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Upload ComfyUI workflow JSON files to automatically detect required models, 
                check for missing dependencies, and download them automatically. Prevents 
                duplicate downloads and ensures your workflows run smoothly.
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="default"
            onClick={() => setShowAnalyzeDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Analyze Workflow
          </Button>
          
          <div className="flex-1" />
          
          <div className="text-sm text-muted-foreground">
            {analyses.length} analyses
          </div>
        </div>

        {/* Analyses Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow Name</TableHead>
                <TableHead>Analysis Status</TableHead>
                <TableHead>Download Status</TableHead>
                <TableHead>Required Models</TableHead>
                <TableHead>Missing Models</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading analyses...
                  </TableCell>
                </TableRow>
              ) : analyses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div className="text-muted-foreground">No workflow analyses yet</div>
                      <div className="text-sm text-muted-foreground">
                        Upload a ComfyUI workflow to get started
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                analyses.map((analysis: WorkflowAnalysis) => {
                  const requiredModels = Array.isArray(analysis.requiredModels) 
                    ? analysis.requiredModels 
                    : [];
                  const missingModels = Array.isArray(analysis.missingModels) 
                    ? analysis.missingModels 
                    : [];

                  return (
                    <TableRow key={analysis.id}>
                      <TableCell>
                        <div className="font-medium">{analysis.workflowName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(analysis.analysisStatus)}
                          {getStatusBadge(analysis.analysisStatus)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDownloadStatusBadge(analysis.downloadStatus)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {requiredModels.length}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {missingModels.length > 0 ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {missingModels.length}
                          </Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-100 text-green-800 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            0
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AnalysisDetailsDialog analysis={analysis} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteAnalysisMutation.mutate(analysis.id)}
                            disabled={deleteAnalysisMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Analyze Workflow Dialog */}
        {showAnalyzeDialog && (
          <AnalyzeWorkflowDialog
            serverId={serverId}
            onClose={() => setShowAnalyzeDialog(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: [`/api/comfy/workflow-analysis/${serverId}`] });
              setShowAnalyzeDialog(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AnalyzeWorkflowDialogProps {
  serverId: number;
  onClose: () => void;
  onSuccess: () => void;
}

function AnalyzeWorkflowDialog({ serverId, onClose, onSuccess }: AnalyzeWorkflowDialogProps) {
  const [formData, setFormData] = useState({
    workflowName: "",
    workflowJson: "",
  });
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/comfy/analyze-workflow/${serverId}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to analyze workflow: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      const requiredModels = Array.isArray(data.requiredModels) ? data.requiredModels : [];
      const missingModels = Array.isArray(data.missingModels) ? data.missingModels : [];
      
      toast({
        title: "Analysis Complete",
        description: `Found ${requiredModels.length} required models, ${missingModels.length} missing`,
      });
      
      if (missingModels.length > 0) {
        toast({
          title: "Auto-Download Started",
          description: `Downloading ${missingModels.length} missing models automatically`,
        });
      }
      
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      JSON.parse(formData.workflowJson);
      analyzeMutation.mutate(formData);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please provide valid JSON workflow data",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        JSON.parse(content); // Validate JSON
        
        setFormData({
          ...formData,
          workflowName: formData.workflowName || file.name.replace('.json', ''),
          workflowJson: content,
        });
      } catch (error) {
        toast({
          title: "Invalid File",
          description: "Please upload a valid JSON file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analyze ComfyUI Workflow</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="workflowName">Workflow Name</Label>
            <Input
              id="workflowName"
              value={formData.workflowName}
              onChange={(e) => setFormData({ ...formData, workflowName: e.target.value })}
              placeholder="Enter workflow name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="file">Upload Workflow JSON</Label>
            <Input
              id="file"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="mb-2"
            />
            <div className="text-sm text-muted-foreground">
              Upload a ComfyUI workflow JSON file or paste JSON below
            </div>
          </div>
          
          <div>
            <Label htmlFor="workflowJson">Workflow JSON</Label>
            <Textarea
              id="workflowJson"
              value={formData.workflowJson}
              onChange={(e) => setFormData({ ...formData, workflowJson: e.target.value })}
              placeholder="Paste ComfyUI workflow JSON here..."
              className="h-32 font-mono text-sm"
              required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={analyzeMutation.isPending}>
              {analyzeMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Analyze Workflow
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AnalysisDetailsDialogProps {
  analysis: WorkflowAnalysis;
}

function AnalysisDetailsDialog({ analysis }: AnalysisDetailsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const requiredModels: ModelRequirement[] = Array.isArray(analysis.requiredModels) 
    ? analysis.requiredModels as ModelRequirement[]
    : [];
  const missingModels: ModelRequirement[] = Array.isArray(analysis.missingModels) 
    ? analysis.missingModels as ModelRequirement[]
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Analysis Details: {analysis.workflowName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-600 dark:text-blue-400">Analysis Status</div>
              <div className="text-lg font-medium text-blue-900 dark:text-blue-100">
                {analysis.analysisStatus}
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-sm text-green-600 dark:text-green-400">Download Status</div>
              <div className="text-lg font-medium text-green-900 dark:text-green-100">
                {analysis.downloadStatus}
              </div>
            </div>
          </div>

          {/* Required Models */}
          <div>
            <h3 className="text-lg font-medium mb-3">Required Models ({requiredModels.length})</h3>
            {requiredModels.length > 0 ? (
              <div className="space-y-2">
                {requiredModels.map((model, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Type: {model.type} {model.required && "• Required"}
                      </div>
                      {model.description && (
                        <div className="text-sm text-muted-foreground">{model.description}</div>
                      )}
                    </div>
                    <Badge variant="outline">{model.type}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No models detected in workflow
              </div>
            )}
          </div>

          {/* Missing Models */}
          <div>
            <h3 className="text-lg font-medium mb-3">Missing Models ({missingModels.length})</h3>
            {missingModels.length > 0 ? (
              <div className="space-y-2">
                {missingModels.map((model, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <div className="font-medium text-red-900 dark:text-red-100">{model.name}</div>
                      <div className="text-sm text-red-700 dark:text-red-300">
                        Type: {model.type} {model.required && "• Required"}
                      </div>
                      {model.description && (
                        <div className="text-sm text-red-700 dark:text-red-300">{model.description}</div>
                      )}
                      {model.url && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Download URL available
                        </div>
                      )}
                    </div>
                    <Badge variant="destructive">{model.type}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-green-600 dark:text-green-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                All required models are available!
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}