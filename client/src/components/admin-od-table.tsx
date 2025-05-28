import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Filter, Download, 
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { downloadFile } from "@/utils/download-helper";

export function AdminOdTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersMap, setUsersMap] = useState<Record<number, any>>({});
  
  const itemsPerPage = 5;
  
  // Prefetch all users
  const { data: allUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Process user data when it changes
  useEffect(() => {
    if (allUsers && Array.isArray(allUsers)) {
      // Create a map of users by ID for quick lookup
      const userMap = allUsers.reduce((acc: Record<number, any>, user: any) => {
        if (user && user.id) {
          acc[user.id] = user;
        }
        return acc;
      }, {});
      
      setUsersMap(userMap);
    } else if (allUsers === undefined) {
      console.error("Error fetching all users: received undefined");
      toast({
        title: "Error",
        description: "Failed to load user data. Student names may not display correctly.",
        variant: "destructive",
      });
    }
  }, [allUsers, toast]);
  
  // Need to make sure we add useEffect import
  const { data: odRequests, isLoading: isLoadingOD } = useQuery({
    queryKey: ["/api/admin/od-requests"],
    retry: 3
  });

  // Handle OD request fetch errors
  useEffect(() => {
    if (odRequests === undefined) {
      console.error("Error fetching OD requests: received undefined");
      toast({
        title: "Error",
        description: "Failed to load OD requests. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  }, [odRequests, toast]);
  
  // OD requests are automatically approved when submitted by students
  
  // Export OD report
  const handleExport = async () => {
    try {
      // Show loading toast
      toast({
        title: "Generating Export",
        description: "Please wait while we generate your Excel file...",
      });
      
      console.log("Starting export process...");
      
      // Use the download helper utility for better handling
      await downloadFile('/api/admin/export-od-report', 'OD_SHEET.xlsx');
      
      console.log("Download completed successfully");
      toast({
        title: "Export Successful",
        description: "OD report has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Export error:", error);
      
      // Get detailed error message
      let errorMessage = "Failed to generate export. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Export failed: ${error.message}`;
        console.error(`Error details: ${error.stack}`);
      }
      
      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Try a direct approach as a fallback
      try {
        console.log("Attempting fallback export method...");
        
        // Show fallback toast
        toast({
          title: "Trying Alternative Download",
          description: "Attempting to use an alternative download method..."
        });
        
        // Open the export URL directly in a new tab as a fallback
        const newTab = window.open('/api/admin/export-od-report', '_blank');
        
        // Check if the tab was actually opened (may be blocked by popup blockers)
        if (!newTab) {
          throw new Error("Popup blocked. Please allow popups for this site and try again.");
        }
        
        // Notify the user of the fallback attempt
        toast({
          title: "Alternative Download Initiated",
          description: "Please check your browser's download manager or the new tab that opened.",
        });
      } catch (fallbackError) {
        console.error("Fallback export method also failed:", fallbackError);
        
        // Provide final fallback instructions
        toast({
          title: "Alternative Download Failed",
          description: "Please try manually navigating to /api/admin/export-od-report in a new tab.",
          variant: "destructive",
        });
      }
    }
  };

  // All OD requests are auto-approved when submitted by students
  
  // Filter and paginate OD requests
  let filteredRequests: any[] = Array.isArray(odRequests) ? odRequests : [];
  
  if (searchTerm) {
    filteredRequests = filteredRequests.filter((request: any) => {
      const user = getUser(request.userId);
      
      // If there's no user data and we're searching, still include it
      // in case we're looking for users with missing data
      if (!user) {
        return searchTerm.toLowerCase().includes("unknown") || 
               searchTerm.toLowerCase().includes("missing");
      }
      
      const userMatch = 
        (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (user.registrationNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const reasonMatch = (request.reason || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      return userMatch || reasonMatch;
    });
  }
  
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name || name === "Unknown") return '?';
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase() || '?';
  };
  
  // Safe user lookup function to prevent errors
  const getUser = (userId: number) => {
    if (!userId || !usersMap) return null;
    return usersMap[userId] || null;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <CardTitle>OD Requests</CardTitle>
          
          <div className="flex space-x-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-2 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
            </div>
            
            <Button variant="outline" size="icon" style={{ display: 'none' }}>
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="default" 
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
        
        {/* OD Requests Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date & Session
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reason
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Submission
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {isLoadingOD || isLoadingUsers ? (
                // Skeleton loading state
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </td>
                  </tr>
                ))
              ) : paginatedRequests.length > 0 ? (
                // Render OD requests
                paginatedRequests.map((request: any) => {
                  const user = getUser(request.userId);
                  const userName = user?.name || "Unknown Student";
                  const regNumber = user?.registrationNumber || "No Registration Number";
                  
                  return (
                    <tr key={request.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary-100 text-primary">
                              {getInitials(userName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground">
                              {userName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {regNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{formatDate(request.date)}</div>
                        <div className="text-xs text-muted-foreground">
                          {request.session === "FN" ? "FN (Morning)" : 
                           request.session === "AN" ? "AN (Afternoon)" : "BOTH (Full Day)"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-foreground max-w-xs truncate">
                          {request.reason || "No reason provided"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge 
                          status={request.isConfirmedSubmission ? "confirmed" : "draft"} 
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                // No OD requests
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No OD requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, filteredRequests.length)}
              </span>{" "}
              of <span className="font-medium">{filteredRequests.length}</span> results
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {Array.from({ length: totalPages }, (_, page) => (
                <Button
                  key={page}
                  variant={currentPage === page + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page + 1)}
                  className={currentPage === page + 1 ? "bg-primary-50 border-primary-300 text-primary-700" : ""}
                >
                  {page + 1}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
