import { describe, it, expect, vi, beforeEach } from "vitest";
import { leaveRouter } from "./leave";
import * as db from "../db";

vi.mock("../db");

describe("Leave Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitRequest", () => {
    it("should create a new leave request", async () => {
      const mockRequest = {
        id: 1,
        userId: 1,
        leaveType: "annual",
        startDate: new Date(),
        endDate: new Date(),
        reason: "I need to take a vacation for personal reasons",
        status: "pending",
      };

      vi.mocked(db.createLeaveRequest).mockResolvedValue(mockRequest as any);

      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "user" } as any,
      });

      const result = await caller.submitRequest({
        leaveType: "annual",
        startDate: new Date(),
        endDate: new Date(),
        reason: "I need to take a vacation for personal reasons",
      });

      expect(result).toEqual(mockRequest);
      expect(db.createLeaveRequest).toHaveBeenCalled();
    });

    it("should reject if end date is before start date", async () => {
      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "user" } as any,
      });

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);

      await expect(
        caller.submitRequest({
          leaveType: "annual",
          startDate,
          endDate,
          reason: "This is an invalid date range test",
        })
      ).rejects.toThrow();
    });
  });

  describe("getMyRequests", () => {
    it("should return user's leave requests", async () => {
      const mockRequests = [
        {
          id: 1,
          userId: 1,
          leaveType: "annual",
          reason: "I need to take a vacation for personal reasons",
          status: "pending",
        },
        {
          id: 2,
          userId: 1,
          leaveType: "sick",
          reason: "I am feeling sick and need medical attention",
          status: "approved",
        },
      ];

      vi.mocked(db.getLeaveRequests).mockResolvedValue(mockRequests as any);

      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "user" } as any,
      });

      const result = await caller.getMyRequests();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getPendingRequests", () => {
    it("should return all pending leave requests for admin", async () => {
      const mockRequests = [
        {
          id: 1,
          userId: 1,
          leaveType: "annual",
          reason: "I need to take a vacation for personal reasons",
          status: "pending",
        },
      ];

      vi.mocked(db.getLeaveRequests).mockResolvedValue(mockRequests as any);

      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "admin" } as any,
      });

      const result = await caller.getPendingRequests();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should throw error if user is not admin", async () => {
      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "user" } as any,
      });

      await expect(caller.getPendingRequests()).rejects.toThrow();
    });
  });

  describe("approveRequest", () => {
    it("should approve a leave request", async () => {
      const mockRequest = {
        id: 1,
        userId: 1,
        leaveType: "annual",
        reason: "I need to take a vacation for personal reasons",
        status: "approved",
        approvalNotes: "Approved",
      };

      vi.mocked(db.updateLeaveRequest).mockResolvedValue(mockRequest as any);

      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "admin" } as any,
      });

      const result = await caller.approveRequest({
        requestId: 1,
        approvalNotes: "Approved",
      });

      expect(result.status).toBe("approved");
    });

    it("should throw error if user is not admin", async () => {
      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.approveRequest({
          requestId: 1,
          approvalNotes: "Approved",
        })
      ).rejects.toThrow();
    });
  });

  describe("rejectRequest", () => {
    it("should reject a leave request", async () => {
      const mockRequest = {
        id: 1,
        userId: 1,
        leaveType: "annual",
        reason: "I need to take a vacation for personal reasons",
        status: "rejected",
        approvalNotes: "Not approved",
      };

      vi.mocked(db.updateLeaveRequest).mockResolvedValue(mockRequest as any);

      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "admin" } as any,
      });

      const result = await caller.rejectRequest({
        requestId: 1,
        approvalNotes: "Not approved",
      });

      expect(result.status).toBe("rejected");
    });

    it("should throw error if user is not admin", async () => {
      const caller = leaveRouter.createCaller({
        user: { id: 1, role: "user" } as any,
      });

      await expect(
        caller.rejectRequest({
          requestId: 1,
          approvalNotes: "Not approved",
        })
      ).rejects.toThrow();
    });
  });
});
