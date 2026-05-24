import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Server, Code2, Inbox } from "../icons";
import { SidebarAd } from "../ads/SidebarAd";
import type { AppConfig } from "../../hooks/useConfig";
import { EmailGenerator } from "./EmailGenerator";
import { EmailDisplay } from "./EmailDisplay";

interface ControlPanelProps {
  config: AppConfig;
  address: string | undefined;
  expiryTimestamp: number | undefined;
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
  onStop: () => void;
  onRefresh: () => void;
  isFetching: boolean;
  onDeleteAll: () => void;
  hasEmails: boolean;
  onShowPassword: () => void;
  onResetExpiry: () => void;
}

export function ControlPanel({
  config, address, expiryTimestamp, selectedDomain, teamDomains, isTeamMode, teamName,
  onDomainSelect, onTeamLoginClick, onTeamLogout, onCreateAddress, isCreating,
  turnstileToken, onTurnstileSuccess,
  onStop, onRefresh, isFetching, onDeleteAll, hasEmails, onShowPassword, onResetExpiry,
}: ControlPanelProps) {
  const { t } = useTranslation();

  return (
    <aside className="w-full md:w-[320px] shrink-0 space-y-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700/50 p-5 space-y-5 shadow-sm">
        {!address ? (
          <EmailGenerator
            config={config}
            selectedDomain={selectedDomain}
            teamDomains={teamDomains}
            isTeamMode={isTeamMode}
            teamName={teamName}
            onDomainSelect={onDomainSelect}
            onTeamLoginClick={onTeamLoginClick}
            onTeamLogout={onTeamLogout}
            onCreateAddress={onCreateAddress}
            isCreating={isCreating}
            turnstileToken={turnstileToken}
            onTurnstileSuccess={onTurnstileSuccess}
          />
        ) : (
          <EmailDisplay
            address={address}
            expiryTimestamp={expiryTimestamp}
            onResetExpiry={onResetExpiry}
            onStop={onStop}
            onRefresh={onRefresh}
            isFetching={isFetching}
            onDeleteAll={onDeleteAll}
            hasEmails={hasEmails}
            onShowPassword={onShowPassword}
          />
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700/50 p-5 space-y-3 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
          {t("TempMail")}
        </h3>
        <div className="space-y-2">
          <a
            href="https://github.com/oiov/vmail"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            <Server className="w-4 h-4" />
            {t("Open Source")}
          </a>
          <Link
            to="/api-docs"
            className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            <Code2 className="w-4 h-4" />
            API Docs
          </Link>
          <div className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-zinc-400">
            <Inbox className="w-4 h-4" />
            <span>{config.emailDomain.length} {t("domains")}</span>
          </div>
        </div>
      </div>

      <SidebarAd />
    </aside>
  );
}
