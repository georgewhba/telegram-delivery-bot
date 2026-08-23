import { Composer } from "grammy";
import type { BotContext } from "../context";
import { adminPanelKeyboard } from "../keyboards";
import { adminPanelMessage } from "../formatters";

export const callbacksHandler = new Composer<BotContext>();

/** Universal "cancel" used by every admin conversation (/add, /bulk, /broadcast) */
callbacksHandler.callbackQuery("admin:cancel", async (ctx) => {
  await ctx.answerCallbackQuery({ text: "تم الإلغاء" });
  for (const active of Object.keys(await ctx.conversation.active())) {
    await ctx.conversation.exit(active);
  }
  await ctx.editMessageText(adminPanelMessage(), { reply_markup: adminPanelKeyboard() });
});

/**
 * Safety net: this must be registered LAST. Any callback_query that no other
 * handler matched still needs an answer, or Telegram shows an endless spinner
 * on the user's button.
 */
callbacksHandler.on("callback_query:data", async (ctx) => {
  console.warn(`[bot] Unhandled callback_query: ${ctx.callbackQuery.data}`);
  await ctx.answerCallbackQuery();
});
