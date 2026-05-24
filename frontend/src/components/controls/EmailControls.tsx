import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shuffle, Send } from "lucide-react";
import { RefreshCw, ChevronDown } from "../icons";
import type { AppConfig } from "../../hooks/useConfig";

function generateRandomLocalPart(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const len = 8 + Math.floor(Math.random() * 9);
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface EmailControlsProps {
  localPart: string;
  domain: string;
  config: AppConfig;
  teamDomains: string[];
  isTeamMode: boolean;
  fullAddress: string;
  isFetching: boolean;
  telegramEnabled: boolean;
  onLocalPartChange: (value: string) => void;
  onDomainChange: (domain: string) => void;
  onRandom: () => void;
  onRefresh: () => void;
  onToggleTelegram: () => void;
  onTeamLoginClick: () => void;
  onTeamLogout: () => void;
}

export function EmailControls({
  localPart, domain, config, teamDomains, isTeamMode,
  fullAddress, isFetching, telegramEnabled,
  onLocalPartChange, onDomainChange, onRandom, onRefresh,
  onToggleTelegram, onTeamLoginClick, onTeamLogout,
}: EmailControlsProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const publicDomains = config.emailDomain;
  const allTeamDomains = [...new Set([...config.teamDomains, ...teamDomains])];

  return (
    <div className="space-y-4">
      {/* Email address input row */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm transition-colors">
        <input
          ref={inputRef}
          type="text"
          value={localPart}
          onChange={(e) => onLocalPartChange(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
          className="flex-1 min-w-0 bg-transparent px-2.5 py-2.5 text-base font-mono text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          placeholder={t("email name")}
        />
        <span className="text-base text-zinc-400 dark:text-zinc-500 shrink-0 select-none">@</span>
        <div className="relative shrink-0">
          <select
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            className="appearance-none bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-zinc-700/50 rounded-xl pl-3 pr-8 py-2.5 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer transition-all"
          >
            {publicDomains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
            {isTeamMode && allTeamDomains.length > 0 && (
              <optgroup label="Team">
                {allTeamDomains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            )}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>
      </div>

      {/* Primary action: Copy button */}
      <button
        onClick={() => navigator.clipboard.writeText(fullAddress)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold shadow-sm shadow-cyan-500/20 transition-all active:scale-[0.98]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {t("Copy address")}
      </button>

      {/* Secondary actions row */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRandom}
          className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all active:scale-[0.98]"
        >
          <Shuffle className="w-4 h-4" />
          {t("Random")}
        </button>
        <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-zinc-700/50 hover:bg-zinc-200 dark:hover:bg-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all active:scale-[0.98]"
        >
          <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isFetching ? "animate-spin" : ""}`} />
          {t("Refresh")}
        </button>
      </div>

      {/* Team + Telegram */}
      <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
        {!isTeamMode ? (
          <button
            onClick={onTeamLoginClick}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-zinc-700/50 hover:bg-zinc-100 dark:hover:bg-white/10 text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-all"
          >
            {t("Team Login")}
          </button>
        ) : (
          <button
            onClick={onTeamLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-zinc-700/50 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 text-xs font-medium text-zinc-500 dark:text-zinc-400 transition-all"
          >
            {t("Team Logout")}
          </button>
        )}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {t("Telegram notifications")}
            </span>
          </div>
          <button
            onClick={onToggleTelegram}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              telegramEnabled ? "bg-cyan-600" : "bg-zinc-300 dark:bg-zinc-600"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                telegramEnabled ? "translate-x-[18px]" : "translate-x-[3px]"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export { generateRandomLocalPart };
