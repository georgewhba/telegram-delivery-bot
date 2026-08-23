import { Composer, InlineKeyboard } from "grammy";
import type { Conversation } from "@grammyjs/conversations";
import type { BotContext } from "../context";
import { requireAdmin } from "../middleware/auth";
import {
  listCategories,
  listCategoriesWithCounts,
  createCategory,
} from "../../services/category.service";
import { createProduct, bulkCreateProducts, countInStockTotal, countDeliveredTotal } from "../../services/product.service";
import { countAllUsers, countNewUsersSince, listNonBlockedTelegramIds } from "../../services/user.service";
import { countAllDeliveries, countDeliveriesSince } from "../../services/delivery.service";
import {
  adminPanelKeyboard,
  categoryPickerKeyboard,
  contentTypeKeyboard,
  confirmKeyboard,
} from "../keyboards";
import { adminPanelMessage, stockMessage, statsMessage } from "../formatters";
import type { ContentType } from "../../db/schema";

export const adminHandler = new Composer<BotContext>();
adminHandler.use(requireAdmin);

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// /admin panel
// ---------------------------------------------------------------------------
adminHandler.command("admin", async (ctx) => {
  await ctx.reply(adminPanelMessage(), { reply_markup: adminPanelKeyboard() });
});

adminHandler.callbackQuery("admin:panel", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(adminPanelMessage(), { reply_markup: adminPanelKeyboard() });
});

// ---------------------------------------------------------------------------
// /stats
// ---------------------------------------------------------------------------
async function sendStats(ctx: BotContext, edit: boolean) {
  const [todayNewUsers, todayDeliveries, totalUsers, totalDeliveries, weekDeliveries, weekNewUsers] =
    await Promise.all([
      countNewUsersSince(daysAgoIso(0)),
      countDeliveriesSince(daysAgoIso(0)),
      countAllUsers(),
      countAllDeliveries(),
      countDeliveriesSince(daysAgoIso(7)),
      countNewUsersSince(daysAgoIso(7)),
    ]);

  const text = statsMessage({ todayNewUsers, todayDeliveries, totalUsers, totalDeliveries, weekDeliveries, weekNewUsers });
  const kb = new InlineKeyboard().text("🔙 لوحة التحكم", "admin:panel");

  if (edit) await ctx.editMessageText(text, { reply_markup: kb });
  else await ctx.reply(text, { reply_markup: kb });
}

adminHandler.command("stats", (ctx) => sendStats(ctx, false));
adminHandler.callbackQuery("admin:stats", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendStats(ctx, true);
});

// ---------------------------------------------------------------------------
// /stock
// ---------------------------------------------------------------------------
async function sendStock(ctx: BotContext, edit: boolean) {
  const [categories, totalInStock, totalDelivered] = await Promise.all([
    listCategoriesWithCounts(),
    countInStockTotal(),
    countDeliveredTotal(),
  ]);
  const text = stockMessage(categories, totalInStock, totalDelivered);
  const kb = new InlineKeyboard().text("🔙 لوحة التحكم", "admin:panel");
  if (edit) await ctx.editMessageText(text, { reply_markup: kb });
  else await ctx.reply(text, { reply_markup: kb });
}

adminHandler.command("stock", (ctx) => sendStock(ctx, false));
adminHandler.callbackQuery("admin:stock", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendStock(ctx, true);
});

// ---------------------------------------------------------------------------
// /add — add a single product (conversation)
// ---------------------------------------------------------------------------
export async function addProductConversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  const categories = await conversation.external(() => listCategories({ onlyActive: true }));
  if (categories.length === 0) {
    await ctx.reply("لا توجد أقسام بعد. أنشئ قسمًا أولًا من «📂 إدارة الأقسام».");
    return;
  }

  await ctx.reply("اختر القسم:", { reply_markup: categoryPickerKeyboard(categories, "addcat") });
  const catCtx = await conversation.waitForCallbackQuery(/^addcat:(\d+)$/);
  await catCtx.answerCallbackQuery();
  const categoryId = Number(catCtx.match[1]);

  await ctx.reply("اكتب اسم المنتج:");
  const nameCtx = await conversation.waitFor("message:text");
  const name = nameCtx.message.text.trim();

  await ctx.reply("اكتب السعر (للعرض فقط):");
  const priceCtx = await conversation.waitFor("message:text");
  const priceLabel = priceCtx.message.text.trim();

  await ctx.reply("اختر نوع المحتوى:", { reply_markup: contentTypeKeyboard("addtype") });
  const typeCtx = await conversation.waitForCallbackQuery(/^addtype:(code|file|link|account)$/);
  await typeCtx.answerCallbackQuery();
  const contentType = typeCtx.match[1] as ContentType;

  let content: string;
  if (contentType === "file") {
    await ctx.reply("ابعت الملف:");
    const fileCtx = await conversation.waitFor("message:document");
    content = fileCtx.message.document.file_id;
  } else {
    await ctx.reply("اكتب المحتوى (الكود / الرابط / اليوزر:الباسورد):");
    const contentCtx = await conversation.waitFor("message:text");
    content = contentCtx.message.text.trim();
  }

  await conversation.external(() => createProduct({ categoryId, name, priceLabel, contentType, content }));
  await ctx.reply("✅ تم إضافة المنتج بنجاح!", { reply_markup: adminPanelKeyboard() });
}

adminHandler.command("add", (ctx) => ctx.conversation.enter("addProductConversation"));
adminHandler.callbackQuery("admin:add", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("addProductConversation");
});

