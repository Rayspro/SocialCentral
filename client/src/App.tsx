import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Sidebar } from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Platforms from "@/pages/Platforms";
import CreateContent from "@/pages/CreateContent";
import Approvals from "@/pages/Approvals";
import MediaLibrary from "@/pages/MediaLibrary";
import Schedule from "@/pages/Schedule";
import Settings from "@/pages/Settings";
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
      <Route path="/settings" component={Settings} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
            <Sidebar />
            <main className="ml-64 flex-1 min-h-screen">
              <Router />
            </main>
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
