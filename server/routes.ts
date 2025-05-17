import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { seedAdminUser } from "./admin-seeder";
import { updateOdRequestSchema, insertOdRequestSchema } from "@shared/schema";
import * as ExcelJS from 'exceljs';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/login, /api/register, /api/logout, /api/user)
  setupAuth(app);
  
  // Seed admin user
  await seedAdminUser();

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
      const parsedData = insertOdRequestSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const odRequest = await storage.createOdRequest(parsedData);
      res.status(201).json(odRequest);
    } catch (error) {
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
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Get all OD requests
      const odRequests = await storage.getAllOdRequests();
      
      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('OD Requests');
      
      // Define columns
      worksheet.columns = [
        { header: 'S.No', key: 'sno', width: 10 },
        { header: 'Reg Number', key: 'regNumber', width: 20 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Session', key: 'session', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Reason', key: 'reason', width: 40 }
      ];
      
      // Add rows
      let sno = 1;
      for (const request of odRequests) {
        const user = await storage.getUser(request.userId);
        if (user) {
          worksheet.addRow({
            sno: sno++,
            regNumber: user.registrationNumber,
            name: user.name,
            date: new Date(request.date).toLocaleDateString(),
            session: request.session,
            status: request.status,
            reason: request.reason || ''
          });
        }
      }
      
      // Style the header row
      worksheet.getRow(1).font = { bold: true };
      
      // Set content disposition and type headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=OD_Requests_Report.xlsx');
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
