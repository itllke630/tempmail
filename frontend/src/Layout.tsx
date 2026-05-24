import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AdFrame } from "./components/ads/AdFrame";
import { AdSlot } from "./components/ads/AdSlot";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./hooks/useTheme";

export function Layout() {
  const { theme } = useTheme();
  const [topAd, setTopAd] = useState("");

  useEffect(() => {
    fetch("/api/ad-top").then(r => r.json()).then(d => setTopAd(d.html || "")).catch(() => {});
  }, []);

  return (
    <div className="mx-auto min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />
      <div className="pt-16">
        <AdFrame html={topAd} width={728} height={90} className="w-full flex justify-center pb-4" />
        {!topAd && <AdSlot variant="leaderboard" className="py-4 px-4" />}
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
