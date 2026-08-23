import { eq, asc, sql, and } from "drizzle-orm";
import { db } from "../db";
import { categories, products, type NewCategory } from "../db/schema";
import { logActivity } from "./activity.service";

export async function listCategories(opts: { onlyActive?: boolean } = {}) {
  const rows = await db
    .select()
    .from(categories)
    .where(opts.onlyActive ? eq(categories.isActive, true) : undefined)
    .orderBy(asc(categories.sortOrder), asc(categories.id))
    .all();
  return rows;
}

/** Categories with live in-stock / delivered counts, used for bot menus and dashboard */
export async function listCategoriesWithCounts(opts: { onlyActive?: boolean } = {}) {
  const cats = await listCategories(opts);
  const results = [];
  for (const cat of cats) {
    const inStock = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.categoryId, cat.id), eq(products.isDelivered, false)))
      .get();
    const delivered = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.categoryId, cat.id), eq(products.isDelivered, true)))
      .get();
    results.push({
      ...cat,
      inStockCount: inStock?.count ?? 0,
      deliveredCount: delivered?.count ?? 0,
    });
  }
  return results;
}

export async function getCategoryById(id: number) {
  return db.select().from(categories).where(eq(categories.id, id)).get();
}

export async function createCategory(input: NewCategory) {
  const [row] = await db.insert(categories).values(input).returning();
  await logActivity("category_created", { id: row?.id, name: row?.name }, "admin");
  return row;
}

export async function updateCategory(id: number, input: Partial<NewCategory>) {
  const [row] = await db
    .update(categories)
    .set(input)
    .where(eq(categories.id, id))
    .returning();
  await logActivity("category_updated", { id, changes: input }, "admin");
  return row;
}

export async function deleteCategory(id: number) {
  await db.delete(categories).where(eq(categories.id, id));
  await logActivity("category_deleted", { id }, "admin");
}
