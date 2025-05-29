import { Header } from "@/components/Header";
import { StatsGrid } from "@/components/StatsGrid";
import { PlatformManager } from "@/components/PlatformManager";
import { QuickActions } from "@/components/QuickActions";
import { ContentCreationWorkflow } from "@/components/ContentCreationWorkflow";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <Header title="Dashboard" subtitle="Manage your social media presence" />
      
      <div className="p-6 space-y-6">
        <StatsGrid />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PlatformManager />
          <QuickActions />
        </div>

        <ContentCreationWorkflow />
      </div>
    </div>
  );
}
