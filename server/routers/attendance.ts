import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  createAttendanceRecord,
  getAttendanceByUserAndDate,
  updateAttendanceRecord,
  getAttendanceHistory,
} from "../db";
import { storagePut } from "../storage";

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
      // Server-side Geofencing validation
      const OFFICE_LAT = parseFloat(process.env.OFFICE_LATITUDE ?? "-3.5952");
      const OFFICE_LNG = parseFloat(process.env.OFFICE_LONGITUDE ?? "98.6722");
      const MAX_RADIUS = parseFloat(process.env.CHECKIN_RADIUS_METERS ?? "200");

      const distance = haversineDistance(input.latitude, input.longitude, OFFICE_LAT, OFFICE_LNG);
      if (distance > MAX_RADIUS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Anda terlalu jauh dari kantor (${Math.round(distance)}m dari batas maksimal ${MAX_RADIUS}m)`,
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today
      const existing = await getAttendanceByUserAndDate(ctx.user.id, today);
      if (existing?.checkInTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already checked in today",
        });
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
      const workStartHour = parseInt(process.env.WORK_START_HOUR ?? "9", 10);
      const isLate = checkInTime.getHours() > workStartHour || (checkInTime.getHours() === workStartHour && checkInTime.getMinutes() > 0);

      if (existing) {
        // Update existing record with check-in
        return updateAttendanceRecord(existing.id, {
          checkInTime,
          checkInLatitude: String(input.latitude),
          checkInLongitude: String(input.longitude),
          checkInPhotoUrl: photoUrl,
          status: isLate ? "late" : "present",
          attendanceDate: today,
        });
      } else {
        // Create new attendance record
        return createAttendanceRecord({
          userId: ctx.user.id,
          checkInTime,
          checkInLatitude: String(input.latitude),
          checkInLongitude: String(input.longitude),
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
      // Server-side Geofencing validation
      const OFFICE_LAT = parseFloat(process.env.OFFICE_LATITUDE ?? "-3.5952");
      const OFFICE_LNG = parseFloat(process.env.OFFICE_LONGITUDE ?? "98.6722");
      const MAX_RADIUS = parseFloat(process.env.CHECKIN_RADIUS_METERS ?? "200");

      const distance = haversineDistance(input.latitude, input.longitude, OFFICE_LAT, OFFICE_LNG);
      if (distance > MAX_RADIUS) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Anda terlalu jauh dari kantor (${Math.round(distance)}m dari batas maksimal ${MAX_RADIUS}m)`,
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const record = await getAttendanceByUserAndDate(ctx.user.id, today);
      if (!record) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No check-in record found for today",
        });
      }

      if (record.checkOutTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already checked out today",
        });
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
        checkOutLatitude: String(input.latitude),
        checkOutLongitude: String(input.longitude),
        checkOutPhotoUrl: photoUrl,
        workHours: String(workHours),
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
  getEmployeeHistory: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      return getAttendanceHistory(input.userId, input.startDate, input.endDate);
    }),
});
