import { useTranslation } from "react-i18next";
import { CopyButton } from "../CopyButton";
import { CountdownTimer } from "../CountdownTimer";
import { X, Copy } from "../icons";
import { ActionButtons } from "./ActionButtons";

interface EmailDisplayProps {
  address: string;
  expiryTimestamp: number | undefined;
  onResetExpiry: () => void;
  onStop: () => void;
  onRefresh: () => void;
  isFetching: boolean;
  onDeleteAll: () => void;
  hasEmails: boolean;
  onShowPassword: () => void;
}

export function EmailDisplay({
  address, expiryTimestamp, onResetExpiry, onStop,
  onRefresh, isFetching, onDeleteAll, hasEmails, onShowPassword,
}: EmailDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-zinc-700/50">
        <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white truncate select-all">
          {address}
        </code>
        <CopyButton text={address} className="shrink-0" />
        <button
          onClick={onStop}
          className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-all"
          title={t("Stop")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {expiryTimestamp && (
        <div className="flex items-center justify-center">
          <CountdownTimer expiryTimestamp={expiryTimestamp} onReset={onResetExpiry} />
        </div>
      )}

      <ActionButtons
        onRefresh={onRefresh}
        isFetching={isFetching}
        onDeleteAll={onDeleteAll}
        hasEmails={hasEmails}
        onShowPassword={onShowPassword}
      />
    </div>
  );
}
