import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
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
  Brain,
  ChevronLeft,
  ChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Update CSS custom property for main content margin with smooth transition
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '4rem' : '16rem');
    // Add transition property to root for smoother animation
    document.documentElement.style.transition = 'margin 500ms cubic-bezier(0.4, 0.0, 0.2, 1)';
  }, [isCollapsed]);

  return (
    <aside className={`fixed left-0 top-0 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transition-all duration-500 ease-in-out transform ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-6">
        <div className={`flex items-center gap-3 mb-10 transition-all duration-300 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-slate-900 dark:bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-300">
            <RotateCw className="text-slate-100 dark:text-slate-900 h-5 w-5" />
          </div>
          <span 
            className={`text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight transition-all duration-300 ${
              isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
            }`}
          >
            SocialSync
          </span>
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-6 -right-3 w-6 h-6 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
        >
          <div className="transition-transform duration-300">
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3 text-slate-100 dark:text-slate-900" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-slate-100 dark:text-slate-900" />
            )}
          </div>
        </button>
        
        <nav className={`space-y-6 transition-all duration-300 ${isCollapsed ? 'space-y-2' : ''}`}>
          {Object.entries(sectionTitles).map(([sectionKey, sectionTitle], sectionIndex) => {
            const sectionItems = navigationItems.filter(item => item.section === sectionKey);
            
            return (
              <div 
                key={sectionKey} 
                className={`space-y-2 transition-all duration-300 ${isCollapsed ? 'space-y-1' : ''}`}
                style={{ transitionDelay: `${sectionIndex * 50}ms` }}
              >
                <h3 
                  className={`text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 transition-all duration-300 ${
                    isCollapsed ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'
                  }`}
                >
                  {sectionTitle}
                </h3>
                <div className={`space-y-1 transition-all duration-300 ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
                  {sectionItems.map((item, itemIndex) => {
                    const isActive = location === item.path;
                    const Icon = item.icon;
                    
                    return (
                      <Link key={item.path} href={item.path}>
                        <div 
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-300 relative group ${
                            isCollapsed ? 'w-10 h-10 justify-center p-0' : ''
                          } ${
                            isActive
                              ? "bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 shadow-sm"
                              : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                          }`}
                          title={isCollapsed ? item.label : undefined}
                          style={{ transitionDelay: `${(sectionIndex * sectionItems.length + itemIndex) * 30}ms` }}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0 transition-all duration-300" />
                          <span 
                            className={`flex-1 transition-all duration-300 ${
                              isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
                            }`}
                          >
                            {item.label}
                          </span>
                          {item.badge && (
                            <span 
                              className={`bg-slate-600 dark:bg-slate-400 text-slate-100 dark:text-slate-900 text-xs px-2 py-0.5 rounded-md font-medium transition-all duration-300 ${
                                isCollapsed ? 'absolute -top-1 -right-1 w-5 h-5 px-0 py-0 rounded-full flex items-center justify-center' : 'relative'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {/* Tooltip for collapsed state */}
                          {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-100 text-slate-100 dark:text-slate-900 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 whitespace-nowrap z-50">
                              {item.label}
                            </div>
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
