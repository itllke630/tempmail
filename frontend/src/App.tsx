import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { ApiDocs } from "./pages/ApiDocs";
import { ConfigContext, AppConfig } from "./hooks/useConfig";
import { Layout } from "./Layout";
import { ThemeProvider } from "./hooks/useTheme";
import { TeamAuthProvider } from "./hooks/useTeamAuth";
import { useGA4 } from "./hooks/useGA4";

const queryClient = new QueryClient();

function App() {
  useGA4();

  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    fetch("/config").then((res) => res.json()).then(setConfig);
  }, []);

  if (!config) {
    return (
      <div className="bg-slate-50 dark:bg-zinc-950 text-gray-900 dark:text-white w-screen h-screen flex items-center justify-center text-sm tracking-wide">
        Loading...
      </div>
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
