import { Router } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../../db";
import { admins } from "../../db/schema";
import { signToken, requireAuth, type AuthedRequest } from "../middleware/auth";
import { validateBody, rateLimit } from "../middleware/validate";

export const authRoutes = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRoutes.post(
  "/login",
  rateLimit({ windowMs: 60_000, max: 5 }),
  validateBody(loginSchema),
  async (req, res) => {
    const { username, password } = req.body as z.infer<typeof loginSchema>;

    const admin = await db.select().from(admins).where(eq(admins.username, username)).get();
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const token = signToken({ adminId: admin.id, username: admin.username });
    res.json({ token, admin: { id: admin.id, username: admin.username } });
  }
);

authRoutes.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ admin: req.admin });
});
