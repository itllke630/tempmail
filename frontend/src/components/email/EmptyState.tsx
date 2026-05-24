import { useTranslation } from "react-i18next";
import { Inbox } from "../icons";

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
      </div>
      <p className="text-sm font-medium text-gray-400 dark:text-zinc-500">
        {t("Waiting for emails...")}
      </p>
      <p className="text-xs text-gray-300 dark:text-zinc-600 mt-1">
        {t("Inbox empty")}
      </p>
    </div>
  );
}
