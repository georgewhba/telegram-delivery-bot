import { desc } from "drizzle-orm";
import { db } from "../db";
import { activityLog, type ActivityAction } from "../db/schema";

export async function logActivity(
  action: ActivityAction,
  details: Record<string, unknown>,
  performedBy: "admin" | "bot" | "system" = "system"
) {
  await db.insert(activityLog).values({
    action,
    details: JSON.stringify(details),
    performedBy,
  });
}

export async function recentActivity(limit = 20) {
  return db.select().from(activityLog).orderBy(desc(activityLog.id)).limit(limit).all();
}
