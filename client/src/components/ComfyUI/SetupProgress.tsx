import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useServerExecutions } from '@/composables/useServer';
import { useStartComfySetup, useResetComfySetup } from '@/composables/useComfyUI';
import { EXECUTION_STATUS } from '@/constants';
import { formatters, helpers } from '@/utils';
import { RefreshCw, Play, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { ServerExecution } from '@/types';

interface SetupProgressProps {
  serverId: number;
  serverName: string;
  onSetupComplete?: () => void;
}

export function SetupProgress({ serverId, serverName, onSetupComplete }: SetupProgressProps) {
  const { data: executions, isLoading, refetch } = useServerExecutions(serverId);
  const startSetup = useStartComfySetup();
  const resetSetup = useResetComfySetup();

  const latestExecution = executions?.[0];
  const isSetupRunning = latestExecution?.status === EXECUTION_STATUS.RUNNING;
  const isSetupCompleted = latestExecution?.status === EXECUTION_STATUS.COMPLETED;
  const isSetupFailed = latestExecution?.status === EXECUTION_STATUS.FAILED;

  const handleStartSetup = () => {
    startSetup.mutate(serverId);
  };

  const handleResetSetup = () => {
    resetSetup.mutate(serverId);
  };

  const getProgressValue = (execution: ServerExecution): number => {
    if (!execution.output) return 0;
    
    const steps = execution.output.split('\n').filter(line => line.includes('Step'));
    const totalSteps = 6; // Based on setup script
    return Math.round((steps.length / totalSteps) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case EXECUTION_STATUS.RUNNING:
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />;
      case EXECUTION_STATUS.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case EXECUTION_STATUS.FAILED:
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">
          ComfyUI Setup - {serverName}
        </CardTitle>
        <div className="flex items-center space-x-2">
          {latestExecution && (
            <Badge 
              variant="outline"
              className={helpers.getStatusColor(latestExecution.status)}
            >
              <span className="flex items-center space-x-1">
                {getStatusIcon(latestExecution.status)}
                <span>{helpers.capitalizeFirst(latestExecution.status)}</span>
              </span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!latestExecution ? (
          <SetupNotStarted onStart={handleStartSetup} isLoading={startSetup.isPending} />
        ) : (
          <SetupStatus 
            execution={latestExecution}
            onReset={handleResetSetup}
            onRefresh={refetch}
            isResetLoading={resetSetup.isPending}
            progressValue={getProgressValue(latestExecution)}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface SetupNotStartedProps {
  onStart: () => void;
  isLoading: boolean;
}

function SetupNotStarted({ onStart, isLoading }: SetupNotStartedProps) {
  return (
    <div className="text-center py-6 space-y-4">
      <div className="text-gray-500">
        ComfyUI setup has not been initiated for this server.
      </div>
      <Button 
        onClick={onStart} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Starting Setup...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Start ComfyUI Setup
          </>
        )}
      </Button>
    </div>
  );
}

interface SetupStatusProps {
  execution: ServerExecution;
  onReset: () => void;
  onRefresh: () => void;
  isResetLoading: boolean;
  progressValue: number;
}

function SetupStatus({ 
  execution, 
  onReset, 
  onRefresh, 
  isResetLoading, 
  progressValue 
}: SetupStatusProps) {
  const isRunning = execution.status === EXECUTION_STATUS.RUNNING;
  const isCompleted = execution.status === EXECUTION_STATUS.COMPLETED;
  const isFailed = execution.status === EXECUTION_STATUS.FAILED;

  return (
    <div className="space-y-4">
      {(isRunning || isCompleted) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Setup Progress</span>
            <span>{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="w-full" />
        </div>
      )}

      {execution.startedAt && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Started:</span>
          <span>{formatters.relativeTime(new Date(execution.startedAt))}</span>
        </div>
      )}

      {execution.completedAt && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Completed:</span>
          <span>{formatters.relativeTime(new Date(execution.completedAt))}</span>
        </div>
      )}

      {execution.output && (
        <SetupLogs output={execution.output} />
      )}

      {execution.errorLog && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-red-800 mb-2">Error Details:</h4>
          <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-x-auto">
            {execution.errorLog}
          </pre>
        </div>
      )}

      <div className="flex space-x-2">
        {(isFailed || isCompleted) && (
          <Button 
            variant="outline" 
            onClick={onReset}
            disabled={isResetLoading}
            className="flex-1"
          >
            {isResetLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Setup
              </>
            )}
          </Button>
        )}
        
        <Button 
          variant="outline" 
          onClick={onRefresh}
          size="sm"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface SetupLogsProps {
  output: string;
}

function SetupLogs({ output }: SetupLogsProps) {
  const lines = output.split('\n').filter(line => line.trim());
  const recentLines = lines.slice(-10); // Show last 10 lines

  return (
    <div className="bg-gray-50 border rounded-md p-3">
      <h4 className="text-sm font-medium text-gray-800 mb-2">Setup Logs:</h4>
      <div className="max-h-32 overflow-y-auto">
        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
          {recentLines.join('\n')}
        </pre>
      </div>
      {lines.length > 10 && (
        <div className="text-xs text-gray-500 mt-2">
          Showing last 10 lines of {lines.length} total
        </div>
      )}
    </div>
  );
}