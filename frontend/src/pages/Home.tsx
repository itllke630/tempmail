import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

import { getEmails, getMailboxMeta, deleteEmails, verifyTurnstile, loginByPassword } from "../services/api";
import { useConfig } from "../hooks/useConfig";
import { useTeamAuth } from "../hooks/useTeamAuth";
import { usePasswordModal } from "../components/password";
import { encrypt } from "../lib/utlis";
import { extractOtpsFromEmail } from "../lib/otp";
import { EmailControls, generateRandomLocalPart } from "../components/controls/EmailControls";
import { EmailListPanel } from "../components/email/EmailListPanel";
import { TeamLoginModal } from "../components/modals/TeamLoginModal";
import { PasswordIcon, Close } from "../components/icons";
import { CopyButton } from "../components/CopyButton";
import type { Email } from "../database_types";

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
    if (teamAuth.isAuthenticated && teamAuth.teamDomains.length > 0) {
      return teamAuth.teamDomains[0];
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [hasReceivedEmail, setHasReceivedEmail] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { PasswordModal, setShowPasswordModal } = usePasswordModal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  // 30 秒自动刷新
  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => { refetch(); }, 30_000);
    return () => clearInterval(interval);
  }, [address, refetch]);

  // 更新团队域名默认值
  useEffect(() => {
    if (teamAuth.isAuthenticated && teamAuth.teamDomains.length > 0) {
      setSelectedDomain(teamAuth.teamDomains[0]);
    }
  }, [teamAuth.isAuthenticated]);

  // 自动创建地址
  useEffect(() => {
    if (address) return;
    const create = async () => {
      setIsCreating(true);
      try {
        await verifyTurnstile(config.turnstileEnabled ? turnstileToken : undefined);
        const addr = `${localPart}@${selectedDomain}`;
        const now = Date.now();
        const expires = now + ttlHours * 60 * 60 * 1000;
        Cookies.set("userMailbox", addr, { expires: 1 });
        Cookies.set("emailExpiry", expires.toString(), { expires: 1 });
        setAddress(addr);
        setExpiryTimestamp(expires);
        toast.success(t("Email created"));
      } catch {
        // Turnstile not ready yet, will retry when token changes
      } finally {
        setIsCreating(false);
      }
    };
    create();
  }, [address, turnstileToken]);

  useEffect(() => {
    if (emails.length > 0 && !hasReceivedEmail) setHasReceivedEmail(true);
    if (!address) {
      setHasReceivedEmail(false);
      setExpiryTimestamp(undefined);
      toast.dismiss("password-notification");
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
    const newLocal = generateRandomLocalPart();
    setLocalPart(newLocal);
    if (config.turnstileEnabled && !turnstileToken) {
      toast.error(t("No captcha response"));
      return;
    }
    try {
      await verifyTurnstile(config.turnstileEnabled ? turnstileToken : undefined);
      updateAddress(newLocal, selectedDomain);
      toast.success(t("New address generated"));
    } catch {
      toast.error(t("Failed to verify captcha"));
    }
  };

  const handleRefresh = () => { refetch(); toast.success(t("Mailbox refreshed")); };

  const handleResetExpiry = useCallback(() => {
    const newExpiry = Date.now() + ttlHours * 60 * 60 * 1000;
    const cookieExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    Cookies.set("emailExpiry", newExpiry.toString(), { expires: cookieExpires });
    setExpiryTimestamp(newExpiry);
    toast.success(t("Validity reset successfully"));
  }, [t, ttlHours]);

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

  const handleLogin = async (password: string) => {
    setIsLoggingIn(true);
    try {
      const data = await loginByPassword(password);
      const domain = data.address.split("@")[1];
      const now = Date.now();
      const expires = now + ttlHours * 60 * 60 * 1000;
      Cookies.set("userMailbox", data.address, { expires: 1 });
      Cookies.set("emailExpiry", expires.toString(), { expires: 1 });
      setLocalPart(data.address.split("@")[0]);
      setSelectedDomain(domain);
      setAddress(data.address);
      setExpiryTimestamp(expires);
      setShowPasswordModal(false);
      toast.success(t("Login successful"));
    } catch (error: any) {
      toast.error(`${t("Login failed")}: ${t(error.message)}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const getPassword = useCallback(() => {
    if (address && config.cookiesSecret) return encrypt(address, config.cookiesSecret);
    return null;
  }, [address, config.cookiesSecret]);

  const showPasswordToast = useCallback((password: string) => {
    toast((instance) => (
      <div className="w-full max-w-lg p-4 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <PasswordIcon className="h-5 w-5 text-cyan-500" />
            <h3 className="text-base font-semibold">{t("View password")}</h3>
          </div>
          <button onClick={() => toast.dismiss(instance.id)} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <Close className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("Save your password and continue using this email in 1 day")}</p>
        <div className="mt-2 flex items-center text-sm bg-gray-100 dark:bg-zinc-700 px-2 py-1 rounded">
          <span className="flex-1 font-mono break-all">{password}</span>
          <CopyButton text={password} className="p-1" />
        </div>
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{t("Remember your password, otherwise your email will expire and cannot be retrieved")}</p>
      </div>
    ), { id: "password-notification", duration: 5000, position: "top-center", style: { background: "transparent", border: "none", padding: 0, boxShadow: "none" } });
  }, [t]);

  const fullAddress = `${localPart}@${selectedDomain}`;

  return (
    <div className="flex flex-col gap-5 items-center pt-20 pb-10 px-4 md:px-6 max-w-6xl mx-auto w-full">
      <PasswordModal onLogin={handleLogin} isLoggingIn={isLoggingIn} />

      <EmailControls
        localPart={localPart}
        domain={selectedDomain}
        config={config}
        teamDomains={teamAuth.teamDomains}
        isTeamMode={teamAuth.isAuthenticated}
        fullAddress={fullAddress}
        isFetching={isFetching}
        onLocalPartChange={handleLocalPartChange}
        onDomainChange={handleDomainChange}
        onRandom={handleRandom}
        onRefresh={handleRefresh}
      />

      <div className="w-full flex justify-center gap-2">
        <button
          onClick={() => { const pw = getPassword(); if (pw) showPasswordToast(pw); }}
          className="text-xs text-gray-400 dark:text-zinc-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        >
          {t("View password")}
        </button>
        {!teamAuth.isAuthenticated ? (
          <button
            onClick={() => setShowTeamModal(true)}
            className="text-xs text-gray-400 dark:text-zinc-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
          >
            {t("Team Login")}
          </button>
        ) : (
          <button
            onClick={teamAuth.logout}
            className="text-xs text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
          >
            {t("Team Logout")}
          </button>
        )}
      </div>

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
        onShowPassword={() => { const pw = getPassword(); if (pw) showPasswordToast(pw); }}
        getOtpsForEmail={extractOtpsFromEmail}
        lastViewedAt={null}
      />

      <TeamLoginModal
        show={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onLogin={teamAuth.login}
        isLoggingIn={teamAuth.isLoading}
        error={teamAuth.error}
      />
    </div>
  );
}
