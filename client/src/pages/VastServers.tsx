import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Server, Play, Square, Trash2, Search, Filter, ArrowUpDown } from "lucide-react";
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
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState("");
  const [gpuFilter, setGpuFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortBy, setSortBy] = useState("price");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  // Filter and sort available servers
  const filteredServers = useMemo(() => {
    if (!availableServers) return [];
    
    let filtered = availableServers.filter(server => {
      // Search filter
      if (searchTerm && !server.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !server.gpu.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // GPU filter
      if (gpuFilter !== "all" && !server.gpu.toLowerCase().includes(gpuFilter.toLowerCase())) {
        return false;
      }
      
      // Location filter
      if (locationFilter !== "all" && server.location !== locationFilter) {
        return false;
      }
      
      // Price range filter
      const price = parseFloat(server.pricePerHour);
      if (priceRange === "budget" && price > 0.5) return false;
      if (priceRange === "mid" && (price <= 0.5 || price > 1.0)) return false;
      if (priceRange === "high" && price <= 1.0) return false;
      
      return true;
    });
    
    // Sort servers
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case "price":
          valueA = parseFloat(a.pricePerHour);
          valueB = parseFloat(b.pricePerHour);
          break;
        case "gpu":
          valueA = a.gpu;
          valueB = b.gpu;
          break;
        case "ram":
          valueA = a.ram;
          valueB = b.ram;
          break;
        case "performance":
          valueA = a.metadata?.dlperf || 0;
          valueB = b.metadata?.dlperf || 0;
          break;
        default:
          valueA = a.name;
          valueB = b.name;
      }
      
      if (typeof valueA === "string") {
        return sortOrder === "asc" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
      }
      
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });
    
    return filtered;
  }, [availableServers, searchTerm, gpuFilter, locationFilter, priceRange, sortBy, sortOrder]);

  // Get unique values for filters
  const uniqueGpus = useMemo(() => {
    if (!availableServers) return [];
    const gpuSet = new Set<string>();
    availableServers.forEach(s => gpuSet.add(s.gpu));
    return Array.from(gpuSet);
  }, [availableServers]);

  const uniqueLocations = useMemo(() => {
    if (!availableServers) return [];
    const locationSet = new Set<string>();
    availableServers.forEach(s => locationSet.add(s.location));
    return Array.from(locationSet);
  }, [availableServers]);

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
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter & Search Servers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search servers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">GPU Type</label>
                  <Select value={gpuFilter} onValueChange={setGpuFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All GPUs</SelectItem>
                      {uniqueGpus.map(gpu => (
                        <SelectItem key={gpu} value={gpu}>{gpu}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {uniqueLocations.map(location => (
                        <SelectItem key={location} value={location}>{location}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="budget">Budget (≤$0.50/hr)</SelectItem>
                      <SelectItem value="mid">Mid-range ($0.50-$1.00/hr)</SelectItem>
                      <SelectItem value="high">High-end ($1.00+/hr)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Sort by:</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="gpu">GPU</SelectItem>
                      <SelectItem value="ram">RAM</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredServers.length} of {availableServers?.length || 0} servers
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servers Table */}
          {isLoadingAvailable ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredServers.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Server</TableHead>
                      <TableHead>GPU</TableHead>
                      <TableHead>CPU/RAM</TableHead>
                      <TableHead>Storage</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Price/Hour</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServers.map((server) => (
                      <TableRow key={server.vastId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{server.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {server.vastId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="secondary">{server.gpu}</Badge>
                            <div className="text-sm text-muted-foreground mt-1">
                              {server.gpuCount}x GPU{server.gpuCount > 1 ? 's' : ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{server.cpuCores} cores</div>
                            <div>{server.ram} GB RAM</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{server.disk} GB</div>
                            <div className="text-muted-foreground">
                              {server.metadata?.ssd ? 'SSD' : 'HDD'}
                              {server.metadata?.raid && ' + RAID'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{server.location}</Badge>
                          <div className="text-sm text-muted-foreground mt-1">
                            {server.metadata?.bandwidth}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {server.metadata?.dlperf ? (
                              <>
                                <div className="font-medium">{server.metadata.dlperf}</div>
                                <div className="text-muted-foreground">DL Perf</div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-green-600">
                            {formatPrice(server.pricePerHour)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ~${(parseFloat(server.pricePerHour) * 24).toFixed(2)}/day
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleLaunchServer(server)}
                            disabled={launchMutation.isPending}
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Launch
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <p className="text-muted-foreground">
                    {availableServers?.length === 0 ? "No servers available" : "No servers match your filters"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {availableServers?.length === 0 ? "Please check your Vast.ai API key in Settings" : "Try adjusting your search criteria"}
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