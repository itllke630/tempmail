import { Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AdSlot } from "./components/ads/AdSlot";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./hooks/useTheme";
import { useConfig } from "./hooks/useConfig";

export function Layout() {
  const { theme } = useTheme();
  const config = useConfig();

  return (
    <div className="mx-auto min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      {config.adTopHtml ? (
        <div className="w-full flex justify-center" dangerouslySetInnerHTML={{ __html: config.adTopHtml }} />
      ) : null}
      <Header />
      <div className="pt-16">
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
