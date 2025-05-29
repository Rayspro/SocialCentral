import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformManagementModal } from "@/components/PlatformManagementModal";
import { PlatformConnectionModal } from "@/components/PlatformConnectionModal";
import { Plus, Settings, Link } from "lucide-react";
import { useState } from "react";
import type { Platform } from "@shared/schema";

export function PlatformManager() {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const { data: platforms, isLoading } = useQuery({
    queryKey: ["/api/platforms"],
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
  });

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connected Platforms</CardTitle>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const getAccountCount = (platformId: number) => {
    if (!accounts || !Array.isArray(accounts)) return 0;
    return accounts.filter((account: any) => account.platformId === platformId).length || 0;
  };

  const handleManagePlatform = (platform: Platform) => {
    setSelectedPlatform(platform);
    setShowModal(true);
  };

  const platformIcons: Record<string, string> = {
    youtube: "🎥",
    instagram: "📷",
    twitter: "🐦",
    linkedin: "💼",
  };

  const platformColors: Record<string, string> = {
    red: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    pink: "bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400",
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    indigo: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400",
  };

  return (
    <>
      <Card className="lg:col-span-2 border border-gray-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-900 dark:text-white">Connected Platforms</CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => setShowConnectionModal(true)}
              >
                <Link className="h-4 w-4 mr-2" />
                Connect Platform
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  setSelectedPlatform(null);
                  setShowModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {platforms && Array.isArray(platforms) && platforms.map((platform: Platform) => {
            const accountCount = getAccountCount(platform.id);
            return (
              <div
                key={platform.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                    platformColors[platform.color] || "bg-gray-100 dark:bg-gray-600"
                  }`}>
                    {platformIcons[platform.name] || "📱"}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {platform.displayName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {accountCount} account{accountCount !== 1 ? 's' : ''} connected
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20">
                    Active
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleManagePlatform(platform)}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <PlatformManagementModal
        platform={selectedPlatform}
        open={showModal}
        onOpenChange={setShowModal}
      />

      <PlatformConnectionModal
        open={showConnectionModal}
        onOpenChange={setShowConnectionModal}
      />
    </>
  );
}
