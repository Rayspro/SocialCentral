import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Star, Sparkles, TrendingUp, ThumbsUp, ThumbsDown, Eye, Play } from "lucide-react";

interface WorkflowRecommendation {
  id: number;
  userId: number;
  workflowId: number | null;
  recommendationType: string;
  confidence: number;
  reasoning: string;
  promptSuggestions: string[];
  isViewed: boolean;
  isUsed: boolean;
  userFeedback: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface WorkflowRecommendationsProps {
  userId: number;
}

export default function WorkflowRecommendations({ userId }: WorkflowRecommendationsProps) {
  const queryClient = useQueryClient();

  // Fetch user recommendations
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['/api/recommendations', userId],
    enabled: !!userId
  });

  // Fetch trending workflows
  const { data: trendingWorkflows = [] } = useQuery({
    queryKey: ['/api/recommendations/trending']
  });

  // Generate new recommendations
  const generateRecommendations = useMutation({
    mutationFn: async () => {
      console.log('Generating recommendations for userId:', userId);
      const response = await fetch(`/api/recommendations/${userId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to generate recommendations: ${errorText}`);
      }
      const result = await response.json();
      console.log('Generated recommendations:', result);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations', userId] });
      toast({
        title: "Recommendations Generated",
        description: `Generated ${data.recommendations?.length || 0} new personalized workflow recommendations!`
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate recommendations. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update recommendation feedback
  const updateFeedback = useMutation({
    mutationFn: async ({ recommendationId, feedback, isUsed }: {
      recommendationId: number;
      feedback: string;
      isUsed?: boolean;
    }) => {
      const response = await fetch(`/api/recommendations/${recommendationId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback, isUsed })
      });
      if (!response.ok) {
        throw new Error('Failed to update feedback');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations', userId] });
      toast({
        title: "Feedback Recorded",
        description: "Thank you for your feedback!"
      });
    }
  });

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'personal':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'skill_development':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Eye className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleUseRecommendation = (recommendation: WorkflowRecommendation) => {
    updateFeedback.mutate({
      recommendationId: recommendation.id,
      feedback: 'used',
      isUsed: true
    });
  };

  const handleFeedback = (recommendationId: number, feedback: string) => {
    updateFeedback.mutate({
      recommendationId,
      feedback
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Workflow Recommendations</h2>
          <p className="text-muted-foreground">
            Personalized workflow suggestions based on your preferences and usage patterns
          </p>
        </div>
        <Button
          onClick={() => {
            console.log('Generate button clicked');
            generateRecommendations.mutate();
          }}
          disabled={generateRecommendations.isPending}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {generateRecommendations.isPending ? 'Generating...' : 'Generate New'}
        </Button>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Personal Recommendations</TabsTrigger>
          <TabsTrigger value="trending">Trending Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Generate personalized workflow recommendations based on your usage patterns
                </p>
                <Button
                  onClick={() => generateRecommendations.mutate()}
                  disabled={generateRecommendations.isPending}
                >
                  Generate Recommendations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {recommendations.map((recommendation: WorkflowRecommendation) => (
                  <Card key={recommendation.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRecommendationIcon(recommendation.recommendationType)}
                          <Badge variant="outline" className="capitalize">
                            {recommendation.recommendationType.replace('_', ' ')}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <div
                              className={`h-2 w-2 rounded-full ${getConfidenceColor(recommendation.confidence)}`}
                            />
                            <span className="text-sm text-muted-foreground">
                              {recommendation.confidence}% match
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!recommendation.isUsed && (
                            <Button
                              size="sm"
                              onClick={() => handleUseRecommendation(recommendation)}
                              className="gap-1"
                            >
                              <Play className="h-3 w-3" />
                              Use
                            </Button>
                          )}
                          {recommendation.isUsed && (
                            <Badge variant="secondary">Used</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{recommendation.reasoning}</p>
                      
                      {recommendation.promptSuggestions && recommendation.promptSuggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Suggested Prompts:</h4>
                          <div className="space-y-1">
                            {recommendation.promptSuggestions.map((prompt, index) => (
                              <div
                                key={index}
                                className="text-sm bg-muted p-2 rounded text-muted-foreground italic"
                              >
                                "{prompt}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Created {new Date(recommendation.createdAt).toLocaleDateString()}
                        </div>
                        
                        {!recommendation.userFeedback && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Helpful?</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFeedback(recommendation.id, 'helpful')}
                              className="h-6 w-6 p-0"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFeedback(recommendation.id, 'not_helpful')}
                              className="h-6 w-6 p-0"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {recommendation.userFeedback && (
                          <Badge variant="outline" className="text-xs">
                            Feedback: {recommendation.userFeedback.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          {trendingWorkflows.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Trending Workflows</h3>
                <p className="text-muted-foreground text-center">
                  Trending workflows will appear here based on community usage
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4 pr-4">
                {trendingWorkflows.map((workflow: WorkflowRecommendation) => (
                  <Card key={workflow.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          <Badge variant="outline">Trending</Badge>
                          <div className="flex items-center gap-1">
                            <div className={`h-2 w-2 rounded-full ${getConfidenceColor(workflow.confidence)}`} />
                            <span className="text-sm text-muted-foreground">
                              {workflow.confidence}% popularity
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm">{workflow.reasoning}</p>
                      
                      {workflow.promptSuggestions && workflow.promptSuggestions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Popular Prompts:</h4>
                          <div className="space-y-1">
                            {workflow.promptSuggestions.map((prompt, index) => (
                              <div
                                key={index}
                                className="text-sm bg-muted p-2 rounded text-muted-foreground italic"
                              >
                                "{prompt}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}