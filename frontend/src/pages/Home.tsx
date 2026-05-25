import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

import { getEmails, getMailboxMeta, deleteEmails, verifyTurnstile } from "../services/api";
import { useConfig } from "../hooks/useConfig";
import { useTeamAuth } from "../hooks/useTeamAuth";
import { extractOtpsFromEmail } from "../lib/otp";
import { Turnstile } from "@marsidev/react-turnstile";
import { EmailControls, generateRandomLocalPart } from "../components/controls/EmailControls";
import { EmailListPanel } from "../components/email/EmailListPanel";
import { AdFrame } from "../components/ads/AdFrame";
import { SeoMarketing } from "../components/SeoMarketing";
import type { Email } from "../database_types";

const TG_KEY = "vmail_telegram_enabled";

export function Home() {
  const config = useConfig();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const teamAuth = useTeamAuth();

  const [localPart, setLocalPart] = useState(() => {
    const addr = Cookies.get("userMailbox");
    if (addr) return addr.split("@")[0];
    return generateRandomLocalPart();
  });

  const getInitialDomain = () => {
    if (teamAuth.isAuthenticated) {
      const allTeamDomains = [...new Set([...config.teamDomains, ...teamAuth.teamDomains])];
      if (allTeamDomains.length > 0) return allTeamDomains[0];
    }
    return config.emailDomain[0];
  };

  const [selectedDomain, setSelectedDomain] = useState(getInitialDomain);
  const [address, setAddress] = useState<string | undefined>(() => Cookies.get("userMailbox") || undefined);
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | undefined>(() => {
    const expiry = Cookies.get("emailExpiry");
    return expiry ? parseInt(expiry, 10) : undefined;
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [hasReceivedEmail, setHasReceivedEmail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(() => {
    try { return localStorage.getItem(TG_KEY) === "true"; } catch { return false; }
  });
  const [randomLength, setRandomLength] = useState(10);
  const [leftAd, setLeftAd] = useState("");
  const [rightAd, setRightAd] = useState("");
  const [infeedAd, setInfeedAd] = useState("");

  const ttlHours = config.domainTtlConfig?.[selectedDomain] ?? 24;

  const { data: emails = [], isLoading, isFetching, refetch } = useQuery<Email[]>({
    queryKey: ["emails", address],
    queryFn: () => getEmails(address!, 50),
    enabled: !!address,
    refetchInterval: false,
    retry: false,
  });

  const mailboxMetaSignatureRef = useRef<string | null>(null);

  useQuery({
    queryKey: ["emails-meta", address],
    queryFn: () => getMailboxMeta(address!),
    enabled: !!address,
    refetchInterval: () => (document.visibilityState === "visible" ? 60_000 : false),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
    onSuccess: (meta) => {
      const signature = `${meta.count}:${meta.latestEmailCreatedAt ?? ""}`;
      if (mailboxMetaSignatureRef.current === null) {
        mailboxMetaSignatureRef.current = signature;
        return;
      }
      if (mailboxMetaSignatureRef.current !== signature) {
        mailboxMetaSignatureRef.current = signature;
        queryClient.invalidateQueries({ queryKey: ["emails", address] });
      }
    },
  });

  // 30s auto-refresh
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => { refetch(); }, 30_000);
    return () => clearInterval(interval);
  }, [address, refetch]);

  // Persist Telegram toggle
  useEffect(() => {
    try { localStorage.setItem(TG_KEY, String(telegramEnabled)); } catch { /* noop */ }
  }, [telegramEnabled]);

  // Update team domain default
  useEffect(() => {
    if (teamAuth.isAuthenticated) {
      const allTeamDomains = [...new Set([...config.teamDomains, ...teamAuth.teamDomains])];
      if (allTeamDomains.length > 0) setSelectedDomain(allTeamDomains[0]);
    }
  }, [teamAuth.isAuthenticated]);

  // Auto-create address
  useEffect(() => {
    if (address) return;
    if (config.turnstileEnabled && !turnstileToken) return;
    const create = async () => {
      setIsCreating(true);
      try {
        if (config.turnstileEnabled) {
          await verifyTurnstile(turnstileToken);
        }
        const addr = `${localPart}@${selectedDomain}`;
        const now = Date.now();
        const expires = now + ttlHours * 60 * 60 * 1000;
        Cookies.set("userMailbox", addr, { expires: 1 });
        Cookies.set("emailExpiry", expires.toString(), { expires: 1 });
        setAddress(addr);
        setExpiryTimestamp(expires);
        setTurnstileToken("");
        setTurnstileKey(k => k + 1);
      } catch {
        // Turnstile not ready yet
      } finally {
        setIsCreating(false);
      }
    };
    create();
  }, [address, turnstileToken]);

  useEffect(() => {
    fetch("/api/ad-left").then(r => r.json()).then(d => setLeftAd(d.html || "")).catch(() => {});
    fetch("/api/ad-right").then(r => r.json()).then(d => setRightAd(d.html || "")).catch(() => {});
    fetch("/api/ad-infeed").then(r => r.json()).then(d => setInfeedAd(d.html || "")).catch(() => {});
  }, []);

  useEffect(() => {
    if (emails.length > 0 && !hasReceivedEmail) setHasReceivedEmail(true);
    if (!address) {
      setHasReceivedEmail(false);
      setExpiryTimestamp(undefined);
    }
  }, [emails, address, hasReceivedEmail]);

  const updateAddress = useCallback((newLocal: string, newDomain: string) => {
    const addr = `${newLocal}@${newDomain}`;
    const newTtlHours = config.domainTtlConfig?.[newDomain] ?? 24;
    const now = Date.now();
    const expires = now + newTtlHours * 60 * 60 * 1000;
    Cookies.set("userMailbox", addr, { expires: 1 });
    Cookies.set("emailExpiry", expires.toString(), { expires: 1 });
    setAddress(addr);
    setExpiryTimestamp(expires);
    setHasReceivedEmail(false);
    queryClient.invalidateQueries({ queryKey: ["emails"] });
  }, [config.domainTtlConfig, queryClient]);

  const handleLocalPartChange = (value: string) => {
    setLocalPart(value);
    if (value) updateAddress(value, selectedDomain);
  };

  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain);
    updateAddress(localPart, domain);
  };

  const handleRandom = async () => {
    if (randomLength < 5 || randomLength > 30) {
      toast.error(t("Random name length must be between 5 and 30"));
      return;
    }
    const newLocal = generateRandomLocalPart(randomLength);
    setLocalPart(newLocal);
    updateAddress(newLocal, selectedDomain);
    if (config.turnstileEnabled && !turnstileToken) {
      toast.error(t("No captcha response"));
      return;
    }
    try {
      if (config.turnstileEnabled) {
        await verifyTurnstile(turnstileToken);
      }
      setTurnstileToken("");
      setTurnstileKey(k => k + 1);
      toast.success(t("New address generated"));
    } catch {
      toast.error(t("Failed to verify captcha"));
    }
  };

  const handleRefresh = () => { refetch(); };

  const handleToggleTelegram = () => {
    const next = !telegramEnabled;
    setTelegramEnabled(next);
    if (next) {
      const botUsername = config.telegramBotUsername;
      if (botUsername) {
        const botUrl = `https://t.me/${botUsername}`;
        window.open(botUrl, "_blank", "noopener");
        toast.success(t("Open Telegram bot to subscribe"), { icon: "🤖" });
      } else {
        toast.success(t("Telegram notifications enabled"), { icon: "🤖" });
      }
    }
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteEmails(ids),
    onSuccess: () => {
      toast.success(t("Emails deleted successfully"));
      setSelectedIds([]);
      if (selectedEmail && selectedIds.includes(selectedEmail.id)) setSelectedEmail(null);
      queryClient.invalidateQueries({ queryKey: ["emails", address] });
    },
    onError: () => toast.error(t("Failed to delete emails")),
  });

  const handleDeleteEmails = (ids: string[]) => {
    if (ids.length === 0) { toast.error(t("Please select emails to delete")); return; }
    deleteMutation.mutate(ids);
  };

  const fullAddress = `${localPart}@${selectedDomain}`;

  return (
    <>
      {/* Email controls: constrained width, centered */}
      <div className="max-w-2xl mx-auto px-4 md:px-6 pt-5 space-y-3">
        <EmailControls
          localPart={localPart}
          domain={selectedDomain}
          config={config}
          teamDomains={teamAuth.teamDomains}
          isTeamMode={teamAuth.isAuthenticated}
          fullAddress={fullAddress}
          isFetching={isFetching}
          telegramEnabled={telegramEnabled}
          randomLength={randomLength}
          onLocalPartChange={handleLocalPartChange}
          onDomainChange={handleDomainChange}
          onRandom={handleRandom}
          onRefresh={handleRefresh}
          onToggleTelegram={handleToggleTelegram}
          onRandomLengthChange={setRandomLength}
        />

        {config.turnstileEnabled && (
          <div className="fixed bottom-4 right-4 z-50">
            <Turnstile
              key={turnstileKey}
              siteKey={config.turnstileKey}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
              options={{ theme: "auto", size: "compact" }}
            />
          </div>
        )}
      </div>

      {/* Three-column layout: left ad | center inbox | right ad */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-5 pb-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-5">

          {/* Left skyscraper ad */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-20 flex justify-center">
              <AdFrame html={leftAd} width={160} height={600} />
            </div>
          </aside>

          {/* Center: Inbox */}
          <main className="lg:col-span-8">
            <EmailListPanel
              emails={emails}
              isLoading={isLoading}
              isFetching={isFetching}
              isDeleting={deleteMutation.isPending}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              selectedEmail={selectedEmail}
              onSelectEmail={setSelectedEmail}
              onCloseDetail={() => setSelectedEmail(null)}
              onExpand={() => {}}
              onDelete={handleDeleteEmails}
              onRefresh={handleRefresh}
              getOtpsForEmail={extractOtpsFromEmail}
              lastViewedAt={null}
              infeedAdHtml={infeedAd}
            />
          </main>

          {/* Right skyscraper ad */}
          <aside className="hidden lg:block lg:col-span-2">
            <div className="sticky top-20 flex justify-center">
              <AdFrame html={rightAd} width={160} height={600} />
            </div>
          </aside>

        </div>
      </div>

      {/* SEO Marketing Section */}
      <SeoMarketing />
    </>
  );
}
