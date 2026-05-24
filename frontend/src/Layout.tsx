import { Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AdSlot } from "./components/ads/AdSlot";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./hooks/useTheme";

function AdTop({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !html) return;
    const el = ref.current;
    el.innerHTML = "";

    const temp = document.createElement("div");
    temp.innerHTML = html;

    const originalWrite = document.write.bind(document);
    document.write = function (markup: string) {
      el.innerHTML += markup;
    } as typeof document.write;

    while (temp.firstChild) {
      const node = temp.firstChild;
      if (node instanceof HTMLScriptElement) {
        const script = document.createElement("script");
        Array.from(node.attributes).forEach((a) => script.setAttribute(a.name, a.value));
        if (node.src) {
          script.src = node.src;
          document.body.appendChild(script);
          script.addEventListener("load", () => script.remove());
          script.addEventListener("error", () => script.remove());
        } else {
          script.textContent = node.textContent;
          document.body.appendChild(script);
          script.remove();
        }
        node.remove();
      } else {
        el.appendChild(node);
      }
    }

    return () => {
      document.write = originalWrite;
    };
  }, [html]);

  return <div ref={ref} className="w-full flex justify-center pb-4" />;
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
