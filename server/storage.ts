import { db, executeWithRetry } from "./db";
import { 
  users, odRequests, 
  type User, type InsertUser, 
  type OdRequest, type InsertOdRequest, type UpdateOdRequest 
} from "@shared/schema";
import { eq, and, asc, desc, SQL, or, between, isNull } from "drizzle-orm";
import session from "express-session";
import MemoryStore from "memorystore";

// Use memory store for sessions instead of PostgreSQL to avoid connection issues
const MemorySessionStore = MemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByRegistrationNumber(registrationNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAllStudents(): Promise<User[]>;
  getPendingStudents(): Promise<User[]>;
  approveStudent(studentId: number, adminId: number): Promise<User>;
  denyStudent(studentId: number): Promise<void>;
  
  // OD request operations
  getOdRequest(id: number): Promise<OdRequest | undefined>;
  getOdRequestsByUser(userId: number): Promise<OdRequest[]>;
  createOdRequest(request: InsertOdRequest): Promise<OdRequest>;
  updateOdRequest(id: number, request: UpdateOdRequest): Promise<OdRequest>;
  deleteOdRequest(id: number): Promise<void>;
  confirmSubmission(userId: number): Promise<void>;
  confirmAndApproveSubmission(userId: number): Promise<void>;
  getAllOdRequests(): Promise<OdRequest[]>;
  getOdRequestsByStatus(status: string): Promise<OdRequest[]>;
  approveOdRequest(id: number, adminId: number): Promise<OdRequest>;
  rejectOdRequest(id: number, adminId: number): Promise<OdRequest>;
  getOdRequestsWithUsers(): Promise<Array<OdRequest & { user?: User }>>;
  clearAllOdRequests(): Promise<number>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    // Use memory store for sessions to avoid database connection issues
    this.sessionStore = new MemorySessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
      ttl: 86400000, // Session TTL in milliseconds (1 day)
      stale: false
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return executeWithRetry(async () => {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    });
  }

  async getAllUsers(): Promise<User[]> {
    return executeWithRetry(async () => {
      try {
        const result = await db
          .select()
          .from(users)
          .orderBy(asc(users.name));
        
        return result || [];
      } catch (error) {
        console.error("Error in getAllUsers:", error);
        // Return empty array instead of throwing to prevent UI errors
        return [];
      }
    });
  }

  async getUserByRegistrationNumber(registrationNumber: string): Promise<User | undefined> {
    return executeWithRetry(async () => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.registrationNumber, registrationNumber));
      return user;
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return executeWithRetry(async () => {
      const [createdUser] = await db
        .insert(users)
        .values(user)
        .returning();
      return createdUser;
    });
  }

  async getAllStudents(): Promise<User[]> {
    const students = await db
      .select()
      .from(users)
      .where(eq(users.role, "student"))
      .orderBy(asc(users.name));
    
    // Enhance with admin approver data
    const enhancedStudents = await Promise.all(
      students.map(async (student) => {
        let approverName = null;
        
        // Get approver info if available
        if (student.approvedById) {
          const approver = await this.getUser(student.approvedById);
          approverName = approver?.name;
        }
        
        // Get OD request counts
        const odRequests = await this.getOdRequestsByUser(student.id);
        const hasSubmissions = odRequests.length > 0;
        
        return {
          ...student,
          approverName,
          hasSubmissions,
          odCount: odRequests.length
        };
      })
    );
    
    return enhancedStudents;
  }

  async getPendingStudents(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.role, "student"),
          eq(users.isApproved, false)
        )
      )
      .orderBy(desc(users.createdAt));
  }

  async approveStudent(studentId: number, adminId: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        isApproved: true,
        approvedById: adminId,
        approvedAt: new Date()
      })
      .where(
        and(
          eq(users.id, studentId),
          eq(users.role, "student")
        )
      )
      .returning();
    return updatedUser;
  }

  async denyStudent(studentId: number): Promise<void> {
    await db
      .delete(users)
      .where(
        and(
          eq(users.id, studentId),
          eq(users.role, "student"),
          eq(users.isApproved, false)
        )
      );
  }

  // OD request operations
  async getOdRequest(id: number): Promise<OdRequest | undefined> {
    const [request] = await db
      .select()
      .from(odRequests)
      .where(eq(odRequests.id, id));
    return request;
  }

  async getOdRequestsByUser(userId: number): Promise<OdRequest[]> {
    return db
      .select()
      .from(odRequests)
      .where(eq(odRequests.userId, userId))
      .orderBy(desc(odRequests.date));
  }

  async createOdRequest(request: InsertOdRequest): Promise<OdRequest> {
    const [createdRequest] = await db
      .insert(odRequests)
      .values(request)
      .returning();
    return createdRequest;
  }

  async updateOdRequest(id: number, request: UpdateOdRequest): Promise<OdRequest> {
    const [updatedRequest] = await db
      .update(odRequests)
      .set({
        ...request,
        updatedAt: new Date()
      })
      .where(eq(odRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteOdRequest(id: number): Promise<void> {
    await db.delete(odRequests).where(eq(odRequests.id, id));
  }

  async confirmAndApproveSubmission(userId: number): Promise<void> {
    await db
      .update(odRequests)
      .set({
        isConfirmedSubmission: true,
        status: "approved",
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(odRequests.userId, userId),
          eq(odRequests.status, "draft")
        )
      );
  }
  
  async confirmSubmission(userId: number): Promise<void> {
    // Keep for backward compatibility
    return this.confirmAndApproveSubmission(userId);
  }

  async getAllOdRequests(): Promise<OdRequest[]> {
    const requests = await db
      .select()
      .from(odRequests)
      .orderBy(desc(odRequests.date));
    
    // Enhance with student information
    const enhancedRequests = await Promise.all(
      requests.map(async (request) => {
        const user = await this.getUser(request.userId);
        return {
          ...request,
          student: user ? {
            id: user.id,
            name: user.name,
            registrationNumber: user.registrationNumber
          } : null
        };
      })
    );
    
    return enhancedRequests;
  }

  async getOdRequestsByStatus(status: string): Promise<OdRequest[]> {
    return db
      .select()
      .from(odRequests)
      .where(eq(odRequests.status, status))
      .orderBy(desc(odRequests.date));
  }

  async approveOdRequest(id: number, adminId: number): Promise<OdRequest> {
    const [updatedRequest] = await db
      .update(odRequests)
      .set({
        status: "approved",
        approvedById: adminId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(odRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async rejectOdRequest(id: number, adminId: number): Promise<OdRequest> {
    const [updatedRequest] = await db
      .update(odRequests)
      .set({
        status: "rejected",
        approvedById: adminId,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(odRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Special method for export to reduce DB calls and improve performance
  async getOdRequestsWithUsers(): Promise<Array<OdRequest & { user?: User }>> {
    return executeWithRetry(async () => {
      try {
        // Get all OD requests
        const allRequests = await db
          .select()
          .from(odRequests)
          .orderBy(desc(odRequests.date));
          
        if (!allRequests || allRequests.length === 0) {
          return [];
        }
        
        // Extract all unique user IDs
        const userIds = [...new Set(allRequests.map(request => request.userId))];
        
        // Batch fetch all needed users
        const allUsers = await db
          .select()
          .from(users)
          .where(
            userIds.length > 0 
              ? or(...userIds.map(id => eq(users.id, id))) 
              : eq(users.id, -1) // Dummy condition if no users (should never happen)
          );
          
        // Create a map of users by ID for quick lookup
        const usersMap: Record<number, User> = {};
        allUsers.forEach(user => {
          usersMap[user.id] = user;
        });
        
        // Join OD requests with their associated users
        return allRequests.map(request => ({
          ...request,
          user: usersMap[request.userId]
        }));
      } catch (error) {
        console.error("Error in getOdRequestsWithUsers:", error);
        return [];
      }
    });
  }

  async clearAllOdRequests(): Promise<number> {
    // Delete all OD requests and return the count of deleted entries
    const result = await db.delete(odRequests).returning({ id: odRequests.id });
    return result.length;
  }
  
  async deleteAllOdRequests(): Promise<number> {
    // Alias for clearAllOdRequests to match the function name used in routes
    return this.clearAllOdRequests();
  }
}

export const storage = new DatabaseStorage();
