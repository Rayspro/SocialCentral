import { AIContentGenerator } from "@/components/AIContentGenerator";
import { ContentCreationWorkflow } from "@/components/ContentCreationWorkflow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Upload, Home, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";

export default function CreateContent() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Elegant Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm">
          <button 
            onClick={() => setLocation('/')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </button>
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <span className="text-slate-900 dark:text-slate-100 font-medium">
            Create Content
          </span>
        </nav>

        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
              <Sparkles className="h-7 w-7 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Create Content
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate AI-powered content for your social media platforms
              </p>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="ai-generator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-generator" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Generator
            </TabsTrigger>
            <TabsTrigger value="video-workflow" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Video Workflow
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-generator">
            <AIContentGenerator />
          </TabsContent>

          <TabsContent value="video-workflow">
            <div className="p-6">
              <ContentCreationWorkflow />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
