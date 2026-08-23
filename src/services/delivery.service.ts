import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { deliveries, categories, users, type Product } from "../db/schema";
import { incrementTotalReceived } from "./user.service";
import { logActivity } from "./activity.service";

/**
 * Records a delivery row as a snapshot (product/category name at time of delivery)
 * so history stays accurate even if the product is later edited or deleted.
 */
export async function recordDelivery(product: Product, userId: number) {
  const category = await db.select().from(categories).where(eq(categories.id, product.categoryId)).get();

  const [row] = await db
    .insert(deliveries)
    .values({
      productId: product.id,
      userId,
      productName: product.name,
      categoryName: category?.name ?? "غير معروف",
      contentType: product.contentType,
    })
    .returning();

  await incrementTotalReceived(userId);
  await logActivity("product_delivered", { productId: product.id, userId }, "bot");

  return row;
}

export interface DeliveryFilters {
  categoryName?: string;
  userId?: number;
  from?: string; // ISO date
  to?: string; // ISO date
  page?: number;
  limit?: number;
}

function buildDeliveryWhere(filters: DeliveryFilters) {
  const conditions = [];
  if (filters.categoryName) conditions.push(eq(deliveries.categoryName, filters.categoryName));
  if (filters.userId) conditions.push(eq(deliveries.userId, filters.userId));
  if (filters.from) conditions.push(gte(deliveries.deliveredAt, filters.from));
  if (filters.to) conditions.push(lte(deliveries.deliveredAt, filters.to));
  return conditions.length ? and(...conditions) : undefined;
}

export async function listDeliveries(filters: DeliveryFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;
  const whereClause = buildDeliveryWhere(filters);

  const rows = await db
    .select({
      id: deliveries.id,
      productName: deliveries.productName,
      categoryName: deliveries.categoryName,
      contentType: deliveries.contentType,
      deliveredAt: deliveries.deliveredAt,
      userId: deliveries.userId,
      telegramId: users.telegramId,
      username: users.username,
      firstName: users.firstName,
    })
    .from(deliveries)
    .innerJoin(users, eq(deliveries.userId, users.id))
    .where(whereClause)
    .orderBy(desc(deliveries.id))
    .limit(limit)
    .offset(offset)
    .all();

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(deliveries).where(whereClause).get();

  return { rows, total: totalRow?.count ?? 0, page, limit };
}

export async function listDeliveriesForExport(filters: DeliveryFilters = {}) {
  const whereClause = buildDeliveryWhere(filters);
  return db
    .select({
      id: deliveries.id,
      productName: deliveries.productName,
      categoryName: deliveries.categoryName,
      contentType: deliveries.contentType,
      deliveredAt: deliveries.deliveredAt,
      telegramId: users.telegramId,
      username: users.username,
      firstName: users.firstName,
    })
    .from(deliveries)
    .innerJoin(users, eq(deliveries.userId, users.id))
    .where(whereClause)
    .orderBy(desc(deliveries.id))
    .all();
}

export async function countDeliveriesSince(isoDate: string) {
  const row = await db
    .select({ count: sql<number>`count(*)` })
    .from(deliveries)
    .where(gte(deliveries.deliveredAt, isoDate))
    .get();
  return row?.count ?? 0;
}

export async function countAllDeliveries() {
  const row = await db.select({ count: sql<number>`count(*)` }).from(deliveries).get();
  return row?.count ?? 0;
}

export async function recentDeliveries(limit = 10) {
  return db
    .select({
      id: deliveries.id,
      productName: deliveries.productName,
      categoryName: deliveries.categoryName,
      deliveredAt: deliveries.deliveredAt,
      username: users.username,
      firstName: users.firstName,
    })
    .from(deliveries)
    .innerJoin(users, eq(deliveries.userId, users.id))
    .orderBy(desc(deliveries.id))
    .limit(limit)
    .all();
}
