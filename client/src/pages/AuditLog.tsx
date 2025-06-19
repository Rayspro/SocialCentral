import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  User, 
  Server, 
  AlertTriangle, 
  Activity, 
  Clock, 
  Filter,
  Search,
  RefreshCw,
  Eye,
  Download,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: number;
  category: string;
  userId: number | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
  severity: string;
}

interface AuditSummary {
  totalEvents: number;
  securityEvents: number;
  userActions: number;
  systemEvents: number;
  errorEvents: number;
  recentActivity: AuditLog[];
}

export default function AuditLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: auditLogs = [], isLoading: logsLoading, refetch: refetchLogs } = useQuery<AuditLog[]>({
    queryKey: ['/api/audit-logs', { limit: 1000, offset: 0 }],
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery<AuditSummary>({
    queryKey: ['/api/audit-logs/summary'],
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    refetchLogs();
    refetchSummary();
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || log.severity === severityFilter;
    const matchesResource = resourceFilter === "all" || log.resource === resourceFilter;
    
    return matchesSearch && matchesCategory && matchesSeverity && matchesResource;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-red-400';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security_event': return <Shield className="h-4 w-4" />;
      case 'user_action': return <User className="h-4 w-4" />;
      case 'system_event': return <Server className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('remove')) return 'text-red-600 dark:text-red-400';
    if (action.includes('create') || action.includes('add')) return 'text-green-600 dark:text-green-400';
    if (action.includes('update') || action.includes('modify')) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const uniqueResources = Array.from(new Set(auditLogs.map(log => log.resource)));

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitor system events, user actions, and security activities
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={logsLoading || summaryLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${logsLoading || summaryLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Summary Cards */}
          <div className="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary?.totalEvents || 0}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Security Events</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary?.securityEvents || 0}
                      </p>
                    </div>
                    <Shield className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User Actions</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary?.userActions || 0}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">System Events</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary?.systemEvents || 0}
                      </p>
                    </div>
                    <Server className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Error Events</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {summary?.errorEvents || 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="security_event">Security Events</SelectItem>
                  <SelectItem value="user_action">User Actions</SelectItem>
                  <SelectItem value="system_event">System Events</SelectItem>
                </SelectContent>
              </Select>

              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {uniqueResources.map(resource => (
                    <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Filter className="h-4 w-4 mr-1" />
                {filteredLogs.length} of {auditLogs.length} events
              </div>
            </div>
          </div>

          {/* Log List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-2">
                {logsLoading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">Loading audit logs...</p>
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Try adjusting your filters or search criteria
                    </p>
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <Card 
                      key={log.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                      style={{ borderLeftColor: getSeverityColor(log.severity).replace('bg-', '#') }}
                      onClick={() => setSelectedLog(log)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(log.category)}
                              <Badge variant="secondary" className="text-xs">
                                {log.category.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={`text-xs ${getSeverityColor(log.severity)} text-white`}>
                                {log.severity}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                            <Clock className="h-4 w-4" />
                            {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className={`font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Resource: {log.resource} {log.resourceId ? `(${log.resourceId})` : ''}
                          </p>
                          {log.ipAddress && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              IP: {log.ipAddress}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Log Detail Panel */}
        {selectedLog && (
          <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Event Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                  ×
                </Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Event ID</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.id}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Timestamp</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {format(new Date(selectedLog.timestamp), 'PPpp')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Action</label>
                  <p className={`text-sm font-medium ${getActionColor(selectedLog.action)}`}>
                    {selectedLog.action}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Resource</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.resource}</p>
                </div>
                
                {selectedLog.resourceId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Resource ID</label>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedLog.resourceId}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {getCategoryIcon(selectedLog.category)}
                    <Badge variant="secondary">{selectedLog.category.replace('_', ' ')}</Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Severity</label>
                  <Badge className={`mt-1 ${getSeverityColor(selectedLog.severity)} text-white`}>
                    {selectedLog.severity}
                  </Badge>
                </div>
                
                {selectedLog.userId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</label>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedLog.userId}</p>
                  </div>
                )}
                
                {selectedLog.ipAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">IP Address</label>
                    <p className="text-sm text-gray-900 dark:text-white">{selectedLog.ipAddress}</p>
                  </div>
                )}
                
                {selectedLog.userAgent && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">User Agent</label>
                    <p className="text-xs text-gray-900 dark:text-white break-all">{selectedLog.userAgent}</p>
                  </div>
                )}
                
                {selectedLog.details && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Details</label>
                    <pre className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}