import { Link } from "react-router-dom";
import { VmailLogo, ChevronDown, Sun, Moon } from "./icons";
import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import { InfoModal } from "./InfoModal";
import { About } from "../pages/About";
import { Privacy } from "../pages/Privacy";
import { Terms } from "../pages/Terms";
import { useTheme } from "../hooks/useTheme";

const languages = [
  { code: "zh", name: "简体中文", flag: "🇨🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "zh-TW", name: "繁體中文", flag: "🇹🇼" },
];

export function Header() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = languages.find((l) => {
    if (l.code === i18n.language) return true;
    if (l.code === i18n.language.split("-")[0]) return true;
    return false;
  }) || languages[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="fixed top-0 z-20 h-16 w-full px-5 backdrop-blur-xl md:px-10 text-gray-700 dark:text-white flex items-center justify-between border-b border-gray-200/50 dark:border-zinc-800/50 transition-colors">
        <Link to="/" className="font-bold flex items-center justify-center gap-2">
          <VmailLogo />
          <span className="text-lg font-bold tracking-tight">TEMPMAIL</span>
        </Link>
        <nav className="flex items-center">
          <a
            className="ml-3 md:ml-6 text-sm font-medium hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            href="/api-docs"
          >
            API
          </a>
          <button
            onClick={() => setShowAboutModal(true)}
            className="ml-3 md:ml-6 text-sm font-medium hidden md:block hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            {t("About")}
          </button>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="ml-3 md:ml-6 text-sm font-medium hidden md:block hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            {t("Privacy")}
          </button>
          <button
            onClick={() => setShowTermsModal(true)}
            className="ml-3 md:ml-6 text-sm font-medium hidden md:block hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            {t("Terms")}
          </button>

          <div className="relative ml-3 md:ml-6" ref={langDropdownRef}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1 text-sm hover:text-cyan-600 dark:hover:text-cyan-400 px-2 py-1.5 rounded-lg transition-colors"
            >
              <span>{currentLang.flag}</span>
              <span className="hidden md:inline">{currentLang.name}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showLangDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setShowLangDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 ${
                      currentLang.code === lang.code ? "text-cyan-600 dark:text-cyan-400 font-medium" : "text-gray-700 dark:text-white"
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="ml-3 md:ml-6 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

        </nav>
      </header>

      <InfoModal showModal={showAboutModal} setShowModal={setShowAboutModal} title={t("About")}>
        <About />
      </InfoModal>
      <InfoModal showModal={showPrivacyModal} setShowModal={setShowPrivacyModal} title={t("Privacy")}>
        <Privacy />
      </InfoModal>
      <InfoModal showModal={showTermsModal} setShowModal={setShowTermsModal} title={t("Terms")}>
        <Terms />
      </InfoModal>
    </>
  );
}
