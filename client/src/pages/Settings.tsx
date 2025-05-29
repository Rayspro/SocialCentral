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
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const { theme, setTheme } = useTheme();
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
                <CardTitle>API & AI Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Model used for text generation and content optimization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Video Generation Provider</Label>
                    <Select value={apiSettings.videoProvider} onValueChange={(value) => setApiSettings(prev => ({ ...prev, videoProvider: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="runway">RunwayML</SelectItem>
                        <SelectItem value="stable-video">Stable Video Diffusion</SelectItem>
                        <SelectItem value="pika">Pika Labs</SelectItem>
                        <SelectItem value="custom">Custom Provider</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Service used for text-to-video generation
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Auto-approve AI Content</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Automatically approve generated content</p>
                    </div>
                    <Switch
                      checked={apiSettings.autoApprove}
                      onCheckedChange={(checked) => setApiSettings(prev => ({ ...prev, autoApprove: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Content Moderation</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Enable AI content filtering</p>
                    </div>
                    <Switch
                      checked={apiSettings.contentModeration}
                      onCheckedChange={(checked) => setApiSettings(prev => ({ ...prev, contentModeration: checked }))}
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800 dark:text-yellow-200">API Configuration</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        For text-to-video generation, you'll need API keys from your chosen provider. 
                        Current implementation uses placeholder generation - integrate with services like:
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
                        <li>RunwayML API for high-quality video generation</li>
                        <li>Stable Video Diffusion for open-source video creation</li>
                        <li>Pika Labs for AI video generation</li>
                        <li>Custom endpoints for specialized workflows</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Save API Settings
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