import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Server, 
  Clock, 
  Zap,
  Download,
  RefreshCw
} from 'lucide-react';
import { formatters } from '@/utils';

interface AnalyticsData {
  overview: {
    totalCost: number;
    costChange: number;
    activeServers: number;
    serverChange: number;
    totalGenerations: number;
    generationChange: number;
    averageGenTime: number;
    timeChange: number;
  };
  costTrends: Array<{
    date: string;
    cost: number;
    servers: number;
    generations: number;
  }>;
  serverUtilization: Array<{
    serverId: number;
    name: string;
    utilizationPercent: number;
    costPerHour: number;
    hoursActive: number;
    totalCost: number;
  }>;
  generationMetrics: Array<{
    date: string;
    successful: number;
    failed: number;
    avgTime: number;
  }>;
  costBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
];

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'];

export function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['analytics', timeRange, refreshKey],
    queryFn: () => fetchAnalytics(timeRange),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const handleExport = () => {
    if (analytics) {
      const exportData = {
        generatedAt: new Date().toISOString(),
        timeRange,
        ...analytics,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-${timeRange}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetch();
  };

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Unable to load analytics data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(range => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <OverviewCards overview={analytics.overview} />

      <Tabs defaultValue="costs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="utilization">Server Utilization</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="costs" className="space-y-4">
          <CostAnalysisTab 
            costTrends={analytics.costTrends}
            costBreakdown={analytics.costBreakdown}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceTab generationMetrics={analytics.generationMetrics} />
        </TabsContent>

        <TabsContent value="utilization" className="space-y-4">
          <UtilizationTab serverUtilization={analytics.serverUtilization} />
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictionsTab analytics={analytics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface OverviewCardsProps {
  overview: AnalyticsData['overview'];
}

function OverviewCards({ overview }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Cost"
        value={formatters.currency(overview.totalCost)}
        change={overview.costChange}
        icon={<DollarSign className="w-5 h-5" />}
        trend={overview.costChange >= 0 ? 'up' : 'down'}
      />
      <MetricCard
        title="Active Servers"
        value={overview.activeServers.toString()}
        change={overview.serverChange}
        icon={<Server className="w-5 h-5" />}
        trend={overview.serverChange >= 0 ? 'up' : 'down'}
      />
      <MetricCard
        title="Total Generations"
        value={overview.totalGenerations.toString()}
        change={overview.generationChange}
        icon={<Zap className="w-5 h-5" />}
        trend={overview.generationChange >= 0 ? 'up' : 'down'}
      />
      <MetricCard
        title="Avg Gen Time"
        value={formatters.duration(overview.averageGenTime)}
        change={overview.timeChange}
        icon={<Clock className="w-5 h-5" />}
        trend={overview.timeChange >= 0 ? 'up' : 'down'}
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  const isPositive = change >= 0;
  const isGoodTrend = (trend === 'up' && title !== 'Total Cost' && title !== 'Avg Gen Time') ||
                     (trend === 'down' && (title === 'Total Cost' || title === 'Avg Gen Time'));

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-gray-500">{icon}</div>
            <span className="text-sm font-medium text-gray-600">{title}</span>
          </div>
          <div className="flex items-center space-x-1">
            {isPositive ? (
              <TrendingUp className={`w-4 h-4 ${isGoodTrend ? 'text-green-500' : 'text-red-500'}`} />
            ) : (
              <TrendingDown className={`w-4 h-4 ${isGoodTrend ? 'text-green-500' : 'text-red-500'}`} />
            )}
            <span className={`text-sm ${isGoodTrend ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CostAnalysisTab({ costTrends, costBreakdown }: { 
  costTrends: AnalyticsData['costTrends'];
  costBreakdown: AnalyticsData['costBreakdown'];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={costTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatters.currency(Number(value))} />
              <Area 
                type="monotone" 
                dataKey="cost" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.1} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {costBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatters.currency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceTab({ generationMetrics }: { 
  generationMetrics: AnalyticsData['generationMetrics'];
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generation Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={generationMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="successful" fill="#22c55e" name="Successful" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Average Generation Time</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generationMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatters.duration(Number(value))} />
              <Line 
                type="monotone" 
                dataKey="avgTime" 
                stroke="#3b82f6" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function UtilizationTab({ serverUtilization }: { 
  serverUtilization: AnalyticsData['serverUtilization'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Utilization Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {serverUtilization.map((server) => (
            <div key={server.serverId} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{server.name}</h3>
                <Badge variant={server.utilizationPercent > 80 ? 'default' : 'secondary'}>
                  {server.utilizationPercent}% utilized
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Cost/Hour:</span>
                  <div className="font-medium">{formatters.currency(server.costPerHour)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Hours Active:</span>
                  <div className="font-medium">{server.hoursActive.toFixed(1)}h</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Cost:</span>
                  <div className="font-medium">{formatters.currency(server.totalCost)}</div>
                </div>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${server.utilizationPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PredictionsTab({ analytics }: { analytics: AnalyticsData }) {
  const predictedMonthlyCost = analytics.overview.totalCost * (30 / 7); // Rough estimate
  const estimatedSavings = predictedMonthlyCost * 0.15; // 15% potential savings

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Cost Predictions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900">Projected Monthly Cost</h4>
            <p className="text-2xl font-bold text-blue-700">
              {formatters.currency(predictedMonthlyCost)}
            </p>
            <p className="text-sm text-blue-600">
              Based on current usage patterns
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900">Potential Savings</h4>
            <p className="text-2xl font-bold text-green-700">
              {formatters.currency(estimatedSavings)}
            </p>
            <p className="text-sm text-green-600">
              With optimization recommendations
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
              <h4 className="font-medium">Auto-scaling Opportunities</h4>
              <p className="text-sm text-gray-600">
                3 servers could benefit from automatic scaling based on usage patterns
              </p>
            </div>
            <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
              <h4 className="font-medium">Workflow Optimization</h4>
              <p className="text-sm text-gray-600">
                Batch processing could reduce costs by up to 25%
              </p>
            </div>
            <div className="p-3 border-l-4 border-green-400 bg-green-50">
              <h4 className="font-medium">Resource Right-sizing</h4>
              <p className="text-sm text-gray-600">
                2 servers are over-provisioned and could use smaller instances
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    </div>
  );
}

async function fetchAnalytics(timeRange: string): Promise<AnalyticsData> {
  const response = await fetch(`/api/analytics?range=${timeRange}`);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  return response.json();
}