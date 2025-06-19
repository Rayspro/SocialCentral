import { StatsGrid } from "@/components/StatsGrid";
import { PlatformManager } from "@/components/PlatformManager";
import { QuickActions } from "@/components/QuickActions";
import { ContentCreationWorkflow } from "@/components/ContentCreationWorkflow";
import { BarChart3, Home, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <BarChart3 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Dashboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage your social media presence and AI workloads
              </p>
            </div>
          </div>
        </div>

        <StatsGrid />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PlatformManager />
          <QuickActions />
        </div>

        <ContentCreationWorkflow />
      </div>
    </div>
  );
}
