import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Plus, Edit, Trash2, Home, ChevronRight, User, Settings, LogOut, Bell } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Content, Account, Schedule } from "@shared/schema";

const scheduleFormSchema = z.object({
  contentId: z.string().min(1, "Please select content"),
  accountId: z.string().min(1, "Please select account"),
  scheduledAt: z.date(),
  time: z.string().min(1, "Please select time"),
});

type ScheduleForm = z.infer<typeof scheduleFormSchema>;

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: schedules } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const { data: content } = useQuery({
    queryKey: ["/api/content"],
    queryFn: async () => {
      const response = await fetch("/api/content?status=approved");
      if (!response.ok) throw new Error("Failed to fetch approved content");
      return response.json();
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      contentId: "",
      accountId: "",
      scheduledAt: new Date(),
      time: "",
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (data: ScheduleForm) => {
      const scheduledDateTime = new Date(data.scheduledAt);
      const [hours, minutes] = data.time.split(':');
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      return apiRequest("POST", "/api/schedules", {
        contentId: parseInt(data.contentId),
        accountId: parseInt(data.accountId),
        scheduledAt: scheduledDateTime.toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowScheduleDialog(false);
      form.reset();
      toast({
        title: "Content scheduled",
        description: "Your content has been scheduled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule content",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleForm) => {
    scheduleMutation.mutate(data);
  };

  const getSchedulesForDate = (date: Date) => {
    if (!schedules || !Array.isArray(schedules)) return [];
    return schedules.filter((schedule: Schedule) => {
      const scheduleDate = new Date(schedule.scheduledAt);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const getContentTitle = (contentId: number) => {
    const contentItem = content?.find((c: Content) => c.id === contentId);
    return contentItem?.title || "Unknown Content";
  };

  const getAccountName = (accountId: number) => {
    const account = accounts?.find((a: Account) => a.id === accountId);
    return account?.name || "Unknown Account";
  };

  // Generate time options
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header with Breadcrumb and Profile */}
        <div className="flex items-center justify-between">
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
              Schedule
            </span>
          </nav>
          
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            
            <Button variant="ghost" size="sm" className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <Bell className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-0 w-8 h-8 rounded-full">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                    <span className="text-white text-sm font-medium">JD</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      john@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Enhanced Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
              <CalendarIcon className="h-7 w-7 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Schedule
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Plan and schedule your content posts
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Content Calendar</span>
                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Content
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Schedule Content</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="contentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Content</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select content" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {content?.map((item: Content) => (
                                    <SelectItem key={item.id} value={item.id.toString()}>
                                      {item.title}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accountId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select account" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {accounts?.map((account: Account) => (
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

                        <FormField
                          control={form.control}
                          name="scheduledAt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date</FormLabel>
                              <div className="flex justify-center">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Time</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select time" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {timeOptions.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowScheduleDialog(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={scheduleMutation.isPending}>
                            {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Scheduled Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {selectedDate ? `Scheduled for ${format(selectedDate, "MMM d")}` : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedDate && getSchedulesForDate(selectedDate).length > 0 ? (
                  getSchedulesForDate(selectedDate).map((schedule: Schedule) => (
                    <div key={schedule.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {formatTime(schedule.scheduledAt)}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          Scheduled
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {getContentTitle(schedule.contentId)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {getAccountName(schedule.accountId)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      {selectedDate ? "No posts scheduled for this date" : "Select a date to view scheduled posts"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schedules && Array.isArray(schedules) && schedules.length > 0 ? (
                schedules
                  .filter((schedule: Schedule) => new Date(schedule.scheduledAt) > new Date())
                  .map((schedule: Schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {format(new Date(schedule.scheduledAt), "MMM d")}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {formatTime(schedule.scheduledAt)}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium">{getContentTitle(schedule.contentId)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getAccountName(schedule.accountId)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Scheduled</Badge>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming posts scheduled</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}