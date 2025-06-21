import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Image, Sparkles, User, Mountain, Palette } from 'lucide-react';

interface Workflow {
  id: number;
  name: string;
  description: string;
  category: string;
  thumbnail?: string;
}

interface WorkflowSelectorProps {
  workflows: Workflow[];
  selectedWorkflowId?: number;
  onSelectWorkflow: (workflowId: number) => void;
}

// Generate workflow thumbnails based on workflow type
const getWorkflowThumbnail = (workflow: Workflow): string => {
  const name = workflow.name.toLowerCase();
  
  if (name.includes('portrait') || name.includes('face')) {
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face';
  } else if (name.includes('anime') || name.includes('cartoon')) {
    return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=150&h=150&fit=crop';
  } else if (name.includes('landscape') || name.includes('nature')) {
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=150&h=150&fit=crop';
  } else if (name.includes('abstract') || name.includes('art')) {
    return 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=150&h=150&fit=crop';
  } else {
    return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop';
  }
};

// Get icon based on workflow category
const getWorkflowIcon = (workflow: Workflow) => {
  const name = workflow.name.toLowerCase();
  
  if (name.includes('portrait') || name.includes('face')) {
    return <User className="w-4 h-4" />;
  } else if (name.includes('anime') || name.includes('cartoon')) {
    return <Sparkles className="w-4 h-4" />;
  } else if (name.includes('landscape') || name.includes('nature')) {
    return <Mountain className="w-4 h-4" />;
  } else if (name.includes('abstract') || name.includes('art')) {
    return <Palette className="w-4 h-4" />;
  } else {
    return <Image className="w-4 h-4" />;
  }
};

// Get category color
const getCategoryColor = (workflow: Workflow): string => {
  const name = workflow.name.toLowerCase();
  
  if (name.includes('portrait') || name.includes('face')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  } else if (name.includes('anime') || name.includes('cartoon')) {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  } else if (name.includes('landscape') || name.includes('nature')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  } else if (name.includes('abstract') || name.includes('art')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
  } else {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export function WorkflowSelector({ workflows, selectedWorkflowId, onSelectWorkflow }: WorkflowSelectorProps) {
  const [hoveredWorkflow, setHoveredWorkflow] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Image className="w-4 h-4" />
        <span className="text-sm font-medium">Select Workflow</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {workflows.map((workflow) => {
          const isSelected = selectedWorkflowId === workflow.id;
          const isHovered = hoveredWorkflow === workflow.id;
          
          return (
            <Card
              key={workflow.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : 'hover:shadow-lg'
              } ${isHovered ? 'scale-105' : ''}`}
              onMouseEnter={() => setHoveredWorkflow(workflow.id)}
              onMouseLeave={() => setHoveredWorkflow(null)}
              onClick={() => onSelectWorkflow(workflow.id)}
            >
              <CardContent className="p-3">
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 z-10">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 bg-white dark:bg-gray-900 rounded-full" />
                  </div>
                )}
                
                {/* Thumbnail */}
                <div className="relative mb-3 overflow-hidden rounded-lg">
                  <img
                    src={workflow.thumbnail || getWorkflowThumbnail(workflow)}
                    alt={workflow.name}
                    className="w-full h-20 object-cover transition-transform duration-200 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                
                {/* Workflow info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                      {workflow.name}
                    </h3>
                    <div className="flex-shrink-0">
                      {getWorkflowIcon(workflow)}
                    </div>
                  </div>
                  
                  {workflow.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {workflow.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs px-2 py-1 ${getCategoryColor(workflow)}`}
                    >
                      {workflow.category || 'General'}
                    </Badge>
                    
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {workflows.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No workflows available</p>
          <p className="text-xs">Create a workflow to get started</p>
        </div>
      )}
      
      {selectedWorkflowId && (
        <div className="flex items-center justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectWorkflow(0)}
            className="text-xs"
          >
            Clear Selection
          </Button>
        </div>
      )}
    </div>
  );
}