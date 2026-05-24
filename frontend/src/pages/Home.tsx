import { useEffect, useState, useRef, useCallback } from "react"; // useRef still used by mailboxMetaSignatureRef
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import randomName from "@scaleway/random-name";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";

import { getEmails, getMailboxMeta, deleteEmails, verifyTurnstile, loginByPassword } from "../services/api";
import { useConfig } from "../hooks/useConfig";
import { useTeamAuth } from "../hooks/useTeamAuth";
import { usePasswordModal } from "../components/password";
import { getRandomCharacter, encrypt } from "../lib/utlis";
import { extractOtpsFromEmail } from "../lib/otp";
import { ControlPanel } from "../components/controls/ControlPanel";
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

  const [address, setAddress] = useState<string | undefined>(() => Cookies.get("userMailbox"));
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | undefined>(() => {
    const expiry = Cookies.get("emailExpiry");
    return expiry ? parseInt(expiry, 10) : undefined;
  });
  const [turnstileToken, setTurnstileToken] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedDomain, setSelectedDomain] = useState(config.emailDomain[0]);
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

  useEffect(() => {
    if (emails.length > 0 && !hasReceivedEmail) setHasReceivedEmail(true);
    if (!address) {
      setHasReceivedEmail(false);
      setExpiryTimestamp(undefined);
      toast.dismiss("password-notification");
    }
  }, [emails, address, hasReceivedEmail]);

  const handleCreateAddress = async () => {
    if (config.turnstileEnabled && !turnstileToken) {
      toast.error(t("No captcha response"));
      return;
    }
    setIsCreating(true);
    try {
      await verifyTurnstile(config.turnstileEnabled ? turnstileToken : undefined);
      const mailbox = `${randomName("", getRandomCharacter())}@${selectedDomain}`;
      const now = Date.now();
      const expires = now + ttlHours * 60 * 60 * 1000;
      Cookies.set("userMailbox", mailbox, { expires: 1 });
      Cookies.set("emailExpiry", expires.toString(), { expires: 1 });
      setAddress(mailbox);
      setExpiryTimestamp(expires);
      setHasReceivedEmail(false);
      toast.success(t("Email created successfully"));
    } catch {
      toast.error(t("Failed to verify captcha"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleStopAddress = () => {
    Cookies.remove("userMailbox");
    Cookies.remove("emailExpiry");
    setAddress(undefined);
    mailboxMetaSignatureRef.current = null;
    setHasReceivedEmail(false);
    setSelectedEmail(null);
    setExpiryTimestamp(undefined);
    queryClient.invalidateQueries({ queryKey: ["emails"] });
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
      const now = Date.now();
      const expires = now + ttlHours * 60 * 60 * 1000;
      Cookies.set("userMailbox", data.address, { expires: 1 });
      Cookies.set("emailExpiry", expires.toString(), { expires: 1 });
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

  return (
    <div className="flex flex-col md:flex-row gap-5 justify-center items-start pt-20 pb-10 px-4 md:px-6 max-w-6xl mx-auto w-full">
      <PasswordModal onLogin={handleLogin} isLoggingIn={isLoggingIn} />

      <ControlPanel
        config={config}
        address={address}
        expiryTimestamp={expiryTimestamp}
        selectedDomain={selectedDomain}
        teamDomains={teamAuth.teamDomains}
        isTeamMode={teamAuth.isAuthenticated}
        teamName={teamAuth.teamName}
        onDomainSelect={setSelectedDomain}
        onTeamLoginClick={() => setShowTeamModal(true)}
        onTeamLogout={teamAuth.logout}
        onCreateAddress={handleCreateAddress}
        isCreating={isCreating}
        turnstileToken={turnstileToken}
        onTurnstileSuccess={setTurnstileToken}
        onStop={handleStopAddress}
        onRefresh={handleRefresh}
        isFetching={isFetching}
        onDeleteAll={() => handleDeleteEmails(emails.map((e) => e.id))}
        hasEmails={emails.length > 0}
        onShowPassword={() => { const pw = getPassword(); if (pw) showPasswordToast(pw); }}
        onResetExpiry={handleResetExpiry}
      />

      <EmailListPanel
        isAddressCreated={!!address}
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
