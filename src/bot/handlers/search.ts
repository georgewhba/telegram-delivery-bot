import { Composer } from "grammy";
import type { Conversation } from "@grammyjs/conversations";
import type { BotContext } from "../context";
import { searchInStockProducts } from "../../services/product.service";
import { searchPromptMessage, searchResultsMessage } from "../formatters";
import { backToCategoriesKeyboard } from "../keyboards";
import { InlineKeyboard } from "grammy";

export const searchHandler = new Composer<BotContext>();

export async function searchConversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  await ctx.reply(searchPromptMessage());

  const { message } = await conversation.waitFor("message:text");
  const query = message.text.trim();

  if (!query) {
    await ctx.reply("من فضلك اكتب اسم منتج صالح.");
    return;
  }

  const results = await conversation.external(() => searchInStockProducts(query, 10));

  const kb = new InlineKeyboard();
  results.forEach((r) => kb.text(`${r.categoryEmoji} ${r.name} — ${r.priceLabel}`, `product:${r.id}`).row());
  kb.text("🔙 القائمة الرئيسية", "menu:main");

  await ctx.reply(searchResultsMessage(results), { reply_markup: results.length ? kb : backToCategoriesKeyboard() });
}

searchHandler.callbackQuery("menu:search", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("searchConversation");
});
