import type { NextFunction } from "grammy";
import type { BotContext } from "../context";

/** Lightweight console logging of every incoming update, useful during development. */
export async function logInteraction(ctx: BotContext, next: NextFunction) {
  const start = Date.now();
  const who = ctx.from ? `${ctx.from.id}${ctx.from.username ? " @" + ctx.from.username : ""}` : "unknown";
  const updateKind = Object.keys(ctx.update).find((k) => k !== "update_id") ?? "unknown";
  const what = ctx.message?.text ?? ctx.callbackQuery?.data ?? updateKind;

  await next();

  const ms = Date.now() - start;
  console.log(`[bot] ${who} -> ${what} (${ms}ms)`);
}
