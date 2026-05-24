import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Lock, X, Loader2 } from "../icons";

interface TeamLoginModalProps {
  show: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<boolean>;
  isLoggingIn: boolean;
  error: string | null;
}

export function TeamLoginModal({ show, onClose, onLogin, isLoggingIn, error }: TeamLoginModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    const ok = await onLogin(password.trim());
    setPassword("");
    if (ok) onClose();
  };

  const handleClose = () => {
    setPassword("");
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-sm bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-zinc-700/30 shadow-2xl p-6"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-zinc-500 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("Team Login")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                {t("Enter team password to unlock private domains")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("Password")}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-zinc-700/50 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
              />
              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}
              <button
                type="submit"
                disabled={isLoggingIn || !password.trim()}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t("Logging in...")}</>
                ) : (
                  t("Login")
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
