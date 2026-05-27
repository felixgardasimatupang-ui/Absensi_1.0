import { relations } from "drizzle-orm";
import { users, attendanceRecords, leaveRequests, attendanceSummary } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  attendanceRecords: many(attendanceRecords),
  leaveRequests: many(leaveRequests),
  attendanceSummaries: many(attendanceSummary),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  user: one(users, {
    fields: [attendanceRecords.userId],
    references: [users.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [leaveRequests.approvedBy],
    references: [users.id],
  }),
}));

export const attendanceSummaryRelations = relations(attendanceSummary, ({ one }) => ({
  user: one(users, {
    fields: [attendanceSummary.userId],
    references: [users.id],
  }),
}));
