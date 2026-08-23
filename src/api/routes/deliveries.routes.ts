import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { listDeliveries, listDeliveriesForExport } from "../../services/delivery.service";

export const deliveriesRoutes = Router();
deliveriesRoutes.use(requireAuth);

deliveriesRoutes.get("/", async (req, res) => {
  const { category, user, from, to, page, limit } = req.query;
  const result = await listDeliveries({
    categoryName: category ? String(category) : undefined,
    userId: user ? Number(user) : undefined,
    from: from ? String(from) : undefined,
    to: to ? String(to) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
});

function csvEscape(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

deliveriesRoutes.get("/export", async (req, res) => {
  const { category, user, from, to } = req.query;
  const rows = await listDeliveriesForExport({
    categoryName: category ? String(category) : undefined,
    userId: user ? Number(user) : undefined,
    from: from ? String(from) : undefined,
    to: to ? String(to) : undefined,
  });

  const header = ["ID", "Product", "Category", "Content Type", "Telegram ID", "Username", "First Name", "Delivered At"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.productName,
        r.categoryName,
        r.contentType,
        r.telegramId,
        r.username ?? "",
        r.firstName,
        r.deliveredAt,
      ]
        .map(csvEscape)
        .join(",")
    );
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="deliveries-${Date.now()}.csv"`);
  // BOM so Excel opens Arabic text correctly
  res.send("\uFEFF" + lines.join("\n"));
});
