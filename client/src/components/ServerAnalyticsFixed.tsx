import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { Server, Clock, DollarSign, Activity, Zap, TrendingUp, Calendar, Eye, RefreshCw } from "lucide-react";
import { useState } from "react";

interface ServerMetrics {
  dailyUsage: Array<{ date: string; servers: number; cost: number; uptime: number }>;
  monthlyUsage: Array<{ month: string; servers: number; cost: number; uptime: number }>;
  serverTypes: Array<{ name: string; count: number; cost: number }>;
  uptimeStats: { totalUptime: number; averageUptime: number; totalCost: number; activeServers: number };
}

interface TodayServer {
  id: number;
  name: string;
  gpu: string;
  status: string;
  hoursRunning: number;
  costPerHour: number;
  todayCost: number;
  region: string;
  createdAt: string;
}

interface TodayAnalytics {
  date: string;
  servers: TodayServer[];
  totalCost: number;
  activeServers: number;
}

// Custom Tooltip Components
const CustomTooltip = ({ active, payload, label, type }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-sm font-semibold text-card-foreground mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="text-sm text-card-foreground">
          {type === 'cost' && (
            <p>{entry.name}: <span className="font-semibold">${entry.value.toFixed(2)}</span></p>
          )}
          {type === 'servers' && (
            <p>{entry.name}: <span className="font-semibold">{entry.value} servers</span></p>
          )}
          {type === 'uptime' && (
            <p>{entry.name}: <span className="font-semibold">{entry.value.toFixed(1)}%</span></p>
          )}
          {type === 'pie' && (
            <div>
              <p className="font-semibold">{entry.payload.name}</p>
              <p>{entry.payload.count} servers</p>
              <p>${entry.payload.cost.toFixed(2)}/hr</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const DailyTooltip = ({ active, payload, label }: any) => (
  <CustomTooltip active={active} payload={payload} label={`Date: ${label}`} type="servers" />
);

const MonthlyTooltip = ({ active, payload, label }: any) => (
  <CustomTooltip active={active} payload={payload} label={`Month: ${label}`} type="cost" />
);

const UptimeTooltip = ({ active, payload, label }: any) => (
  <CustomTooltip active={active} payload={payload} label={`Month: ${label}`} type="uptime" />
);

const PieTooltip = ({ active, payload }: any) => (
  <CustomTooltip active={active} payload={payload} label="" type="pie" />
);

export function ServerAnalytics() {
  const [viewMode, setViewMode] = useState<'overview' | 'today'>('overview');
  
  const { data: metrics, isLoading: metricsLoading, refetch: refetchMetrics } = useQuery<ServerMetrics>({
    queryKey: ["/api/server-analytics"]
  });

  const { data: todayData, isLoading: todayLoading, refetch: refetchToday } = useQuery<TodayAnalytics>({
    queryKey: ["/api/server-analytics/today"],
    enabled: viewMode === 'today'
  });

  const isLoading = metricsLoading || (viewMode === 'today' && todayLoading);

  const handleRefresh = () => {
    if (viewMode === 'overview') {
      refetchMetrics();
    } else {
      refetchToday();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'loading': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'running': return 'default';
      case 'stopped': return 'destructive';
      case 'loading': return 'outline';
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-600" />
            Server Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'today' && todayData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Today's Server Costs</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('overview')}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Overview
                </Button>
              </div>
            </div>
            <CardDescription>
              Individual server costs for {new Date(todayData.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Cost</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">${todayData.totalCost}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Servers</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">{todayData.activeServers}</p>
                  </div>
                  <Server className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Servers</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{todayData.servers.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Avg Cost/Hour</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      ${todayData.servers.length > 0 ? 
                        (todayData.servers.reduce((sum, s) => sum + s.costPerHour, 0) / todayData.servers.length).toFixed(2) : 
                        '0.00'
                      }
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Server List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Server Breakdown</CardTitle>
            <CardDescription>Individual server costs and runtime details</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {todayData.servers.map((server) => (
                <div 
                  key={server.id}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`}></div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">{server.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{server.gpu} • {server.region}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(server.status)} className="capitalize">
                      {server.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Runtime</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{server.hoursRunning}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Rate</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">${server.costPerHour}/h</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Today's Cost</p>
                      <p className="font-bold text-lg text-slate-900 dark:text-slate-100">${server.todayCost}</p>
                    </div>
                  </div>
                </div>
              ))}
              {todayData.servers.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No servers running today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Server Analytics Overview</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('today')}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Today's Costs
              </Button>
            </div>
          </div>
          <CardDescription>
            Comprehensive server usage, costs, and performance metrics
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Active Servers</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{metrics?.uptimeStats.activeServers}</p>
              </div>
              <Server className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-cyan-200 dark:border-cyan-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Avg Uptime</p>
                <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{metrics?.uptimeStats.averageUptime.toFixed(1)}%</p>
              </div>
              <Clock className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total Hours</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{metrics?.uptimeStats.totalUptime}</p>
              </div>
              <Zap className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Total Cost</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">${metrics?.uptimeStats.totalCost}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Usage Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Daily Server Usage
            </CardTitle>
            <CardDescription>Server count over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics?.dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<DailyTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="servers" 
                  stackId="1"
                  stroke="#8b5cf6" 
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Server Types Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-purple-600" />
              GPU Distribution
            </CardTitle>
            <CardDescription>Server types by count</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={metrics?.serverTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                >
                  {metrics?.serverTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Cost Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Monthly Costs
            </CardTitle>
            <CardDescription>Server costs over 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={metrics?.monthlyUsage}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<MonthlyTooltip />} />
                <Bar 
                  dataKey="cost" 
                  fill="#06b6d4"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Uptime Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Uptime Performance
            </CardTitle>
            <CardDescription>Server uptime percentage</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics?.monthlyUsage}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[80, 100]}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<UptimeTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}