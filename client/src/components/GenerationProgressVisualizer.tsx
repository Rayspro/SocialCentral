import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Image as ImageIcon,
  Zap,
  Server,
  Database,
  Wand2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'pending' | 'active' | 'completed' | 'error';
  duration?: number;
}

interface NodeProgress {
  nodeId: string;
  nodeTitle: string;
  nodeType: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  executionTime?: number;
  outputs?: any;
  error?: string;
}

interface GenerationProgressVisualizerProps {
  generationId: number | null;
  isGenerating: boolean;
  progress: number;
  currentStep?: string;
  totalSteps?: number;
  completedSteps?: number;
  status: 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
  estimatedTime?: string;
  currentNode?: string;
  totalNodes?: number;
  completedNodes?: number;
  nodeProgress?: NodeProgress[];
  executionLogs?: string[];
  onCancel?: () => void;
}

const generationSteps: GenerationStep[] = [
  {
    id: 'validation',
    title: 'Server Validation',
    description: 'Checking server status and connectivity',
    icon: Server,
    status: 'pending'
  },
  {
    id: 'workflow',
    title: 'Workflow Loading',
    description: 'Loading and validating workflow configuration',
    icon: Database,
    status: 'pending'
  },
  {
    id: 'processing',
    title: 'Image Processing',
    description: 'Generating images using AI models',
    icon: Wand2,
    status: 'pending'
  },
  {
    id: 'rendering',
    title: 'Final Rendering',
    description: 'Processing outputs and generating final images',
    icon: ImageIcon,
    status: 'pending'
  },
  {
    id: 'completion',
    title: 'Completion',
    description: 'Finalizing generation and preparing results',
    icon: CheckCircle,
    status: 'pending'
  }
];

