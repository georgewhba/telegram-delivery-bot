import { Composer } from "grammy";
import type { BotContext } from "../context";
import { listCategoriesWithCounts, getCategoryById } from "../../services/category.service";
import {
  listInStockByCategory,
  getProductById,
  claimProductForDelivery,
} from "../../services/product.service";
import { recordDelivery } from "../../services/delivery.service";
import { getUserByTelegramId, getUserDeliveries, touchUser } from "../../services/user.service";
import {
  categoriesKeyboard,
  productListKeyboard,
  productDetailKeyboard,
  afterDeliveryKeyboard,
  backToCategoriesKeyboard,
} from "../keyboards";
import {
  categoriesHeaderMessage,
  emptyCategoryMessage,
  productListMessage,
  productDetailMessage,
  deliverySuccessMessage,
  alreadyDeliveredMessage,
  cooldownMessage,
  myOrdersMessage,
  deliveryAdminNotification,
} from "../formatters";
import { env } from "../../env";

export const catalogHandler = new Composer<BotContext>();

const PAGE_SIZE = 5;
const CLAIM_COOLDOWN_MS = 3000;
const lastClaimAttempt = new Map<number, number>();

catalogHandler.callbackQuery("menu:browse", async (ctx) => {
  await ctx.answerCallbackQuery();
  const categories = await listCategoriesWithCounts({ onlyActive: true });

  if (categories.length === 0) {
    await ctx.editMessageText("😔 لا توجد أقسام متاحة حاليًا.");
    return;
  }

  await ctx.editMessageText(categoriesHeaderMessage(), {
    reply_markup: categoriesKeyboard(categories),
  });
});

catalogHandler.callbackQuery(/^cat:(\d+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const categoryId = Number(ctx.match[1]);
  const page = Number(ctx.match[2]);

  const category = await getCategoryById(categoryId);
  if (!category) {
    await ctx.editMessageText("😔 هذا القسم لم يعد متاحًا.", { reply_markup: backToCategoriesKeyboard() });
    return;
  }

  const { rows, total } = await listInStockByCategory(categoryId, page, PAGE_SIZE);

  if (total === 0) {
    await ctx.editMessageText(emptyCategoryMessage(), { reply_markup: backToCategoriesKeyboard() });
    return;
  }

  const hasNext = page * PAGE_SIZE < total;
  await ctx.editMessageText(
    productListMessage(category.emoji, category.name, rows, page, total),
    { reply_markup: productListKeyboard(categoryId, page, rows, hasNext) }
  );
});

catalogHandler.callbackQuery(/^product:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const productId = Number(ctx.match[1]);
  const product = await getProductById(productId);

  if (!product || product.isDelivered) {
    await ctx.editMessageText(alreadyDeliveredMessage(), { reply_markup: backToCategoriesKeyboard() });
    return;
  }

  await ctx.editMessageText(productDetailMessage(product), {
    reply_markup: productDetailKeyboard(product.id, product.categoryId),
  });
});

catalogHandler.callbackQuery(/^claim:(\d+)$/, async (ctx) => {
  const telegramId = ctx.from.id;
  const now = Date.now();
  const last = lastClaimAttempt.get(telegramId) ?? 0;

  if (now - last < CLAIM_COOLDOWN_MS) {
    await ctx.answerCallbackQuery({ text: cooldownMessage(), show_alert: false });
    return;
  }
  lastClaimAttempt.set(telegramId, now);

  await ctx.answerCallbackQuery({ text: "⏳ جاري التسليم..." });

  const productId = Number(ctx.match[1]);
  const product = await getProductById(productId);

  if (!product) {
    await ctx.editMessageText(alreadyDeliveredMessage(), { reply_markup: backToCategoriesKeyboard() });
    return;
  }

  const { user } = await touchUser({
    telegramId,
    username: ctx.from.username ?? null,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name ?? null,
  });

  const claimed = await claimProductForDelivery(productId, user.id);
  if (!claimed) {
    // Someone else claimed it between viewing the detail page and tapping the button
    await ctx.editMessageText(alreadyDeliveredMessage(), {
      reply_markup: backToCategoriesKeyboard(),
    });
    return;
  }

  await recordDelivery(claimed, user.id);

  if (claimed.contentType === "file") {
    await ctx.editMessageText(`✅ تم التسليم بنجاح!\n🎮 ${claimed.name}\n\nشكرًا لك! 🙏`, {
      reply_markup: afterDeliveryKeyboard(),
    });
    // `content` holds a Telegram file_id captured when the admin uploaded the file via /add
    await ctx.replyWithDocument(claimed.content);
  } else {
    await ctx.editMessageText(deliverySuccessMessage(claimed), {
      reply_markup: afterDeliveryKeyboard(),
    });
  }

  // Notify all configured admins
  const category = await getCategoryById(claimed.categoryId);
  const { rows: remainingRows, total: remaining } = await listInStockByCategory(claimed.categoryId, 1, 1);
  void remainingRows;
  const notification = deliveryAdminNotification(
    claimed.name,
    ctx.from.username ?? null,
    telegramId,
    category?.name ?? "—",
    remaining
  );
  for (const adminId of env.ADMIN_TELEGRAM_IDS) {
    ctx.api.sendMessage(adminId, notification).catch(() => {
      /* admin may have blocked the bot; ignore */
    });
  }
});

catalogHandler.callbackQuery("menu:orders", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!ctx.from) return;
  const user = await getUserByTelegramId(ctx.from.id);
  if (!user) {
    await ctx.editMessageText(myOrdersMessage([]), { reply_markup: afterDeliveryKeyboard() });
    return;
  }
  const orders = await getUserDeliveries(user.id);
  await ctx.editMessageText(
    myOrdersMessage(orders.map((o) => ({ productName: o.productName, deliveredAt: o.deliveredAt }))),
    { reply_markup: afterDeliveryKeyboard() }
  );
});
