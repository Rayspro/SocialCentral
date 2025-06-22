import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Server, 
  Zap, 
  Image, 
  Settings, 
  BarChart3,
  FileText,
  Clock,
  Command
} from 'lucide-react';
import { useNavigate } from 'wouter';
import { useServers } from '@/composables/useServer';
import { formatters, helpers } from '@/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'navigation' | 'server' | 'generation' | 'analytics';
  keywords: string[];
  action: () => void;
  shortcut?: string;
}

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { data: servers } = useServers();

  const quickActions: QuickAction[] = [
    // Navigation Actions
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      description: 'View overview and analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'navigation',
      keywords: ['dashboard', 'home', 'overview'],
      action: () => navigate('/dashboard'),
      shortcut: 'Ctrl+H'
    },
    {
      id: 'servers',
      title: 'Manage Servers',
      description: 'View and manage Vast.ai servers',
      icon: <Server className="w-4 h-4" />,
      category: 'navigation',
      keywords: ['servers', 'vast', 'instances'],
      action: () => navigate('/vast-servers'),
      shortcut: 'Ctrl+S'
    },
    {
      id: 'comfyui',
      title: 'ComfyUI Studio',
      description: 'Generate images with AI',
      icon: <Image className="w-4 h-4" />,
      category: 'navigation',
      keywords: ['comfy', 'generate', 'ai', 'images'],
      action: () => navigate('/comfyui'),
      shortcut: 'Ctrl+G'
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Cost and performance insights',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'analytics',
      keywords: ['analytics', 'stats', 'costs', 'performance'],
      action: () => navigate('/analytics'),
      shortcut: 'Ctrl+A'
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'Security and activity tracking',
      icon: <FileText className="w-4 h-4" />,
      category: 'navigation',
      keywords: ['audit', 'logs', 'security', 'activity'],
      action: () => navigate('/audit'),
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Configure your account',
      icon: <Settings className="w-4 h-4" />,
      category: 'navigation',
      keywords: ['settings', 'config', 'account'],
      action: () => navigate('/settings'),
    },

    // Server Actions
    ...(servers?.slice(0, 5).map(server => ({
      id: `server-${server.id}`,
      title: `View ${server.name}`,
      description: `${server.status} • ${server.gpu}`,
      icon: <Server className="w-4 h-4" />,
      category: 'server' as const,
      keywords: ['server', server.name.toLowerCase(), server.gpu.toLowerCase()],
      action: () => navigate(`/servers/${server.id}`),
    })) || []),

    // Quick Generation Actions
    {
      id: 'quick-generate',
      title: 'Quick Generate',
      description: 'Start image generation with default settings',
      icon: <Zap className="w-4 h-4" />,
      category: 'generation',
      keywords: ['generate', 'quick', 'image', 'ai'],
      action: () => {
        navigate('/comfyui');
        // Auto-open generation dialog
        setTimeout(() => {
          const generateButton = document.querySelector('[data-testid="quick-generate"]');
          if (generateButton) (generateButton as HTMLElement).click();
        }, 100);
      },
    },
    {
      id: 'view-progress',
      title: 'View Progress',
      description: 'Check ongoing generations',
      icon: <Clock className="w-4 h-4" />,
      category: 'generation',
      keywords: ['progress', 'generations', 'status'],
      action: () => navigate('/progress'),
    },
  ];

  const filteredActions = quickActions.filter(action => {
    if (!query) return true;
    const searchTerm = query.toLowerCase();
    return (
      action.title.toLowerCase().includes(searchTerm) ||
      action.description.toLowerCase().includes(searchTerm) ||
      action.keywords.some(keyword => keyword.includes(searchTerm))
    );
  });

  const executeAction = (action: QuickAction) => {
    action.action();
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open quick actions with Ctrl+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      // Navigate with arrow keys when open
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredActions.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredActions.length - 1
          );
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredActions[selectedIndex]) {
            executeAction(filteredActions[selectedIndex]);
          }
        }
      }

      // Individual shortcuts
      quickActions.forEach(action => {
        if (action.shortcut) {
          const keys = action.shortcut.split('+');
          const isCtrlOrMeta = keys.includes('Ctrl') && (e.ctrlKey || e.metaKey);
          const keyMatch = keys[keys.length - 1].toLowerCase() === e.key.toLowerCase();
          
          if (isCtrlOrMeta && keyMatch) {
            e.preventDefault();
            action.action();
          }
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation': return '🧭';
      case 'server': return '🖥️';
      case 'generation': return '✨';
      case 'analytics': return '📊';
      default: return '⚡';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation': return 'bg-blue-100 text-blue-800';
      case 'server': return 'bg-green-100 text-green-800';
      case 'generation': return 'bg-purple-100 text-purple-800';
      case 'analytics': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2"
      >
        <Command className="w-4 h-4" />
        <span className="hidden sm:inline">Quick Actions</span>
        <Badge variant="secondary" className="hidden md:inline text-xs">
          Ctrl+K
        </Badge>
      </Button>

      {/* Quick Actions Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center space-x-2">
              <Command className="w-5 h-5" />
              <span>Quick Actions</span>
            </DialogTitle>
          </DialogHeader>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search actions..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <ScrollArea className="max-h-96">
            <div className="px-4 pb-4">
              {filteredActions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No actions found for "{query}"</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredActions.map((action, index) => (
                    <ActionItem
                      key={action.id}
                      action={action}
                      isSelected={index === selectedIndex}
                      onClick={() => executeAction(action)}
                      categoryIcon={getCategoryIcon(action.category)}
                      categoryColor={getCategoryColor(action.category)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
              <div className="flex items-center space-x-4">
                <span>Ctrl+K to open</span>
                <span>Ctrl+H for Dashboard</span>
                <span>Ctrl+S for Servers</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ActionItemProps {
  action: QuickAction;
  isSelected: boolean;
  onClick: () => void;
  categoryIcon: string;
  categoryColor: string;
}

function ActionItem({ 
  action, 
  isSelected, 
  onClick, 
  categoryIcon, 
  categoryColor 
}: ActionItemProps) {
  return (
    <div
      className={`
        flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
      `}
      onClick={onClick}
    >
      <div className="flex-shrink-0">
        {action.icon}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900 truncate">
            {action.title}
          </h3>
          <Badge className={`text-xs ${categoryColor}`}>
            {categoryIcon} {helpers.capitalizeFirst(action.category)}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {action.description}
        </p>
      </div>

      {action.shortcut && (
        <div className="flex-shrink-0">
          <Badge variant="outline" className="text-xs">
            {action.shortcut}
          </Badge>
        </div>
      )}
    </div>
  );
}