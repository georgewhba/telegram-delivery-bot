import { InlineKeyboard } from "grammy";
import type { ContentType } from "../db/schema";

export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🛍️ تصفح المنتجات", "menu:browse")
    .row()
    .text("🔍 بحث عن منتج", "menu:search")
    .row()
    .text("📦 طلباتي", "menu:orders")
    .row()
    .text("📞 تواصل معنا", "menu:contact");
}

export function categoriesKeyboard(
  categories: { id: number; name: string; emoji: string; inStockCount: number }[]
): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const cat of categories) {
    kb.text(`${cat.emoji} ${cat.name} (${cat.inStockCount} منتج)`, `cat:${cat.id}:1`).row();
  }
  kb.text("🔙 القائمة الرئيسية", "menu:main");
  return kb;
}

export function productListKeyboard(
  categoryId: number,
  page: number,
  products: { id: number; name: string }[],
  hasNext: boolean
): InlineKeyboard {
  const kb = new InlineKeyboard();
  const numberEmojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
  products.forEach((p, i) => {
    kb.text(`${numberEmojis[i] ?? i + 1} ${p.name}`, `product:${p.id}`).row();
  });

  const navRow: [string, string][] = [];
  if (page > 1) navRow.push(["◀️ السابق", `cat:${categoryId}:${page - 1}`]);
  if (hasNext) navRow.push(["التالي ▶️", `cat:${categoryId}:${page + 1}`]);
  if (navRow.length) {
    for (const [label, data] of navRow) kb.text(label, data);
    kb.row();
  }

  kb.text("🔙 الأقسام", "menu:browse");
  return kb;
}

export function productDetailKeyboard(productId: number, categoryId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text("✅ استلام المنتج", `claim:${productId}`)
    .row()
    .text("🔙 رجوع", `cat:${categoryId}:1`);
}

export function afterDeliveryKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🛍️ تصفح المزيد", "menu:browse")
    .row()
    .text("📂 القائمة الرئيسية", "menu:main");
}

export function backToCategoriesKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text("🔙 الأقسام", "menu:browse");
}

export function adminPanelKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("📊 الإحصائيات", "admin:stats")
    .row()
    .text("➕ إضافة منتج", "admin:add")
    .row()
    .text("📦 إضافة منتجات بالجملة", "admin:bulk")
    .row()
    .text("📂 إدارة الأقسام", "admin:categories")
    .row()
    .text("📋 المخزون", "admin:stock")
    .row()
    .text("📢 رسالة جماعية", "admin:broadcast");
}

export function categoryPickerKeyboard(
  categories: { id: number; name: string; emoji: string }[],
  callbackPrefix: string
): InlineKeyboard {
  const kb = new InlineKeyboard();
  for (const cat of categories) {
    kb.text(`${cat.emoji} ${cat.name}`, `${callbackPrefix}:${cat.id}`).row();
  }
  kb.text("❌ إلغاء", "admin:cancel");
  return kb;
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  code: "🔑 كود",
  file: "📁 ملف",
  link: "🔗 رابط",
  account: "👤 حساب",
};

export function contentTypeKeyboard(callbackPrefix: string): InlineKeyboard {
  const kb = new InlineKeyboard();
  (Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][]).forEach(([type, label], i) => {
    kb.text(label, `${callbackPrefix}:${type}`);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

export function confirmKeyboard(yesData: string, noData: string): InlineKeyboard {
  return new InlineKeyboard().text("✅ نعم", yesData).text("❌ لا", noData);
}

export { CONTENT_TYPE_LABELS };
