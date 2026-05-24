import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shuffle } from "lucide-react";
import { RefreshCw, ChevronDown } from "../icons";
import { CopyButton } from "../CopyButton";
import type { AppConfig } from "../../hooks/useConfig";

function generateRandomLocalPart(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const len = 8 + Math.floor(Math.random() * 9); // 8-16
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
  onLocalPartChange: (value: string) => void;
  onDomainChange: (domain: string) => void;
  onRandom: () => void;
  onRefresh: () => void;
}

export function EmailControls({
  localPart, domain, config, teamDomains, isTeamMode,
  fullAddress, isFetching, onLocalPartChange, onDomainChange,
  onRandom, onRefresh,
}: EmailControlsProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const publicDomains = config.emailDomain;

  const getTtlLabel = (d: string) => {
    const hours = config.domainTtlConfig?.[d];
    if (!hours) return null;
    if (hours >= 720) return `${Math.round(hours / 24)}d`;
    return `${hours}h`;
  };

  const ttlHours = config.domainTtlConfig?.[domain] ?? 24;

  return (
    <div className="w-full max-w-lg mx-auto space-y-3">
      {/* Email input row */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700/50 shadow-sm">
        <input
          ref={inputRef}
          type="text"
          value={localPart}
          onChange={(e) => onLocalPartChange(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
          className="flex-1 min-w-0 bg-transparent px-2 py-2 text-sm font-mono text-gray-900 dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-500"
          placeholder={t("email name")}
        />
        <span className="text-sm text-gray-400 dark:text-zinc-500 shrink-0">@</span>
        <div className="relative shrink-0">
          <select
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            className="appearance-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-zinc-700/50 rounded-lg pl-2.5 pr-7 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40 cursor-pointer"
          >
            {publicDomains.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
            {isTeamMode && teamDomains.length > 0 && (
              <optgroup label="Team">
                {teamDomains.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </optgroup>
            )}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <CopyButton text={fullAddress} className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-all active:scale-[0.98]" />
        <button
          onClick={onRandom}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-zinc-700/50 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-medium text-gray-700 dark:text-zinc-300 transition-all shrink-0"
          title={t("Random")}
        >
          <Shuffle className="w-4 h-4" />
        </button>
        <button
          onClick={onRefresh}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-zinc-700/50 hover:bg-gray-200 dark:hover:bg-white/10 text-sm font-medium text-gray-700 dark:text-zinc-300 transition-all shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* TTL info */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
        <span className="text-xs text-amber-700 dark:text-amber-400">
          {t("Email retention")}: {ttlHours}h{isTeamMode && ` (${Math.round(ttlHours / 24)}d)`}
        </span>
      </div>
    </div>
  );
}

export { generateRandomLocalPart };
