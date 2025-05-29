import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Share2, 
  PlusCircle, 
  CheckCircle, 
  Images, 
  Calendar, 
  Settings, 
  RotateCw 
} from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/platforms", label: "Platforms", icon: Share2 },
  { path: "/create", label: "Create Content", icon: PlusCircle },
  { path: "/approvals", label: "Approvals", icon: CheckCircle, badge: 3 },
  { path: "/media", label: "Media Library", icon: Images },
  { path: "/schedule", label: "Schedule", icon: Calendar },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <RotateCw className="text-white h-4 w-4" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SocialSync
          </span>
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <a className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                }`}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
