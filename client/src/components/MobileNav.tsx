import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, BarChart3, Share2, PlusCircle, Server, Settings, Wand2, Calendar } from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/platforms", label: "Platforms", icon: Share2 },
  { path: "/create", label: "Create Content", icon: PlusCircle },
  { path: "/schedule", label: "Schedule", icon: Calendar },
  { path: "/comfy-ui", label: "ComfyUI", icon: Wand2 },
  { path: "/vast-servers", label: "Servers", icon: Server },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  return (
    <>
      {/* Mobile menu button - minimalist design */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-slate-900/90 dark:bg-slate-100/90 backdrop-blur-sm rounded-md flex items-center justify-center shadow-lg"
      >
        <Menu className="h-5 w-5 text-white dark:text-slate-900" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile navigation - professional sliding drawer */}
      <nav className={`lg:hidden fixed top-0 left-0 h-full w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 z-50 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center">
                <span className="text-white dark:text-slate-900 font-bold text-sm">S</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                SocialSync
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 p-6">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}>
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Version 1.0.0
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}