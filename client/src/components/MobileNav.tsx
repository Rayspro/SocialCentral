import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Home, Share2, PlusCircle, Server, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const quickNavItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/platforms", label: "Platforms", icon: Share2 },
  { path: "/create", label: "Create", icon: PlusCircle },
  { path: "/vast-servers", label: "Servers", icon: Server },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 shadow-lg border"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile navigation */}
      {isOpen && (
        <nav className="lg:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-300">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                SocialSync
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-2">
              {quickNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}>
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </>
  );
}