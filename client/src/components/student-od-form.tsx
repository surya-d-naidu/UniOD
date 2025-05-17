import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar-day";
import { SessionSelector } from "@/components/ui/session-selector";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Form schema
const formSchema = z.object({
  date: z.date({
    required_error: "A date is required",
  }),
  session: z.enum(["FN", "AN", "BOTH"], {
    required_error: "Please select a session",
  }),
  reason: z.string().min(5, "Reason must be at least 5 characters").max(200, "Reason must not exceed 200 characters"),
});

type FormData = z.infer<typeof formSchema>;

interface StudentOdFormProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  odStatuses?: Record<string, "pending" | "approved" | "rejected" | null>;
  onRefresh?: () => void;
}

export function StudentOdForm({ 
  selectedDate,
  onDateSelect,
  odStatuses = {},
  onRefresh
}: StudentOdFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState<number | undefined>(
    selectedDate ? selectedDate.getDate() : undefined
  );
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Form setup
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: selectedDate || new Date(),
      session: "FN",
      reason: "",
    },
  });
  
  useEffect(() => {
    if (selectedDate) {
      form.setValue("date", selectedDate);
      setSelectedDay(selectedDate.getDate());
    }
  }, [selectedDate, form]);
  
  // Handle day selection in calendar
  const handleDaySelect = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    setSelectedDay(day);
    form.setValue("date", newDate);
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };
  
  // Submit OD request
  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        date: data.date.toISOString(),
        session: data.session,
        reason: data.reason,
        status: "approved",
        isConfirmedSubmission: true
      };
      
      const res = await apiRequest("POST", "/api/od-requests", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "OD Request Approved",
        description: "Your OD request has been automatically approved.",
      });
      form.reset({
        date: new Date(),
        session: "FN",
        reason: "",
      });
      setSelectedDay(undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/od-requests"] });
      if (onRefresh) {
        onRefresh();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Confirm all submissions
  const confirmMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/confirm-submission");
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "All Submissions Confirmed",
        description: "Your OD requests have been confirmed and automatically approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/od-requests"] });
      if (onRefresh) {
        onRefresh();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Confirmation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };
  
  // Handle confirm all submissions
  const handleConfirmAll = () => {
    confirmMutation.mutate();
  };
  
  // Clear form handler
  const handleClear = () => {
    form.reset({
      date: new Date(),
      session: "FN",
      reason: "",
    });
    setSelectedDay(undefined);
    if (onDateSelect) {
      onDateSelect(new Date());
    }
  };
  
  const isPending = submitMutation.isPending || confirmMutation.isPending;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Section */}
      <div className="lg:col-span-1">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <Calendar 
              month={currentMonth}
              year={currentYear}
              selectedDay={selectedDay}
              onSelectDay={handleDaySelect}
              odStatuses={odStatuses}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* OD Request Form */}
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            <CardTitle className="mb-4">OD Request Details</CardTitle>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selected Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1 px-4 py-2 rounded-lg border border-input bg-background">
                            {field.value.toLocaleDateString('en-US', { 
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="session"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session</FormLabel>
                      <FormControl>
                        <SessionSelector 
                          value={field.value} 
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for OD</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please provide reason for your on-duty request" 
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    disabled={isPending}
                  >
                    Clear
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button
                      type="submit"
                      variant="default"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
            
            <div className="mt-6 pt-6 border-t border-input">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-muted-foreground">Your OD requests are automatically approved upon submission</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
