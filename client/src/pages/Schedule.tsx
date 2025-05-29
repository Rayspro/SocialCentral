import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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

  const createScheduleMutation = useMutation({
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
        title: "Post scheduled",
        description: "Your content has been scheduled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule post",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ScheduleForm) => {
    createScheduleMutation.mutate(data);
  };

  const getSchedulesForDate = (date: Date) => {
    if (!schedules) return [];
    return schedules.filter((schedule: Schedule) => {
      const scheduleDate = new Date(schedule.scheduledAt);
      return scheduleDate.toDateString() === date.toDateString();
    });
  };

  const getContentTitle = (contentId: number) => {
    const contentItem = content?.find((c: Content) => c.id === contentId);
    return contentItem?.title || "Unknown Content";
  };

  const getAccountName = (accountId: number) => {
    const account = accounts?.find((a: Account) => a.id === accountId);
    return account?.name || "Unknown Account";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400";
      case "pending": return "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
      case "failed": return "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400";
      default: return "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400";
    }
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <div className="space-y-6">
      <Header title="Schedule" subtitle="Plan and schedule your content posts" />
      
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Content Calendar</CardTitle>
                <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Post
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Schedule New Post</DialogTitle>
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
                                  className="rounded-md border"
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
                                  {timeSlots.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={createScheduleMutation.isPending}
                        >
                          {createScheduleMutation.isPending ? "Scheduling..." : "Schedule Post"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
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

          {/* Daily Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDate ? (
                <div className="space-y-3">
                  {getSchedulesForDate(selectedDate).map((schedule: Schedule) => (
                    <div
                      key={schedule.id}
                      className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {formatTime(schedule.scheduledAt)}
                          </span>
                        </div>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {getContentTitle(schedule.contentId)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {getAccountName(schedule.accountId)}
                      </p>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {getSchedulesForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No posts scheduled for this date</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a date to view schedule</p>
                </div>
              )}
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
              {schedules && schedules.length > 0 ? (
                schedules
                  .filter((schedule: Schedule) => new Date(schedule.scheduledAt) > new Date())
                  .slice(0, 5)
                  .map((schedule: Schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-semibold">
                          {format(new Date(schedule.scheduledAt), "dd")}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {getContentTitle(schedule.contentId)}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getAccountName(schedule.accountId)} • {format(new Date(schedule.scheduledAt), "MMM dd, yyyy 'at' hh:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Trash2 className="h-3 w-3" />
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