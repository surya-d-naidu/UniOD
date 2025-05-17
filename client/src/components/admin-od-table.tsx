import { useState } from "react";
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

export function AdminOdTable() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersMap, setUsersMap] = useState<Record<number, any>>({});
  
  const itemsPerPage = 5;
  
  const { data: odRequests, isLoading } = useQuery({
    queryKey: ["/api/admin/od-requests"],
    onSuccess: (data) => {
      // Extract unique user IDs
      const userIds = [...new Set(data.map((request: any) => request.userId))];
      
      // Fetch user details for each unique user ID
      userIds.forEach(async (userId) => {
        try {
          const res = await fetch(`/api/admin/users/${userId}`, {
            credentials: "include",
          });
          if (res.ok) {
            const userData = await res.json();
            setUsersMap(prevMap => ({
              ...prevMap,
              [userId]: userData
            }));
          }
        } catch (error) {
          console.error("Error fetching user data", error);
        }
      });
    }
  });
  
  // OD requests are automatically approved when submitted by students
  
  // Export OD report
  const handleExport = async () => {
    try {
      window.open('/api/admin/export-od-report', '_blank');
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to generate export. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // All OD requests are auto-approved when submitted by students
  
  // Filter and paginate OD requests
  let filteredRequests = odRequests || [];
  
  if (searchTerm) {
    filteredRequests = filteredRequests.filter((request: any) => {
      const user = usersMap[request.userId];
      if (!user) return false;
      
      const userMatch = 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.registrationNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const reasonMatch = request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return userMatch || reasonMatch;
    });
  }
  
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
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
            
            <Button variant="outline" size="icon">
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
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {isLoading ? (
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
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedRequests.length > 0 ? (
                // Render OD requests
                paginatedRequests.map((request: any) => {
                  const user = usersMap[request.userId] || {};
                  return (
                    <tr key={request.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary-100 text-primary">
                              {getInitials(user.name || "")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground">{user.name || "..."}</div>
                            <div className="text-xs text-muted-foreground">{user.registrationNumber || "..."}</div>
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
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                      >
                        View
                      </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                // No OD requests
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
              
              {[...Array(totalPages).keys()].map(page => (
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
