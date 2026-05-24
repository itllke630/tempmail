import { motion } from "framer-motion";
import { format } from "date-fns/format";
import type { Email } from "../../database_types";
import type { OtpMatch } from "../../types";
import { OtpBadge } from "./OtpBadge";

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onClick: () => void;
  isUnread: boolean;
  otpCodes: OtpMatch[];
}

function getPreview(text: string | null, maxLen = 120): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim().slice(0, maxLen);
}

function formatTime(date: string | Date | null): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = Date.now();
    const diff = now - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
    return format(d, "MM/dd");
  } catch {
    return "";
  }
}

export function EmailListItem({ email, isSelected, onToggle, onClick, isUnread, otpCodes }: EmailListItemProps) {
  const bestOtp = otpCodes.length > 0 ? otpCodes[0] : null;
  const preview = getPreview(email.text);
  const senderName = email.from?.name || email.from?.address || email.messageFrom;
  const subject = email.subject || "(no subject)";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className={`group flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
        isSelected
          ? "bg-cyan-50/60 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800/40"
          : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700/50 hover:border-gray-300 dark:hover:border-zinc-600"
      }`}
    >
      <div className="flex items-center gap-2 shrink-0 mt-0.5" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(email.id)}
          className="w-3.5 h-3.5 rounded border-gray-300 dark:border-zinc-600 text-cyan-600 focus:ring-cyan-500/30"
        />
        {isUnread && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 mb-0.5">
          <span className={`text-sm truncate ${isUnread ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-zinc-200"}`}>
            {senderName}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-zinc-500 shrink-0 tabular-nums">
            {formatTime(email.date || email.createdAt)}
          </span>
        </div>
        <p className={`text-sm mb-1 truncate ${isUnread ? "font-semibold text-gray-800 dark:text-zinc-100" : "text-gray-600 dark:text-zinc-400"}`}>
          {subject}
        </p>
        {preview && (
          <p className="text-xs text-gray-400 dark:text-zinc-500 line-clamp-2">{preview}</p>
        )}
        {bestOtp && (
          <div className="mt-1.5">
            <OtpBadge code={bestOtp.code} confidence={bestOtp.confidence} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
