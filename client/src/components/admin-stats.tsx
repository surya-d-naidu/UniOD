import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Clock, CheckCircle, XCircle } from "lucide-react";

export function AdminStats() {
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["/api/admin/students"],
  });
  
  const { data: odRequests, isLoading: loadingOdRequests } = useQuery({
    queryKey: ["/api/admin/od-requests"],
  });
  
  // Count the number of OD requests by status
  const odCounts = {
    pending: 0,
    approved: 0,
    rejected: 0
  };
  
  if (odRequests) {
    odRequests.forEach((request: any) => {
      if (request.status === "pending") {
        odCounts.pending++;
      } else if (request.status === "approved") {
        odCounts.approved++;
      } else if (request.status === "rejected") {
        odCounts.rejected++;
      }
    });
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Students */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-muted-foreground text-sm font-medium">Total Students</h3>
              {loadingStudents ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <div className="text-2xl font-semibold text-foreground">
                  {students ? students.length : 0}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
      
      {/* Pending Requests */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[hsl(38,92%,90%)] text-[hsl(38,92%,50%)]">
              <Clock className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-muted-foreground text-sm font-medium">Pending Requests</h3>
              {loadingOdRequests ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <div className="text-2xl font-semibold text-foreground">
                  {odCounts.pending}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
      
      {/* Approved ODs */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[hsl(142,70%,90%)] text-[hsl(142,70%,45%)]">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-muted-foreground text-sm font-medium">Approved ODs</h3>
              {loadingOdRequests ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <div className="text-2xl font-semibold text-foreground">
                  {odCounts.approved}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
      
      {/* Rejected ODs */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[hsl(0,84%,90%)] text-[hsl(0,84%,60%)]">
              <XCircle className="h-5 w-5" />
            </div>
            <div className="ml-4">
              <h3 className="text-muted-foreground text-sm font-medium">Rejected ODs</h3>
              {loadingOdRequests ? (
                <Skeleton className="h-8 w-12 mt-1" />
              ) : (
                <div className="text-2xl font-semibold text-foreground">
                  {odCounts.rejected}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
