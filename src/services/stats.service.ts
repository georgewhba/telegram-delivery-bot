import { countInStockTotal, countDeliveredTotal } from "./product.service";
import { countAllUsers, countNewUsersSince } from "./user.service";
import { countAllDeliveries, countDeliveriesSince, recentDeliveries } from "./delivery.service";
import { listCategoriesWithCounts } from "./category.service";

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD, string-comparable against ISO timestamps
}

export async function getDashboardStats() {
  const [
    totalInStock,
    totalDelivered,
    totalUsers,
    todayNewUsers,
    weekNewUsers,
    totalDeliveries,
    todayDeliveries,
    weekDeliveries,
    categoryStats,
    recent,
  ] = await Promise.all([
    countInStockTotal(),
    countDeliveredTotal(),
    countAllUsers(),
    countNewUsersSince(daysAgoIso(0)),
    countNewUsersSince(daysAgoIso(7)),
    countAllDeliveries(),
    countDeliveriesSince(daysAgoIso(0)),
    countDeliveriesSince(daysAgoIso(7)),
    listCategoriesWithCounts(),
    recentDeliveries(10),
  ]);

  return {
    totalProducts: totalInStock + totalDelivered,
    totalInStock,
    totalDelivered,
    totalUsers,
    todayNewUsers,
    weekNewUsers,
    totalDeliveries,
    todayDeliveries,
    weekDeliveries,
    activeCategories: categoryStats.filter((c) => c.isActive).length,
    emptyCategories: categoryStats.filter((c) => c.inStockCount === 0).length,
    categoryStats,
    recentDeliveries: recent,
  };
}
