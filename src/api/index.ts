import path from "node:path";
import express from "express";
import cors from "cors";
import { env } from "../env";
import { authRoutes } from "./routes/auth.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";
import { categoriesRoutes } from "./routes/categories.routes";
import { productsRoutes } from "./routes/products.routes";
import { deliveriesRoutes } from "./routes/deliveries.routes";
import { usersRoutes } from "./routes/users.routes";

export function createApiApp() {
  const app = express();

  app.use(
    cors({
      origin: env.DASHBOARD_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/categories", categoriesRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/deliveries", deliveriesRoutes);
  app.use("/api/users", usersRoutes);

  // Serve the built React dashboard (npm run build) in production
  const dashboardDist = path.resolve(process.cwd(), "dashboard/dist");
  app.use(express.static(dashboardDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(dashboardDist, "index.html"), (err) => {
      if (err) next();
    });
  });

  // Centralized error handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("❌ API error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
