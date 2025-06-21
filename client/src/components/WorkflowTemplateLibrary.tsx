import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Folder,
  Search,
  Download,
  FileText,
  Loader2,
  Star,
  Eye,
  Filter,
  Grid,
  List,
  Zap
} from "lucide-react";

interface WorkflowTemplateLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: number;
  onTemplateSelect?: (template: WorkflowTemplate) => void;
}

interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  workflowJson: string;
  thumbnailUrl?: string;
  tags: string[];
  requiredModels: string[];
  estimatedTime: string;
  popularity: number;
  isBuiltIn: boolean;
}

const TEMPLATE_CATEGORIES = [
  'All',
  'Text to Image',
  'Image to Image', 
  'Inpainting',
  'Upscaling',
  'Style Transfer',
  'Animation',
  'Advanced'
];

const BUILT_IN_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 1,
    name: "Simple Text to Image",
    description: "Basic text-to-image generation using SDXL",
    category: "Text to Image",
    difficulty: "beginner",
    workflowJson: JSON.stringify({
      "1": {"inputs": {"text": "masterpiece, best quality, amazing"}, "class_type": "CLIPTextEncode"},
      "2": {"inputs": {"text": "blurry, low quality"}, "class_type": "CLIPTextEncode"},
      "3": {"inputs": {"seed": 42, "steps": 20, "cfg": 8.0}, "class_type": "KSampler"}
    }),
    tags: ["basic", "sdxl", "text2img"],
    requiredModels: ["sd_xl_base_1.0.safetensors"],
    estimatedTime: "2-3 minutes",
    popularity: 95,
    isBuiltIn: true
  },
  {
    id: 2,
    name: "Portrait Enhancement",
    description: "Professional portrait generation with face enhancement",
    category: "Text to Image",
    difficulty: "intermediate",
    workflowJson: JSON.stringify({
      "1": {"inputs": {"text": "professional portrait, detailed face"}, "class_type": "CLIPTextEncode"},
      "2": {"inputs": {"upscale_factor": 2.0}, "class_type": "ImageUpscaleWithModel"}
    }),
    tags: ["portrait", "face", "enhancement"],
    requiredModels: ["sd_xl_base_1.0.safetensors", "4x-UltraSharp.pth"],
    estimatedTime: "5-7 minutes",
    popularity: 87,
    isBuiltIn: true
  },
  {
    id: 3,
    name: "Anime Style Generator",
    description: "High-quality anime character generation",
    category: "Text to Image", 
    difficulty: "intermediate",
    workflowJson: JSON.stringify({
      "1": {"inputs": {"text": "anime character, detailed eyes, colorful"}, "class_type": "CLIPTextEncode"},
      "2": {"inputs": {"model_name": "animagine-xl"}, "class_type": "CheckpointLoaderSimple"}
    }),
    tags: ["anime", "character", "style"],
    requiredModels: ["animagineXLV3_v30.safetensors"],
    estimatedTime: "3-4 minutes",
    popularity: 92,
    isBuiltIn: true
  },
  {
    id: 4,
    name: "Image Upscaling 4x",
    description: "High-quality image upscaling using Real-ESRGAN",
    category: "Upscaling",
    difficulty: "beginner",
    workflowJson: JSON.stringify({
      "1": {"inputs": {"image": "input.png"}, "class_type": "LoadImage"},
      "2": {"inputs": {"upscale_model": "RealESRGAN_x4plus.pth"}, "class_type": "UpscaleModelLoader"}
    }),
    tags: ["upscale", "enhancement", "quality"],
    requiredModels: ["RealESRGAN_x4plus.pth"],
    estimatedTime: "1-2 minutes",
    popularity: 89,
    isBuiltIn: true
  },
  {
    id: 5,
    name: "Advanced Controlnet",
    description: "Pose-controlled image generation with ControlNet",
    category: "Advanced",
    difficulty: "advanced",
    workflowJson: JSON.stringify({
      "1": {"inputs": {"image": "pose.png"}, "class_type": "LoadImage"},
      "2": {"inputs": {"control_net_name": "control_sd15_openpose.pth"}, "class_type": "ControlNetLoader"}
    }),
    tags: ["controlnet", "pose", "advanced"],
    requiredModels: ["sd_xl_base_1.0.safetensors", "control_sd15_openpose.pth"],
    estimatedTime: "8-10 minutes",
    popularity: 76,
    isBuiltIn: true
  }
];

export function WorkflowTemplateLibrary({ open, onOpenChange, serverId, onTemplateSelect }: WorkflowTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For now, use built-in templates. In the future, this could fetch from API
  const templates = BUILT_IN_TEMPLATES;

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const loadTemplateMutation = useMutation({
    mutationFn: async (template: WorkflowTemplate) => {
      const response = await fetch(`/api/comfy/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${template.name} (Template)`,
          workflowJson: template.workflowJson,
          serverId: serverId,
          description: template.description,
          category: template.category,
          isTemplate: true
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to load template");
      }
      
      return response.json();
    },
    onSuccess: (result, template) => {
      toast({
        title: "Template Loaded",
        description: `"${template.name}" has been added to your workflows.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/comfy/workflows'] });
      if (onTemplateSelect) {
        onTemplateSelect(template);
      }
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Load Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Workflow Template Library
          </DialogTitle>
          <DialogDescription>
            Browse and load pre-built ComfyUI workflow templates
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              {TEMPLATE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Templates Grid/List */}
          <ScrollArea className="h-[500px] pr-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                          <CardDescription className="text-xs mt-1 line-clamp-2">
                            {template.description}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-xs">{template.popularity}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          {template.estimatedTime}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Models: {template.requiredModels.length}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => loadTemplateMutation.mutate(template)}
                          disabled={loadTemplateMutation.isPending}
                        >
                          {loadTemplateMutation.isPending ? (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3 mr-2" />
                          )}
                          Load
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">{template.name}</h3>
                            <Badge variant="outline" className={getDifficultyColor(template.difficulty)}>
                              {template.difficulty}
                            </Badge>
                            <Badge variant="secondary">{template.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{template.estimatedTime}</span>
                            <span>{template.requiredModels.length} models</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              {template.popularity}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => loadTemplateMutation.mutate(template)}
                            disabled={loadTemplateMutation.isPending}
                          >
                            {loadTemplateMutation.isPending ? (
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3 mr-2" />
                            )}
                            Load
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className={getDifficultyColor(selectedTemplate.difficulty)}>
                    {selectedTemplate.difficulty}
                  </Badge>
                  <Badge variant="secondary">{selectedTemplate.category}</Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Required Models:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.requiredModels.map((model, index) => (
                      <Badge key={index} variant="outline">{model}</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Close
                  </Button>
                  <Button 
                    onClick={() => {
                      loadTemplateMutation.mutate(selectedTemplate);
                      setSelectedTemplate(null);
                    }}
                    disabled={loadTemplateMutation.isPending}
                  >
                    {loadTemplateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Load Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}