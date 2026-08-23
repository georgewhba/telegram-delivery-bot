import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { CONTENT_TYPES } from "../../db/schema";
import {
  listProducts,
  getProductById,
  createProduct,
  bulkCreateProducts,
  updateProduct,
  deleteProduct,
} from "../../services/product.service";

export const productsRoutes = Router();
productsRoutes.use(requireAuth);

const contentTypeEnum = z.enum(CONTENT_TYPES);

const createSchema = z.object({
  categoryId: z.number().int(),
  name: z.string().min(1),
  description: z.string().optional(),
  content: z.string().min(1),
  contentType: contentTypeEnum,
  priceLabel: z.string().min(1),
});

const bulkSchema = z.object({
  categoryId: z.number().int(),
  name: z.string().min(1),
  priceLabel: z.string().min(1),
  contentType: contentTypeEnum,
  items: z.array(z.string().min(1)).min(1),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  contentType: contentTypeEnum.optional(),
  priceLabel: z.string().min(1).optional(),
  categoryId: z.number().int().optional(),
});

productsRoutes.get("/", async (req, res) => {
  const { category_id, status, type, search, page, limit } = req.query;
  const result = await listProducts({
    categoryId: category_id ? Number(category_id) : undefined,
    status: (status as "in_stock" | "delivered" | "all" | undefined) ?? undefined,
    contentType: type ? (type as (typeof CONTENT_TYPES)[number]) : undefined,
    search: search ? String(search) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
});

productsRoutes.post("/", validateBody(createSchema), async (req, res) => {
  const created = await createProduct(req.body);
  res.status(201).json(created);
});

productsRoutes.post("/bulk", validateBody(bulkSchema), async (req, res) => {
  const created = await bulkCreateProducts(req.body);
  res.status(201).json({ count: created.length, products: created });
});

productsRoutes.put("/:id", validateBody(updateSchema), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getProductById(id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const updated = await updateProduct(id, req.body);
  res.json(updated);
});

productsRoutes.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getProductById(id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  await deleteProduct(id);
  res.status(204).send();
});
