import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, attendanceRecords, leaveRequests, attendanceSummary } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "phone", "department", "position", "profilePhotoUrl"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEmployees(status?: 'active' | 'inactive') {
  const db = await getDb();
  if (!db) return [];

  const conditions = status ? [eq(users.status, status)] : [];
  const result = await db.select().from(users).where(and(...conditions)).orderBy(asc(users.name));
  return result;
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return null;

  await db.update(users).set(data).where(eq(users.id, id));
  return getUserById(id);
}

export async function createAttendanceRecord(data: any) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(attendanceRecords).values(data);
  return result;
}

export async function getAttendanceByUserAndDate(userId: number, date: Date) {
  const db = await getDb();
  if (!db) return null;

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.attendanceDate, startOfDay),
        lte(attendanceRecords.attendanceDate, endOfDay)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateAttendanceRecord(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;

  await db.update(attendanceRecords).set(data).where(eq(attendanceRecords.id, id));
  const result = await db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getAttendanceHistory(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        eq(attendanceRecords.userId, userId),
        gte(attendanceRecords.attendanceDate, startDate),
        lte(attendanceRecords.attendanceDate, endDate)
      )
    )
    .orderBy(desc(attendanceRecords.attendanceDate));

  return result;
}

export async function createLeaveRequest(data: any) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(leaveRequests).values(data);
  return result;
}

export async function getLeaveRequests(userId?: number, status?: 'pending' | 'approved' | 'rejected') {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (userId) conditions.push(eq(leaveRequests.userId, userId));
  if (status) conditions.push(eq(leaveRequests.status, status));

  const result = await db
    .select()
    .from(leaveRequests)
    .where(and(...conditions))
    .orderBy(desc(leaveRequests.createdAt));

  return result;
}

export async function updateLeaveRequest(id: number, data: any) {
  const db = await getDb();
  if (!db) return null;

  await db.update(leaveRequests).set(data).where(eq(leaveRequests.id, id));
  const result = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getTodayAttendanceStats() {
  const db = await getDb();
  if (!db) return { total: 0, present: 0, absent: 0, late: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const records = await db
    .select()
    .from(attendanceRecords)
    .where(
      and(
        gte(attendanceRecords.attendanceDate, today),
        lte(attendanceRecords.attendanceDate, tomorrow)
      )
    );

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length,
  };

  return stats;
}
