export type { Email, Address, Header } from "../database_types";

export type Theme = "light" | "dark";

export interface TeamAuthState {
  isAuthenticated: boolean;
  token: string | null;
  teamDomains: string[];
  teamName: string | null;
}

export interface OtpMatch {
  code: string;
  confidence: "high" | "medium" | "low";
}

export interface DomainTtlConfig {
  [domain: string]: number;
}
