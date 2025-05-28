import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, X } from "lucide-react";

export function AdminStudentsTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/admin/pending-students"],
  });
  
  // Approve student mutation
  const approveMutation = useMutation({
    mutationFn: async (studentId: number) => {
      const res = await apiRequest("POST", `/api/admin/approve-student/${studentId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Student Approved",
        description: "The student can now log in to the system.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/pending-students"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/students"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Deny student mutation
  const denyMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await apiRequest("POST", `/api/admin/deny-student/${studentId}`);
    },
    onSuccess: () => {
      toast({
        title: "Student Denied",
        description: "The student account has been removed.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/pending-students"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Denial Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle approve click
  const handleApprove = (studentId: number) => {
    approveMutation.mutate(studentId);
  };
  
  // Handle deny click
  const handleDeny = (studentId: number) => {
    denyMutation.mutate(studentId);
  };
  
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <CardTitle>Student Approvals</CardTitle>
        </div>
        
        {isLoading ? (
          // Skeleton loading state
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-input rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="mt-4 pt-4 border-t border-input flex justify-end space-x-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : students && Array.isArray(students) && students.length > 0 ? (
          // Render students
          <div className="space-y-4">
            {students.map((student: any) => (
              <div key={student.id} className="border border-input rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{student.name}</h3>
                    <div className="text-muted-foreground text-sm mt-1">{student.registrationNumber}</div>
                  </div>
                  <StatusBadge status="pending" />
                </div>
                <div className="mt-4 pt-4 border-t border-input flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeny(student.id)}
                    disabled={denyMutation.isPending}
                    className="border-[hsl(0,84%,60%)] text-[hsl(0,84%,60%)] hover:bg-[hsl(0,84%,95%)] hover:text-[hsl(0,84%,60%)]"
                  >
                    {denyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Deny
                      </>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(student.id)}
                    disabled={approveMutation.isPending}
                    className="bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)]"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // No pending students
          <div className="border border-input rounded-lg p-6 text-center">
            <p className="text-muted-foreground">No pending student approvals</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
