import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Server, Play, Square, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { VastServer } from "@shared/schema";

interface AvailableServer {
  vastId: string;
  name: string;
  gpu: string;
  gpuCount: number;
  cpuCores: number;
  ram: number;
  disk: number;
  pricePerHour: string;
  location: string;
  isAvailable: boolean;
  metadata?: any;
}

export default function VastServers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedServer, setSelectedServer] = useState<AvailableServer | null>(null);
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);

  // Fetch launched servers
  const { data: launchedServers, isLoading: isLoadingLaunched } = useQuery<VastServer[]>({
    queryKey: ['/api/vast-servers'],
    queryFn: () => fetch('/api/vast-servers').then(res => res.json()),
  });

  // Fetch available servers
  const { data: availableServers, isLoading: isLoadingAvailable } = useQuery<AvailableServer[]>({
    queryKey: ['/api/vast-servers/available'],
    queryFn: () => fetch('/api/vast-servers/available').then(res => res.json()),
  });

  // Launch server mutation
  const launchMutation = useMutation({
    mutationFn: async (server: AvailableServer) => {
      const response = await fetch(`/api/vast-servers/launch/${server.vastId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(server),
      });
      if (!response.ok) throw new Error('Failed to launch server');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vast-servers'] });
      setShowLaunchDialog(false);
      toast({
        title: "Server Launching",
        description: "Your server is being launched. This may take a few minutes.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Launch Failed",
        description: error.message || "Failed to launch server",
        variant: "destructive",
      });
    },
  });

  // Stop server mutation
  const stopMutation = useMutation({
    mutationFn: async (serverId: number) => {
      const response = await fetch(`/api/vast-servers/stop/${serverId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to stop server');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vast-servers'] });
      toast({
        title: "Server Stopping",
        description: "Your server is being stopped.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Stop Failed",
        description: error.message || "Failed to stop server",
        variant: "destructive",
      });
    },
  });

  // Delete server mutation
  const deleteMutation = useMutation({
    mutationFn: async (serverId: number) => {
      const response = await fetch(`/api/vast-servers/${serverId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete server');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vast-servers'] });
      toast({
        title: "Server Deleted",
        description: "Server has been removed from your account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete server",
        variant: "destructive",
      });
    },
  });

  const handleLaunchServer = (server: AvailableServer) => {
    setSelectedServer(server);
    setShowLaunchDialog(true);
  };

  const confirmLaunch = () => {
    if (selectedServer) {
      launchMutation.mutate(selectedServer);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'launching': return 'bg-yellow-500';
      case 'stopping': return 'bg-orange-500';
      case 'stopped': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatPrice = (price: string) => {
    return `$${parseFloat(price).toFixed(2)}/hour`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Vast.ai Servers</h1>
          <p className="text-muted-foreground">
            Manage your GPU servers for AI workloads
          </p>
        </div>
      </div>

      <Tabs defaultValue="launched" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="launched">My Servers</TabsTrigger>
          <TabsTrigger value="available">Available Servers</TabsTrigger>
        </TabsList>

        <TabsContent value="launched" className="space-y-4">
          {isLoadingLaunched ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : launchedServers && launchedServers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {launchedServers.map((server) => (
                <Card key={server.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      <Badge className={getStatusColor(server.status)}>
                        {server.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {server.gpu} × {server.gpuCount} | {server.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>CPU Cores:</span>
                        <span>{server.cpuCores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RAM:</span>
                        <span>{server.ram} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span>{server.disk} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className="font-semibold">{formatPrice(server.pricePerHour)}</span>
                      </div>
                      {server.serverUrl && (
                        <div className="flex justify-between">
                          <span>URL:</span>
                          <a 
                            href={server.serverUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-xs"
                          >
                            Access Server
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      {server.status === 'running' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => stopMutation.mutate(server.id)}
                          disabled={stopMutation.isPending}
                        >
                          <Square className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(server.id)}
                        disabled={deleteMutation.isPending || server.status === 'running'}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No servers launched yet</p>
                  <p className="text-sm text-muted-foreground">
                    Launch a server from the Available Servers tab
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {isLoadingAvailable ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : availableServers && availableServers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableServers.map((server) => (
                <Card key={server.vastId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                      <Badge variant="outline">Available</Badge>
                    </div>
                    <CardDescription>
                      {server.gpu} × {server.gpuCount} | {server.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>CPU Cores:</span>
                        <span>{server.cpuCores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RAM:</span>
                        <span>{server.ram} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage:</span>
                        <span>{server.disk} GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cost:</span>
                        <span className="font-semibold text-green-600">{formatPrice(server.pricePerHour)}</span>
                      </div>
                      {server.metadata && (
                        <div className="flex justify-between">
                          <span>Bandwidth:</span>
                          <span>{server.metadata.bandwidth}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleLaunchServer(server)}
                      disabled={launchMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Launch Server
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    No available servers found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please check your Vast.ai API key in Settings
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Launch Server</DialogTitle>
            <DialogDescription>
              Are you sure you want to launch this server? You will be charged based on usage.
            </DialogDescription>
          </DialogHeader>
          {selectedServer && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">{selectedServer.name}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>GPU: {selectedServer.gpu} × {selectedServer.gpuCount}</div>
                  <div>CPU: {selectedServer.cpuCores} cores</div>
                  <div>RAM: {selectedServer.ram} GB</div>
                  <div>Storage: {selectedServer.disk} GB</div>
                  <div>Location: {selectedServer.location}</div>
                  <div className="font-semibold text-green-600">
                    Cost: {formatPrice(selectedServer.pricePerHour)}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowLaunchDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmLaunch}
                  disabled={launchMutation.isPending}
                >
                  {launchMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Confirm Launch
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}