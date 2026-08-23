import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardStats } from "../../services/stats.service";

export const dashboardRoutes = Router();

dashboardRoutes.use(requireAuth);

dashboardRoutes.get("/stats", async (_req, res) => {
  const stats = await getDashboardStats();
  res.json(stats);
});
