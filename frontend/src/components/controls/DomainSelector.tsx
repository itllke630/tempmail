import { useTranslation } from "react-i18next";
import { ChevronDown } from "../icons";
import type { AppConfig } from "../../hooks/useConfig";

interface DomainSelectorProps {
  config: AppConfig;
  teamDomains: string[];
  isTeamMode: boolean;
  selectedDomain: string;
  onSelect: (domain: string) => void;
}

export function DomainSelector({ config, teamDomains, isTeamMode, selectedDomain, onSelect }: DomainSelectorProps) {
  const { t } = useTranslation();
  const publicDomains = config.emailDomain;

  const getTtlLabel = (domain: string) => {
    const hours = config.domainTtlConfig?.[domain];
    if (!hours) return null;
    if (hours >= 720) return t("30d retention", "30d");
    return `${hours}h`;
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
        {t("Domain")}
      </label>
      <div className="relative">
        <select
          value={selectedDomain}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-zinc-700/50 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all"
        >
          <optgroup label={t("Public domains")}>
            {publicDomains.map((d) => (
              <option key={d} value={d}>@{d} {getTtlLabel(d) && `(${getTtlLabel(d)})`}</option>
            ))}
          </optgroup>
          {isTeamMode && teamDomains.length > 0 && (
            <optgroup label={t("Team domains")}>
              {teamDomains.map((d) => (
                <option key={d} value={d}>@{d} ({getTtlLabel(d) || "720h"})</option>
              ))}
            </optgroup>
          )}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {isTeamMode && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            {t("Team mode")}
          </span>
        </div>
      )}
    </div>
  );
}
