import { Composer } from "grammy";
import type { BotContext } from "../context";
import { touchUser } from "../../services/user.service";
import { mainMenuKeyboard, afterDeliveryKeyboard } from "../keyboards";
import { welcomeMessage, contactMessage } from "../formatters";

export const startHandler = new Composer<BotContext>();

startHandler.command("start", async (ctx) => {
  if (!ctx.from) return;

  await touchUser({
    telegramId: ctx.from.id,
    username: ctx.from.username ?? null,
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name ?? null,
  });

  await ctx.reply(welcomeMessage(ctx.from.first_name), {
    reply_markup: mainMenuKeyboard(),
  });
});

/** "🔙 القائمة الرئيسية" — always available from any menu */
startHandler.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!ctx.from) return;
  await ctx.editMessageText(welcomeMessage(ctx.from.first_name), {
    reply_markup: mainMenuKeyboard(),
  });
});

startHandler.callbackQuery("menu:contact", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(contactMessage(), { reply_markup: afterDeliveryKeyboard() });
});
