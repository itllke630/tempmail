import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface SiteUnlockProps {
  onUnlock: (password: string) => Promise<void>;
  isUnlocking: boolean;
  error: string | null;
}

export function SiteUnlock({ onUnlock, isUnlocking, error }: SiteUnlockProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      return;
    }
    await onUnlock(password);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-gray-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 p-6 text-gray-900 dark:text-white shadow-sm">
        <h1 className="text-xl font-semibold mb-3">{t('Site locked')}</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
          {t('Enter site password to continue')}
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('Password')}
          className="w-full rounded-md bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-zinc-700/50 px-3 py-2 mb-4 outline-none focus:ring-2 focus:ring-cyan-500 text-gray-900 dark:text-white"
        />

        {error && <p className="text-sm text-red-500 dark:text-rose-400 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={isUnlocking || !password.trim()}
          className="w-full rounded-md bg-cyan-600 py-2.5 font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed">
          {isUnlocking ? t('Unlocking...') : t('Unlock')}
        </button>
      </form>
    </div>
  );
}
