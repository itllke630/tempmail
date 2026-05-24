import { Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AdSlot } from "./components/ads/AdSlot";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./hooks/useTheme";

function AdTop({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const htmlRef = useRef(html);
  htmlRef.current = html;

  useEffect(() => {
    const iframe = ref.current;
    if (!iframe) return;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      if (!doc || !htmlRef.current) return;
      doc.open();
      doc.write(htmlRef.current);
      doc.close();
    };

    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, []);

  return (
    <div className="w-full flex justify-center pb-4">
      <iframe
        ref={ref}
        title="ad"
        style={{ width: "728px", height: "90px", border: "none" }}
        scrolling="no"
        sandbox="allow-scripts allow-popups allow-top-navigation-by-user-activation"
      />
    </div>
  );
}

export function Layout() {
  const { theme } = useTheme();
  const [adTopHtml, setAdTopHtml] = useState("");

  useEffect(() => {
    fetch("/api/ad-top").then(r => r.json()).then(d => setAdTopHtml(d.html || "")).catch(() => {});
  }, []);

  return (
    <div className="mx-auto min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Header />
      <div className="pt-16">
        {adTopHtml ? <AdTop html={adTopHtml} /> : <AdSlot variant="leaderboard" className="py-4 px-4" />}
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
