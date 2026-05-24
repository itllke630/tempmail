import { Turnstile } from "@marsidev/react-turnstile";
import { useTranslation } from "react-i18next";
import type { AppConfig } from "../../hooks/useConfig";
import { DomainSelector } from "./DomainSelector";
import { TeamLoginButton } from "./TeamLoginButton";

interface EmailGeneratorProps {
  config: AppConfig;
  selectedDomain: string;
  teamDomains: string[];
  isTeamMode: boolean;
  teamName: string | null;
  onDomainSelect: (domain: string) => void;
  onTeamLoginClick: () => void;
  onTeamLogout: () => void;
  onCreateAddress: () => Promise<void>;
  isCreating: boolean;
  turnstileToken: string;
  onTurnstileSuccess: (token: string) => void;
}

export function EmailGenerator({
  config, selectedDomain, teamDomains, isTeamMode, teamName,
  onDomainSelect, onTeamLoginClick, onTeamLogout, onCreateAddress, isCreating,
  turnstileToken, onTurnstileSuccess,
}: EmailGeneratorProps) {
  const { t } = useTranslation();
  const showTurnstile = config.turnstileEnabled;

  const getTtlHours = (domain: string) => config.domainTtlConfig?.[domain] ?? 24;
  const ttlHours = getTtlHours(selectedDomain);

  return (
    <div className="space-y-4">
      <DomainSelector
        config={config}
        teamDomains={teamDomains}
        isTeamMode={isTeamMode}
        selectedDomain={selectedDomain}
        onSelect={onDomainSelect}
      />

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
        <span className="text-xs text-amber-700 dark:text-amber-400">
          {isTeamMode
            ? `${t("Email retention")}: ${ttlHours}h (${Math.round(ttlHours / 24)}d)`
            : `${t("Email retention")}: ${ttlHours}h`}
        </span>
      </div>

      {showTurnstile && (
        <div className="flex justify-center [&_iframe]:!w-full bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-zinc-700/50 overflow-hidden">
          <Turnstile
            siteKey={config.turnstileKey}
            onSuccess={onTurnstileSuccess}
            options={{ theme: "auto", size: "flexible" }}
          />
        </div>
      )}

      <button
        onClick={onCreateAddress}
        disabled={isCreating || (showTurnstile && !turnstileToken)}
        className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCreating ? t("Creating...") : t("Create")}
      </button>

      <TeamLoginButton
        isTeamMode={isTeamMode}
        teamName={teamName}
        onLoginClick={onTeamLoginClick}
        onLogout={onTeamLogout}
      />
    </div>
  );
}
