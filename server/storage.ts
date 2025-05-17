import { db } from "./db";
import { 
  users, odRequests, 
  type User, type InsertUser, 
  type OdRequest, type InsertOdRequest, type UpdateOdRequest 
} from "@shared/schema";
import { eq, and, asc, desc, SQL, or, between, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByRegistrationNumber(registrationNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
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
  getAllOdRequests(): Promise<OdRequest[]>;
  getOdRequestsByStatus(status: string): Promise<OdRequest[]>;
  approveOdRequest(id: number, adminId: number): Promise<OdRequest>;
  rejectOdRequest(id: number, adminId: number): Promise<OdRequest>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
      tableName: 'session'
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByRegistrationNumber(registrationNumber: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.registrationNumber, registrationNumber));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db
      .insert(users)
      .values(user)
      .returning();
    return createdUser;
  }

  async getAllStudents(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.role, "student"))
      .orderBy(asc(users.name));
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

  async confirmSubmission(userId: number): Promise<void> {
    await db
      .update(odRequests)
      .set({
        isConfirmedSubmission: true,
        status: "pending",
        updatedAt: new Date()
      })
      .where(
        and(
          eq(odRequests.userId, userId),
          eq(odRequests.status, "draft")
        )
      );
  }

  async getAllOdRequests(): Promise<OdRequest[]> {
    return db
      .select()
      .from(odRequests)
      .orderBy(desc(odRequests.date));
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
}

export const storage = new DatabaseStorage();
