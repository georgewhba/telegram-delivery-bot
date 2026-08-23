import type { ContentType, Product } from "../db/schema";
import { CONTENT_TYPE_LABELS } from "./keyboards";

export function formatDateArabic(iso: string): string {
  const date = new Date(iso.replace(" ", "T") + "Z");
  return date.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export function welcomeMessage(firstName: string): string {
  return `مرحبًا ${firstName}! 👋\nأهلاً بك في متجرنا الإلكتروني.\nاختر من القائمة:`;
}

export function categoriesHeaderMessage(): string {
  return "📂 الأقسام المتاحة:";
}

export function emptyCategoryMessage(): string {
  return "😔 عذرًا، لا توجد منتجات متاحة حاليًا في هذا القسم.\nسيتم إخطارك عند توفر منتجات جديدة.";
}

export function productListMessage(
  categoryEmoji: string,
  categoryName: string,
  products: { name: string; priceLabel: string }[],
  page: number,
  total: number
): string {
  const lines = products.map((p, i) => `${(page - 1) * 5 + i + 1}. ${p.name} — ${p.priceLabel}`);
  return `${categoryEmoji} ${categoryName}\n\n${lines.join("\n")}\n\nالمتاح: ${total} منتج`;
}

export function productDetailMessage(product: { name: string; priceLabel: string }): string {
  return `🎮 ${product.name}\n💰 السعر: ${product.priceLabel}\n📦 متاح في المخزون`;
}

export function deliveredContentBlock(product: Product): string {
  switch (product.contentType) {
    case "code":
      return `🔑 الكود: ${product.content}`;
    case "link":
      return `🔗 الرابط: ${product.content}`;
    case "account": {
      const [username, ...rest] = product.content.split(":");
      const password = rest.join(":");
      return `👤 اليوزر: ${username}\n🔒 الباسورد: ${password || "—"}`;
    }
    case "file":
      return ""; // file is sent separately via sendDocument using content as file_id
  }
}

export function deliverySuccessMessage(product: Product): string {
  const body = deliveredContentBlock(product);
  return `✅ تم التسليم بنجاح!\n🎮 ${product.name}\n${body}\n\nشكرًا لك! 🙏`;
}

export function alreadyDeliveredMessage(): string {
  return "عذرًا، تم بيع هذا المنتج 😔\nجرّب منتج آخر من نفس القسم.";
}

export function cooldownMessage(): string {
  return "⏳ من فضلك انتظر لحظات قبل الضغط مرة أخرى.";
}

export function myOrdersMessage(
  orders: { productName: string; deliveredAt: string; categoryEmoji?: string }[]
): string {
  if (orders.length === 0) {
    return "📦 لا يوجد لديك طلبات سابقة حتى الآن.\nتصفح المنتجات وابدأ أول طلب لك!";
  }
  const lines = orders.map(
    (o, i) => `${i + 1}. ${o.categoryEmoji ?? "🛍️"} ${o.productName} — ${formatDateArabic(o.deliveredAt)}`
  );
  return `📦 طلباتك السابقة:\n${lines.join("\n")}\n\nالإجمالي: ${orders.length} منتج`;
}

export function contactMessage(): string {
  return "📞 للتواصل معنا، راسلنا مباشرة وسيتم الرد عليك في أقرب وقت.";
}

export function searchPromptMessage(): string {
  return "🔍 اكتب اسم المنتج اللي بتدور عليه:";
}

export function searchResultsMessage(results: { name: string; priceLabel: string; categoryEmoji: string }[]): string {
  if (results.length === 0) {
    return "😔 لم يتم العثور على منتجات مطابقة.\nجرّب كلمة بحث مختلفة.";
  }
  const lines = results.map((r, i) => `${i + 1}. ${r.categoryEmoji} ${r.name} — ${r.priceLabel}`);
  return `🔍 نتائج البحث:\n\n${lines.join("\n")}`;
}

export function adminPanelMessage(): string {
  return "⚙️ لوحة التحكم";
}

export function stockMessage(
  categories: { emoji: string; name: string; inStockCount: number }[],
  totalInStock: number,
  totalDelivered: number
): string {
  const lines = categories.map((c) => `${c.emoji} ${c.name}: ${c.inStockCount} متاح`);
  return `📦 المخزون الحالي:\n${lines.join("\n")}\n\nالإجمالي: ${totalInStock} منتج متاح\nالمُسلّم: ${totalDelivered} منتج`;
}

export function statsMessage(stats: {
  todayNewUsers: number;
  todayDeliveries: number;
  totalUsers: number;
  totalDeliveries: number;
  weekDeliveries: number;
  weekNewUsers: number;
}): string {
  return (
    `📊 إحصائيات اليوم:\n` +
    `👥 مستخدمين جدد: ${stats.todayNewUsers}\n` +
    `📦 تسليمات: ${stats.todayDeliveries}\n` +
    `📈 إجمالي المستخدمين: ${stats.totalUsers}\n` +
    `📈 إجمالي التسليمات: ${stats.totalDeliveries}\n\n` +
    `آخر 7 أيام:\n` +
    `📦 تسليمات: ${stats.weekDeliveries}\n` +
    `👥 مستخدمين جدد: ${stats.weekNewUsers}`
  );
}

export function deliveryAdminNotification(
  productName: string,
  username: string | null,
  telegramId: number,
  categoryName: string,
  remaining: number
): string {
  const who = username ? `@${username}` : "بدون يوزرنيم";
  const now = new Date();
  return (
    `🔔 تم تسليم منتج\n` +
    `📦 ${productName}\n` +
    `👤 ${who} (ID: ${telegramId})\n` +
    `📂 ${categoryName}\n` +
    `⏰ ${now.toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })} — ${now.toLocaleTimeString(
      "ar-EG",
      { hour: "2-digit", minute: "2-digit" }
    )}\n` +
    `📊 المتبقي في القسم: ${remaining}`
  );
}

export const CONTENT_TYPE_ARABIC = CONTENT_TYPE_LABELS;
