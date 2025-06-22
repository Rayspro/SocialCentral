import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link2, Clock, BarChart3, Sparkles } from "lucide-react";

export function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm">
            <CardContent className="p-4 lg:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Connected Accounts",
      value: stats?.connectedAccounts || 0,
      icon: Link2,
      color: "blue",
    },
    {
      label: "Pending Approval",
      value: stats?.pendingApprovals || 0,
      icon: Clock,
      color: "orange",
    },
    {
      label: "Posts This Month",
      value: stats?.postsThisMonth || 0,
      icon: BarChart3,
      color: "green",
    },
    {
      label: "Generated Media",
      value: stats?.generatedMedia || 0,
      icon: Sparkles,
      color: "purple",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    orange: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    green: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
      {statItems.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="border-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4 lg:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {item.label.split(' ').pop()}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {item.value}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 lg:hidden">
                    {item.label.replace(item.label.split(' ').pop() || '', '').trim()}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 hidden lg:block">
                    {item.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
