import { Header } from "@/components/Header";
import { ContentCreationWorkflow } from "@/components/ContentCreationWorkflow";

export default function CreateContent() {
  return (
    <div className="space-y-6">
      <Header title="Create Content" subtitle="Transform your ideas into engaging content" />
      
      <div className="p-6">
        <ContentCreationWorkflow />
      </div>
    </div>
  );
}
