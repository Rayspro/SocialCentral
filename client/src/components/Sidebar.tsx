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
  ChevronRight,
  Menu,
  X
} from "lucide-react";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: BarChart3, section: "main" },
  { path: "/platforms", label: "Social Platforms", icon: Share2, section: "content" },
  { path: "/accounts", label: "Connected Accounts", icon: CheckCircle, section: "content" },
  { path: "/content", label: "Content Library", icon: PlusCircle, section: "content" },
  { path: "/scheduler", label: "Content Scheduler", icon: Calendar, section: "content" },
  { path: "/images", label: "AI Image Generator", icon: Images, section: "ai" },
  { path: "/workflows", label: "Workflow Designer", icon: Workflow, section: "ai" },
  { path: "/recommendations", label: "AI Recommendations", icon: Brain, section: "intelligence" },
  { path: "/servers", label: "Server Management", icon: Server, section: "system" },
  { path: "/restart-servers", label: "Restart Servers", icon: RotateCw, section: "system" },
  { path: "/comfy-models", label: "ComfyUI Models", icon: Wand2, section: "ai" },
  { path: "/audit-logs", label: "Audit Logs", icon: BookOpen, section: "system" },
  { path: "/settings", label: "Settings", icon: Settings, section: "system" },
  { path: "/security", label: "Security Center", icon: Shield, section: "system", badge: "3" }
];

const sectionTitles = {
  main: "Overview",
  content: "Content Management", 
  ai: "AI Generation",
  intelligence: "Intelligence",
  system: "System"
};

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Update CSS custom property for main content margin with smooth transition
  useEffect(() => {
    // On mobile, sidebar is overlay so no margin adjustment needed
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '4rem' : '16rem');
      } else {
        document.documentElement.style.setProperty('--sidebar-width', '0');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-60 w-10 h-10 bg-slate-900 dark:bg-slate-100 rounded-lg flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-300 shadow-lg"
      >
        <Menu className="h-5 w-5 text-slate-100 dark:text-slate-900" />
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transition-all duration-500 ease-in-out transform 
        ${isCollapsed ? 'w-16' : 'w-64'} 
        md:translate-x-0 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-100 dark:to-slate-200 rounded-lg flex items-center justify-center">
              <Share2 className="h-4 w-4 text-slate-100 dark:text-slate-900" />
            </div>
            <span 
              className={`font-bold text-lg text-slate-900 dark:text-slate-100 transition-all duration-300 ${
                isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'
              }`}
            >
              SocialSync
            </span>
          </div>
          
          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex absolute top-6 -right-3 w-6 h-6 bg-slate-900 dark:bg-slate-100 rounded-full items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl"
          >
            <div className="transition-transform duration-300">
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3 text-slate-100 dark:text-slate-900" />
              ) : (
                <ChevronLeft className="h-3 w-3 text-slate-100 dark:text-slate-900" />
              )}
            </div>
          </button>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden absolute top-6 right-6 w-6 h-6 bg-slate-900 dark:bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-all duration-300"
          >
            <X className="h-3 w-3 text-slate-100 dark:text-slate-900" />
          </button>
          
          <nav className={`flex-1 px-4 py-6 space-y-6 transition-all duration-300 ${isCollapsed ? 'space-y-2' : ''}`}>
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
    </>
  );
}