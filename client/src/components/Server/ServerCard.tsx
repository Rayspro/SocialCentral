import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStartServer, useStopServer, useDeleteServer } from '@/composables/useServer';
import { SERVER_STATUS } from '@/constants';
import { formatters, helpers } from '@/utils';
import { 
  Play, 
  Square, 
  Trash2, 
  Monitor, 
  HardDrive, 
  Cpu, 
  DollarSign,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { VastServer } from '@/types';

interface ServerCardProps {
  server: VastServer;
  onViewDetails?: (serverId: number) => void;
  onSetupComfyUI?: (serverId: number) => void;
}

export function ServerCard({ server, onViewDetails, onSetupComfyUI }: ServerCardProps) {
  const startServer = useStartServer();
  const stopServer = useStopServer();
  const deleteServer = useDeleteServer();

  const isRunning = server.status === SERVER_STATUS.RUNNING;
  const isStopped = server.status === SERVER_STATUS.STOPPED;
  const isPending = server.status === SERVER_STATUS.PENDING;

  const handleStart = () => {
    startServer.mutate(server.id);
  };

  const handleStop = () => {
    stopServer.mutate(server.id);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete server "${server.name}"?`)) {
      deleteServer.mutate(server.id);
    }
  };

  const handleViewDetails = () => {
    onViewDetails?.(server.id);
  };

  const handleSetupComfyUI = () => {
    onSetupComfyUI?.(server.id);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {server.name}
          </CardTitle>
          <ServerStatusBadge status={server.status} />
        </div>
        <div className="text-sm text-gray-600">
          ID: {server.vastId}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <ServerSpecs server={server} />
        <ServerPricing server={server} />
        <ServerTimestamps server={server} />
        <ServerActions
          server={server}
          isRunning={isRunning}
          isStopped={isStopped}
          isPending={isPending}
          onStart={handleStart}
          onStop={handleStop}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
          onSetupComfyUI={handleSetupComfyUI}
          isStarting={startServer.isPending}
          isStopping={stopServer.isPending}
          isDeleting={deleteServer.isPending}
        />
      </CardContent>
    </Card>
  );
}

interface ServerStatusBadgeProps {
  status: string;
}

function ServerStatusBadge({ status }: ServerStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case SERVER_STATUS.RUNNING:
        return { 
          color: 'bg-green-100 text-green-800', 
          icon: <Play className="w-3 h-3" />,
          label: 'Running'
        };
      case SERVER_STATUS.STOPPED:
        return { 
          color: 'bg-gray-100 text-gray-800', 
          icon: <Square className="w-3 h-3" />,
          label: 'Stopped'
        };
      case SERVER_STATUS.PENDING:
        return { 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: <Clock className="w-3 h-3" />,
          label: 'Pending'
        };
      default:
        return { 
          color: 'bg-red-100 text-red-800', 
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge className={`${config.color} flex items-center space-x-1`}>
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}

interface ServerSpecsProps {
  server: VastServer;
}

function ServerSpecs({ server }: ServerSpecsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="flex items-center space-x-2">
        <Monitor className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600">GPU:</span>
        <span className="font-medium">{server.gpu}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Cpu className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600">CPU:</span>
        <span className="font-medium">{server.cpuCores} cores</span>
      </div>
      <div className="flex items-center space-x-2">
        <HardDrive className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600">RAM:</span>
        <span className="font-medium">{server.ram} GB</span>
      </div>
      <div className="flex items-center space-x-2">
        <HardDrive className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600">Disk:</span>
        <span className="font-medium">{server.disk} GB</span>
      </div>
    </div>
  );
}

interface ServerPricingProps {
  server: VastServer;
}

function ServerPricing({ server }: ServerPricingProps) {
  const hourlyRate = parseFloat(server.pricePerHour);
  const dailyRate = hourlyRate * 24;
  const monthlyRate = dailyRate * 30;

  return (
    <div className="bg-blue-50 rounded-lg p-3">
      <div className="flex items-center space-x-2 mb-2">
        <DollarSign className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-800">Pricing</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <div className="font-medium">{formatters.currency(hourlyRate)}</div>
          <div className="text-gray-600">per hour</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{formatters.currency(dailyRate)}</div>
          <div className="text-gray-600">per day</div>
        </div>
        <div className="text-center">
          <div className="font-medium">{formatters.currency(monthlyRate)}</div>
          <div className="text-gray-600">per month</div>
        </div>
      </div>
    </div>
  );
}

interface ServerTimestampsProps {
  server: VastServer;
}

function ServerTimestamps({ server }: ServerTimestampsProps) {
  return (
    <div className="text-xs text-gray-500 space-y-1">
      <div className="flex justify-between">
        <span>Created:</span>
        <span>{formatters.relativeTime(new Date(server.createdAt))}</span>
      </div>
      <div className="flex justify-between">
        <span>Updated:</span>
        <span>{formatters.relativeTime(new Date(server.updatedAt))}</span>
      </div>
    </div>
  );
}

interface ServerActionsProps {
  server: VastServer;
  isRunning: boolean;
  isStopped: boolean;
  isPending: boolean;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onSetupComfyUI: () => void;
  isStarting: boolean;
  isStopping: boolean;
  isDeleting: boolean;
}

function ServerActions({
  server,
  isRunning,
  isStopped,
  isPending,
  onStart,
  onStop,
  onDelete,
  onViewDetails,
  onSetupComfyUI,
  isStarting,
  isStopping,
  isDeleting
}: ServerActionsProps) {
  return (
    <div className="space-y-2">
      <div className="flex space-x-2">
        {isStopped && (
          <Button
            onClick={onStart}
            disabled={isStarting}
            size="sm"
            className="flex-1"
          >
            {isStarting ? 'Starting...' : 'Start'}
          </Button>
        )}
        
        {isRunning && (
          <Button
            onClick={onStop}
            disabled={isStopping}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isStopping ? 'Stopping...' : 'Stop'}
          </Button>
        )}
        
        <Button
          onClick={onViewDetails}
          variant="outline"
          size="sm"
        >
          Details
        </Button>
      </div>

      {isRunning && (
        <Button
          onClick={onSetupComfyUI}
          variant="secondary"
          size="sm"
          className="w-full"
        >
          Setup ComfyUI
        </Button>
      )}

      <Button
        onClick={onDelete}
        disabled={isDeleting}
        variant="destructive"
        size="sm"
        className="w-full"
      >
        {isDeleting ? (
          'Deleting...'
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Server
          </>
        )}
      </Button>
    </div>
  );
}