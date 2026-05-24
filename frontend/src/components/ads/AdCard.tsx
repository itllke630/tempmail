import { useConfig } from "../../hooks/useConfig";

export function AdCard() {
  const config = useConfig();
  if (!config.showAff) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10 cursor-pointer hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-all">
      <span className="text-[10px] font-medium text-amber-600/60 dark:text-amber-500/60 uppercase tracking-wider shrink-0 mt-0.5">
        Sponsored
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
          TempMail &mdash; Open Source Temporary Email
        </p>
        <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5 line-clamp-1">
          Self-host your own disposable email service on Cloudflare Workers.
        </p>
      </div>
    </div>
  );
}
