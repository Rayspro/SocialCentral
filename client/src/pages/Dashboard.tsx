import { StatsGrid } from "@/components/StatsGrid";
import { PlatformManager } from "@/components/PlatformManager";
import { QuickActions } from "@/components/QuickActions";
import { ServerAnalytics } from "@/components/ServerAnalyticsFixed";
import { Button } from "@/components/ui/button";
import { BarChart3, Home, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-4 space-y-6">
        {/* Header with Breadcrumb and Profile */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center space-x-2 text-sm">
            <span className="text-slate-900 dark:text-slate-100 font-medium flex items-center gap-1">
              <Home className="h-4 w-4" />
              Dashboard
            </span>
          </nav>
          
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            
            <Button variant="ghost" size="sm" className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Bell className="h-3.5 w-3.5" />
            </Button>
            
            <UserProfileDropdown />
          </div>
        </div>

        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
              <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Dashboard
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">
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

        <ServerAnalytics />
      </div>
    </div>
  );
}
