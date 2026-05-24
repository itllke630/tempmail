import { useTranslation } from "react-i18next";
import { Lock, LogOut } from "../icons";

interface TeamLoginButtonProps {
  isTeamMode: boolean;
  teamName: string | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

export function TeamLoginButton({ isTeamMode, teamName, onLoginClick, onLogout }: TeamLoginButtonProps) {
  const { t } = useTranslation();

  if (isTeamMode) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/30">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {teamName || t("Team mode")}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          title={t("Logout")}
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onLoginClick}
      className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-medium text-gray-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-dashed border-gray-200 dark:border-zinc-700/50 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all"
    >
      <Lock className="w-3.5 h-3.5" />
      {t("Team Login")}
    </button>
  );
}
