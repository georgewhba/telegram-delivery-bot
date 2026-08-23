import { eq, and, like, sql, desc, asc } from "drizzle-orm";
import { db } from "../db";
import { products, categories, type NewProduct, type ContentType } from "../db/schema";
import { logActivity } from "./activity.service";

export interface ProductFilters {
  categoryId?: number;
  status?: "in_stock" | "delivered" | "all";
  contentType?: ContentType;
  search?: string;
  page?: number;
  limit?: number;
}

export async function listProducts(filters: ProductFilters = {}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters.status === "in_stock") conditions.push(eq(products.isDelivered, false));
  if (filters.status === "delivered") conditions.push(eq(products.isDelivered, true));
  if (filters.contentType) conditions.push(eq(products.contentType, filters.contentType));
  if (filters.search) conditions.push(like(products.name, `%${filters.search}%`));

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(products)
    .where(whereClause)
    .orderBy(desc(products.id))
    .limit(limit)
    .offset(offset)
    .all();

  const totalRow = await db.select({ count: sql<number>`count(*)` }).from(products).where(whereClause).get();

  return { rows, total: totalRow?.count ?? 0, page, limit };
}

/** In-stock products for a category, used by the bot catalog (paginated, oldest first = FIFO delivery) */
export async function listInStockByCategory(categoryId: number, page = 1, pageSize = 5) {
  const offset = (page - 1) * pageSize;
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.isDelivered, false)))
    .orderBy(asc(products.id))
    .limit(pageSize)
    .offset(offset)
    .all();

  const totalRow = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.categoryId, categoryId), eq(products.isDelivered, false)))
    .get();

  return { rows, total: totalRow?.count ?? 0 };
}

export async function searchInStockProducts(query: string, limit = 10) {
  return db
    .select({
      id: products.id,
      name: products.name,
      priceLabel: products.priceLabel,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categoryEmoji: categories.emoji,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.isDelivered, false), like(products.name, `%${query}%`)))
    .limit(limit)
    .all();
}

export async function getProductById(id: number) {
  return db.select().from(products).where(eq(products.id, id)).get();
}

export async function createProduct(input: NewProduct) {
  const [row] = await db.insert(products).values(input).returning();
  await logActivity("product_added", { id: row?.id, name: row?.name }, "admin");
  return row;
}

export async function bulkCreateProducts(input: {
  categoryId: number;
  name: string;
  priceLabel: string;
  contentType: ContentType;
  items: string[];
}) {
  const values: NewProduct[] = input.items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((content) => ({
      categoryId: input.categoryId,
      name: input.name,
      priceLabel: input.priceLabel,
      contentType: input.contentType,
      content,
    }));

  if (values.length === 0) return [];

  const inserted = await db.insert(products).values(values).returning();
  await logActivity("bulk_import", { categoryId: input.categoryId, count: inserted.length }, "admin");
  return inserted;
}

export async function updateProduct(id: number, input: Partial<NewProduct>) {
  const [row] = await db.update(products).set(input).where(eq(products.id, id)).returning();
  await logActivity("product_updated", { id, changes: Object.keys(input) }, "admin");
  return row;
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
  await logActivity("product_deleted", { id }, "admin");
}

/**
 * Atomically claim an in-stock product for delivery.
 * Uses a conditional UPDATE so two users tapping "receive" at the same time
 * can never both get the same product (SQLite serializes writes).
 */
export async function claimProductForDelivery(productId: number, userId: number) {
  const result = db
    .update(products)
    .set({
      isDelivered: true,
      deliveredTo: userId,
      deliveredAt: sql`(current_timestamp)`,
    })
    .where(and(eq(products.id, productId), eq(products.isDelivered, false)))
    .run();

  if (result.changes === 0) {
    return null; // already delivered to someone else, or doesn't exist
  }

  return getProductById(productId);
}

export async function countInStockTotal() {
  const row = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isDelivered, false)).get();
  return row?.count ?? 0;
}

export async function countDeliveredTotal() {
  const row = await db.select({ count: sql<number>`count(*)` }).from(products).where(eq(products.isDelivered, true)).get();
  return row?.count ?? 0;
}