export default function GenerationProgressVisualizer({
  generationId,
  isGenerating,
  progress,
  currentStep,
  totalSteps = 5,
  completedSteps = 0,
  status,
  estimatedTime,
  currentNode,
  totalNodes,
  completedNodes,
  nodeProgress = [],
  executionLogs = [],
  onCancel
}: GenerationProgressVisualizerProps) {
  const [steps, setSteps] = useState<GenerationStep[]>(generationSteps);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Update step statuses based on progress
  useEffect(() => {
    if (!isGenerating && status === 'idle') {
      setSteps(generationSteps.map(step => ({ ...step, status: 'pending' })));
      setElapsedTime(0);
      setStartTime(null);
      return;
    }

    if (isGenerating && !startTime) {
      setStartTime(Date.now());
    }

    const progressPercent = Math.min(100, Math.max(0, progress));
    const currentStepIndex = Math.floor((progressPercent / 100) * steps.length);

    setSteps(prevSteps => 
      prevSteps.map((step, index) => {
        if (index < currentStepIndex) {
          return { ...step, status: 'completed' };
        } else if (index === currentStepIndex && isGenerating) {
          return { ...step, status: 'active' };
        } else if (status === 'failed' && index === currentStepIndex) {
          return { ...step, status: 'error' };
        } else {
          return { ...step, status: 'pending' };
        }
      })
    );
  }, [progress, isGenerating, status, startTime, steps.length]);

  // Update elapsed time
  useEffect(() => {
    if (!isGenerating || !startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 100);

    return () => clearInterval(interval);
  }, [isGenerating, startTime]);

  // Mark all steps as completed when generation finishes successfully
  useEffect(() => {
    if (status === 'completed') {
      setSteps(prevSteps => 
        prevSteps.map(step => ({ ...step, status: 'completed' }))
      );
    }
  }, [status]);

  const getStatusColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'active': return 'text-blue-600 dark:text-blue-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-400 dark:text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default' as const;
      case 'processing': return 'secondary' as const;
      case 'failed': return 'destructive' as const;
      default: return 'outline' as const;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isGenerating && status === 'idle') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-6 w-6 text-blue-600" />
                  </motion.div>
                ) : status === 'completed' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : status === 'failed' ? (
                  <XCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {generationId ? `Generation #${generationId}` : 'Image Generation'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isGenerating ? 'Processing your request...' : 
                   status === 'completed' ? 'Generation completed successfully' :
                   status === 'failed' ? 'Generation failed' : 'Ready to generate'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              {isGenerating && onCancel && (
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-2" />
              {isGenerating && (
                <motion.div
                  className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{ x: [-100, 300] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ clipPath: 'inset(0)' }}
                />
              )}
            </div>
          </div>

          {/* Step Progress */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Generation Steps</h4>
            <div className="space-y-2">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                      step.status === 'active' 
                        ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50' 
                        : step.status === 'completed'
                        ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50'
                        : step.status === 'error'
                        ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50'
                        : 'border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <div className={`flex-shrink-0 ${getStatusColor(step.status)}`}>
                      {step.status === 'active' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <StepIcon className="h-4 w-4" />
                        </motion.div>
                      ) : step.status === 'completed' ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </motion.div>
                      ) : step.status === 'error' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className={`text-sm font-medium ${
                          step.status === 'pending' ? 'text-muted-foreground' : ''
                        }`}>
                          {step.title}
                        </h5>
                        {step.status === 'active' && (
                          <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <Zap className="h-3 w-3 text-blue-500" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                    {step.status === 'completed' && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="text-green-600 dark:text-green-400"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Node Progress Section */}
          {currentNode && totalNodes && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Node Processing</h4>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Node</span>
                <span className="font-medium">{completedNodes || 0}/{totalNodes}</span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-sm font-medium">Processing: {currentNode}</span>
                </div>
                {nodeProgress.length > 0 && (
                  <div className="space-y-1">
                    {nodeProgress.slice(-3).map((node, index) => (
                      <div key={node.nodeId} className="text-xs text-muted-foreground flex items-center gap-2">
                        {node.status === 'completed' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : node.status === 'processing' ? (
                          <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                        ) : node.status === 'error' ? (
                          <XCircle className="h-3 w-3 text-red-500" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-gray-300" />
                        )}
                        <span>{node.nodeTitle} ({node.nodeType})</span>
                        {node.executionTime && (
                          <span className="ml-auto">{node.executionTime}ms</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Real-time Console */}
          {executionLogs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Execution Console</h4>
              <div className="bg-black dark:bg-gray-950 rounded-lg p-4 font-mono text-sm max-h-64 overflow-y-auto">
                <div className="space-y-1">
                  {executionLogs.slice(-20).map((log, index) => {
                    const timestamp = new Date().toLocaleTimeString();
                    const isError = log.toLowerCase().includes('error') || log.toLowerCase().includes('failed');
                    const isSuccess = log.toLowerCase().includes('completed') || log.toLowerCase().includes('success');
                    const isProgress = log.toLowerCase().includes('progress') || log.toLowerCase().includes('processing');
                    
                    return (
                      <div key={index} className="flex gap-2">
                        <span className="text-gray-500 text-xs">{timestamp}</span>
                        <span className={`flex-1 ${
                          isError ? 'text-red-400' : 
                          isSuccess ? 'text-green-400' : 
                          isProgress ? 'text-blue-400' : 
                          'text-gray-300'
                        }`}>
                          {log}
                        </span>
                      </div>
                    );
                  })}
                  {isGenerating && (
                    <div className="flex gap-2">
                      <span className="text-gray-500 text-xs">{new Date().toLocaleTimeString()}</span>
                      <span className="text-blue-400 flex items-center gap-1">
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ▋
                        </motion.div>
                        Processing...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timing Information */}
          {(isGenerating || status === 'completed') && (
            <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Elapsed: {formatTime(elapsedTime)}</span>
              </div>
              {estimatedTime && isGenerating && (
                <div className="flex items-center gap-2">
                  <span>Estimated: {estimatedTime}</span>
                </div>
              )}
              {status === 'completed' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Completed in {formatTime(elapsedTime)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}