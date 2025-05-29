import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Eye } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Content } from "@shared/schema";

export default function Approvals() {
  const { toast } = useToast();

  const { data: pendingContent, isLoading } = useQuery({
    queryKey: ["/api/content"],
    queryFn: async () => {
      const response = await fetch("/api/content?status=pending");
      if (!response.ok) throw new Error("Failed to fetch pending content");
      return response.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (contentId: number) => {
      return apiRequest("PUT", `/api/content/${contentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Content approved",
        description: "The content has been approved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve content",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (contentId: number) => {
      return apiRequest("PUT", `/api/content/${contentId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Content rejected",
        description: "The content has been rejected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject content",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (contentId: number) => {
    approveMutation.mutate(contentId);
  };

  const handleReject = (contentId: number) => {
    rejectMutation.mutate(contentId);
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const contentDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - contentDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  const getPlatformName = (platformId: number | null) => {
    const platforms: Record<number, string> = {
      1: "YouTube",
      2: "Instagram", 
      3: "Twitter",
      4: "LinkedIn",
    };
    return platforms[platformId || 0] || "Unknown";
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return "🎥";
      case "image":
        return "🖼️";
      default:
        return "📄";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Header title="Approvals" subtitle="Review and approve pending content" />
        
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header title="Approvals" subtitle="Review and approve pending content" />
      
      <div className="p-6">
        <Card className="border border-gray-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white">Pending Content</CardTitle>
              <Badge variant="secondary">
                {pendingContent?.length || 0} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingContent && pendingContent.length > 0 ? (
              pendingContent.map((content: Content) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
                      {getTypeIcon(content.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {content.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {content.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{getPlatformName(content.platformId)}</span>
                        <span>•</span>
                        <span>{getTimeAgo(content.createdAt)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {content.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {content.contentUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(content.contentUrl!, '_blank')}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={() => handleApprove(content.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white p-0"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(content.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Check className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No pending approvals
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All content has been reviewed. New submissions will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
