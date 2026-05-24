import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { ApiDocs } from "./pages/ApiDocs";
import { ConfigContext, AppConfig } from "./hooks/useConfig";
import { getUnlockStatus, unlockSite } from "./services/api";
import { SiteUnlock } from "./components/SiteUnlock";
import { Layout } from "./Layout";
import { ThemeProvider } from "./hooks/useTheme";
import { TeamAuthProvider } from "./hooks/useTeamAuth";

const queryClient = new QueryClient();

function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    fetch("/config").then((res) => res.json()).then(setConfig);
  }, []);

  useEffect(() => {
    if (!config) return;
    if (!config.sitePasswordEnabled) {
      setIsUnlocked(true);
      return;
    }
    getUnlockStatus()
      .then((status) => setIsUnlocked(status.unlocked || !status.sitePasswordEnabled))
      .catch(() => setIsUnlocked(false));
  }, [config]);

  const handleUnlock = async (password: string) => {
    setIsUnlocking(true);
    setUnlockError(null);
    try {
      await unlockSite(password);
      setIsUnlocked(true);
    } catch (err: any) {
      setUnlockError(err?.message || "Invalid password");
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!config) {
    return (
      <div className="bg-slate-50 dark:bg-zinc-950 text-gray-900 dark:text-white w-screen h-screen flex items-center justify-center text-sm tracking-wide">
        Loading...
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <ThemeProvider>
        <SiteUnlock onUnlock={handleUnlock} isUnlocking={isUnlocking} error={unlockError} />
      </ThemeProvider>
    );
  }

  return (
    <ConfigContext.Provider value={config}>
      <ThemeProvider>
        <TeamAuthProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/api-docs" element={<ApiDocs />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </QueryClientProvider>
        </TeamAuthProvider>
      </ThemeProvider>
    </ConfigContext.Provider>
  );
}

export default App;
