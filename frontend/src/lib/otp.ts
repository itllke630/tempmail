import type { Email } from "../database_types";
import type { OtpMatch } from "../types";

const OTP_PATTERNS = [
  { regex: /\b(\d{6})\b/g, confidence: "high" as const },
  { regex: /\b(\d{5})\b/g, confidence: "medium" as const },
  { regex: /\b(\d{4})\b/g, confidence: "low" as const },
];

const CONTEXTUAL_PATTERNS = [
  /(?:code|otp|token|pin|password|verification|verify|auth)[\s:.\-]{0,10}(\d{4,6})\b/gi,
  /(\d{4,6})\b[\s:.\-]{0,10}(?:code|otp|token|pin|verification|verify)/gi,
];

const DATE_LIKE = /^\d{4}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])$/;

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ");
}

export function extractOtps(text: string): OtpMatch[] {
  const seen = new Set<string>();
  const results: OtpMatch[] = [];

  for (const { regex, confidence } of OTP_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const code = match[1];
      if (seen.has(code) || DATE_LIKE.test(code)) continue;
      seen.add(code);
      results.push({ code, confidence });
    }
  }

  for (const pattern of CONTEXTUAL_PATTERNS) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const code = match[1] || match[2];
      if (!code || seen.has(code) || DATE_LIKE.test(code)) continue;
      seen.add(code);
      const existing = results.find((r) => r.code === code);
      if (existing) {
        existing.confidence = "high";
      } else {
        results.push({ code, confidence: "high" });
      }
    }
  }

  results.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.confidence] - order[b.confidence];
  });

  return results.slice(0, 2);
}

export function extractOtpsFromEmail(email: Email): OtpMatch[] {
  const parts = [email.subject, email.text, stripHtml(email.html)].filter(Boolean) as string[];
  return extractOtps(parts.join(" "));
}
