import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getAllEmployees, updateUser, getTodayAttendanceStats } from "../db";

export const employeesRouter = router({
  // Get all employees (admin only)
  getAll: adminProcedure.query(async () => {
    return getAllEmployees("active");
  }),

  // Get all employees including inactive (admin only)
  getAllIncludingInactive: adminProcedure.query(async () => {
    const active = await getAllEmployees("active");
    const inactive = await getAllEmployees("inactive");
    return [...active, ...inactive];
  }),

  // Update employee details (admin only)
  updateEmployee: adminProcedure
    .input(
      z.object({
        employeeId: z.number(),
        name: z.string().nullable().optional(),
        email: z.string().email().or(z.literal("")).nullable().optional(),
        phone: z.string().nullable().optional(),
        department: z.string().nullable().optional(),
        position: z.string().nullable().optional(),
        role: z.enum(["user", "admin"]).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name || null;
      if (input.email !== undefined) updateData.email = input.email || null;
      if (input.phone !== undefined) updateData.phone = input.phone || null;
      if (input.department !== undefined) updateData.department = input.department || null;
      if (input.position !== undefined) updateData.position = input.position || null;
      if (input.role !== undefined) updateData.role = input.role;
      if (input.status !== undefined) updateData.status = input.status;

      return updateUser(input.employeeId, updateData);
    }),

  // Deactivate employee (admin only)
  deactivateEmployee: adminProcedure
    .input(z.object({ employeeId: z.number() }))
    .mutation(async ({ input }) => {
      return updateUser(input.employeeId, { status: "inactive" });
    }),

  // Reactivate employee (admin only)
  reactivateEmployee: adminProcedure
    .input(z.object({ employeeId: z.number() }))
    .mutation(async ({ input }) => {
      return updateUser(input.employeeId, { status: "active" });
    }),

  // Get today's attendance statistics (admin only)
  getTodayStats: adminProcedure.query(async () => {
    return getTodayAttendanceStats();
  }),

  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  // Update current user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        department: z.string().nullable().optional(),
        position: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name || null;
      if (input.phone !== undefined) updateData.phone = input.phone || null;
      if (input.department !== undefined) updateData.department = input.department || null;
      if (input.position !== undefined) updateData.position = input.position || null;

      return updateUser(ctx.user.id, updateData);
    }),
});
