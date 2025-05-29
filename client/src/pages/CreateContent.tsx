import { Header } from "@/components/Header";
import { AIContentGenerator } from "@/components/AIContentGenerator";
import { ContentCreationWorkflow } from "@/components/ContentCreationWorkflow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Upload } from "lucide-react";

export default function CreateContent() {
  return (
    <div className="space-y-6">
      <Header title="Create Content" subtitle="Generate AI-powered content for your social media platforms" />
      
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
  );
}
