import { Link } from "react-router-dom";
import { Twitter, GitHub, MailIcon, WrdoLogo } from "./icons";

export function Footer() {
  return (
    <div className="w-full mt-auto flex flex-col items-center justify-between px-5 pt-16 mb-10 md:px-10 mx-auto sm:flex-row text-gray-500 dark:text-gray-400">
      <Link to="/" className="text-xl font-black leading-none select-none text-gray-900 dark:text-white">
        TEMPMAIL
      </Link>
      <p className="mt-4 text-sm sm:ml-4 sm:pl-4 sm:border-l sm:border-gray-300 dark:sm:border-zinc-600 sm:mt-0">
        &copy; 2024-2026 Products of{" "}
        <a
          className="font-semibold underline hover:text-gray-600 dark:hover:text-gray-300"
          href="https://www.oiov.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          oiov
        </a>
        .
      </p>
      <div className="inline-flex justify-center mt-4 space-x-5 sm:ml-auto sm:mt-0 sm:justify-start">
        <a
          href="https://like.do"
          target="_blank"
          rel="noopener noreferrer"
          title="LikeDo"
          className="hover:text-gray-700 dark:hover:text-gray-300 scale-[1.2] transition-colors"
        >
          <img src="/likedo.svg" alt="LikeDo" className="w-5 h-5" />
        </a>
        <a
          href="mailto:hi@oiov.dev"
          title="Email"
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <MailIcon className="w-5 h-5" />
        </a>
        <a
          href="https://twitter.com/yesmoree"
          target="_blank"
          rel="noopener noreferrer"
          title="Twitter"
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Twitter />
        </a>
        <a
          href="https://github.com/oiov/vmail"
          target="_blank"
          rel="noopener noreferrer"
          title="Github"
          className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <GitHub />
        </a>
      </div>
    </div>
  );
}
