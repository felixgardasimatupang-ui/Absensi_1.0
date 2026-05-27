import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, datetime } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with employee-specific fields and role management.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  department: varchar("department", { length: 255 }),
  position: varchar("position", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  profilePhotoUrl: text("profilePhotoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Attendance records table for tracking check-in and check-out
 */
export const attendanceRecords = mysqlTable("attendanceRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  checkInTime: datetime("checkInTime"),
  checkOutTime: datetime("checkOutTime"),
  checkInLatitude: decimal("checkInLatitude", { precision: 10, scale: 8 }),
  checkInLongitude: decimal("checkInLongitude", { precision: 11, scale: 8 }),
  checkOutLatitude: decimal("checkOutLatitude", { precision: 10, scale: 8 }),
  checkOutLongitude: decimal("checkOutLongitude", { precision: 11, scale: 8 }),
  checkInPhotoUrl: text("checkInPhotoUrl"),
  checkOutPhotoUrl: text("checkOutPhotoUrl"),
  workHours: decimal("workHours", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["present", "absent", "late", "half-day"]).default("present").notNull(),
  notes: text("notes"),
  attendanceDate: datetime("attendanceDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = typeof attendanceRecords.$inferInsert;

/**
 * Leave and permission requests table
 */
export const leaveRequests = mysqlTable("leaveRequests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leaveType: mysqlEnum("leaveType", ["annual", "sick", "personal", "permission"]).notNull(),
  startDate: datetime("startDate").notNull(),
  endDate: datetime("endDate").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvalNotes: text("approvalNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = typeof leaveRequests.$inferInsert;

/**
 * Attendance summary table for quick statistics
 */
export const attendanceSummary = mysqlTable("attendanceSummary", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  summaryDate: datetime("summaryDate").notNull(),
  totalPresent: int("totalPresent").default(0),
  totalAbsent: int("totalAbsent").default(0),
  totalLate: int("totalLate").default(0),
  totalLeave: int("totalLeave").default(0),
  totalWorkHours: decimal("totalWorkHours", { precision: 8, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AttendanceSummary = typeof attendanceSummary.$inferSelect;
export type InsertAttendanceSummary = typeof attendanceSummary.$inferInsert;
