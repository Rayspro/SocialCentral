import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Zap,
  GamepadIcon,
  Brain,
  Code,
  Sparkles,
  Rocket,
  Target,
  Coffee,
  Timer,
  CheckCircle,
  AlertTriangle,
  History,
  Settings,
  Play,
  Palette,
  Clock,
} from "lucide-react";
import { ServerMood, ServerMoodApplication } from "@shared/schema";

interface ServerMoodConfiguratorProps {
  serverId: number;
}

interface MoodConfiguration {
  comfySettings: {
    autoStartup: boolean;
    modelPresets: string[];
    workflowTemplates: string[];
    performanceMode: string;
  };
  systemSettings: {
    ramAllocation: string;
    gpuBoost: boolean;
    cpuPriority: string;
    storageOptimization: boolean;
  };
  networkSettings: {
    bandwidth: string;
    latencyOptimization: boolean;
    portForwarding: string[];
  };
}

const getMoodIcon = (iconName: string) => {
  const icons: { [key: string]: React.ReactNode } = {
    'zap': <Zap className="h-5 w-5" />,
    'gamepad': <GamepadIcon className="h-5 w-5" />,
    'brain': <Brain className="h-5 w-5" />,
    'code': <Code className="h-5 w-5" />,
    'sparkles': <Sparkles className="h-5 w-5" />,
    'rocket': <Rocket className="h-5 w-5" />,
    'target': <Target className="h-5 w-5" />,
    'coffee': <Coffee className="h-5 w-5" />,
  };
  return icons[iconName] || <Settings className="h-5 w-5" />;
};

