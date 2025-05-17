import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, XCircle, Calculator } from "lucide-react";

interface OdSummaryProps {
  className?: string;
}

export function StudentOdSummary({ className }: OdSummaryProps) {
  const { data: odRequests, isLoading } = useQuery({
    queryKey: ["/api/od-requests"],
  });
  
  // Count the number of OD requests by status
  const counts = {
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  };
  
  if (odRequests) {
    odRequests.forEach((request: any) => {
      if (request.status === "pending") {
        counts.pending++;
      } else if (request.status === "approved") {
        counts.approved++;
      } else if (request.status === "rejected") {
        counts.rejected++;
      }
      counts.total++;
    });
  }
  
  // Recent activity
  const recentActivities = odRequests
    ? odRequests
        .slice(0, 3)
        .map((request: any) => ({
          id: request.id,
          message: `OD request for ${new Date(request.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} was ${request.status}`,
          status: request.status,
          time: new Date(request.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }))
    : [];
  
  return (
    <div className={className}>
      <Card className="shadow-sm mb-6">
        <CardContent className="pt-6">
          <CardTitle className="mb-4">OD Request Summary</CardTitle>
          
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <Skeleton className="ml-3 h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-6" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <span className="ml-3 text-foreground">Pending</span>
                  </div>
                  <span className="text-xl font-semibold text-primary">{counts.pending}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[hsl(142,70%,90%)] flex items-center justify-center text-[hsl(142,70%,45%)]">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span className="ml-3 text-foreground">Approved</span>
                  </div>
                  <span className="text-xl font-semibold text-[hsl(142,70%,45%)]">{counts.approved}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-[hsl(0,84%,90%)] flex items-center justify-center text-[hsl(0,84%,60%)]">
                      <XCircle className="h-5 w-5" />
                    </div>
                    <span className="ml-3 text-foreground">Rejected</span>
                  </div>
                  <span className="text-xl font-semibold text-[hsl(0,84%,60%)]">{counts.rejected}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-input">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Calculator className="h-5 w-5" />
                    </div>
                    <span className="ml-3 text-foreground">Total</span>
                  </div>
                  <span className="text-xl font-semibold text-foreground">{counts.total}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <CardTitle className="mb-4">Recent Activity</CardTitle>
          
          <div className="space-y-4">
            {isLoading ? (
              // Loading skeletons for recent activity
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-l-4 border-primary pl-4 py-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                ))}
              </>
            ) : recentActivities.length > 0 ? (
              // Actual recent activities
              recentActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className={`border-l-4 pl-4 py-1 ${
                    activity.status === "approved" 
                      ? "border-[hsl(142,70%,45%)]" 
                      : activity.status === "rejected"
                      ? "border-[hsl(0,84%,60%)]"
                      : "border-primary"
                  }`}
                >
                  <p className="text-sm text-foreground">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              ))
            ) : (
              // No activities
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
          
          {recentActivities.length > 0 && (
            <button className="mt-4 text-sm text-primary hover:text-primary-600">
              View all activity
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
