import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shuffle } from "lucide-react";
import { Copy, Send, RefreshCw, ChevronDown, Check } from "../icons";
import type { AppConfig } from "../../hooks/useConfig";
import { useState, useCallback } from "react";

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
}

export function EmailControls({
  localPart, domain, config, teamDomains, isTeamMode,
  fullAddress, isFetching, telegramEnabled,
  onLocalPartChange, onDomainChange, onRandom, onRefresh,
  onToggleTelegram,
}: EmailControlsProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const publicDomains = config.emailDomain;
  const allTeamDomains = [...new Set([...config.teamDomains, ...teamDomains])];

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(fullAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [fullAddress]);

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm transition-colors">
      {/* Email name input */}
      <input
        ref={inputRef}
        type="text"
        value={localPart}
        onChange={(e) => onLocalPartChange(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
        className="flex-1 min-w-0 bg-transparent px-2.5 py-2 text-sm font-mono text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        placeholder={t("email name")}
      />

      {/* @ separator */}
      <span className="text-sm text-zinc-400 dark:text-zinc-500 shrink-0 select-none">@</span>

      {/* Domain select */}
      <div className="relative shrink-0">
        <select
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          className="appearance-none bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-zinc-700/50 rounded-lg pl-2.5 pr-7 py-2 text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer transition-all"
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
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400 pointer-events-none" />
      </div>

      {/* Random button */}
      <button
        onClick={onRandom}
        title={t("Random")}
        className="shrink-0 p-2 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all"
      >
        <Shuffle className="w-4 h-4" />
      </button>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        title={t("Copy address")}
        className="shrink-0 p-2 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      </button>

      {/* Refresh button */}
      <button
        onClick={onRefresh}
        title={t("Refresh")}
        className="shrink-0 p-2 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all"
      >
        <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
      </button>

      {/* Telegram toggle with tooltip */}
      <div className="relative group shrink-0">
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[11px] bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {t("Telegram notifications")}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-zinc-800 dark:bg-zinc-200 rotate-45" />
        </div>
      </div>
    </div>
  );
}

export { generateRandomLocalPart };
