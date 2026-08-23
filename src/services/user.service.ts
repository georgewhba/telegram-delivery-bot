import { eq, like, or, sql, desc } from "drizzle-orm";
import { db } from "../db";
import { users, deliveries, type NewUser } from "../db/schema";
import { logActivity } from "./activity.service";

interface TelegramUserInfo {
  telegramId: number;
  username?: string | null;
  firstName: string;
  lastName?: string | null;
}

/** Upsert a user record on every interaction, updating last_seen. Returns whether this was a new user. */
export async function touchUser(info: TelegramUserInfo): Promise<{ user: typeof users.$inferSelect; isNew: boolean }> {
  const existing = await db.select().from(users).where(eq(users.telegramId, info.telegramId)).get();

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        username: info.username ?? existing.username,
        firstName: info.firstName,
        lastName: info.lastName ?? existing.lastName,
        lastSeen: sql`(current_timestamp)`,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return { user: updated!, isNew: false };
  }

  const [created] = await db
    .insert(users)
    .values({
      telegramId: info.telegramId,
      username: info.username ?? null,
      firstName: info.firstName,
      lastName: info.lastName ?? null,
    } satisfies NewUser)
    .returning();
  return { user: created!, isNew: true };
}

export async function getUserByTelegramId(telegramId: number) {
  return db.select().from(users).where(eq(users.telegramId, telegramId)).get();
}

export async function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

export async function listUsers(opts: { search?: string; page?: number; limit?: number } = {}) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const offset = (page - 1) * limit;

  const whereClause = opts.search
    ? or(
        like(users.username, `%${opts.search}%`),
        like(users.firstName, `%${opts.search}%`),
        like(users.lastName, `%${opts.search}%`)
      )
    : undefined;

  const rows = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.lastSeen))
    .limit(limit)
    .offset(offset)
    .all();

  const totalRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(whereClause)
    .get();

  return { rows, total: totalRow?.count ?? 0, page, limit };
}

export async function setUserBlocked(id: number, isBlocked: boolean) {
  const [row] = await db.update(users).set({ isBlocked }).where(eq(users.id, id)).returning();
  await logActivity(isBlocked ? "user_blocked" : "user_unblocked", { userId: id }, "admin");
  return row;
}

export async function getUserDeliveries(userId: number) {
  return db.select().from(deliveries).where(eq(deliveries.userId, userId)).orderBy(desc(deliveries.id)).all();
}

export async function incrementTotalReceived(userId: number) {
  await db
    .update(users)
    .set({ totalReceived: sql`${users.totalReceived} + 1` })
    .where(eq(users.id, userId));
}

export async function countAllUsers() {
  const row = await db.select({ count: sql<number>`count(*)` }).from(users).get();
  return row?.count ?? 0;
}

export async function countNewUsersSince(isoDate: string) {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(sql`${users.firstSeen} >= ${isoDate}`)
    .get();
  return row?.count ?? 0;
}

export async function listNonBlockedTelegramIds(): Promise<number[]> {
  const rows = await db.select({ telegramId: users.telegramId }).from(users).where(eq(users.isBlocked, false)).all();
  return rows.map((r) => r.telegramId);
}
