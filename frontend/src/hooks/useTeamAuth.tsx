import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { loginByPassword } from "../services/api";
import { useConfig } from "./useConfig";

interface TeamAuthState {
  isAuthenticated: boolean;
  teamDomains: string[];
  teamName: string | null;
}

interface TeamAuthContextValue extends TeamAuthState {
  login: (password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = "vmail_team_auth";

const TeamAuthContext = createContext<TeamAuthContextValue | null>(null);

function isTeamDomain(domain: string, domainTtlConfig: Record<string, number>): boolean {
  const ttl = domainTtlConfig[domain];
  return ttl !== undefined && ttl >= 720;
}

export function TeamAuthProvider({ children }: { children: React.ReactNode }) {
  const config = useConfig();
  const [state, setState] = useState<TeamAuthState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { isAuthenticated: false, teamDomains: [], teamName: null };
      const parsed = JSON.parse(raw);
      if (parsed.teamDomains?.length > 0) {
        return {
          isAuthenticated: true,
          teamDomains: parsed.teamDomains,
          teamName: parsed.teamName || null,
        };
      }
    } catch { /* noop */ }
    return { isAuthenticated: false, teamDomains: [], teamName: null };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.isAuthenticated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const login = useCallback(async (password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { address } = await loginByPassword(password);
      const domain = address.split("@")[1];
      if (!domain || !isTeamDomain(domain, config.domainTtlConfig)) {
        setError("Invalid team credentials");
        setIsLoading(false);
        return;
      }
      const teamDomains = Object.keys(config.domainTtlConfig).filter(
        (d) => isTeamDomain(d, config.domainTtlConfig)
      );
      const newState: TeamAuthState = {
        isAuthenticated: true,
        teamDomains,
        teamName: domain,
      };
      setState(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }, [config.domainTtlConfig]);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, teamDomains: [], teamName: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <TeamAuthContext.Provider value={{ ...state, login, logout, isLoading, error }}>
      {children}
    </TeamAuthContext.Provider>
  );
}

export function useTeamAuth() {
  const ctx = useContext(TeamAuthContext);
  if (!ctx) throw new Error("useTeamAuth must be used within TeamAuthProvider");
  return ctx;
}
