import type { NextFunction } from "grammy";
import { isAdmin } from "../../env";
import type { BotContext } from "../context";

/** Blocks non-admin users from admin-only commands/callbacks. */
export async function requireAdmin(ctx: BotContext, next: NextFunction) {
  const telegramId = ctx.from?.id;
  if (!telegramId || !isAdmin(telegramId)) {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "⛔ غير مصرح لك بهذا الإجراء", show_alert: true });
    } else {
      await ctx.reply("⛔ هذا الأمر متاح للأدمن فقط.");
    }
    return;
  }
  await next();
}
