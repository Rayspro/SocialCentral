import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Share2, 
  PlusCircle, 
  CheckCircle, 
  Images, 
  Calendar, 
  Settings, 
  Server,
  RotateCw,
  Wand2,
  BookOpen,
  Shield,
  Workflow,
  Brain
} from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: BarChart3, section: "overview" },
  { path: "/platforms", label: "Platforms", icon: Share2, section: "content" },
  { path: "/create", label: "Create Content", icon: PlusCircle, section: "content" },
  { path: "/approvals", label: "Approvals", icon: CheckCircle, badge: 3, section: "content" },
  { path: "/media", label: "Media Library", icon: Images, section: "content" },
  { path: "/schedule", label: "Schedule", icon: Calendar, section: "content" },
  { path: "/vast-servers", label: "Servers", icon: Server, section: "infrastructure" },
  { path: "/workflows", label: "Workflows", icon: Workflow, section: "infrastructure" },
  { path: "/recommendations", label: "Recommendations", icon: Brain, section: "intelligence" },
  { path: "/performance-story", label: "Performance", icon: BookOpen, section: "intelligence" },
  { path: "/audit-log", label: "Audit Log", icon: Shield, section: "system" },
  { path: "/settings", label: "Settings", icon: Settings, section: "system" },
];

const sectionTitles = {
  overview: "Overview",
  content: "Content Management", 
  infrastructure: "Infrastructure",
  intelligence: "Intelligence",
  system: "System"
};

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-slate-900 dark:bg-slate-100 rounded-md flex items-center justify-center">
            <RotateCw className="text-slate-100 dark:text-slate-900 h-5 w-5" />
          </div>
          <span className="text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            SocialSync
          </span>
        </div>
        
        <nav className="space-y-6">
          {Object.entries(sectionTitles).map(([sectionKey, sectionTitle]) => {
            const sectionItems = navigationItems.filter(item => item.section === sectionKey);
            
            return (
              <div key={sectionKey} className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3">
                  {sectionTitle}
                </h3>
                <div className="space-y-1">
                  {sectionItems.map((item) => {
                    const isActive = location === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <Link key={item.path} href={item.path}>
                        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 shadow-sm"
                            : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                        }`}>
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className="bg-slate-600 dark:bg-slate-400 text-slate-100 dark:text-slate-900 text-xs px-2 py-0.5 rounded-md font-medium">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
