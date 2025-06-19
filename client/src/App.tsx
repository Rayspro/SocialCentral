import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import { useTabRefresh } from "@/hooks/useTabRefresh";
import Dashboard from "@/pages/Dashboard";
import Platforms from "@/pages/Platforms";
import CreateContent from "@/pages/CreateContent";
import Approvals from "@/pages/Approvals";
import MediaLibrary from "@/pages/MediaLibrary";
import Schedule from "@/pages/Schedule";
import Settings from "@/pages/Settings";
import VastServers from "@/pages/VastServers";
import ServerDetails from "@/pages/ServerDetails";
import ServerDetail from "@/pages/ServerDetail";
import { ServerDetailPage } from "@/pages/ServerDetailPage";
import ComfyUI from "@/pages/ComfyUI";
import PerformanceStory from "@/pages/PerformanceStory";
import AuditLog from "@/pages/AuditLog";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/platforms" component={Platforms} />
      <Route path="/create" component={CreateContent} />
      <Route path="/approvals" component={Approvals} />
      <Route path="/media" component={MediaLibrary} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/vast-servers" component={VastServers} />
      <Route path="/vast-servers/:id" component={ServerDetails} />
      <Route path="/server-detail/:serverId" component={ServerDetail} />
      <Route path="/server/:id" component={ServerDetailPage} />
      <Route path="/server/:serverId/comfy-ui">
        {(params) => <ComfyUI serverId={params.serverId} />}
      </Route>
      <Route path="/performance-story" component={PerformanceStory} />
      <Route path="/audit-log" component={AuditLog} />
      <Route path="/settings" component={Settings} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const isAuthPage = location === '/signin' || location === '/signup';
  
  // Enable tab refresh functionality
  useTabRefresh();

  // Handle redirects with useEffect to avoid state updates during render
  useEffect(() => {
    if (isLoading) return;
    
    if (isAuthenticated && isAuthPage) {
      setLocation('/');
    } else if (!isAuthenticated && !isAuthPage) {
      setLocation('/signin');
    }
  }, [isAuthenticated, isLoading, isAuthPage, setLocation]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth pages without sidebar
  if (isAuthPage) {
    return <Router />;
  }

  // Show main app with sidebar for authenticated users
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar />
      <main className="ml-64 flex-1 min-h-screen">
        <Router />
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <AppLayout />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