// ---------------------------------------------------------------------------
// /bulk — bulk import products (conversation)
// ---------------------------------------------------------------------------
export async function bulkImportConversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  const categories = await conversation.external(() => listCategories({ onlyActive: true }));
  if (categories.length === 0) {
    await ctx.reply("لا توجد أقسام بعد. أنشئ قسمًا أولًا من «📂 إدارة الأقسام».");
    return;
  }

  await ctx.reply("اختر القسم:", { reply_markup: categoryPickerKeyboard(categories, "bulkcat") });
  const catCtx = await conversation.waitForCallbackQuery(/^bulkcat:(\d+)$/);
  await catCtx.answerCallbackQuery();
  const categoryId = Number(catCtx.match[1]);
  const category = categories.find((c) => c.id === categoryId)!;

  await ctx.reply("اختر نوع المحتوى:", { reply_markup: contentTypeKeyboard("bulktype") });
  const typeCtx = await conversation.waitForCallbackQuery(/^bulktype:(code|file|link|account)$/);
  await typeCtx.answerCallbackQuery();
  const contentType = typeCtx.match[1] as ContentType;

  await ctx.reply("اكتب اسم المنتج:");
  const nameCtx = await conversation.waitFor("message:text");
  const name = nameCtx.message.text.trim();

  await ctx.reply("اكتب السعر:");
  const priceCtx = await conversation.waitFor("message:text");
  const priceLabel = priceCtx.message.text.trim();

  await ctx.reply("ابعت الأكواد/الروابط — كل واحد في سطر جديد:");
  const itemsCtx = await conversation.waitFor("message:text");
  const items = itemsCtx.message.text.split("\n").map((l) => l.trim()).filter(Boolean);

  const inserted = await conversation.external(() =>
    bulkCreateProducts({ categoryId, name, priceLabel, contentType, items })
  );

  await ctx.reply(`✅ تم إضافة ${inserted.length} منتجات في قسم ${category.name}`, {
    reply_markup: adminPanelKeyboard(),
  });
}

adminHandler.command("bulk", (ctx) => ctx.conversation.enter("bulkImportConversation"));
adminHandler.callbackQuery("admin:bulk", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("bulkImportConversation");
});

// ---------------------------------------------------------------------------
// 📂 إدارة الأقسام — quick category list + add-category conversation
// ---------------------------------------------------------------------------
adminHandler.callbackQuery("admin:categories", async (ctx) => {
  await ctx.answerCallbackQuery();
  const categories = await listCategoriesWithCounts();
  const lines = categories.length
    ? categories.map((c) => `${c.emoji} ${c.name} — ${c.inStockCount} متاح${c.isActive ? "" : " (مخفي)"}`)
    : ["لا توجد أقسام بعد."];

  const kb = new InlineKeyboard()
    .text("➕ إضافة قسم", "admin:addcategory")
    .row()
    .text("🔙 لوحة التحكم", "admin:panel");

  await ctx.editMessageText(
    `📂 إدارة الأقسام:\n\n${lines.join("\n")}\n\nللتعديل أو الحذف أو إعادة الترتيب، استخدم لوحة الويب.`,
    { reply_markup: kb }
  );
});

export async function addCategoryConversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  await ctx.reply("اكتب اسم القسم:");
  const nameCtx = await conversation.waitFor("message:text");
  const name = nameCtx.message.text.trim();

  await ctx.reply("ابعت الإيموجي المناسب للقسم (مثال: 🎮):");
  const emojiCtx = await conversation.waitFor("message:text");
  const emoji = emojiCtx.message.text.trim();

  await conversation.external(() => createCategory({ name, emoji }));
  await ctx.reply(`✅ تم إنشاء القسم ${emoji} ${name}`, { reply_markup: adminPanelKeyboard() });
}

adminHandler.callbackQuery("admin:addcategory", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("addCategoryConversation");
});

// ---------------------------------------------------------------------------
// /broadcast — send a message to every non-blocked user (conversation)
// ---------------------------------------------------------------------------
export async function broadcastConversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  await ctx.reply("اكتب الرسالة اللي عايز تبعتها لكل المستخدمين:");
  const msgCtx = await conversation.waitFor("message:text");
  const text = msgCtx.message.text;

  const ids = await conversation.external(() => listNonBlockedTelegramIds());

  await ctx.reply(`هل أنت متأكد؟ سيتم الإرسال إلى ${ids.length} مستخدم`, {
    reply_markup: confirmKeyboard("broadcast:yes", "broadcast:no"),
  });
  const confirmCtx = await conversation.waitForCallbackQuery(/^broadcast:(yes|no)$/);
  await confirmCtx.answerCallbackQuery();

  if (confirmCtx.match[1] === "no") {
    await ctx.reply("❌ تم إلغاء الإرسال.", { reply_markup: adminPanelKeyboard() });
    return;
  }

  await ctx.reply("⏳ جاري الإرسال...");

  const sent = await conversation.external(async () => {
    let successCount = 0;
    for (const telegramId of ids) {
      try {
        await ctx.api.sendMessage(telegramId, text);
        successCount++;
      } catch {
        // user blocked the bot or chat no longer exists — skip
      }
      // Stay well under Telegram's ~30 msg/sec broadcast limit
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return successCount;
  });

  await ctx.reply(`✅ تم الإرسال إلى ${sent}/${ids.length} مستخدم`, { reply_markup: adminPanelKeyboard() });
}

adminHandler.command("broadcast", (ctx) => ctx.conversation.enter("broadcastConversation"));
adminHandler.callbackQuery("admin:broadcast", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("broadcastConversation");
});
