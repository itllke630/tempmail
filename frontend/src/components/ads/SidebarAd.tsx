import { useConfig } from "../../hooks/useConfig";
import { ExternalLink } from "../icons";

export function SidebarAd() {
  const config = useConfig();
  if (!config.showAff) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-4 shadow-sm max-h-[120px] overflow-hidden">
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] font-medium text-amber-600/60 dark:text-amber-500/60 uppercase tracking-wider">
          Sponsored
        </span>
        <ExternalLink className="w-3 h-3 text-amber-400" />
      </div>
      <p className="text-xs font-medium text-amber-700 dark:text-amber-400 line-clamp-2">
        TempMail &mdash; Open Source Temporary Email on Cloudflare
      </p>
    </div>
  );
}
