import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Database, 
  Key,
  AlertTriangle,
  Save,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ApiKey } from "@shared/schema";

const apiKeyFormSchema = z.object({
  service: z.string().min(1, "Service is required"),
  keyName: z.string().min(1, "Key name is required"),
  keyValue: z.string().min(1, "API key is required"),
});

type ApiKeyForm = z.infer<typeof apiKeyFormSchema>;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [showKeyValue, setShowKeyValue] = useState<{ [key: number]: boolean }>({});
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    contentApprovals: true,
    scheduleReminders: true,
  });

  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    timezone: "UTC-5",
    language: "en",
  });

  const [apiSettings, setApiSettings] = useState({
    openaiModel: "gpt-4o",
    videoProvider: "runway",
    autoApprove: false,
    contentModeration: true,
  });

  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const form = useForm<ApiKeyForm>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      service: "",
      keyName: "",
      keyValue: "",
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: async (data: ApiKeyForm) => {
      return apiRequest("POST", "/api/api-keys", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setShowApiKeyDialog(false);
      form.reset();
      toast({
        title: "API key added",
        description: "Your API key has been securely stored.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add API key",
        variant: "destructive",
      });
    },
  });

  const updateApiKeyMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<ApiKeyForm> }) => {
      return apiRequest("PUT", `/api/api-keys/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setEditingApiKey(null);
      toast({
        title: "API key updated",
        description: "Your API key has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update API key",
        variant: "destructive",
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API key deleted",
        description: "Your API key has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ApiKeyForm) => {
    if (editingApiKey) {
      updateApiKeyMutation.mutate({ id: editingApiKey.id, updates: data });
    } else {
      createApiKeyMutation.mutate(data);
    }
  };

  const handleEditApiKey = (apiKey: ApiKey) => {
    setEditingApiKey(apiKey);
    form.reset({
      service: apiKey.service,
      keyName: apiKey.keyName,
      keyValue: "",
    });
    setShowApiKeyDialog(true);
  };

  const toggleKeyVisibility = (keyId: number) => {
    setShowKeyValue(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const getServiceDisplayName = (service: string) => {
    const serviceNames = {
      openai: "OpenAI",
      runway: "RunwayML",
      pika: "Pika Labs",
      stable: "Stable Diffusion",
      vast: "Vast.ai",
    };
    return serviceNames[service as keyof typeof serviceNames] || service;
  };

  return (
    <div className="space-y-6">
      <Header title="Settings" subtitle="Manage your account preferences and system configuration" />
      
      <div className="p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API & AI
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                        <SelectItem value="UTC-7">Mountain Time (UTC-7)</SelectItem>
                        <SelectItem value="UTC-6">Central Time (UTC-6)</SelectItem>
                        <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                        <SelectItem value="UTC+0">UTC</SelectItem>
                        <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Receive browser push notifications</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Weekly Reports</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Get weekly analytics summaries</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyReports: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Content Approvals</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Notify when content needs approval</p>
                    </div>
                    <Switch
                      checked={notifications.contentApprovals}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, contentApprovals: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Schedule Reminders</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Remind about upcoming scheduled posts</p>
                    </div>
                    <Switch
                      checked={notifications.scheduleReminders}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, scheduleReminders: checked }))}
                    />
                  </div>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance & Theme</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Theme Preference</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Choose how SocialSync looks on your device
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <Card 
                        className={`cursor-pointer border-2 transition-colors ${
                          theme === "light" ? "border-purple-600" : "border-gray-200 dark:border-gray-700"
                        }`}
                        onClick={() => setTheme("light")}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-8 mx-auto mb-2 bg-white border rounded shadow-sm"></div>
                          <p className="text-sm font-medium">Light</p>
                        </CardContent>
                      </Card>
                      <Card 
                        className={`cursor-pointer border-2 transition-colors ${
                          theme === "dark" ? "border-purple-600" : "border-gray-200 dark:border-gray-700"
                        }`}
                        onClick={() => setTheme("dark")}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-8 mx-auto mb-2 bg-gray-900 border rounded"></div>
                          <p className="text-sm font-medium">Dark</p>
                        </CardContent>
                      </Card>
                      <Card 
                        className={`cursor-pointer border-2 transition-colors ${
                          theme === "system" ? "border-purple-600" : "border-gray-200 dark:border-gray-700"
                        }`}
                        onClick={() => setTheme("system")}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="w-12 h-8 mx-auto mb-2 bg-gradient-to-r from-white to-gray-900 border rounded"></div>
                          <p className="text-sm font-medium">System</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API & AI Settings */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>API Keys & Configuration</CardTitle>
                  <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => {
                          setEditingApiKey(null);
                          form.reset();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add API Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingApiKey ? "Edit API Key" : "Add API Key"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="service"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Service</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select service" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="openai">OpenAI</SelectItem>
                                    <SelectItem value="runway">RunwayML</SelectItem>
                                    <SelectItem value="pika">Pika Labs</SelectItem>
                                    <SelectItem value="stable">Stable Diffusion</SelectItem>
                                    <SelectItem value="vast">Vast.ai</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="keyName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Key Name</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., OPENAI_API_KEY" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="keyValue"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>API Key</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="password"
                                    placeholder="Enter your API key"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={createApiKeyMutation.isPending || updateApiKeyMutation.isPending}
                          >
                            {createApiKeyMutation.isPending || updateApiKeyMutation.isPending 
                              ? "Saving..." 
                              : editingApiKey ? "Update Key" : "Add Key"
                            }
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vast.ai Quick Setup */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100">Vast.ai Server Management</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Configure your Vast.ai API key to launch GPU servers for AI workloads
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        form.reset({
                          service: "vast",
                          keyName: "VAST_API_KEY",
                          keyValue: ""
                        });
                        setEditingApiKey(null);
                        setShowApiKeyDialog(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Setup Vast.ai
                    </Button>
                  </div>
                  {apiKeys && Array.isArray(apiKeys) && apiKeys.find((key: ApiKey) => key.service === 'vast') && (
                    <div className="mt-3 text-sm text-green-700 dark:text-green-300">
                      ✓ Vast.ai API key configured - You can now launch servers
                    </div>
                  )}
                </div>

                <Separator />

                {/* API Keys List */}
                <div className="space-y-4">
                  <h3 className="font-medium">Configured API Keys</h3>
                  {apiKeysLoading ? (
                    <div className="text-center py-4 text-gray-500">Loading API keys...</div>
                  ) : apiKeys && Array.isArray(apiKeys) && apiKeys.length > 0 ? (
                    <div className="space-y-3">
                      {apiKeys.map((apiKey: ApiKey) => (
                        <div
                          key={apiKey.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-semibold">
                              <Key className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {getServiceDisplayName(apiKey.service)}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {apiKey.keyName}
                              </p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                                  {showKeyValue[apiKey.id] 
                                    ? apiKey.keyValue 
                                    : `${'*'.repeat(Math.min(apiKey.keyValue.length, 20))}...`
                                  }
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleKeyVisibility(apiKey.id)}
                                >
                                  {showKeyValue[apiKey.id] ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                              {apiKey.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditApiKey(apiKey)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => deleteApiKeyMutation.mutate(apiKey.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No API keys configured</p>
                      <p className="text-xs">Add your API keys to enable AI features</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* AI Settings */}
                <div className="space-y-4">
                  <h3 className="font-medium">AI Configuration</h3>
                  
                  <div className="space-y-2">
                    <Label>OpenAI Model</Label>
                    <Select value={apiSettings.openaiModel} onValueChange={(value) => setApiSettings(prev => ({ ...prev, openaiModel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Video Generation Provider</Label>
                    <Select value={apiSettings.videoProvider} onValueChange={(value) => setApiSettings(prev => ({ ...prev, videoProvider: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="runway">RunwayML</SelectItem>
                        <SelectItem value="pika">Pika Labs</SelectItem>
                        <SelectItem value="stable">Stable Video Diffusion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto-approve AI Content</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Automatically approve generated content</p>
                    </div>
                    <Switch
                      checked={apiSettings.autoApprove}
                      onCheckedChange={(checked) => setApiSettings(prev => ({ ...prev, autoApprove: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Content Moderation</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Enable AI content filtering</p>
                    </div>
                    <Switch
                      checked={apiSettings.contentModeration}
                      onCheckedChange={(checked) => setApiSettings(prev => ({ ...prev, contentModeration: checked }))}
                    />
                  </div>
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save AI Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Change Password</h3>
                    <div className="space-y-3">
                      <Input type="password" placeholder="Current password" />
                      <Input type="password" placeholder="New password" />
                      <Input type="password" placeholder="Confirm new password" />
                      <Button variant="outline">Update Password</Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Connected Platforms</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white">
                            🎥
                          </div>
                          <div>
                            <p className="font-medium">YouTube</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">3 accounts connected</p>
                          </div>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white">
                            📷
                          </div>
                          <div>
                            <p className="font-medium">Instagram</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">2 accounts connected</p>
                          </div>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Data Management</h3>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <Database className="h-4 w-4 mr-2" />
                        Export Account Data
                      </Button>
                      <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}