import { Header } from "@/components/Header";
import { PlatformManager } from "@/components/PlatformManager";

export default function Platforms() {
  return (
    <div className="space-y-6">
      <Header title="Platforms" subtitle="Manage your connected social media accounts" />
      
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6">
          <PlatformManager />
        </div>
      </div>
    </div>
  );
}
