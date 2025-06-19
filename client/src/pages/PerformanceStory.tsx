import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Zap, Clock, DollarSign, Server, Activity, Target, Award, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Story-driven performance dashboard
export default function PerformanceStory() {
  const [currentStory, setCurrentStory] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Fetch server analytics data with real-time updates
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/server-analytics'],
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  });

  const { data: todayData } = useQuery({
    queryKey: ['/api/server-analytics/today'], 
    refetchInterval: 15000,
    refetchOnWindowFocus: true
  });

  const { data: servers } = useQuery({
    queryKey: ['/api/vast-servers'],
    refetchInterval: 30000,
    refetchOnWindowFocus: true
  });

  // Story chapters configuration
  const storyChapters = [
    {
      id: 'performance-overview',
      title: 'Chapter 1: The Performance Story Begins',
      subtitle: 'Your server infrastructure at a glance',
      icon: Activity,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'cost-efficiency',
      title: 'Chapter 2: The Cost Optimization Journey',
      subtitle: 'How your spending patterns tell a story',
      icon: DollarSign,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'uptime-reliability',
      title: 'Chapter 3: The Reliability Chronicles',
      subtitle: 'Your uptime story and what it means',
      icon: Clock,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'growth-trajectory',
      title: 'Chapter 4: The Growth Narrative',
      subtitle: 'Your infrastructure evolution over time',
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  // Auto-advance story chapters
  useEffect(() => {
    if (!autoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentStory((prev) => (prev + 1) % storyChapters.length);
    }, 8000);
    
    return () => clearInterval(timer);
  }, [autoPlay, storyChapters.length]);

  // Story insights generator
  const generateStoryInsights = () => {
    if (!analytics || !todayData || !servers) return [];

    const last7Days = analytics?.last7Days || [];
    const totalCost = last7Days.reduce((sum: number, day: any) => sum + (day?.cost || 0), 0);
    const avgUptime = last7Days.length > 0 ? last7Days.reduce((sum: number, day: any) => sum + (day?.uptime || 0), 0) / last7Days.length : 0;
    const activeServers = Array.isArray(servers) ? servers.filter((s: any) => s?.status === 'running').length : 0;
    const costTrend = totalCost > 500 ? 'increasing' : 'optimized';

    return [
      {
        type: 'success',
        title: 'Performance Milestone',
        description: `${avgUptime.toFixed(1)}% average uptime shows excellent reliability`,
        metric: `${avgUptime.toFixed(1)}%`,
        trend: avgUptime > 95 ? 'positive' : 'neutral'
      },
      {
        type: 'info',
        title: 'Cost Efficiency',
        description: `$${totalCost.toFixed(2)} spent across ${activeServers} active servers`,
        metric: `$${(totalCost / activeServers || 0).toFixed(2)}`,
        trend: costTrend === 'optimized' ? 'positive' : 'warning'
      },
      {
        type: 'achievement',
        title: 'Infrastructure Scale',
        description: `Managing ${Array.isArray(servers) ? servers.length : 0} total servers with ${activeServers} currently active`,
        metric: `${activeServers}/${Array.isArray(servers) ? servers.length : 0}`,
        trend: 'positive'
      }
    ];
  };

  const insights = generateStoryInsights();

  // Performance score calculation
  const calculatePerformanceScore = () => {
    if (!analytics || !servers) return 0;
    
    const last7Days = analytics?.last7Days || [];
    const uptimeScore = last7Days.length > 0 ? (last7Days.reduce((sum: number, day: any) => sum + (day?.uptime || 0), 0) / last7Days.length) : 0;
    const serverArray = Array.isArray(servers) ? servers : [];
    const efficiencyScore = Math.min(100, (serverArray.filter((s: any) => s?.status === 'running').length / Math.max(serverArray.length, 1)) * 100);
    const costScore = Math.max(0, 100 - (last7Days.reduce((sum: number, day: any) => sum + (day?.cost || 0), 0) / 100));
    
    return Math.round((uptimeScore + efficiencyScore + costScore) / 3);
  };

  const performanceScore = calculatePerformanceScore();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded-lg w-96 mx-auto" />
          <div className="h-4 bg-muted animate-pulse rounded w-64 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-8 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Story Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Server Performance Story
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Watch your infrastructure tell its story through interactive visualizations and data-driven narratives
        </p>
      </motion.div>

      {/* Performance Score Hero */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
          <CardContent className="relative p-8 text-center">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 rounded-full">
                <Award className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">Performance Score</span>
              </div>
              
              <div className="space-y-2">
                <div className="text-6xl font-bold text-foreground">{performanceScore}</div>
                <div className="text-lg text-muted-foreground">out of 100</div>
              </div>

              <div className="max-w-md mx-auto">
                <Progress value={performanceScore} className="h-3" />
              </div>

              <div className="flex justify-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-green-600">Excellent</div>
                  <div className="text-muted-foreground">90-100</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">Good</div>
                  <div className="text-muted-foreground">70-89</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-orange-600">Fair</div>
                  <div className="text-muted-foreground">50-69</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Story Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Story Chapters</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant={autoPlay ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoPlay(!autoPlay)}
              >
                {autoPlay ? "Pause" : "Auto Play"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {storyChapters.map((chapter, index) => {
              const Icon = chapter.icon;
              const isActive = currentStory === index;
              
              return (
                <motion.div
                  key={chapter.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all duration-300 ${
                      isActive 
                        ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setCurrentStory(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${chapter.color}`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm leading-tight">{chapter.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {chapter.subtitle}
                          </p>
                        </div>
                      </div>
                      
                      {isActive && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 8 }}
                          className="h-1 bg-blue-500 rounded-full mt-3"
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Story Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStory}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          {currentStory === 0 && <PerformanceOverviewStory analytics={analytics} servers={servers} />}
          {currentStory === 1 && <CostEfficiencyStory analytics={analytics} todayData={todayData} />}
          {currentStory === 2 && <UptimeReliabilityStory analytics={analytics} />}
          {currentStory === 3 && <GrowthTrajectoryStory analytics={analytics} servers={servers} />}
        </motion.div>
      </AnimatePresence>

      {/* Story Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Key Insights</span>
            </CardTitle>
            <CardDescription>
              AI-generated insights from your server performance data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="relative group"
                >
                  <Card className="h-full transition-all duration-300 group-hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant={insight.trend === 'positive' ? 'default' : insight.trend === 'warning' ? 'destructive' : 'secondary'}>
                          {insight.type}
                        </Badge>
                        <div className="text-2xl font-bold text-right">
                          {insight.metric}
                        </div>
                      </div>
                      
                      <h4 className="font-semibold mb-2">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                      
                      <div className="mt-4 flex items-center space-x-1">
                        {insight.trend === 'positive' && (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-600">Trending positive</span>
                          </>
                        )}
                        {insight.trend === 'warning' && (
                          <>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-xs text-orange-600">Needs attention</span>
                          </>
                        )}
                        {insight.trend === 'neutral' && (
                          <>
                            <Activity className="h-4 w-4 text-blue-500" />
                            <span className="text-xs text-blue-600">Stable</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Story Chapter Components
function PerformanceOverviewStory({ analytics, servers }: any) {
  const chartData = analytics?.last7Days || [];
  const serverArray = Array.isArray(servers) ? servers : [];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>The Performance Journey</span>
          </CardTitle>
          <CardDescription>
            Your servers have been on an incredible journey. Here's their story over the last 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#uptimeGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Server className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <div className="text-2xl font-bold">{serverArray.length}</div>
            <div className="text-sm text-muted-foreground">Total Servers</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <div className="text-2xl font-bold">{serverArray.filter((s: any) => s?.status === 'running').length}</div>
            <div className="text-sm text-muted-foreground">Active Now</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <div className="text-2xl font-bold">
              {chartData.length > 0 ? ((chartData.reduce((sum: number, day: any) => sum + (day?.uptime || 0), 0) / chartData.length)).toFixed(1) : '0.0'}%
            </div>
            <div className="text-sm text-muted-foreground">Avg Uptime</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CostEfficiencyStory({ analytics, todayData }: any) {
  const chartData = analytics?.last7Days || [];
  const totalCost = chartData.reduce((sum: number, day: any) => sum + day.cost, 0);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>The Cost Optimization Story</span>
          </CardTitle>
          <CardDescription>
            Every dollar spent tells a story of growth, efficiency, and smart resource management.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Daily Cost']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">7-Day Total</div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">${(totalCost / 7).toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Daily Average</div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function UptimeReliabilityStory({ analytics }: any) {
  const chartData = analytics?.last7Days || [];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>The Reliability Chronicles</span>
          </CardTitle>
          <CardDescription>
            Uptime is more than a metric—it's a promise to your users and a testament to your infrastructure's resilience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[85, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Uptime']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GrowthTrajectoryStory({ analytics, servers }: any) {
  const monthlyData = analytics?.last6Months || [];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>The Growth Narrative</span>
          </CardTitle>
          <CardDescription>
            Every server launched, every resource allocated, tells the story of your expanding digital footprint.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: 'none', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="servers" 
                  stroke="#f97316" 
                  fillOpacity={1} 
                  fill="url(#growthGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}