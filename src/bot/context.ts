import type { Context, SessionFlavor } from "grammy";
import type { ConversationFlavor } from "@grammyjs/conversations";

export interface SessionData {
  /** Scratch space used by admin conversations (/add, /bulk, /broadcast) */
  draft?: Record<string, unknown>;
}

export type BaseContext = Context & SessionFlavor<SessionData>;
export type BotContext = ConversationFlavor<BaseContext>;
