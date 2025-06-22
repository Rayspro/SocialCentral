import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Play, 
  Square, 
  Trash2, 
  ChevronDown, 
  X,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { useStartServer, useStopServer, useDeleteServer } from '@/composables/useServer';
import { useToast } from '@/hooks/use-toast';
import { formatters } from '@/utils';
import type { VastServer } from '@/types';

interface BulkOperationsProps {
  items: VastServer[];
  selectedItems: number[];
  onSelectionChange: (selected: number[]) => void;
  onClearSelection: () => void;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline';
  action: (items: VastServer[]) => Promise<void>;
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationMessage?: string;
}

export function BulkOperations({ 
  items, 
  selectedItems, 
  onSelectionChange, 
  onClearSelection 
}: BulkOperationsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const { toast } = useToast();
  const startServer = useStartServer();
  const stopServer = useStopServer();
  const deleteServer = useDeleteServer();

  const selectedServerItems = items.filter(item => selectedItems.includes(item.id));
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length;

  const bulkActions: BulkAction[] = [
    {
      id: 'start',
      label: `Start ${selectedItems.length} servers`,
      icon: <Play className="w-4 h-4" />,
      variant: 'default',
      action: async (servers) => {
        const stoppedServers = servers.filter(s => s.status === 'stopped');
        for (const server of stoppedServers) {
          await startServer.mutateAsync(server.id);
        }
        toast({
          title: 'Servers Started',
          description: `Successfully started ${stoppedServers.length} servers`,
        });
      },
    },
    {
      id: 'stop',
      label: `Stop ${selectedItems.length} servers`,
      icon: <Square className="w-4 h-4" />,
      variant: 'outline',
      action: async (servers) => {
        const runningServers = servers.filter(s => s.status === 'running');
        for (const server of runningServers) {
          await stopServer.mutateAsync(server.id);
        }
        toast({
          title: 'Servers Stopped',
          description: `Successfully stopped ${runningServers.length} servers`,
        });
      },
      requiresConfirmation: true,
      confirmationTitle: 'Stop Selected Servers',
      confirmationMessage: 'Are you sure you want to stop the selected servers? This will halt all running processes.',
    },
    {
      id: 'delete',
      label: `Delete ${selectedItems.length} servers`,
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'destructive',
      action: async (servers) => {
        for (const server of servers) {
          await deleteServer.mutateAsync(server.id);
        }
        toast({
          title: 'Servers Deleted',
          description: `Successfully deleted ${servers.length} servers`,
        });
      },
      requiresConfirmation: true,
      confirmationTitle: 'Delete Selected Servers',
      confirmationMessage: 'This action cannot be undone. All data and configurations for these servers will be permanently lost.',
    },
    {
      id: 'export',
      label: `Export ${selectedItems.length} servers`,
      icon: <Download className="w-4 h-4" />,
      variant: 'outline',
      action: async (servers) => {
        const exportData = {
          exportedAt: new Date().toISOString(),
          servers: servers.map(server => ({
            name: server.name,
            gpu: server.gpu,
            ram: server.ram,
            disk: server.disk,
            pricePerHour: server.pricePerHour,
            status: server.status,
            createdAt: server.createdAt,
          })),
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `servers-export-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Export Complete',
          description: `Exported ${servers.length} servers to JSON file`,
        });
      },
    },
  ];

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setIsConfirmOpen(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: BulkAction) => {
    setIsExecuting(true);
    try {
      await action.action(selectedServerItems);
      onClearSelection();
    } catch (error) {
      toast({
        title: 'Action Failed',
        description: `Failed to ${action.label.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
      setIsConfirmOpen(false);
      setPendingAction(null);
    }
  };

  const getTotalCost = () => {
    return selectedServerItems.reduce((sum, server) => 
      sum + parseFloat(server.pricePerHour), 0
    );
  };

  const getStatusCounts = () => {
    const counts = selectedServerItems.reduce((acc, server) => {
      acc[server.status] = (acc[server.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  };

  if (selectedItems.length === 0) {
    return null;
  }

  const statusCounts = getStatusCounts();
  const totalCost = getTotalCost();

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-96">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onCheckedChange={handleSelectAll}
              />
              <div>
                <div className="font-medium">
                  {selectedItems.length} servers selected
                </div>
                <div className="text-sm text-gray-600">
                  Total cost: {formatters.currency(totalCost)}/hour
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge key={status} variant="outline" className="text-xs">
                {count} {status}
              </Badge>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {bulkActions.map((action) => {
              const canExecute = getActionAvailability(action, selectedServerItems);
              return (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  onClick={() => handleActionClick(action)}
                  disabled={isExecuting || !canExecute.available}
                  title={canExecute.reason}
                  className="flex items-center space-x-1"
                >
                  {isExecuting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    action.icon
                  )}
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              );
            })}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onSelectionChange([])}>
                  Clear Selection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSelectAll}>
                  {allSelected ? 'Deselect All' : 'Select All'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Copy Server IDs
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Generate Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.confirmationTitle}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingAction && executeAction(pendingAction)}
              className={pendingAction?.variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function getActionAvailability(action: BulkAction, servers: VastServer[]) {
  switch (action.id) {
    case 'start':
      const stoppedServers = servers.filter(s => s.status === 'stopped');
      return {
        available: stoppedServers.length > 0,
        reason: stoppedServers.length === 0 ? 'No stopped servers selected' : ''
      };
    
    case 'stop':
      const runningServers = servers.filter(s => s.status === 'running');
      return {
        available: runningServers.length > 0,
        reason: runningServers.length === 0 ? 'No running servers selected' : ''
      };
    
    case 'delete':
      return {
        available: servers.length > 0,
        reason: ''
      };
    
    case 'export':
      return {
        available: servers.length > 0,
        reason: ''
      };
    
    default:
      return { available: true, reason: '' };
  }
}