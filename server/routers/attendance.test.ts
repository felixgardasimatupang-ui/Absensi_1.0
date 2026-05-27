import { describe, it, expect, vi, beforeEach } from "vitest";
import { attendanceRouter } from "./attendance";
import * as db from "../db";

// Mock the database module
vi.mock("../db");
vi.mock("../storage");

describe("Attendance Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTodayAttendance", () => {
    it("should return today's attendance record", async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        checkInTime: new Date(),
        checkOutTime: null,
        status: "present",
        attendanceDate: new Date(),
      };

      vi.mocked(db.getAttendanceByUserAndDate).mockResolvedValue(mockRecord as any);

      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      const result = await caller.getTodayAttendance();
      expect(result).toEqual(mockRecord);
    });

    it("should return null if no attendance record exists", async () => {
      vi.mocked(db.getAttendanceByUserAndDate).mockResolvedValue(null);

      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      const result = await caller.getTodayAttendance();
      expect(result).toBeNull();
    });
  });

  describe("checkIn", () => {
    it("should create a new attendance record on check-in within office coordinates", async () => {
      vi.mocked(db.getAttendanceByUserAndDate).mockResolvedValue(null);
      vi.mocked(db.createAttendanceRecord).mockResolvedValue({ id: 1 } as any);

      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      const result = await caller.checkIn({
        latitude: -3.5952,
        longitude: 98.6722,
      });

      expect(result).toBeDefined();
      expect(db.createAttendanceRecord).toHaveBeenCalled();
    });

    it("should throw error if already checked in", async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        checkInTime: new Date(),
        status: "present",
      };

      vi.mocked(db.getAttendanceByUserAndDate).mockResolvedValue(mockRecord as any);

      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.checkIn({
          latitude: -3.5952,
          longitude: 98.6722,
        })
      ).rejects.toThrow("Already checked in today");
    });

    it("should throw error if coordinates are too far from office (geofencing)", async () => {
      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.checkIn({
          latitude: 10.5,
          longitude: 20.5,
        })
      ).rejects.toThrow("Anda terlalu jauh dari kantor");
    });
  });

  describe("checkOut", () => {
    it("should update attendance record on check-out", async () => {
      const mockRecord = {
        id: 1,
        userId: 1,
        checkInTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        checkOutTime: null,
        status: "present",
      };

      vi.mocked(db.getAttendanceByUserAndDate).mockResolvedValue(mockRecord as any);
      vi.mocked(db.updateAttendanceRecord).mockResolvedValue({
        ...mockRecord,
        checkOutTime: new Date(),
      } as any);

      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      const result = await caller.checkOut({
        latitude: -3.5952,
        longitude: 98.6722,
      });

      expect(result).toBeDefined();
      expect(db.updateAttendanceRecord).toHaveBeenCalled();
    });

    it("should throw error if no check-in record exists", async () => {
      vi.mocked(db.getAttendanceByUserAndDate).mockResolvedValue(null);

      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.checkOut({
          latitude: -3.5952,
          longitude: 98.6722,
        })
      ).rejects.toThrow("No check-in record found for today");
    });

    it("should throw error if check-out is too far from office (geofencing)", async () => {
      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.checkOut({
          latitude: 10.5,
          longitude: 20.5,
        })
      ).rejects.toThrow("Anda terlalu jauh dari kantor");
    });
  });

  describe("getHistory", () => {
    it("should return attendance history for date range", async () => {
      const mockRecords = [
        { id: 1, userId: 1, attendanceDate: new Date(), status: "present" },
        { id: 2, userId: 1, attendanceDate: new Date(), status: "present" },
      ];

      vi.mocked(db.getAttendanceHistory).mockResolvedValue(mockRecords as any);

      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      const startDate = new Date();
      const endDate = new Date();

      const result = await caller.getHistory({ startDate, endDate });
      expect(result).toEqual(mockRecords);
      expect(db.getAttendanceHistory).toHaveBeenCalledWith(1, startDate, endDate);
    });
  });

  describe("getEmployeeHistory", () => {
    it("should throw forbidden error if caller is not admin", async () => {
      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.getEmployeeHistory({
          userId: 2,
          startDate: new Date(),
          endDate: new Date(),
        })
      ).rejects.toThrow("You do not have required permission");
    });

    it("should allow admin to fetch history for other employee", async () => {
      const mockRecords = [
        { id: 1, userId: 2, attendanceDate: new Date(), status: "present" },
      ];

      vi.mocked(db.getAttendanceHistory).mockResolvedValue(mockRecords as any);

      const caller = attendanceRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, role: "admin" } as any,
      });

      const startDate = new Date();
      const endDate = new Date();

      const result = await caller.getEmployeeHistory({
        userId: 2,
        startDate,
        endDate,
      });

      expect(result).toEqual(mockRecords);
      expect(db.getAttendanceHistory).toHaveBeenCalledWith(2, startDate, endDate);
    });
  });
});
