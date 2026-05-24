import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns/format";
import { ArrowUturnLeft, Maximize2, Trash2, UserCircleIcon } from "../icons";
import { OtpBadge } from "./OtpBadge";
import type { Email } from "../../database_types";
import type { OtpMatch } from "../../types";

interface EmailDetailViewProps {
  email: Email;
  otpCodes: OtpMatch[];
  onClose: () => void;
  onExpand: () => void;
  onDelete: () => void;
}

export function EmailDetailView({ email, otpCodes, onClose, onExpand, onDelete }: EmailDetailViewProps) {
  const { t } = useTranslation();
  const bestOtp = otpCodes.length > 0 ? otpCodes[0] : null;
  const senderName = email.from?.name || email.from?.address || email.messageFrom;
  const subject = email.subject || "(no subject)";

  const htmlFrameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = htmlFrameRef.current;
    if (!container || !email.html) return;

    const blob = new Blob([email.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.className = "w-full min-h-[400px] border-0 rounded-xl bg-white dark:bg-zinc-950";
    iframe.setAttribute("sandbox", "allow-same-origin allow-popups");
    iframe.title = "Email content";
    iframe.src = url;

    container.innerHTML = "";
    container.appendChild(iframe);

    return () => {
      URL.revokeObjectURL(url);
      iframe.remove();
    };
  }, [email.html]);

  const formatDate = (d: string | Date | null) => {
    if (!d) return "";
    try {
      return format(typeof d === "string" ? new Date(d) : d, "yyyy/MM/dd HH:mm");
    } catch { return ""; }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700/50 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-medium text-gray-600 dark:text-zinc-400 transition-all">
            <ArrowUturnLeft className="w-4 h-4" />
            {t("Back")}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onExpand} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-zinc-500 transition-all">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{subject}</h2>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <UserCircleIcon className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{senderName}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {t("To")}: {email.messageTo} &middot; {formatDate(email.date || email.createdAt)}
              </p>
            </div>
          </div>
          {bestOtp && (
            <div className="mt-3">
              <OtpBadge code={bestOtp.code} confidence={bestOtp.confidence} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
          {email.html ? (
            <div ref={htmlFrameRef} className="w-full min-h-[400px]" />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-zinc-300 font-sans leading-relaxed">
              {email.text || t("No content")}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
