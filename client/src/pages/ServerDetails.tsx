import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie } from "recharts";
import { ArrowLeft, Server, Cpu, HardDrive, Wifi, Clock, Activity, Terminal, Settings, RefreshCw, TrendingUp, Zap, Globe, HardDriveIcon } from "lucide-react";
import type { VastServer } from "@shared/schema";

interface ServerMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
  processes: number;
  gpuUsage: number;
  temperature: number;
  powerConsumption: number;
}

interface MetricsHistory {
  time: string;
  cpu: number;
  memory: number;
  gpu: number;
  networkIn: number;
  networkOut: number;
  temperature: number;
}

interface ServerExecution {
  id: number;
  serverId: number;
  scriptId: number;
  status: string;
  output?: string;
  errorLog?: string;
  startedAt?: string;
  completedAt?: string;
}

export default function ServerDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const serverId = parseInt(params.id || "0");

  const { data: server, isLoading, refetch } = useQuery({
    queryKey: ['/api/vast-servers', serverId],
    queryFn: () => 
      fetch(`/api/vast-servers/${serverId}`).then(res => res.json()),
    enabled: !!serverId,
  });

  const { data: executions } = useQuery({
    queryKey: ['/api/server-executions', serverId],
    queryFn: () => 
      fetch(`/api/server-executions/${serverId}`).then(res => res.json()),
    enabled: !!serverId,
  });

  // Enhanced metrics data with historical tracking
  const [metrics, setMetrics] = useState<ServerMetrics>({
    cpuUsage: 45,
    memoryUsage: 68,
    diskUsage: 32,
    networkIn: 1250,
    networkOut: 890,
    uptime: 14400,
    processes: 87,
    gpuUsage: 72,
    temperature: 68,
    powerConsumption: 280,
  });

  // Historical metrics for charts
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([
    { time: '10:00', cpu: 42, memory: 65, gpu: 70, networkIn: 1100, networkOut: 850, temperature: 65 },
    { time: '10:05', cpu: 38, memory: 62, gpu: 68, networkIn: 1180, networkOut: 920, temperature: 66 },
    { time: '10:10', cpu: 52, memory: 70, gpu: 75, networkIn: 1300, networkOut: 980, temperature: 69 },
    { time: '10:15', cpu: 48, memory: 68, gpu: 73, networkIn: 1250, networkOut: 890, temperature: 68 },
    { time: '10:20', cpu: 45, memory: 68, gpu: 72, networkIn: 1250, networkOut: 890, temperature: 68 },
  ]);

  // Simulate real-time metrics updates with enhanced data
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);
      
      setMetrics(prev => ({
        ...prev,
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(20, Math.min(95, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        gpuUsage: Math.max(15, Math.min(95, prev.gpuUsage + (Math.random() - 0.5) * 8)),
        networkIn: Math.max(0, prev.networkIn + (Math.random() - 0.5) * 500),
        networkOut: Math.max(0, prev.networkOut + (Math.random() - 0.5) * 300),
        temperature: Math.max(50, Math.min(85, prev.temperature + (Math.random() - 0.5) * 3)),
        powerConsumption: Math.max(200, Math.min(350, prev.powerConsumption + (Math.random() - 0.5) * 20)),
        uptime: prev.uptime + 5,
      }));

      // Update historical data
      setMetricsHistory(prev => {
        const newEntry = {
          time: timeStr,
          cpu: Math.max(10, Math.min(90, (prev[prev.length - 1]?.cpu || 45) + (Math.random() - 0.5) * 10)),
          memory: Math.max(20, Math.min(95, (prev[prev.length - 1]?.memory || 68) + (Math.random() - 0.5) * 5)),
          gpu: Math.max(15, Math.min(95, (prev[prev.length - 1]?.gpu || 72) + (Math.random() - 0.5) * 8)),
          networkIn: Math.max(0, (prev[prev.length - 1]?.networkIn || 1250) + (Math.random() - 0.5) * 500),
          networkOut: Math.max(0, (prev[prev.length - 1]?.networkOut || 890) + (Math.random() - 0.5) * 300),
          temperature: Math.max(50, Math.min(85, (prev[prev.length - 1]?.temperature || 68) + (Math.random() - 0.5) * 3)),
        };
        
        return [...prev.slice(-19), newEntry]; // Keep last 20 entries
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500 text-white';
      case 'stopped': return 'bg-red-500 text-white';
      case 'loading': return 'bg-yellow-500 text-white';
      case 'launching': return 'bg-blue-500 text-white animate-pulse';
      case 'configuring': return 'bg-purple-500 text-white animate-pulse';
      default: return 'bg-gray-400 text-white';
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes/s';
    const k = 1024;
    const sizes = ['Bytes/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/vast-servers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Servers
          </Button>
          <div className="h-6 w-48 bg-gray-200 animate-pulse rounded"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 w-20 bg-gray-200 animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-2 w-full bg-gray-200 animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <p className="text-gray-500">Server not found</p>
          <Button 
            onClick={() => setLocation('/vast-servers')} 
            className="mt-4"
          >
            Back to Servers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/vast-servers')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Servers
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Server className="h-8 w-8" />
              {server.name}
            </h1>
            <p className="text-muted-foreground">{server.gpu} • {server.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(server.status)}>
            {server.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Server Overview with Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cpuUsage.toFixed(1)}%</div>
            <Progress value={metrics.cpuUsage} className="mt-2" />
            <div className="mt-2 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory.slice(-10)}>
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPU Usage</CardTitle>
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-yellow-500" />
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.gpuUsage.toFixed(1)}%</div>
            <Progress value={metrics.gpuUsage} className="mt-2" />
            <div className="mt-2 h-8">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory.slice(-10)}>
                  <Line 
                    type="monotone" 
                    dataKey="gpu" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <HardDriveIcon className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
            <Progress value={metrics.memoryUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {((metrics.memoryUsage / 100) * server.ram).toFixed(1)} GB / {server.ram} GB
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                metrics.temperature > 75 ? 'bg-red-500 animate-ping' : 
                metrics.temperature > 65 ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.temperature.toFixed(0)}°C</div>
            <Progress 
              value={(metrics.temperature / 85) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Max: 85°C
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Performance Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resource Usage Trends
            </CardTitle>
            <CardDescription>Real-time CPU, GPU, and Memory utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsHistory}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="gpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="url(#cpuGradient)"
                    name="CPU %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gpu" 
                    stackId="2"
                    stroke="#f59e0b" 
                    fill="url(#gpuGradient)"
                    name="GPU %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memory" 
                    stackId="3"
                    stroke="#8b5cf6" 
                    fill="url(#memoryGradient)"
                    name="Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Network Activity
            </CardTitle>
            <CardDescription>Bandwidth utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatBytes(Number(value)), '']} />
                  <Line 
                    type="monotone" 
                    dataKey="networkIn" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Download"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="networkOut" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="Upload"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Dashboard */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Used', value: metrics.memoryUsage, fill: '#8b5cf6' },
                      { name: 'Free', value: 100 - metrics.memoryUsage, fill: '#e5e7eb' }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    startAngle={90}
                    endAngle={450}
                    dataKey="value"
                  >
                  </Pie>
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Memory Usage</p>
              <p className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Power Consumption</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Current', power: metrics.powerConsumption },
                  { name: 'Average', power: 250 },
                  { name: 'Peak', power: 320 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}W`, '']} />
                  <Bar dataKey="power" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Temperature Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory.slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[50, 85]} />
                  <Tooltip formatter={(value) => [`${value}°C`, '']} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke={metrics.temperature > 75 ? "#ef4444" : metrics.temperature > 65 ? "#f59e0b" : "#10b981"}
                    strokeWidth={4}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <p className="text-2xl font-bold">{metrics.temperature.toFixed(0)}°C</p>
              <p className={`text-sm ${
                metrics.temperature > 75 ? 'text-red-500' : 
                metrics.temperature > 65 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {metrics.temperature > 75 ? 'High' : metrics.temperature > 65 ? 'Moderate' : 'Normal'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Server Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Server ID:</span>
                  <span>{server.vastId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GPU:</span>
                  <span>{server.gpu}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPU Cores:</span>
                  <span>{server.cpuCores}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RAM:</span>
                  <span>{server.ram} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage:</span>
                  <span>{server.disk} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span>{server.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price:</span>
                  <span>${server.pricePerHour}/hour</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SSH Host:</span>
                  <span className="font-mono text-sm">{server.sshHost || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SSH Port:</span>
                  <span>{server.sshPort || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Direct Ports:</span>
                  <span>{server.directPortStart ? `${server.directPortStart}-${server.directPortEnd}` : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Launched:</span>
                  <span>{server.launchedAt ? new Date(server.launchedAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime:</span>
                  <span>{formatUptime(metrics.uptime)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>CPU Usage</span>
                    <span>{metrics.cpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.cpuUsage} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>GPU Usage</span>
                    <span>{metrics.gpuUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.gpuUsage} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Memory Usage</span>
                    <span>{metrics.memoryUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.memoryUsage} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Disk Usage</span>
                    <span>{metrics.diskUsage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.diskUsage} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Processes:</span>
                  <span>{metrics.processes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Temperature:</span>
                  <span>{metrics.temperature.toFixed(0)}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Power:</span>
                  <span>{metrics.powerConsumption}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network In:</span>
                  <span>{formatBytes(metrics.networkIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Out:</span>
                  <span>{formatBytes(metrics.networkOut)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Public IP:</span>
                <span className="font-mono text-sm">{server.sshHost || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SSH Port:</span>
                <span>{server.sshPort || 'Not configured'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Direct Port Range:</span>
                <span>{server.directPortStart ? `${server.directPortStart}-${server.directPortEnd}` : 'Not available'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bandwidth In:</span>
                <span>{formatBytes(metrics.networkIn)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bandwidth Out:</span>
                <span>{formatBytes(metrics.networkOut)}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Script Executions</CardTitle>
              <CardDescription>History of executed setup scripts and commands</CardDescription>
            </CardHeader>
            <CardContent>
              {executions && executions.length > 0 ? (
                <div className="space-y-4">
                  {executions.map((execution: ServerExecution) => (
                    <div key={execution.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={execution.status === 'completed' ? 'default' : 'secondary'}>
                          {execution.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {execution.startedAt && new Date(execution.startedAt).toLocaleString()}
                        </span>
                      </div>
                      {execution.output && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1">Output:</p>
                          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                            {execution.output}
                          </pre>
                        </div>
                      )}
                      {execution.errorLog && (
                        <div className="mt-2">
                          <p className="text-sm font-medium mb-1 text-red-600">Error:</p>
                          <pre className="bg-red-50 p-2 rounded text-xs overflow-auto max-h-32 text-red-800">
                            {execution.errorLog}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No script executions recorded for this server.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}