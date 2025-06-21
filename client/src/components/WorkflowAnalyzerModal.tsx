import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  AlertTriangle,
  CheckCircle,
  Package,
  Download,
  FileText,
  Search,
  Loader2,
  ExternalLink,
  Copy,
  Zap,
  Target,
  Settings,
  Clock,
  Upload
} from "lucide-react";

interface WorkflowAnalyzerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: number;
}

interface AnalysisResult {
  id: number;
  workflowName: string;
  requiredModels: Array<{
    name: string;
    type: string;
    url?: string;
    size?: string;
    status: 'available' | 'missing' | 'downloading';
  }>;
  missingNodes: Array<{
    name: string;
    type: string;
    description?: string;
    installUrl?: string;
  }>;
  analysisStatus: 'pending' | 'analyzing' | 'completed' | 'error';
  downloadStatus: 'idle' | 'downloading' | 'completed' | 'error';
  createdAt: string;
}

export function WorkflowAnalyzerModal({ open, onOpenChange, serverId }: WorkflowAnalyzerModalProps) {
  const [workflowJson, setWorkflowJson] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeWorkflowMutation = useMutation({
    mutationFn: async ({ workflowJson, workflowName }: { workflowJson: string; workflowName: string }) => {
      const response = await fetch(`/api/comfy/analyze-workflow/${serverId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowJson,
          workflowName: workflowName || "Unnamed Workflow",
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to analyze workflow");
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setAnalysisResult(result);
      setActiveTab("results");
      toast({
        title: "Analysis Complete",
        description: "Workflow has been analyzed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadRequirementsMutation = useMutation({
    mutationFn: async (analysisId: number) => {
      const response = await fetch(`/api/comfy/${serverId}/download-requirements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysisId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start downloads");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Downloads Started",
        description: "Missing models are being downloaded in the background.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/comfy/models/${serverId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAnalyze = () => {
    if (!workflowJson.trim()) {
      toast({
        title: "Validation Error",
        description: "Please paste a workflow JSON.",
        variant: "destructive",
      });
      return;
    }

    try {
      JSON.parse(workflowJson);
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please check your workflow JSON format.",
        variant: "destructive",
      });
      return;
    }

    analyzeWorkflowMutation.mutate({ workflowJson, workflowName });
  };

  const handleCopyNodeList = () => {
    if (!analysisResult) return;
    
    const nodeList = analysisResult.missingNodes
      .map(node => `${node.name} (${node.type})`)
      .join('\n');
    
    navigator.clipboard.writeText(nodeList);
    toast({
      title: "Copied",
      description: "Missing nodes list copied to clipboard.",
    });
  };

  const handleReset = () => {
    setWorkflowJson("");
    setWorkflowName("");
    setAnalysisResult(null);
    setActiveTab("upload");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            ComfyUI Workflow Analyzer
          </DialogTitle>
          <DialogDescription>
            Analyze ComfyUI workflows to detect required models and missing nodes
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload & Analyze
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!analysisResult} className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analysis Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="workflow-name">Workflow Name (Optional)</Label>
                <input
                  id="workflow-name"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  placeholder="Enter a name for this workflow"
                  className="w-full px-3 py-2 border rounded-md bg-background text-sm mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="workflow-json">Workflow JSON</Label>
                <Textarea
                  id="workflow-json"
                  value={workflowJson}
                  onChange={(e) => setWorkflowJson(e.target.value)}
                  placeholder="Paste your ComfyUI workflow JSON here..."
                  className="min-h-[200px] font-mono text-sm mt-1"
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">How to get workflow JSON:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Open ComfyUI in your browser</li>
                      <li>• Load your workflow</li>
                      <li>• Click "Save (API Format)" button</li>
                      <li>• Copy the JSON and paste it above</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {analysisResult && (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {/* Analysis Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Analysis Summary
                      </CardTitle>
                      <CardDescription>
                        Workflow: {analysisResult.workflowName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Required Models</span>
                            <Badge variant="secondary">{analysisResult.requiredModels.length}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium">Missing Nodes</span>
                            <Badge variant={analysisResult.missingNodes.length > 0 ? "destructive" : "secondary"}>
                              {analysisResult.missingNodes.length}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Analyzed {new Date(analysisResult.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Required Models */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Required Models ({analysisResult.requiredModels.length})
                        </CardTitle>
                        {analysisResult.requiredModels.some(m => m.status === 'missing') && (
                          <Button
                            size="sm"
                            onClick={() => downloadRequirementsMutation.mutate(analysisResult.id)}
                            disabled={downloadRequirementsMutation.isPending}
                          >
                            {downloadRequirementsMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            Download Missing
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResult.requiredModels.map((model, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{model.name}</span>
                                <Badge variant="outline" className="text-xs">{model.type}</Badge>
                                {model.size && (
                                  <span className="text-xs text-muted-foreground">{model.size}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  model.status === 'available' ? 'default' :
                                  model.status === 'downloading' ? 'secondary' : 'destructive'
                                }
                                className="text-xs"
                              >
                                {model.status === 'available' && <CheckCircle className="h-3 w-3 mr-1" />}
                                {model.status === 'downloading' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                {model.status === 'missing' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                {model.status}
                              </Badge>
                              {model.url && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={model.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Missing Nodes */}
                  {analysisResult.missingNodes.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            Missing Nodes ({analysisResult.missingNodes.length})
                          </CardTitle>
                          <Button variant="outline" size="sm" onClick={handleCopyNodeList}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy List
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analysisResult.missingNodes.map((node, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{node.name}</span>
                                  <Badge variant="outline" className="text-xs">{node.type}</Badge>
                                </div>
                                {node.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{node.description}</p>
                                )}
                              </div>
                              {node.installUrl && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={node.installUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-2" />
                                    Install
                                  </a>
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {activeTab === "upload" && (
            <Button 
              onClick={handleAnalyze}
              disabled={analyzeWorkflowMutation.isPending || !workflowJson.trim()}
            >
              {analyzeWorkflowMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Analyze Workflow
            </Button>
          )}
          {activeTab === "results" && (
            <Button onClick={handleReset}>
              <Upload className="h-4 w-4 mr-2" />
              Analyze Another
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}