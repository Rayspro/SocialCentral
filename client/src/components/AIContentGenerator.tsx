import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WorkflowSelector } from "@/components/WorkflowSelector";
import { 
  Sparkles, 
  Type, 
  Image as ImageIcon, 
  Wand2, 
  Copy,
  RefreshCw,
  Download
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AIContentGeneratorProps {
  onContentGenerated?: (content: any) => void;
}

export function AIContentGenerator({ onContentGenerated }: AIContentGeneratorProps) {
  const [textPrompt, setTextPrompt] = useState("");
  const [textType, setTextType] = useState("social-post");
  const [textTone, setTextTone] = useState("engaging");
  const [textLength, setTextLength] = useState("medium");
  const [generatedText, setGeneratedText] = useState("");
  
  const [enhanceText, setEnhanceText] = useState("");
  const [enhancePlatform, setEnhancePlatform] = useState("instagram");
  const [enhanceObjective, setEnhanceObjective] = useState("increase engagement");
  const [enhancedText, setEnhancedText] = useState("");

  const { toast } = useToast();

  const generateTextMutation = useMutation({
    mutationFn: async (data: { prompt: string; type: string; tone: string; length: string }) => {
      return apiRequest("POST", "/api/content/generate-text", data);
    },
    onSuccess: (data: any) => {
      if (data.generatedText) {
        setGeneratedText(data.generatedText);
        toast({
          title: "Text generated successfully",
          description: "AI-generated content is ready for use.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Text generation failed",
        description: error.message || "Please check your OpenAI API key in Settings.",
        variant: "destructive",
      });
    },
  });

  const enhanceTextMutation = useMutation({
    mutationFn: async (data: { text: string; platform: string; objective: string }) => {
      return apiRequest("POST", "/api/content/enhance-text", data);
    },
    onSuccess: (data: any) => {
      if (data.enhancedText) {
        setEnhancedText(data.enhancedText);
        toast({
          title: "Text enhanced successfully",
          description: "Your content has been optimized for better engagement.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Text enhancement failed",
        description: error.message || "Please check your OpenAI API key in Settings.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateText = () => {
    if (!textPrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for text generation.",
        variant: "destructive",
      });
      return;
    }
    generateTextMutation.mutate({
      prompt: textPrompt,
      type: textType,
      tone: textTone,
      length: textLength
    });
  };

  const handleEnhanceText = () => {
    if (!enhanceText.trim()) {
      toast({
        title: "Error",
        description: "Please enter text to enhance.",
        variant: "destructive",
      });
      return;
    }
    enhanceTextMutation.mutate({
      text: enhanceText,
      platform: enhancePlatform,
      objective: enhanceObjective
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Content has been copied to your clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Content Generator</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Create engaging content with AI assistance</p>
      </div>

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Text Generation
          </TabsTrigger>
          <TabsTrigger value="enhance" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Text Enhancement
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image Generation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Generate Social Media Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-prompt" className="text-xs">Content Prompt</Label>
                <Textarea
                  id="text-prompt"
                  placeholder="Describe what kind of content you want to create..."
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Content Type</Label>
                  <Select value={textType} onValueChange={setTextType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social-post">Social Media Post</SelectItem>
                      <SelectItem value="caption">Image Caption</SelectItem>
                      <SelectItem value="story">Story Content</SelectItem>
                      <SelectItem value="ad-copy">Ad Copy</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Tone</Label>
                  <Select value={textTone} onValueChange={setTextTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engaging">Engaging</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                      <SelectItem value="informative">Informative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Length</Label>
                  <Select value={textLength} onValueChange={setTextLength}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Short (50-150 words)</SelectItem>
                      <SelectItem value="medium">Medium (150-400 words)</SelectItem>
                      <SelectItem value="long">Long (400-800 words)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerateText}
                disabled={generateTextMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {generateTextMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>

              {generatedText && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Generated Content</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedText)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {generatedText}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wand2 className="h-4 w-4 text-blue-600" />
                Enhance Existing Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="enhance-text" className="text-xs">Content to Enhance</Label>
                <Textarea
                  id="enhance-text"
                  placeholder="Paste your content here to improve it..."
                  value={enhanceText}
                  onChange={(e) => setEnhanceText(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Target Platform</Label>
                  <Select value={enhancePlatform} onValueChange={setEnhancePlatform}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Objective</Label>
                  <Select value={enhanceObjective} onValueChange={setEnhanceObjective}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="increase engagement">Increase Engagement</SelectItem>
                      <SelectItem value="drive traffic">Drive Traffic</SelectItem>
                      <SelectItem value="build brand awareness">Build Brand Awareness</SelectItem>
                      <SelectItem value="generate leads">Generate Leads</SelectItem>
                      <SelectItem value="improve clarity">Improve Clarity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleEnhanceText}
                disabled={enhanceTextMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {enhanceTextMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Enhance Content
                  </>
                )}
              </Button>

              {enhancedText && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Enhanced Content</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(enhancedText)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {enhancedText}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <ComfyUIImageGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComfyUIImageGenerator() {
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | undefined>();
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available servers
  const { data: servers = [], isLoading: serversLoading } = useQuery({
    queryKey: ["/api/vast-servers"],
    queryFn: async () => {
      const response = await fetch("/api/vast-servers");
      if (!response.ok) throw new Error("Failed to fetch servers");
      return response.json();
    },
  });

  // Fetch available workflows
  const { data: workflows = [], isLoading: workflowsLoading } = useQuery({
    queryKey: ["/api/workflows/with-models"],
    queryFn: async () => {
      const response = await fetch("/api/workflows/with-models");
      if (!response.ok) throw new Error("Failed to fetch workflows");
      return response.json();
    },
  });

  // Image generation mutation
  const generateImageMutation = useMutation({
    mutationFn: async (data: { serverId: string; workflowId: string; prompt: string }) => {
      const response = await fetch(`/api/comfy/${data.serverId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: data.prompt,
          workflowId: data.workflowId,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate image");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setGenerationId(data.generationId);
      toast({
        title: "Image generation started",
        description: "Your image is being generated. This may take a few minutes.",
      });
      // Start polling for results
      pollGenerationStatus(data.generationId);
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to start image generation",
        variant: "destructive",
      });
    },
  });

  // Poll generation status
  const pollGenerationStatus = async (genId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/comfy/generation/${genId}`);
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.status === "completed" && data.imageUrls && data.imageUrls.length > 0) {
          setGeneratedImages(data.imageUrls);
          setGenerationId(null);
          clearInterval(pollInterval);
          toast({
            title: "Image generated successfully",
            description: "Your AI-generated images are ready!",
          });
        } else if (data.status === "failed") {
          setGenerationId(null);
          clearInterval(pollInterval);
          toast({
            title: "Generation failed",
            description: data.errorMessage || "Image generation failed",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error polling generation status:", error);
      }
    }, 3000);

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (generationId === genId) {
        setGenerationId(null);
        toast({
          title: "Generation timeout",
          description: "Image generation is taking longer than expected",
          variant: "destructive",
        });
      }
    }, 300000);
  };

  const handleGenerateImage = () => {
    if (!selectedServer) {
      toast({
        title: "Server required",
        description: "Please select a server for image generation",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWorkflow) {
      toast({
        title: "Workflow required", 
        description: "Please select a workflow for image generation",
        variant: "destructive",
      });
      return;
    }

    if (!imagePrompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a description for your image",
        variant: "destructive",
      });
      return;
    }

    generateImageMutation.mutate({
      serverId: selectedServer,
      workflowId: selectedWorkflow.toString(),
      prompt: imagePrompt,
    });
  };

  const runningServers = servers.filter((server: any) => server.status === "running");
  // Show all workflows when a server is selected (templates and server-specific workflows)
  const availableWorkflows = selectedServer ? workflows : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-4 w-4 text-green-600" />
          Generate AI Images with ComfyUI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server Selection */}
        <div className="space-y-2">
          <Label className="text-xs">Select Server Instance</Label>
          <Select value={selectedServer} onValueChange={setSelectedServer}>
            <SelectTrigger>
              <SelectValue placeholder={serversLoading ? "Loading servers..." : "Choose a running server"} />
            </SelectTrigger>
            <SelectContent>
              {runningServers.length === 0 ? (
                <SelectItem value="none" disabled>
                  No running servers available
                </SelectItem>
              ) : (
                runningServers.map((server: any) => (
                  <SelectItem key={server.id} value={server.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {server.name} ({server.gpu})
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Interactive Workflow Selection */}
        {selectedServer && availableWorkflows.length > 0 && (
          <WorkflowSelector
            workflows={availableWorkflows}
            selectedWorkflowId={selectedWorkflow}
            onSelectWorkflow={(workflowId) => setSelectedWorkflow(workflowId === 0 ? undefined : workflowId)}
          />
        )}
        
        {selectedServer && availableWorkflows.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No workflows available for this server</p>
            <p className="text-xs">Create a workflow to get started</p>
          </div>
        )}
        
        {!selectedServer && (
          <div className="text-center py-6 text-muted-foreground">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a server to view available workflows</p>
          </div>
        )}

        {/* Image Prompt */}
        <div className="space-y-2">
          <Label htmlFor="image-prompt" className="text-xs">Image Description</Label>
          <Textarea
            id="image-prompt"
            placeholder="Describe the image you want to create..."
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateImage}
          disabled={generateImageMutation.isPending || !!generationId}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
        >
          {generateImageMutation.isPending || generationId ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Image...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Generate Image
            </>
          )}
        </Button>

        {/* Server Status Info */}
        {selectedServer && (
          <div className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <strong>Server Info:</strong> {runningServers.find((s: any) => s.id.toString() === selectedServer)?.name} - 
            Status: Running, GPU: {runningServers.find((s: any) => s.id.toString() === selectedServer)?.gpu}
          </div>
        )}

        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div className="mt-6 space-y-3">
            <Label className="text-sm font-medium">Generated Images</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-auto rounded-lg border shadow-sm"
                    onError={(e) => {
                      console.error("Image failed to load:", imageUrl);
                      e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEZhaWxlZDwvdGV4dD48L3N2Zz4=";
                    }}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/90 hover:bg-white"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `generated-image-${index + 1}.png`;
                        link.click();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}