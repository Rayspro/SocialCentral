import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import WorkflowRecommendations from "@/components/WorkflowRecommendations";
import { Settings, User, Brain, TrendingUp, Target, Clock } from "lucide-react";

interface UserPreferences {
  id?: number;
  userId: number;
  preferredStyles: string[];
  favoritePromptTypes: string[];
  usagePatterns: any;
  skillLevel: string;
  interests: string[];
}

export default function Recommendations() {
  const queryClient = useQueryClient();
  const userId = 1; // Demo user ID
  
  const [preferences, setPreferences] = useState<Partial<UserPreferences>>({
    preferredStyles: [],
    favoritePromptTypes: [],
    skillLevel: 'beginner',
    interests: []
  });

  // Fetch user preferences
  const { data: userPreferences } = useQuery({
    queryKey: ['/api/user-preferences', userId],
    enabled: !!userId
  });

  // Fetch user interactions for analytics
  const { data: interactions = [] } = useQuery({
    queryKey: ['/api/interactions', userId],
    enabled: !!userId
  });

  // Update user preferences
  const updatePreferences = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      const response = await fetch(`/api/user-preferences/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-preferences', userId] });
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Unable to save preferences. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleStyleToggle = (style: string) => {
    const currentStyles = preferences.preferredStyles || [];
    const updatedStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    
    setPreferences(prev => ({
      ...prev,
      preferredStyles: updatedStyles
    }));
  };

  const handlePromptTypeToggle = (type: string) => {
    const currentTypes = preferences.favoritePromptTypes || [];
    const updatedTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    
    setPreferences(prev => ({
      ...prev,
      favoritePromptTypes: updatedTypes
    }));
  };

  const handleInterestToggle = (interest: string) => {
    const currentInterests = preferences.interests || [];
    const updatedInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    setPreferences(prev => ({
      ...prev,
      interests: updatedInterests
    }));
  };

  const handleSavePreferences = () => {
    updatePreferences.mutate({
      userId,
      ...preferences
    });
  };

  const availableStyles = [
    'realistic', 'anime', 'abstract', 'fantasy', 'sci-fi', 'artistic',
    'photographic', 'painterly', 'digital_art', 'concept_art'
  ];

  const availablePromptTypes = [
    'portrait', 'landscape', 'character', 'environment', 'object',
    'architectural', 'nature', 'vehicle', 'creature', 'scene'
  ];

  const availableInterests = [
    'photography', 'digital_art', 'concept_art', 'character_design',
    'environment_design', 'game_art', 'illustration', 'fine_art'
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner', description: 'New to AI image generation' },
    { value: 'intermediate', label: 'Intermediate', description: 'Some experience with workflows' },
    { value: 'advanced', label: 'Advanced', description: 'Expert user with deep knowledge' }
  ];

  const getUsageStats = () => {
    const totalInteractions = interactions.length;
    const recentInteractions = interactions.filter((interaction: any) => {
      const interactionDate = new Date(interaction.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return interactionDate > weekAgo;
    }).length;

    const mostUsedTypes = interactions.reduce((acc: any, interaction: any) => {
      const type = interaction.entityType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalInteractions,
      recentInteractions,
      mostUsedTypes: Object.entries(mostUsedTypes)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([type, count]) => ({ type, count }))
    };
  };

  const stats = getUsageStats();

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Recommendations</h1>
          <p className="text-muted-foreground">
            Personalized workflow suggestions powered by artificial intelligence
          </p>
        </div>
      </div>

      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          <WorkflowRecommendations userId={userId} />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Personalization Settings
              </CardTitle>
              <CardDescription>
                Configure your preferences to receive better workflow recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Skill Level</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {skillLevels.map((level) => (
                    <Card
                      key={level.value}
                      className={`cursor-pointer border-2 transition-colors ${
                        preferences.skillLevel === level.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setPreferences(prev => ({ ...prev, skillLevel: level.value }))}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium">{level.label}</h4>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">Preferred Art Styles</Label>
                <div className="flex flex-wrap gap-2">
                  {availableStyles.map((style) => (
                    <Badge
                      key={style}
                      variant={preferences.preferredStyles?.includes(style) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleStyleToggle(style)}
                    >
                      {style.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">Favorite Prompt Types</Label>
                <div className="flex flex-wrap gap-2">
                  {availablePromptTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={preferences.favoritePromptTypes?.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handlePromptTypeToggle(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">Areas of Interest</Label>
                <div className="flex flex-wrap gap-2">
                  {availableInterests.map((interest) => (
                    <Badge
                      key={interest}
                      variant={preferences.interests?.includes(interest) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleInterestToggle(interest)}
                    >
                      {interest.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSavePreferences}
                  disabled={updatePreferences.isPending}
                >
                  {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalInteractions}</div>
                <p className="text-xs text-muted-foreground">
                  All-time activity
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentInteractions}</div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usage Pattern</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.recentInteractions > 10 ? 'High' : stats.recentInteractions > 3 ? 'Medium' : 'Low'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Activity level
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Breakdown</CardTitle>
              <CardDescription>
                Your most frequently used features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.mostUsedTypes.length > 0 ? (
                <div className="space-y-3">
                  {stats.mostUsedTypes.map(({ type, count }: any, index) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ 
                              width: `${(count / stats.totalInteractions) * 100}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No usage data available yet. Start using workflows to see analytics.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}