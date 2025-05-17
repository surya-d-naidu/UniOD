import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["student", "admin"]);
export const sessionTypeEnum = pgEnum("session_type", ["FN", "AN", "BOTH"]);
export const odStatusEnum = pgEnum("od_status", ["draft", "pending", "approved", "rejected"]);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  isApproved: boolean("is_approved").default(false),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// OD request table
export const odRequests = pgTable("od_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  session: sessionTypeEnum("session").notNull(),
  reason: text("reason"),
  status: odStatusEnum("status").notNull().default("draft"),
  isConfirmedSubmission: boolean("is_confirmed_submission").default(false),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Schemas for input validation
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, approvedById: true, approvedAt: true, createdAt: true });

export const loginUserSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  password: z.string().min(1, "Password is required")
});

export const insertOdRequestSchema = createInsertSchema(odRequests)
  .omit({ id: true, approvedById: true, approvedAt: true, createdAt: true, updatedAt: true })
  .extend({
    date: z.string().transform(val => new Date(val)),
  });

export const updateOdRequestSchema = insertOdRequestSchema.partial();

// Types for database operations
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type OdRequest = typeof odRequests.$inferSelect;
export type InsertOdRequest = z.infer<typeof insertOdRequestSchema>;
export type UpdateOdRequest = z.infer<typeof updateOdRequestSchema>;
