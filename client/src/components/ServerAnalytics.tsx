import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from "recharts";
import { Server, Clock, DollarSign, Activity, Zap, TrendingUp } from "lucide-react";

interface ServerMetrics {
  dailyUsage: Array<{ date: string; servers: number; cost: number; uptime: number }>;
  monthlyUsage: Array<{ month: string; servers: number; cost: number; uptime: number }>;
  serverTypes: Array<{ name: string; count: number; cost: number }>;
  uptimeStats: { totalUptime: number; averageUptime: number; totalCost: number; activeServers: number };
}

export function ServerAnalytics() {
  const { data: metrics, isLoading } = useQuery<ServerMetrics>({
    queryKey: ["/api/server-analytics"],
    queryFn: async () => {
      // Generate mock analytics data for demonstration
      const today = new Date();
      const dailyData = [];
      const monthlyData = [];
      
      // Generate last 7 days data
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          servers: Math.floor(Math.random() * 5) + 1,
          cost: Math.floor(Math.random() * 50) + 10,
          uptime: Math.floor(Math.random() * 20) + 80
        });
      }

      // Generate last 6 months data
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          servers: Math.floor(Math.random() * 20) + 5,
          cost: Math.floor(Math.random() * 800) + 200,
          uptime: Math.floor(Math.random() * 15) + 85
        });
      }

      return {
        dailyUsage: dailyData,
        monthlyUsage: monthlyData,
        serverTypes: [
          { name: "RTX 4090", count: 12, cost: 450 },
          { name: "RTX 3080", count: 8, cost: 280 },
          { name: "RTX 4080", count: 5, cost: 320 },
          { name: "A100", count: 3, cost: 890 }
        ],
        uptimeStats: {
          totalUptime: 2847,
          averageUptime: 94.2,
          totalCost: 1247.50,
          activeServers: 7
        }
      };
    }
  });

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

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6">
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
                <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{metrics?.uptimeStats.averageUptime}%</p>
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
            <CardDescription>Server count and costs over the last 7 days</CardDescription>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
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
              Server Types
            </CardTitle>
            <CardDescription>Distribution of GPU server types used</CardDescription>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-4">
              {metrics?.serverTypes.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Cost Trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              Monthly Costs
            </CardTitle>
            <CardDescription>Server costs over the last 6 months</CardDescription>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
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
            <CardDescription>Server uptime percentage over time</CardDescription>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
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