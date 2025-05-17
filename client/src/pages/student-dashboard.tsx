import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/ui/user-nav";
import { StudentOdSummary } from "@/components/student-od-summary";
import { StudentOdForm } from "@/components/student-od-form";
import { Button } from "@/components/ui/button";
import { Loader2, Bell } from "lucide-react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  
  // Fetch OD requests
  const { data: odRequests, isLoading, refetch } = useQuery({
    queryKey: ["/api/od-requests"],
  });
  
  // Map to track OD request status by date
  const odStatusMap: Record<string, "pending" | "approved" | "rejected" | null> = {};
  
  if (odRequests) {
    odRequests.forEach((request: any) => {
      const dateStr = new Date(request.date).toISOString().split('T')[0];
      odStatusMap[dateStr] = request.status;
    });
  }
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refetch();
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Logo />
            </div>
            
            <div className="flex items-center">
              <div className="hidden md:block">
                <div className="flex items-center space-x-4">
                  <span className="text-neutral-600">{user?.name}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">Student</span>
                </div>
              </div>
              
              <div className="ml-4 flex items-center md:ml-6">
                <Button variant="ghost" size="icon" className="relative mr-2">
                  <Bell className="h-5 w-5 text-neutral-500" />
                </Button>
                
                <div className="ml-3 relative">
                  <UserNav />
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-800">On-Duty Request Management</h1>
            <p className="mt-1 text-neutral-600">Request and manage your on-duty absences</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Status Summary */}
            <div className="lg:col-span-1">
              <StudentOdSummary />
            </div>
            
            {/* Right Column: Calendar and OD Form */}
            <div className="lg:col-span-2">
              <StudentOdForm 
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                odStatuses={odStatusMap}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
