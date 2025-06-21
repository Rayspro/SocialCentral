import { ComfyProgressMonitor } from '@/components/ComfyProgressMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Activity, Zap } from 'lucide-react';
import { Link } from 'wouter';

export default function ComfyProgressPage() {
  const { data: servers } = useQuery({
    queryKey: ['/api/vast-servers'],
  });

  const activeServers = servers?.filter((s: any) => 
    s.status === 'running' && (
      s.setupStatus === 'ready' || 
      s.setupStatus === 'demo-ready' ||
      s.metadata?.comfyUIStatus === 'demo-ready'
    )
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/create-content">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Content
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  ComfyUI Progress Monitor
                </h1>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Real-time Updates
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Progress Monitor */}
          <div className="lg:col-span-2">
            <ComfyProgressMonitor className="space-y-4" />
          </div>

          {/* Sidebar - Active Servers */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Servers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeServers.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active ComfyUI servers</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href="/vast-servers">Launch Server</Link>
                    </Button>
                  </div>
                ) : (
                  activeServers.map((server: any) => (
                    <div
                      key={server.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{server.name}</p>
                        <p className="text-xs text-gray-500">{server.gpu}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Ready
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/create-content">
                    <Activity className="w-4 h-4 mr-2" />
                    Generate New Image
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/workflows">
                    <Zap className="w-4 h-4 mr-2" />
                    Manage Workflows
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                  <Link href="/vast-servers">
                    <Activity className="w-4 h-4 mr-2" />
                    Server Manager
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Progress Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Today's Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">3</p>
                    <p className="text-xs text-gray-500">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">8.2m</p>
                    <p className="text-xs text-gray-500">Avg. Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">95%</p>
                    <p className="text-xs text-gray-500">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}