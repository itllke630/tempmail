import { useTranslation } from "react-i18next";
import { Inbox } from "../icons";

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-2xl scale-150 animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/50 flex items-center justify-center">
          <Inbox className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
        </div>
      </div>
      <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
        {t("Waiting for emails...")}
      </p>
      <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-1.5 max-w-[240px]">
        {t(
          "Your temporary inbox is active. Emails will appear here automatically."
        )}
      </p>
    </div>
  );
}
