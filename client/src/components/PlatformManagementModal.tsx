import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Platform, Account } from "@shared/schema";

interface PlatformManagementModalProps {
  platform: Platform | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const addAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  username: z.string().min(1, "Username is required"),
  externalId: z.string().optional(),
});

type AddAccountForm = z.infer<typeof addAccountSchema>;

export function PlatformManagementModal({ platform, open, onOpenChange }: PlatformManagementModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["/api/platforms", platform?.id, "accounts"],
    queryFn: async () => {
      if (!platform) return [];
      const response = await fetch(`/api/platforms/${platform.id}/accounts`);
      if (!response.ok) throw new Error("Failed to fetch accounts");
      return response.json();
    },
    enabled: !!platform && open,
  });

  const form = useForm<AddAccountForm>({
    resolver: zodResolver(addAccountSchema),
    defaultValues: {
      name: "",
      username: "",
      externalId: "",
    },
  });

  const addAccountMutation = useMutation({
    mutationFn: async (data: AddAccountForm) => {
      if (!platform) throw new Error("No platform selected");
      
      return apiRequest("POST", "/api/accounts", {
        ...data,
        platformId: platform.id,
        isActive: true,
        metadata: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", platform?.id, "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setShowAddForm(false);
      form.reset();
      toast({
        title: "Account added",
        description: "The account has been successfully connected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add account",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: number) => {
      return apiRequest("DELETE", `/api/accounts/${accountId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platforms", platform?.id, "accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Account removed",
        description: "The account has been disconnected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddAccountForm) => {
    addAccountMutation.mutate(data);
  };

  const handleDeleteAccount = (accountId: number) => {
    if (window.confirm("Are you sure you want to remove this account?")) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  if (!platform) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAccountColor = (index: number) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500"];
    return colors[index % colors.length];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage {platform.displayName} Accounts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <div className="space-y-1">
                        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      </div>
                    </div>
                    <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {accounts?.map((account: Account, index: number) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${getAccountColor(index)} rounded-full flex items-center justify-center`}>
                      <span className="text-white text-xs font-medium">
                        {getInitials(account.name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {account.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {account.metadata?.subscribers || account.metadata?.followers || account.metadata?.connections || "0"} 
                        {platform.name === "youtube" ? " subscribers" : 
                         platform.name === "linkedin" ? " connections" : " followers"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAccount(account.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 h-6 w-6 p-0"
                    disabled={deleteAccountMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {showAddForm ? (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-3 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My Channel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={addAccountMutation.isPending}
                        className="flex-1"
                      >
                        {addAccountMutation.isPending ? "Adding..." : "Add Account"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddForm(false);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <Button
                  variant="outline"
                  className="w-full border-2 border-dashed border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New {platform.displayName} Account
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
