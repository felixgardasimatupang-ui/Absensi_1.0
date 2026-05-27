import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { createLeaveRequest, getLeaveRequests, updateLeaveRequest } from "../db";

export const leaveRouter = router({
  // Get leave requests for current user
  getMyRequests: protectedProcedure.query(async ({ ctx }) => {
    return getLeaveRequests(ctx.user.id);
  }),

  // Get pending leave requests for current user
  getMyPending: protectedProcedure.query(async ({ ctx }) => {
    return getLeaveRequests(ctx.user.id, "pending");
  }),

  // Submit a new leave request
  submitRequest: protectedProcedure
    .input(
      z.object({
        leaveType: z.enum(["annual", "sick", "personal", "permission"]),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string().min(10).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.endDate < input.startDate) {
        throw new Error("End date must be after start date");
      }

      return createLeaveRequest({
        userId: ctx.user.id,
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
        status: "pending",
      });
    }),

  // Get all pending leave requests (admin only)
  getPendingRequests: adminProcedure.query(async () => {
    return getLeaveRequests(undefined, "pending");
  }),

  // Get all leave requests (admin only)
  getAllRequests: adminProcedure.query(async () => {
    return getLeaveRequests();
  }),

  // Approve leave request (admin only)
  approveRequest: adminProcedure
    .input(
      z.object({
        requestId: z.number(),
        approvalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateLeaveRequest(input.requestId, {
        status: "approved",
        approvedBy: ctx.user.id,
        approvalNotes: input.approvalNotes,
      });
    }),

  // Reject leave request (admin only)
  rejectRequest: adminProcedure
    .input(
      z.object({
        requestId: z.number(),
        approvalNotes: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return updateLeaveRequest(input.requestId, {
        status: "rejected",
        approvedBy: ctx.user.id,
        approvalNotes: input.approvalNotes,
      });
    }),
});
