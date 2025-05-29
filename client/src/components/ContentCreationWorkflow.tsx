import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Video, Image as ImageIcon, Sparkles, Edit } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ImageEditor } from "@/components/ImageEditor";

const videoFormSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters"),
  style: z.string().min(1, "Please select a style"),
  duration: z.string().min(1, "Please select a duration"),
  platformId: z.string().optional(),
  accountId: z.string().optional(),
});

const imageFormSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters"),
  style: z.string().min(1, "Please select a style"),
  size: z.string().min(1, "Please select a size"),
  platformId: z.string().optional(),
  accountId: z.string().optional(),
});

type VideoForm = z.infer<typeof videoFormSchema>;
type ImageForm = z.infer<typeof imageFormSchema>;

export function ContentCreationWorkflow() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const { toast } = useToast();

  const { data: platforms } = useQuery({
    queryKey: ["/api/platforms"],
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const videoForm = useForm<VideoForm>({
    resolver: zodResolver(videoFormSchema),
    defaultValues: {
      content: "",
      style: "",
      duration: "",
      platformId: "",
      accountId: "",
    },
  });

  const imageForm = useForm<ImageForm>({
    resolver: zodResolver(imageFormSchema),
    defaultValues: {
      prompt: "",
      style: "",
      size: "",
      platformId: "",
      accountId: "",
    },
  });

  const generateVideoMutation = useMutation({
    mutationFn: async (data: VideoForm) => {
      return apiRequest("POST", "/api/content/generate-video", {
        text: data.content,
        style: data.style,
        duration: data.duration,
        platformId: data.platformId ? parseInt(data.platformId) : null,
        accountId: data.accountId ? parseInt(data.accountId) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      videoForm.reset();
      toast({
        title: "Video generation started",
        description: "Your video will be available for approval once processing is complete.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate video",
        variant: "destructive",
      });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (data: ImageForm) => {
      return apiRequest("POST", "/api/content/generate-image", {
        prompt: data.prompt,
        style: data.style,
        size: data.size,
        platformId: data.platformId ? parseInt(data.platformId) : null,
        accountId: data.accountId ? parseInt(data.accountId) : null,
      });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setGeneratedImage(response.imageUrl);
      imageForm.reset();
      toast({
        title: "Image generated successfully",
        description: "Your image is ready for editing and approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    },
  });

  const onVideoSubmit = (data: VideoForm) => {
    generateVideoMutation.mutate(data);
  };

  const onImageSubmit = (data: ImageForm) => {
    generateImageMutation.mutate(data);
  };

  const getAccountsForPlatform = (platformId: string) => {
    if (!platformId || !accounts) return [];
    return accounts.filter((account: any) => account.platformId === parseInt(platformId));
  };

  return (
    <>
      <Card className="border border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Content Creation Workflow</CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Transform your ideas into engaging content</p>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Text to Video */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Video className="text-blue-600 dark:text-blue-400 h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Text to Video</h3>
              </div>
              
              <Form {...videoForm}>
                <form onSubmit={videoForm.handleSubmit(onVideoSubmit)} className="space-y-4">
                  <FormField
                    control={videoForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Story Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your story text here..."
                            rows={4}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={videoForm.control}
                      name="style"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Video Style</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="slideshow">Slideshow</SelectItem>
                              <SelectItem value="animated">Animated Text</SelectItem>
                              <SelectItem value="split">Split Screen</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={videoForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="30">30 seconds</SelectItem>
                              <SelectItem value="60">60 seconds</SelectItem>
                              <SelectItem value="90">90 seconds</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={videoForm.control}
                      name="platformId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {platforms?.map((platform: any) => (
                                <SelectItem key={platform.id} value={platform.id.toString()}>
                                  {platform.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={videoForm.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAccountsForPlatform(videoForm.watch("platformId")).map((account: any) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={generateVideoMutation.isPending}
                  >
                    {generateVideoMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
            
            {/* Image Generation */}
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <ImageIcon className="text-purple-600 dark:text-purple-400 h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Image Generation</h3>
              </div>
              
              <Form {...imageForm}>
                <form onSubmit={imageForm.handleSubmit(onImageSubmit)} className="space-y-4">
                  <FormField
                    control={imageForm.control}
                    name="prompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the image you want to generate..."
                            rows={3}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={imageForm.control}
                      name="style"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Style</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select style" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="realistic">Realistic</SelectItem>
                              <SelectItem value="artistic">Artistic</SelectItem>
                              <SelectItem value="cartoon">Cartoon</SelectItem>
                              <SelectItem value="abstract">Abstract</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={imageForm.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1024x1024">Square (1024x1024)</SelectItem>
                              <SelectItem value="1024x1792">Portrait (1024x1792)</SelectItem>
                              <SelectItem value="1792x1024">Landscape (1792x1024)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={imageForm.control}
                      name="platformId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select platform" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {platforms?.map((platform: any) => (
                                <SelectItem key={platform.id} value={platform.id.toString()}>
                                  {platform.displayName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={imageForm.control}
                      name="accountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAccountsForPlatform(imageForm.watch("platformId")).map((account: any) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={generateImageMutation.isPending}
                  >
                    {generateImageMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </form>
              </Form>
              
              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Generated Image</span>
                    <Button
                      size="sm"
                      onClick={() => setShowImageEditor(true)}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <img
                    src={generatedImage}
                    alt="Generated content"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ImageEditor
        imageUrl={generatedImage}
        open={showImageEditor}
        onOpenChange={setShowImageEditor}
      />
    </>
  );
}
