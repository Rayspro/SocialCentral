import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie } from "recharts";
import { ArrowLeft, Server, Cpu, HardDrive, Wifi, Clock, Activity, Terminal, Settings, RefreshCw, TrendingUp, Zap, Globe, HardDriveIcon, ChevronRight, Home } from "lucide-react";
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Elegant Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-sm">
            <button 
              onClick={() => setLocation('/')}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </button>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <button 
              onClick={() => setLocation('/vast-servers')}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
            >
              Vast Servers
            </button>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 dark:text-slate-100 font-medium">
              {server.name}
            </span>
          </nav>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(server.status)}>
              {server.status}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <Server className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {server.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {server.gpu} • {server.location} • ${server.pricePerHour}/hour
              </p>
            </div>
          </div>
        </div>

      {/* Professional Metrics Dashboard */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  CPU Load
                </CardTitle>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.cpuUsage.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {server.cpuCores} cores
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${metrics.cpuUsage}%` }}
                ></div>
              </div>
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsHistory.slice(-12)} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#3b82f6" 
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  GPU Load
                </CardTitle>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.gpuUsage.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {server.gpu}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${metrics.gpuUsage}%` }}
                ></div>
              </div>
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsHistory.slice(-12)} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Line 
                      type="monotone" 
                      dataKey="gpu" 
                      stroke="#f59e0b" 
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-violet-100 dark:bg-violet-900 rounded-lg">
                  <HardDriveIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Memory
                </CardTitle>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.memoryUsage.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {((metrics.memoryUsage / 100) * server.ram).toFixed(1)} / {server.ram} GB
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-violet-600 h-2 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${metrics.memoryUsage}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Available: {(server.ram - (metrics.memoryUsage / 100) * server.ram).toFixed(1)} GB</span>
                <span className="text-violet-600 dark:text-violet-400 font-medium">
                  {metrics.memoryUsage > 80 ? 'High' : metrics.memoryUsage > 60 ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${
                  metrics.temperature > 75 ? 'bg-red-100 dark:bg-red-900' : 
                  metrics.temperature > 65 ? 'bg-amber-100 dark:bg-amber-900' : 
                  'bg-emerald-100 dark:bg-emerald-900'
                }`}>
                  <Activity className={`h-4 w-4 ${
                    metrics.temperature > 75 ? 'text-red-600 dark:text-red-400' : 
                    metrics.temperature > 65 ? 'text-amber-600 dark:text-amber-400' : 
                    'text-emerald-600 dark:text-emerald-400'
                  }`} />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Thermal
                </CardTitle>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.temperature.toFixed(0)}°C
                </div>
                <div className={`text-xs font-medium ${
                  metrics.temperature > 75 ? 'text-red-600 dark:text-red-400' : 
                  metrics.temperature > 65 ? 'text-amber-600 dark:text-amber-400' : 
                  'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {metrics.temperature > 75 ? 'Critical' : metrics.temperature > 65 ? 'Elevated' : 'Optimal'}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-700 ease-out ${
                    metrics.temperature > 75 ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                    metrics.temperature > 65 ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 
                    'bg-gradient-to-r from-emerald-500 to-emerald-600'
                  }`}
                  style={{ width: `${(metrics.temperature / 85) * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Threshold: 75°C</span>
                <span>Max: 85°C</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional Performance Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Resource Utilization
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                  System performance metrics over time
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">CPU</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">GPU</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Memory</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="#e2e8f0" 
                    strokeOpacity={0.3}
                  />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    dy={5}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    dx={-5}
                    domain={[0, 100]}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      fontSize: '11px',
                      padding: '8px'
                    }}
                    formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="#3b82f6" 
                    strokeWidth={1.5}
                    fill="url(#cpuGradient)"
                    name="CPU"
                    dot={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="gpu" 
                    stroke="#f59e0b" 
                    strokeWidth={1.5}
                    fill="url(#gpuGradient)"
                    name="GPU"
                    dot={false}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="memory" 
                    stroke="#8b5cf6" 
                    strokeWidth={1.5}
                    fill="url(#memoryGradient)"
                    name="Memory"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Network Throughput
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                  Real-time bandwidth monitoring
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Ingress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-slate-600 dark:text-slate-400">Egress</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <CartesianGrid 
                    strokeDasharray="2 2" 
                    stroke="#e2e8f0" 
                    strokeOpacity={0.3}
                  />
                  <XAxis 
                    dataKey="time" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    dy={5}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    dx={-5}
                    tickFormatter={(value) => formatBytes(value)}
                    width={50}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      fontSize: '11px',
                      padding: '8px'
                    }}
                    formatter={(value, name) => [formatBytes(Number(value)), name]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="networkIn" 
                    stroke="#10b981" 
                    strokeWidth={1.5}
                    name="Ingress"
                    dot={false}
                    strokeDasharray="0"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="networkOut" 
                    stroke="#ef4444" 
                    strokeWidth={1.5}
                    name="Egress"
                    dot={false}
                    strokeDasharray="4 4"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Professional System Analytics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Memory Analysis
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              Current allocation and utilization
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Utilized</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.memoryUsage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${metrics.memoryUsage}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Used</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {((metrics.memoryUsage / 100) * server.ram).toFixed(1)} GB
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Available</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {(server.ram - (metrics.memoryUsage / 100) * server.ram).toFixed(1)} GB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Power Management
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              Energy consumption metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Current</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.powerConsumption}W
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Efficiency</span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {((320 - metrics.powerConsumption) / 320 * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.powerConsumption / 350) * 100}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Min</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">200W</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Avg</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">250W</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Max</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">350W</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Thermal Status
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
              Temperature monitoring and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Current</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    metrics.temperature > 75 ? 'bg-red-500' : 
                    metrics.temperature > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {metrics.temperature.toFixed(0)}°C
                  </span>
                </div>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metricsHistory.slice(-8)} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke={metrics.temperature > 75 ? "#ef4444" : metrics.temperature > 65 ? "#f59e0b" : "#10b981"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Status</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    metrics.temperature > 75 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 
                    metrics.temperature > 65 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                  }`}>
                    {metrics.temperature > 75 ? 'Critical' : metrics.temperature > 65 ? 'Elevated' : 'Optimal'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Threshold</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">75°C</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Maximum</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">85°C</p>
                  </div>
                </div>
              </div>
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
    </div>
  );
}