import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "../icons";
import toast from "react-hot-toast";

const TG_KEY = "vmail_telegram_enabled";

export function TelegramToggle() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(TG_KEY) === "true"; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(TG_KEY, String(enabled)); } catch { /* noop */ }
  }, [enabled]);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    if (next) {
      toast.success(t("Telegram notifications coming soon"), { icon: "🚀" });
    }
  };

  return (
    <div className="flex items-center justify-between px-1 py-1">
      <div className="flex items-center gap-2.5">
        <Send className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
        <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
          {t("Telegram notifications")}
        </span>
      </div>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          enabled ? "bg-cyan-600" : "bg-gray-300 dark:bg-zinc-600"
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </button>
    </div>
  );
}
