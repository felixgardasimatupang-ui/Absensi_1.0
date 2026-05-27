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
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.email) updateData.email = input.email;
      if (input.phone) updateData.phone = input.phone;
      if (input.department) updateData.department = input.department;
      if (input.position) updateData.position = input.position;
      if (input.role) updateData.role = input.role;
      if (input.status) updateData.status = input.status;

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
        name: z.string().optional(),
        phone: z.string().optional(),
        department: z.string().optional(),
        position: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.phone) updateData.phone = input.phone;
      if (input.department) updateData.department = input.department;
      if (input.position) updateData.position = input.position;

      return updateUser(ctx.user.id, updateData);
    }),
});
