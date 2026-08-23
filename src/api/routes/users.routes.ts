import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { listUsers, getUserById, setUserBlocked, getUserDeliveries } from "../../services/user.service";

export const usersRoutes = Router();
usersRoutes.use(requireAuth);

usersRoutes.get("/", async (req, res) => {
  const { search, page, limit } = req.query;
  const result = await listUsers({
    search: search ? String(search) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
});

usersRoutes.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const user = await getUserById(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const deliveries = await getUserDeliveries(id);
  res.json({ ...user, deliveries });
});

const blockSchema = z.object({ is_blocked: z.boolean() });

usersRoutes.put("/:id/block", validateBody(blockSchema), async (req, res) => {
  const id = Number(req.params.id);
  const user = await getUserById(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const updated = await setUserBlocked(id, (req.body as z.infer<typeof blockSchema>).is_blocked);
  res.json(updated);
});
