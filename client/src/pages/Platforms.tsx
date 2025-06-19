import { PlatformManager } from "@/components/PlatformManager";
import { Link2, Home, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Platforms() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Elegant Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm">
          <button 
            onClick={() => setLocation('/')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </button>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-medium">
            Platforms
          </span>
        </nav>

        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
              <Link2 className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Platforms
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage your connected social media accounts
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <PlatformManager />
        </div>
      </div>
    </div>
  );
}
