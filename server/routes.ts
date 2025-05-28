// filepath: /home/phantom/Downloads/UniversityODTracker(2)/UniversityODTracker/server/routes.ts
import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { seedAdminUser } from "./admin-seeder";
import { updateOdRequestSchema, insertOdRequestSchema, type User } from "@shared/schema";
// Import our Excel helper that handles the ExcelJS import safely
import { createWorkbook } from "./excel-helper";

// Augment Express types to include user
declare global {
  namespace Express {
    interface User {
      id: number;
      role: string;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/login, /api/register, /api/logout, /api/user)
  setupAuth(app);
  
  // Seed admin user (non-blocking) - allow the server to start even if database is temporarily unavailable
  seedAdminUser().catch(error => {
    console.error("⚠️ Admin seeding failed, but server will continue:", error.message);
  });

  // Student OD request routes
  app.get("/api/od-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const odRequests = await storage.getOdRequestsByUser(req.user!.id);
      res.json(odRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch OD requests" });
    }
  });

  app.post("/api/od-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Handle date conversion on the server side
      const dateStr = req.body.date;
      const date = new Date(dateStr);
      
      // Auto-approve OD requests
      const parsedData = {
        ...req.body,
        date: date,
        userId: req.user!.id,
        status: "approved",
        approvedAt: new Date(),
        isConfirmedSubmission: true
      };
      
      const odRequest = await storage.createOdRequest(parsedData);
      res.status(201).json(odRequest);
    } catch (error) {
      console.error("OD request error:", error);
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.put("/api/od-requests/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const existingRequest = await storage.getOdRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "OD request not found" });
      }
      
      if (existingRequest.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const parsedData = updateOdRequestSchema.parse(req.body);
      const updatedRequest = await storage.updateOdRequest(id, parsedData);
      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.delete("/api/od-requests/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const existingRequest = await storage.getOdRequest(id);
      if (!existingRequest) {
        return res.status(404).json({ message: "OD request not found" });
      }
      
      if (existingRequest.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteOdRequest(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete OD request" });
    }
  });

  app.post("/api/confirm-submission", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      // Auto-approve OD requests when students confirm submission
      await storage.confirmAndApproveSubmission(req.user!.id);
      res.status(200).json({ message: "Submission confirmed and approved" });
    } catch (error) {
      res.status(500).json({ message: "Failed to confirm submission" });
    }
  });

  // Admin routes
  app.get("/api/admin/students", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/admin/pending-students", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const pendingStudents = await storage.getPendingStudents();
      res.json(pendingStudents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending students" });
    }
  });

  app.get("/api/admin/users", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const users = await storage.getAllUsers();
      // Send empty array instead of error if no users found
      res.json(users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      // Return empty array instead of error to prevent UI issues
      res.json([]);
    }
  });

  app.get("/api/admin/users/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/admin/approve-student/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      const updatedStudent = await storage.approveStudent(id, req.user!.id);
      res.json(updatedStudent);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve student" });
    }
  });

  app.post("/api/admin/deny-student/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    
    try {
      await storage.denyStudent(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to deny student" });
    }
  });

  app.get("/api/admin/od-requests", async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      const odRequests = await storage.getAllOdRequests();
      res.json(odRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch OD requests" });
    }
  });

  app.get("/api/admin/export-od-report", async (req: Request, res: Response) => {
    console.log("=====================================================");
    console.log("Export OD report endpoint called");
    console.log(`Request from user: ${req.user?.id}, Role: ${req.user?.role}`);
    
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      console.log("Unauthorized access attempt to export OD report");
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      console.log("Fetching OD requests for export...");
      // Get OD requests with associated users directly in one query
      const odRequestsWithUsers = await storage.getOdRequestsWithUsers().catch(err => {
        console.error("Error fetching OD requests with users for export:", err);
        return [];
      });
      
      console.log(`Found ${odRequestsWithUsers?.length || 0} OD requests for export`);
      
      if (!odRequestsWithUsers || odRequestsWithUsers.length === 0) {
        console.log("No OD requests found for export");
        return res.status(404).json({ message: "No OD requests found to export" });
      }
      
      // Create Excel workbook using our helper
      const workbook = await createWorkbook();
      workbook.creator = 'University OD Tracker';
      workbook.created = new Date();
      
      // Group OD requests by date
      const requestsByDate = odRequestsWithUsers.reduce((acc, request) => {
        // Format date to match the sample format (DD.MM.YYYY)
        const date = request.date ? new Date(request.date) : new Date();
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
        
        if (!acc[formattedDate]) {
          acc[formattedDate] = [];
        }
        acc[formattedDate].push(request);
        return acc;
      }, {});
      
      console.log(`Grouped OD requests by ${Object.keys(requestsByDate).length} different dates`);
      
      // Create a worksheet for each date (like in the sample file)
      Object.keys(requestsByDate).forEach(date => {
        const requests = requestsByDate[date];
        const worksheet = workbook.addWorksheet(date);
        
        // Set columns exactly like the sample file
        worksheet.columns = [
          { header: 'Registration Number', key: 'registrationNumber', width: 22 },
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Date', key: 'date', width: 15 },
          { header: 'Session', key: 'session', width: 12 }
        ];
        
        // Style the header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, size: 12 };
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        headerRow.height = 20; // Set height to match sample
        
        // Add borders to header cells
        headerRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        
        // Add data rows
        requests.forEach(request => {
          try {
            const user = request.user;
            
            // If session is BOTH, create two entries (FN and AN) like in the sample file
            if (request.session === 'BOTH') {
              // Add FN entry
              const fnRow = worksheet.addRow({
                registrationNumber: user?.registrationNumber || "Unknown",
                name: user?.name || "Unknown Student",
                date: date, // Already formatted as DD.MM.YYYY
                session: 'FN'
              });
              
              // Add AN entry
              const anRow = worksheet.addRow({
                registrationNumber: user?.registrationNumber || "Unknown",
                name: user?.name || "Unknown Student",
                date: date, // Already formatted as DD.MM.YYYY
                session: 'AN'
              });
            } else {
              // For non-BOTH sessions, add a single entry
              const row = worksheet.addRow({
                registrationNumber: user?.registrationNumber || "Unknown",
                name: user?.name || "Unknown Student",
                date: date, // Already formatted as DD.MM.YYYY
                session: request.session || "Unknown"
              });
            }
          } catch (error) {
            console.error(`Error adding row for OD request:`, error);
            worksheet.addRow({
              registrationNumber: "Error",
              name: "Error retrieving data",
              date: date,
              session: "Unknown"
            });
          }
        });
        
        // Add styling to data rows
        // Get the actual number of rows in the worksheet for styling
        // This accounts for BOTH sessions that create two rows
        const totalRows = worksheet.rowCount;
        
        // Style all data rows (starting from row 2, after the header)
        for (let i = 2; i <= totalRows; i++) {
          const row = worksheet.getRow(i);
          row.height = 18; // Set data row height to match sample
          
          // Add borders to cells
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            // Center alignment for date and session columns
            if (cell.col === 3 || cell.col === 4) {
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            } else {
              cell.alignment = { vertical: 'middle' };
            }
          });
        }
        
        // Auto-fit columns to content but respect minimum widths
        worksheet.columns.forEach(column => {
          const maxLength = worksheet.getColumn(column.key).values
            .filter(value => value !== undefined)
            .reduce((max, value) => Math.max(max, value ? value.toString().length : 0), 0);
          
          // Set column widths based on content, but with minimums matching the sample file
          const minWidths = {
            'registrationNumber': 22,
            'name': 30,
            'date': 15,
            'session': 12
          };
          
          const minWidth = minWidths[column.key] || 10;
          column.width = Math.max(minWidth, maxLength + 2);
        });
      });
      
      // Set content type and disposition headers
      console.log("Setting response headers for Excel download...");
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=OD_SHEET.xlsx`);
      
      // Write to response with error handling
      try {
        console.log("Attempting to write Excel workbook to response...");
        await workbook.xlsx.write(res);
        console.log("Successfully wrote Excel workbook to response");
        res.end();
      } catch (writeError) {
        console.error("Error writing Excel workbook to response:", writeError);
        console.error("Error details:", JSON.stringify({
          name: writeError.name,
          message: writeError.message,
          stack: writeError.stack
        }));
        
        // If we've already started writing the response, we can't send a new one
        if (!res.headersSent) {
          res.status(500).json({ message: `Failed to generate Excel file: ${writeError.message}` });
        } else {
          res.end();
        }
      }
    } catch (error) {
      console.error("Error in export-od-report endpoint:", error);
      
      // Try to provide more specific error information
      let errorMessage = "Failed to generate report. Please try again.";
      if (error instanceof Error) {
        console.error(`Export error details: ${error.name}: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
        errorMessage = `Export failed: ${error.message}`;
      }
      
      // Ensure we haven't already sent headers
      if (!res.headersSent) {
        res.status(500).json({ message: errorMessage });
      } else {
        try {
          res.end();
        } catch (e) {
          console.error("Error ending response:", e);
        }
      }
    }
  });

  // Add an endpoint to clear all OD requests
  app.post("/api/admin/clear-od-data", async (req: Request, res: Response) => {
    console.log("Clear OD data endpoint called");
    console.log(`Request from user: ${req.user?.id}, Role: ${req.user?.role}`);
    
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      console.log("Unauthorized access attempt to clear OD data");
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Delete all OD requests
      const deleted = await storage.deleteAllOdRequests();
      console.log(`Successfully deleted ${deleted} OD requests`);
      
      return res.status(200).json({ 
        success: true,
        message: `Successfully cleared ${deleted} OD requests` 
      });
    } catch (error) {
      console.error("Error clearing OD data:", error);
      
      // Try to provide more specific error information
      let errorMessage = "Failed to clear OD data. Please try again.";
      if (error instanceof Error) {
        console.error(`Clear data error details: ${error.name}: ${error.message}`);
        console.error(`Stack trace: ${error.stack}`);
        errorMessage = `Clear operation failed: ${error.message}`;
      }
      
      return res.status(500).json({ message: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
