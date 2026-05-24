import { useTranslation } from "react-i18next";
import { RefreshCw, Trash2, Lock, Send } from "../icons";
import { TelegramToggle } from "./TelegramToggle";

interface ActionButtonsProps {
  onRefresh: () => void;
  isFetching: boolean;
  onDeleteAll: () => void;
  hasEmails: boolean;
  onShowPassword: () => void;
}

export function ActionButtons({ onRefresh, isFetching, onDeleteAll, hasEmails, onShowPassword }: ActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-zinc-700/50 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-medium text-gray-700 dark:text-zinc-300 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          {t("Refresh")}
        </button>
        <button
          onClick={onDeleteAll}
          disabled={!hasEmails}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm font-medium text-red-600 dark:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Trash2 className="w-4 h-4" />
          {t("Delete all")}
        </button>
      </div>
      <button
        onClick={onShowPassword}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-zinc-700/50 hover:bg-gray-100 dark:hover:bg-white/10 text-sm font-medium text-gray-600 dark:text-zinc-400 transition-all"
      >
        <Lock className="w-4 h-4" />
        {t("View password")}
      </button>
      <div className="pt-1 border-t border-gray-100 dark:border-zinc-800">
        <TelegramToggle />
      </div>
    </div>
  );
}
