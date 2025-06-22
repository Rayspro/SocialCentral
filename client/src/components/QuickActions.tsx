import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Image, CalendarPlus, Check, X } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Content } from "@shared/schema";

export function QuickActions() {
  const { toast } = useToast();

  const { data: pendingContent } = useQuery({
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

  return (
    <div className="space-y-6">
      {/* Quick Actions Card */}
      <Card className="border border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-base text-gray-900 dark:text-white">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <Link href="/create">
            <Button className="w-full justify-start bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-0 h-12 sm:h-14">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Video className="text-white h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm sm:text-base">Create Video</p>
                <p className="text-xs sm:text-sm text-blue-500 dark:text-blue-300">Text to video generation</p>
              </div>
            </Button>
          </Link>
          
          <Link href="/create">
            <Button className="w-full justify-start bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-0 h-12 sm:h-14">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Image className="text-white h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm sm:text-base">Generate Image</p>
                <p className="text-xs sm:text-sm text-purple-500 dark:text-purple-300">AI-powered image creation</p>
              </div>
            </Button>
          </Link>
          
          <Link href="/schedule">
            <Button className="w-full justify-start bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 border-0 h-12 sm:h-14">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                <CalendarPlus className="text-white h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm sm:text-base">Schedule Post</p>
                <p className="text-xs sm:text-sm text-green-500 dark:text-green-300">Plan your content</p>
              </div>
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Pending Approvals Card */}
      <Card className="border border-gray-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-gray-900 dark:text-white">Pending Approvals</CardTitle>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {pendingContent?.length || 0} items
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pendingContent && pendingContent.length > 0 ? (
            pendingContent.slice(0, 3).map((content: Content) => (
              <div key={content.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {content.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getPlatformName(content.platformId)} • {getTimeAgo(content.createdAt.toString())}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleApprove(content.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="w-6 h-6 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors p-0"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleReject(content.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    className="w-6 h-6 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Check className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending approvals</p>
            </div>
          )}
          
          {pendingContent && pendingContent.length > 3 && (
            <Link href="/approvals">
              <Button variant="outline" className="w-full text-sm">
                View All ({pendingContent.length - 3} more)
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
