import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AdminNav } from "@/components/admin-nav";
import { AdminStats } from "@/components/admin-stats";
import { AdminStudentsTable } from "@/components/admin-students-table";
import { AdminOdTable } from "@/components/admin-od-table";
import { AdminApprovedStudents } from "@/components/admin-approved-students";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Fetch data for dashboard
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["/api/admin/students"],
  });
  
  const { data: odRequests, isLoading: loadingOdRequests } = useQuery({
    queryKey: ["/api/admin/od-requests"],
  });
  
  // Loading state
  if (loadingStudents || loadingOdRequests) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Navigation */}
      <AdminNav />

      {/* Main Content */}
      <main className="flex-1 bg-neutral-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-800">OD Management Dashboard</h1>
            <p className="mt-1 text-neutral-600">Manage student approvals and OD requests</p>
          </div>
          
          {/* Stats Cards */}
          <AdminStats />
          
          {/* Admin Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Left Column: Student Management */}
            <div className="lg:col-span-1">
              <AdminStudentsTable />
            </div>
            
            {/* Right Column: OD Requests */}
            <div className="lg:col-span-2">
              <AdminOdTable />
            </div>
          </div>
          
          {/* Approved Students with Status */}
          <div className="mt-6">
            <AdminApprovedStudents />
          </div>
        </div>
      </main>
    </div>
  );
}
