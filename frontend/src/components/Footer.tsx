import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <div className="w-full mt-auto flex flex-col items-center justify-between px-5 pt-16 mb-10 md:px-10 mx-auto sm:flex-row text-gray-500 dark:text-gray-400">
      <Link to="/" className="text-xl font-black leading-none select-none text-gray-900 dark:text-white">
        TEMPMAIL
      </Link>
      <p className="mt-4 text-sm sm:ml-4 sm:pl-4 sm:border-l sm:border-gray-300 dark:sm:border-zinc-600 sm:mt-0">
        {t("All rights reserved to TempMail")}
      </p>
    </div>
  );
}
