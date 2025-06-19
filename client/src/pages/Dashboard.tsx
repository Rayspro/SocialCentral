import { StatsGrid } from "@/components/StatsGrid";
import { PlatformManager } from "@/components/PlatformManager";
import { QuickActions } from "@/components/QuickActions";
import { ContentCreationWorkflow } from "@/components/ContentCreationWorkflow";
import { Button } from "@/components/ui/button";
import { BarChart3, Home, ChevronRight, User, Settings, LogOut, Bell } from "lucide-react";
import { useLocation } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 w-7 h-7 rounded-full">
                  <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white text-xs font-medium">JD</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      john@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  logout();
                  setLocation('/signin');
                }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

        <ContentCreationWorkflow />
      </div>
    </div>
  );
}
