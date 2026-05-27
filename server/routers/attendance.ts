import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createAttendanceRecord,
  getAttendanceByUserAndDate,
  updateAttendanceRecord,
  getAttendanceHistory,
} from "../db";
import { storagePut } from "../storage";

export const attendanceRouter = router({
  // Get today's attendance record for current user
  getTodayAttendance: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const record = await getAttendanceByUserAndDate(ctx.user.id, today);
    return record;
  }),

  // Check-in with GPS and photo
  checkIn: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        photoBase64: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today
      const existing = await getAttendanceByUserAndDate(ctx.user.id, today);
      if (existing?.checkInTime) {
        throw new Error("Already checked in today");
      }

      let photoUrl = null;
      if (input.photoBase64) {
        try {
          const buffer = Buffer.from(input.photoBase64, "base64");
          const { url } = await storagePut(
            `attendance/${ctx.user.id}/checkin-${Date.now()}.jpg`,
            buffer,
            "image/jpeg"
          );
          photoUrl = url;
        } catch (error) {
          console.error("Failed to upload check-in photo:", error);
        }
      }

      const checkInTime = new Date();
      const isLate = checkInTime.getHours() > 9; // Assuming 9 AM is the standard time

      if (existing) {
        // Update existing record with check-in
        return updateAttendanceRecord(existing.id, {
          checkInTime,
          checkInLatitude: input.latitude,
          checkInLongitude: input.longitude,
          checkInPhotoUrl: photoUrl,
          status: isLate ? "late" : "present",
          attendanceDate: today,
        });
      } else {
        // Create new attendance record
        return createAttendanceRecord({
          userId: ctx.user.id,
          checkInTime,
          checkInLatitude: input.latitude,
          checkInLongitude: input.longitude,
          checkInPhotoUrl: photoUrl,
          status: isLate ? "late" : "present",
          attendanceDate: today,
        });
      }
    }),

  // Check-out with GPS and photo
  checkOut: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        photoBase64: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const record = await getAttendanceByUserAndDate(ctx.user.id, today);
      if (!record) {
        throw new Error("No check-in record found for today");
      }

      if (record.checkOutTime) {
        throw new Error("Already checked out today");
      }

      let photoUrl = null;
      if (input.photoBase64) {
        try {
          const buffer = Buffer.from(input.photoBase64, "base64");
          const { url } = await storagePut(
            `attendance/${ctx.user.id}/checkout-${Date.now()}.jpg`,
            buffer,
            "image/jpeg"
          );
          photoUrl = url;
        } catch (error) {
          console.error("Failed to upload check-out photo:", error);
        }
      }

      const checkOutTime = new Date();
      const checkInTime = record.checkInTime;

      // Calculate work hours
      let workHours = 0;
      if (checkInTime) {
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        workHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
      }

      return updateAttendanceRecord(record.id, {
        checkOutTime,
        checkOutLatitude: input.latitude,
        checkOutLongitude: input.longitude,
        checkOutPhotoUrl: photoUrl,
        workHours,
      });
    }),

  // Get attendance history for current user
  getHistory: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return getAttendanceHistory(ctx.user.id, input.startDate, input.endDate);
    }),

  // Get attendance history for a specific employee (admin only)
  getEmployeeHistory: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return getAttendanceHistory(input.userId, input.startDate, input.endDate);
    }),
});
