import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Type, 
  Image as ImageIcon, 
  Video, 
  Wand2, 
  Copy,
  RefreshCw,
  Download
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
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
  
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("realistic");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");

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

  const generateImageMutation = useMutation({
    mutationFn: async (data: { prompt: string; style: string; size: string }) => {
      return apiRequest("POST", "/api/content/generate-image", data);
    },
    onSuccess: (data: any) => {
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        toast({
          title: "Image generated successfully",
          description: "AI-generated image is ready for use.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Image generation failed",
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

  const handleGenerateImage = () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation.",
        variant: "destructive",
      });
      return;
    }
    generateImageMutation.mutate({
      prompt: imagePrompt,
      style: imageStyle,
      size: imageSize
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-green-600" />
                Generate AI Images
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Style</Label>
                  <Select value={imageStyle} onValueChange={setImageStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="artistic">Artistic</SelectItem>
                      <SelectItem value="cartoon">Cartoon</SelectItem>
                      <SelectItem value="digital art">Digital Art</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Size</Label>
                  <Select value={imageSize} onValueChange={setImageSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                      <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                      <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerateImage}
                disabled={generateImageMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {generatedImageUrl && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Generated Image</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(generatedImageUrl, '_blank')}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                  <img 
                    src={generatedImageUrl} 
                    alt="Generated content" 
                    className="w-full max-w-md mx-auto rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}