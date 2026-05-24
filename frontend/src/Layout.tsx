import { Outlet } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Toaster } from "react-hot-toast";
import { useTheme } from "./hooks/useTheme";

export function Layout() {
  const { theme } = useTheme();

  return (
    <div className="mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors">
      <Header />
      <Outlet />
      <Footer />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#27272a" : "#fff",
            color: theme === "dark" ? "#fff" : "#18181b",
            border: theme === "dark" ? "1px solid #3f3f46" : "1px solid #e4e4e7",
          },
        }}
      />
    </div>
  );
}
