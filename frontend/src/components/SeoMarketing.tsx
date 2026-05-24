import { useTranslation } from "react-i18next";
import { ShieldCheck, Clock } from "./icons";
import { Bell } from "lucide-react";

export function SeoMarketing() {
  const { t } = useTranslation();

  return (
    <section className="w-full max-w-6xl mx-auto px-4 md:px-6 pb-16 pt-8">
      {/* Hidden SEO h1 */}
      <h1 className="sr-only">
        Disposable Temporary Email Service &mdash; Protect Your Privacy with TempMail
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <article className="rounded-2xl border border-zinc-200/60 dark:border-zinc-700/40 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5 text-cyan-500" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
            {t("What is TempMail?")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t(
              "TempMail provides disposable, anonymous temporary email addresses. Keep your real inbox spam-free — no registration required, works instantly."
            )}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200/60 dark:border-zinc-700/40 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
            {t("Flexible Email Retention")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t(
              "Standard domains offer 24-hour email retention. Premium team domains support up to 30-day storage — ideal for developers testing email flows."
            )}
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-200/60 dark:border-zinc-700/40 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <Bell className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-white mb-2">
            {t("Telegram Notifications")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t(
              "Receive real-time email alerts directly in Telegram. Instantly know when a new message arrives without refreshing the page."
            )}
          </p>
        </article>
      </div>
    </section>
  );
}
