import { Outlet } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AdSlot } from "./components/ads/AdSlot";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./hooks/useTheme";
import { useConfig } from "./hooks/useConfig";

function AdTop({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !html) return;
    ref.current.innerHTML = "";
    const fragment = document.createRange().createContextualFragment(html);
    ref.current.appendChild(fragment);
  }, [html]);

  return <div ref={ref} className="w-full flex justify-center pb-4" />;
}

export function Layout() {
  const { theme } = useTheme();
  const config = useConfig();

  return (
    <div className="mx-auto min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />
      <div className="pt-16">
        {config.adTopHtml ? <AdTop html={config.adTopHtml} /> : null}
        <AdSlot variant="leaderboard" className="py-4 px-4" />
        <Outlet />
      </div>
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#27272a" : "#fff",
            color: theme === "dark" ? "#fff" : "#18181b",
            border: theme === "dark" ? "1px solid #3f3f46" : "1px solid #e4e4e7",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />
    </div>
  );
}