const getMoodColor = (color: string) => {
  const colors: { [key: string]: string } = {
    'blue': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200',
    'green': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200',
    'purple': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200',
    'orange': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200',
    'pink': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-200',
    'indigo': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-200',
    'red': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200',
    'yellow': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200',
  };
  return colors[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
};

export function ServerMoodConfigurator({ serverId }: ServerMoodConfiguratorProps) {
  const [applyingMood, setApplyingMood] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch available mood configurations
  const { data: moods = [], isLoading: loadingMoods } = useQuery({
    queryKey: ['/api/server-moods'],
  });

  // Fetch current server mood applications
  const { data: applications = [], isLoading: loadingApplications } = useQuery({
    queryKey: [`/api/server-moods/applications/${serverId}`],
  });

  // Fetch current server mood
  const { data: currentMood } = useQuery({
    queryKey: [`/api/server-moods/current/${serverId}`],
  });

  const applyMoodMutation = useMutation({
    mutationFn: async ({ moodId }: { moodId: number }) => {
      setApplyingMood(moodId);
      const response = await fetch(`/api/server-moods/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, moodId }),
      });
      if (!response.ok) {
        throw new Error('Failed to apply mood configuration');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/server-moods/applications/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/server-moods/current/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/vast-servers/${serverId}`] });
      
      const mood = moods.find((m: ServerMood) => m.id === variables.moodId);
      toast({
        title: "Mood Applied Successfully",
        description: `${mood?.name} configuration has been applied to your server.`,
      });
      setApplyingMood(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Apply Mood",
        description: error.message,
        variant: "destructive",
      });
      setApplyingMood(null);
    },
  });

  const revertMoodMutation = useMutation({
    mutationFn: async ({ applicationId }: { applicationId: number }) => {
      const response = await fetch(`/api/server-moods/revert/${applicationId}`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to revert mood configuration');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/server-moods/applications/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/server-moods/current/${serverId}`] });
      toast({
        title: "Configuration Reverted",
        description: "Server has been restored to previous configuration.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Revert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const groupedMoods = Array.isArray(moods) ? moods.reduce((groups: { [key: string]: ServerMood[] }, mood: ServerMood) => {
    const category = mood.category || 'other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(mood);
    return groups;
  }, {}) : {};

  const getCategoryTitle = (category: string) => {
    const titles: { [key: string]: string } = {
      'productivity': 'Productivity & Work',
      'gaming': 'Gaming & Entertainment',
      'ai': 'AI & Machine Learning',
      'development': 'Development & Coding',
      'other': 'General Purpose',
    };
    return titles[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      'productivity': <Target className="h-4 w-4" />,
      'gaming': <GamepadIcon className="h-4 w-4" />,
      'ai': <Brain className="h-4 w-4" />,
      'development': <Code className="h-4 w-4" />,
      'other': <Settings className="h-4 w-4" />,
    };
    return icons[category] || <Settings className="h-4 w-4" />;
  };

  const lastApplication = Array.isArray(applications) && applications.length > 0 
    ? applications[applications.length - 1] 
    : null;

  return (
    <div className="space-y-6">
      {/* Current Mood Status */}
      {currentMood && (
        <Card className="border-dashed border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Current Server Mood
            </CardTitle>
            <CardDescription>
              Active configuration applied to this server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getMoodColor(currentMood.color)}`}>
                  {getMoodIcon(currentMood.icon)}
                </div>
                <div>
                  <h4 className="font-medium">{currentMood.name}</h4>
                  <p className="text-sm text-muted-foreground">{currentMood.description}</p>
                </div>
              </div>
              {lastApplication && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Applied {new Date(lastApplication.appliedAt).toLocaleString()}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revertMoodMutation.mutate({ applicationId: lastApplication.id })}
                    disabled={revertMoodMutation.isPending}
                  >
                    <History className="h-4 w-4 mr-1" />
                    Revert
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Categories */}
      {Object.entries(groupedMoods).map(([category, categoryMoods]) => (
        <div key={category} className="space-y-4">
          <div className="flex items-center gap-2">
            {getCategoryIcon(category)}
            <h3 className="text-lg font-semibold">{getCategoryTitle(category)}</h3>
            <Badge variant="secondary" className="text-xs">
              {categoryMoods.length} moods
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryMoods.map((mood: ServerMood) => {
              const isApplying = applyingMood === mood.id;
              const isCurrent = currentMood?.id === mood.id;
              
              return (
                <Card 
                  key={mood.id} 
                  className={`hover:shadow-md transition-all duration-200 cursor-pointer ${
                    isCurrent ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                  } ${isApplying ? 'animate-pulse' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getMoodColor(mood.color)}`}>
                          {getMoodIcon(mood.icon)}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium">
                            {mood.name}
                            {mood.isBuiltIn && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Built-in
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {mood.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Configuration Preview */}
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Settings className="h-3 w-3" />
                          <span>Configuration includes:</span>
                        </div>
                        <div className="pl-5 space-y-1">
                          {mood.configuration && typeof mood.configuration === 'object' && (
                            <>
                              {(mood.configuration as any).comfySettings && (
                                <div className="text-xs">• ComfyUI optimizations</div>
                              )}
                              {(mood.configuration as any).systemSettings && (
                                <div className="text-xs">• System performance tuning</div>
                              )}
                              {(mood.configuration as any).networkSettings && (
                                <div className="text-xs">• Network optimization</div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Apply Button */}
                      <Button
                        onClick={() => applyMoodMutation.mutate({ moodId: mood.id })}
                        disabled={isApplying || isCurrent || applyMoodMutation.isPending}
                        className="w-full"
                        variant={isCurrent ? "secondary" : "default"}
                        size="sm"
                      >
                        {isApplying ? (
                          <>
                            <Timer className="h-4 w-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : isCurrent ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Currently Active
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Apply Configuration
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Application History */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Mood Applications
            </CardTitle>
            <CardDescription>
              History of mood configurations applied to this server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.slice(-5).reverse().map((app: ServerMoodApplication) => {
                const mood = moods.find((m: ServerMood) => m.id === app.moodId);
                return (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {mood && (
                        <div className={`p-1 rounded ${getMoodColor(mood.color)}`}>
                          {getMoodIcon(mood.icon)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{mood?.name || 'Unknown Mood'}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied {new Date(app.appliedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={app.status === 'applied' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {app.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading States */}
      {(loadingMoods || loadingApplications) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loadingMoods && moods.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Mood Configurations Available</h3>
            <p className="text-muted-foreground text-center">
              Mood configurations will appear here once they are created.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}