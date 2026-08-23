import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  listCategoriesWithCounts,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/category.service";

export const categoriesRoutes = Router();
categoriesRoutes.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1),
  emoji: z.string().min(1),
  description: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
});

categoriesRoutes.get("/", async (_req, res) => {
  const categories = await listCategoriesWithCounts();
  res.json(categories);
});

categoriesRoutes.post("/", validateBody(createSchema), async (req, res) => {
  const created = await createCategory(req.body);
  res.status(201).json(created);
});

categoriesRoutes.put("/:id", validateBody(updateSchema), async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getCategoryById(id);
  if (!existing) return res.status(404).json({ error: "Category not found" });

  const updated = await updateCategory(id, req.body);
  res.json(updated);
});

categoriesRoutes.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await getCategoryById(id);
  if (!existing) return res.status(404).json({ error: "Category not found" });

  await deleteCategory(id);
  res.status(204).send();
});
