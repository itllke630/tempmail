import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AdSlot } from "./components/ads/AdSlot";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./hooks/useTheme";

function AdFrame({
  html,
  width,
  height,
  className,
}: {
  html: string;
  width: number;
  height: number;
  className?: string;
}) {
  if (!html) return null;
  return (
    <div className={className}>
      <iframe
        srcDoc={html}
        title="ad"
        style={{ width, height, border: "none", display: "block" }}
        scrolling="no"
        sandbox="allow-scripts allow-popups"
      />
    </div>
  );
}

export function Layout() {
  const { theme } = useTheme();
  const [topAd, setTopAd] = useState("");
  const [leftAd, setLeftAd] = useState("");
  const [rightAd, setRightAd] = useState("");

  useEffect(() => {
    fetch("/api/ad-top").then(r => r.json()).then(d => setTopAd(d.html || "")).catch(() => {});
    fetch("/api/ad-left").then(r => r.json()).then(d => setLeftAd(d.html || "")).catch(() => {});
    fetch("/api/ad-right").then(r => r.json()).then(d => setRightAd(d.html || "")).catch(() => {});
  }, []);

  return (
    <div className="mx-auto min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />

      {/* 左右侧边广告 — 仅桌面端可见 */}
      <AdFrame html={leftAd} width={160} height={600} className="hidden xl:block fixed left-4 top-20 z-10" />
      <AdFrame html={rightAd} width={160} height={600} className="hidden xl:block fixed right-4 top-20 z-10" />

      <div className="pt-16">
        {/* 顶部横幅广告 */}
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
