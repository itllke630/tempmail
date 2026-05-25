const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const MAX_SUBSCRIPTIONS_PER_USER = 10;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function sendMessage(
  botToken: string,
  chatId: number,
  text: string,
): Promise<Response> {
  return fetch(`${TELEGRAM_API_BASE}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}

export function setWebhook(
  botToken: string,
  webhookUrl: string,
  secretToken: string,
): Promise<Response> {
  return fetch(`${TELEGRAM_API_BASE}${botToken}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secretToken,
      allowed_updates: ["message"],
    }),
  });
}

export function buildEmailNotification(
  address: string,
  fromName: string,
  fromAddress: string,
  subject: string | null,
): string {
  const fromDisplay = fromName
    ? `${fromName} &lt;${fromAddress}&gt;`
    : fromAddress;
  const subjectDisplay = subject || "(no subject)";
  return [
    `📧 <b>New email for ${escapeHtml(address)}</b>`,
    `From: ${escapeHtml(fromDisplay)}`,
    `Subject: ${escapeHtml(subjectDisplay)}`,
  ].join("\n");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function extractCommandAndArgs(
  text: string,
): { command: string; args: string } | null {
  const match = text.match(/^\/(\w+)(@\w+)?(?:\s+(.*))?$/s);
  if (!match) return null;
  return { command: match[1].toLowerCase(), args: (match[3] || "").trim() };
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function getMaxSubscriptions(): number {
  return MAX_SUBSCRIPTIONS_PER_USER;
}
