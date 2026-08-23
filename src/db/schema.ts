import { sql } from "drizzle-orm";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

/** Content types a product can be delivered as */
export const CONTENT_TYPES = ["code", "file", "link", "account"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("📦"),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  contentType: text("content_type", { enum: CONTENT_TYPES }).notNull(),
  priceLabel: text("price_label").notNull(),
  isDelivered: integer("is_delivered", { mode: "boolean" }).notNull().default(false),
  deliveredTo: integer("delivered_to").references(() => users.id),
  deliveredAt: text("delivered_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  telegramId: integer("telegram_id").notNull().unique(),
  username: text("username"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  isBlocked: integer("is_blocked", { mode: "boolean" }).notNull().default(false),
  totalReceived: integer("total_received").notNull().default(0),
  firstSeen: text("first_seen")
    .notNull()
    .default(sql`(current_timestamp)`),
  lastSeen: text("last_seen")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const deliveries = sqliteTable("deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  productName: text("product_name").notNull(),
  categoryName: text("category_name").notNull(),
  contentType: text("content_type", { enum: CONTENT_TYPES }).notNull(),
  deliveredAt: text("delivered_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const ACTIVITY_ACTIONS = [
  "product_added",
  "product_delivered",
  "category_created",
  "category_updated",
  "category_deleted",
  "product_updated",
  "product_deleted",
  "user_blocked",
  "user_unblocked",
  "bulk_import",
  "broadcast_sent",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const activityLog = sqliteTable("activity_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action", { enum: ACTIVITY_ACTIONS }).notNull(),
  details: text("details").notNull().default("{}"),
  performedBy: text("performed_by", { enum: ["admin", "bot", "system"] })
    .notNull()
    .default("system"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type Delivery = typeof deliveries.$inferSelect;
export type NewDelivery = typeof deliveries.$inferInsert;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
