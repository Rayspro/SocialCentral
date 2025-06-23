import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Terminal,
  Download,
  Package,
  Server,
  Trash2,
  RotateCcw,
  Clock,
  Zap,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface ComfyUISetupTabProps {
  serverId: number;
  serverData: any;
  executions: any[];
  isLoadingExecutions: boolean;
  onSetupComplete: () => void;
}

interface SetupStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export function ComfyUISetupTab({ 
  serverId, 
  serverData, 
  executions, 
  isLoadingExecutions,
  onSetupComplete 
}: ComfyUISetupTabProps) {
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: 'deps',
      name: 'Install Dependencies',
      description: 'Installing system dependencies and Python packages',
      status: 'pending',
      progress: 0
    },
    {
      id: 'environment',
      name: 'Setup Environment',
      description: 'Configuring Python virtual environment',
      status: 'pending',
      progress: 0
    },
    {
      id: 'comfyui',
      name: 'Clone ComfyUI',
      description: 'Downloading ComfyUI repository from GitHub',
      status: 'pending',
      progress: 0
    },
    {
      id: 'requirements',
      name: 'Install Requirements',
      description: 'Installing ComfyUI Python dependencies',
      status: 'pending',
      progress: 0
    },
    {
      id: 'models',
      name: 'Download Models',
      description: 'Downloading base models (SDXL, VAE)',
      status: 'pending',
      progress: 0
    },
    {
      id: 'startup',
      name: 'Start Server',
      description: 'Starting ComfyUI server on port 8188',
      status: 'pending',
      progress: 0
    }
  ]);

  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [setupLogs, setSetupLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get latest setup execution (scriptId 1) and latest reset execution (scriptId 2)
  const setupExecutions = executions?.filter(e => e.scriptId === 1) || [];
  const resetExecutions = executions?.filter(e => e.scriptId === 2) || [];
  
  const latestSetupExecution = setupExecutions
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  
  const latestResetExecution = resetExecutions
    ?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  
  // Use setup execution for setup logs, reset execution for reset logs
  const latestExecution = latestSetupExecution;

  // Determine setup status
  const setupStatus = serverData?.setupStatus || 'pending';
  const isSetupRunning = setupStatus === 'running' || latestExecution?.status === 'running';
  const isSetupComplete = setupStatus === 'ready' || setupStatus === 'demo-ready' || latestExecution?.status === 'completed';
  const isSetupFailed = setupStatus === 'failed' || latestExecution?.status === 'failed';
  const needsSetup = !isSetupComplete && !isSetupRunning;

  // Parse execution output for progress tracking
  useEffect(() => {
    if (latestExecution?.output) {
      const logs = latestExecution.output.split('\n').filter((line: string) => line.trim());
      // Only show setup logs for setup executions (scriptId 1)
      if (latestExecution.scriptId === 1) {
        setSetupLogs(logs);
      } else {
        setSetupLogs([]); // Clear logs if not a setup execution
      }
      
      // Update steps based on logs
      const updatedSteps = [...setupSteps];
      let completedSteps = 0;
      
      // Handle setup progress - only process setup executions
      if (latestExecution?.scriptId === 1) {
        // Handle setup progress - original logic
        logs.forEach((log: string) => {
          if (log.includes('Installing system dependencies') || log.includes('Step 1/6') || log.includes('Step 2/6')) {
            updatedSteps[0].status = 'running';
            updatedSteps[0].progress = 50;
            setCurrentStep('deps');
          } else if (log.includes('Python environment') || log.includes('Step 3/6')) {
            updatedSteps[0].status = 'completed';
            updatedSteps[0].progress = 100;
            updatedSteps[1].status = 'running';
            updatedSteps[1].progress = 50;
            setCurrentStep('environment');
            completedSteps = 1;
          } else if (log.includes('Cloning ComfyUI') || log.includes('Step 4/6')) {
            updatedSteps[1].status = 'completed';
            updatedSteps[1].progress = 100;
            updatedSteps[2].status = 'running';
            updatedSteps[2].progress = 30;
            setCurrentStep('comfyui');
            completedSteps = 2;
          } else if (log.includes('Installing ComfyUI requirements') || log.includes('Step 5/6')) {
            updatedSteps[2].status = 'completed';
            updatedSteps[2].progress = 100;
            updatedSteps[3].status = 'running';
            updatedSteps[3].progress = 20;
            setCurrentStep('requirements');
            completedSteps = 3;
          } else if (log.includes('Downloading') && log.includes('model') || log.includes('Step 6/6')) {
            updatedSteps[3].status = 'completed';
            updatedSteps[3].progress = 100;
            updatedSteps[4].status = 'running';
            updatedSteps[4].progress = 60;
            setCurrentStep('models');
            completedSteps = 4;
          } else if (log.includes('Starting ComfyUI server') || log.includes('main.py')) {
            updatedSteps[4].status = 'completed';
            updatedSteps[4].progress = 100;
            updatedSteps[5].status = 'running';
            updatedSteps[5].progress = 80;
            setCurrentStep('startup');
            completedSteps = 5;
          } else if (log.includes('Setup Complete') || log.includes('SUCCESS')) {
            updatedSteps.forEach(step => {
              step.status = 'completed';
              step.progress = 100;
            });
            setCurrentStep(null);
            completedSteps = 6;
          } else if (log.includes('ERROR') || log.includes('FAILED')) {
            const currentStepIndex = updatedSteps.findIndex(step => step.status === 'running');
            if (currentStepIndex >= 0) {
              updatedSteps[currentStepIndex].status = 'failed';
              updatedSteps[currentStepIndex].error = log;
            }
          }
        });
        
        setSetupSteps(updatedSteps);
        setOverallProgress((completedSteps / 6) * 100);
      }
    }
  }, [latestExecution?.output]);

  // Calculate reset progress separately
  const getResetProgress = () => {
    if (!latestResetExecution?.output) return { progress: 0, currentStep: '', isRunning: false };
    
    const logs = latestResetExecution.output.split('\n').filter((line: string) => line.trim());
    let completedSteps = 0;
    let currentStep = '';
    
    logs.forEach((log: string) => {
      if (log.includes('Step 1/4')) {
        completedSteps = Math.max(completedSteps, 1);
        currentStep = 'Stopping ComfyUI processes...';
      } else if (log.includes('Step 2/4')) {
        completedSteps = Math.max(completedSteps, 2);
        currentStep = 'Removing ComfyUI installation...';
      } else if (log.includes('Step 3/4')) {
        completedSteps = Math.max(completedSteps, 3);
        currentStep = 'Cleaning up models and cache...';
      } else if (log.includes('Step 4/4')) {
        completedSteps = Math.max(completedSteps, 4);
        currentStep = 'Resetting server status...';
      } else if (log.includes('Cleanup Complete')) {
        completedSteps = 4;
        currentStep = 'Reset complete';
      }
    });
    
    return {
      progress: (completedSteps / 4) * 100,
      currentStep,
      isRunning: latestResetExecution.status === 'running'
    };
  };

  // Setup ComfyUI mutation
  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/comfy/startup/${serverId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Setup failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Setup Started",
        description: `ComfyUI installation initiated. Estimated time: ${data.estimatedTime || '10-15 minutes'}`,
      });
      onSetupComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Setup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset/cleanup mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/comfy/${serverId}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Reset failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset Complete",
        description: "ComfyUI has been cleaned up. You can now start a fresh setup.",
      });
      // Reset local state
      setSetupSteps(prev => prev.map(step => ({
        ...step,
        status: 'pending',
        progress: 0,
        error: undefined
      })));
      setSetupLogs([]);
      setCurrentStep(null);
      setOverallProgress(0);
      onSetupComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
      case 'demo-ready':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Ready</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Setting Up
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Not Setup</Badge>;
    }
  };

  const getStepIcon = (step: SetupStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ComfyUI Setup Status
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-2">
                <span>Current Status:</span>
                {getStatusBadge(setupStatus)}
              </CardDescription>
            </div>
            {serverData?.serverUrl && isSetupComplete && (
              <Button variant="outline" size="sm" asChild>
                <a href={serverData.serverUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open ComfyUI
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isSetupRunning && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="w-full h-2" />
              </div>
              {currentStep && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {setupSteps.find(s => s.id === currentStep)?.name}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    {setupSteps.find(s => s.id === currentStep)?.description}
                  </p>
                </div>
              )}
            </div>
          )}

          {needsSetup && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ComfyUI Setup Required
                  </p>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                  Your server is running but ComfyUI needs to be installed and configured for AI workloads.
                </p>
              </div>
              
              <Button
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
                className="w-full"
                size="lg"
              >
                {setupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initiating Setup...
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ComfyUI is Ready
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Reset
                </Button>
              </div>
              {serverData?.serverUrl && (
                <div className="mt-2">
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Access ComfyUI at: <a 
                      href={serverData.serverUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:no-underline font-medium"
                    >
                      {serverData.serverUrl}
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}

          {isSetupFailed && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Setup Failed
                  </p>
                </div>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  ComfyUI setup encountered an error. Check the logs below for details.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => setupMutation.mutate()}
                  disabled={setupMutation.isPending}
                  className="flex-1"
                >
                  {setupMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Setup
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clean & Reset
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Progress Display */}
      {(resetMutation.isPending || getResetProgress().isRunning) && latestResetExecution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Reset Progress
            </CardTitle>
            <CardDescription>
              ComfyUI cleanup and reset operation in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium">
                  {getResetProgress().currentStep || 'Initializing reset...'}
                </span>
              </div>
              <Progress value={getResetProgress().progress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Progress: {Math.round(getResetProgress().progress)}% complete
              </p>
              
              {/* Reset Logs */}
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Reset Logs</h4>
                <ScrollArea className="h-32 w-full border rounded-md p-3 bg-black text-red-400 font-mono text-xs">
                  {latestResetExecution.output?.split('\n').filter((line: string) => line.trim()).map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-500">[{format(new Date(), 'HH:mm:ss')}]</span> {log}
                    </div>
                  ))}
                  {getResetProgress().isRunning && (
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-gray-500">[{format(new Date(), 'HH:mm:ss')}]</span>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="animate-pulse">Resetting...</span>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Step Progress */}
      {(isSetupRunning || isSetupComplete || isSetupFailed) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Setup Progress Details
            </CardTitle>
            <CardDescription>
              Detailed breakdown of the ComfyUI installation process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {setupSteps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="flex-shrink-0">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{step.name}</p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {step.progress}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                    {step.progress > 0 && step.progress < 100 && (
                      <Progress value={step.progress} className="w-full h-1 mt-2" />
                    )}
                    {step.error && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-mono">
                        {step.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Logs */}
      {setupLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Setup Logs
            </CardTitle>
            <CardDescription>
              Real-time installation logs from the server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64 w-full border rounded-md p-3 bg-black text-green-400 font-mono text-xs">
              {setupLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-500">[{format(new Date(), 'HH:mm:ss')}]</span> {log}
                </div>
              ))}
              {isSetupRunning && (
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-gray-500">[{format(new Date(), 'HH:mm:ss')}]</span>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="animate-pulse">Processing...</span>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Execution History */}
      {executions && executions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Setup History
            </CardTitle>
            <CardDescription>
              Previous ComfyUI setup attempts and executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {executions
                .filter(e => e.scriptId === 1)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {execution.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : execution.status === 'failed' ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                      )}
                      <div>
                        <p className="text-sm font-medium">Setup Execution #{execution.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(execution.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={
                      execution.status === 'completed' ? 'default' :
                      execution.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {execution.status}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}