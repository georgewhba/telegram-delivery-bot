import { Bot, session, GrammyError, HttpError } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { env } from "../env";
import type { BotContext, SessionData } from "./context";
import { logInteraction } from "./middleware/logger";
import { startHandler } from "./handlers/start";
import { catalogHandler } from "./handlers/catalog";
import { searchHandler, searchConversation } from "./handlers/search";
import {
  adminHandler,
  addProductConversation,
  bulkImportConversation,
  broadcastConversation,
  addCategoryConversation,
} from "./handlers/admin";
import { callbacksHandler } from "./handlers/callbacks";

export const bot = new Bot<BotContext>(env.BOT_TOKEN);

// --- Core middleware -------------------------------------------------------
bot.use(session<SessionData, BotContext>({ initial: () => ({}) }));
bot.use(conversations());

// Every multi-step admin/customer flow is registered here by name, matching
// the string passed to `ctx.conversation.enter(...)` in the handlers above.
bot.use(createConversation(searchConversation, "searchConversation"));
bot.use(createConversation(addProductConversation, "addProductConversation"));
bot.use(createConversation(bulkImportConversation, "bulkImportConversation"));
bot.use(createConversation(broadcastConversation, "broadcastConversation"));
bot.use(createConversation(addCategoryConversation, "addCategoryConversation"));

if (env.NODE_ENV !== "production") {
  bot.use(logInteraction);
}

// --- Feature handlers (order matters: callbacksHandler's catch-all is last) -
bot.use(startHandler);
bot.use(catalogHandler);
bot.use(searchHandler);
bot.use(adminHandler);
bot.use(callbacksHandler);

// --- Error handling ----------------------------------------------------
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`❌ Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Telegram API error:", e.description);
  } else if (e instanceof HttpError) {
    console.error("Could not reach Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

export async function startBot() {
  await bot.api.setMyCommands([
    { command: "start", description: "بدء استخدام البوت" },
    { command: "admin", description: "لوحة تحكم الأدمن (للأدمن فقط)" },
  ]);
  await bot.start({
    onStart: (info) => console.log(`🤖 Bot started as @${info.username}`),
  });
}
