import type { Env } from "../index";
import { getD1DB } from "../database/db";
import {
  insertTelegramSubscription,
  deleteTelegramSubscription,
  deleteAllTelegramSubscriptionsByChatId,
  getTelegramSubscriptionsByChatId,
  getTelegramSubscriptionCountByChatId,
} from "../database/dao";
import type { TelegramUpdate } from "./types";
import {
  sendMessage,
  extractCommandAndArgs,
  isValidEmail,
  getMaxSubscriptions,
  escapeHtml,
} from "./bot";

export async function handleTelegramWebhook(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const secretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!env.TELEGRAM_WEBHOOK_SECRET || secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("Forbidden", { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const msg = update.message;
  if (!msg || !msg.text || msg.chat.type !== "private") {
    return new Response("OK", { status: 200 });
  }

  ctx.waitUntil(handleCommand(env, msg.chat.id, msg.text));

  return new Response("OK", { status: 200 });
}

async function handleCommand(env: Env, chatId: number, text: string) {
  if (!env.TELEGRAM_BOT_TOKEN) return;

  const parsed = extractCommandAndArgs(text);
  if (!parsed) return;

  const db = getD1DB(env.DB);
  const botToken = env.TELEGRAM_BOT_TOKEN;

  switch (parsed.command) {
    case "start": {
      if (!parsed.args) {
        await sendMessage(
          botToken,
          chatId,
          "Welcome! Send /start email@domain.com to subscribe to notifications for that address.\n\n" +
            "Commands:\n" +
            "/start email@domain.com - Subscribe to an address\n" +
            "/stop - Unsubscribe from all addresses\n" +
            "/stop email@domain.com - Unsubscribe from a specific address\n" +
            "/status - List your subscriptions",
        );
        return;
      }

      const email = parsed.args.toLowerCase();
      if (!isValidEmail(email)) {
        await sendMessage(botToken, chatId, "Invalid email address format.");
        return;
      }

      const currentCount = await getTelegramSubscriptionCountByChatId(db, chatId);
      if (currentCount >= getMaxSubscriptions()) {
        await sendMessage(
          botToken,
          chatId,
          `You have reached the maximum of ${getMaxSubscriptions()} subscriptions. Use /stop to remove some first.`,
        );
        return;
      }

      const inserted = await insertTelegramSubscription(db, chatId, email);
      if (inserted) {
        await sendMessage(
          botToken,
          chatId,
          `Subscribed to notifications for ${escapeHtml(email)}.`,
        );
      } else {
        await sendMessage(
          botToken,
          chatId,
          `You are already subscribed to ${escapeHtml(email)}.`,
        );
      }
      break;
    }

    case "stop": {
      if (parsed.args) {
        const email = parsed.args.toLowerCase();
        const deleted = await deleteTelegramSubscription(db, chatId, email);
        await sendMessage(
          botToken,
          chatId,
          deleted
            ? `Unsubscribed from ${escapeHtml(email)}.`
            : `No subscription found for ${escapeHtml(email)}.`,
        );
      } else {
        const count = await deleteAllTelegramSubscriptionsByChatId(db, chatId);
        if (count > 0) {
          await sendMessage(
            botToken,
            chatId,
            `Removed all ${count} subscription(s). You will no longer receive notifications.`,
          );
        } else {
          await sendMessage(
            botToken,
            chatId,
            "You have no active subscriptions. Use /start email@domain.com to subscribe.",
          );
        }
      }
      break;
    }

    case "status": {
      const subs = await getTelegramSubscriptionsByChatId(db, chatId);
      if (subs.length === 0) {
        await sendMessage(
          botToken,
          chatId,
          "You have no active subscriptions. Use /start email@domain.com to subscribe.",
        );
      } else {
        const lines = subs.map((s) => `- ${escapeHtml(s.address)}`);
        await sendMessage(
          botToken,
          chatId,
          `Your subscriptions (${subs.length}/${getMaxSubscriptions()}):\n${lines.join("\n")}`,
        );
      }
      break;
    }
  }
}
