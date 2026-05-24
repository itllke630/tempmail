import { useTranslation } from "react-i18next";
import { Inbox, RefreshCw, Lock } from "../icons";
import { SiteStats } from "../SiteStats";
import { SkeletonLoader } from "./SkeletonLoader";
import { EmptyState } from "./EmptyState";
import { EmailListItem } from "./EmailListItem";
import { EmailDetailView } from "./EmailDetailView";
import { AdCard } from "../ads/AdCard";
import type { Email } from "../../database_types";
import type { OtpMatch } from "../../types";

interface EmailListPanelProps {
  isAddressCreated: boolean;
  emails: Email[];
  isLoading: boolean;
  isFetching: boolean;
  isDeleting: boolean;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedEmail: Email | null;
  onSelectEmail: (email: Email) => void;
  onCloseDetail: () => void;
  onExpand: () => void;
  onDelete: (ids: string[]) => void;
  onRefresh: () => void;
  onShowPassword: () => void;
  getOtpsForEmail: (email: Email) => OtpMatch[];
  lastViewedAt: number | null;
}

export function EmailListPanel({
  isAddressCreated, emails, isLoading, isFetching, isDeleting,
  selectedIds, setSelectedIds, selectedEmail, onSelectEmail,
  onCloseDetail, onExpand, onDelete, onRefresh, onShowPassword,
  getOtpsForEmail, lastViewedAt,
}: EmailListPanelProps) {
  const { t } = useTranslation();

  const isUnread = (email: Email) => {
    if (!lastViewedAt) return true;
    const ts = typeof email.createdAt === "string" ? new Date(email.createdAt).getTime() : email.createdAt?.getTime?.() ?? 0;
    return ts > lastViewedAt;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === emails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map((e) => e.id));
    }
  };

  // If no address created, show stats
  if (!isAddressCreated) {
    return (
      <main className="flex-1">
        <div className="max-w-lg mx-auto">
          <SiteStats />
        </div>
      </main>
    );
  }

  // If an email is selected, show detail view
  if (selectedEmail) {
    return (
      <main className="flex-1">
        <EmailDetailView
          email={selectedEmail}
          otpCodes={getOtpsForEmail(selectedEmail)}
          onClose={onCloseDetail}
          onExpand={onExpand}
          onDelete={() => onDelete([selectedEmail.id])}
        />
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700/50 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Inbox className="w-5 h-5 text-gray-400 dark:text-zinc-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              INBOX
            </h2>
            {!isLoading && (
              <span className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {emails.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSelectAll}
              className="text-xs font-medium text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              {selectedIds.length === emails.length && emails.length > 0 ? t("Deselect all") : t("Select all")}
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => onDelete(selectedIds)}
                disabled={isDeleting}
                className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all disabled:opacity-50"
              >
                {t("Delete")} ({selectedIds.length})
              </button>
            )}
            <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
              <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""} text-gray-400 dark:text-zinc-500`} />
            </button>
            <button onClick={onShowPassword} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
              <Lock className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {isLoading ? (
            <SkeletonLoader />
          ) : emails.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-2">
              {emails.map((email, idx) => (
                <div key={email.id}>
                  <EmailListItem
                    email={email}
                    isSelected={selectedIds.includes(email.id)}
                    onToggle={toggleSelect}
                    onClick={() => onSelectEmail(email)}
                    isUnread={isUnread(email)}
                    otpCodes={getOtpsForEmail(email)}
                  />
                  {/* AdCard after 1st email */}
                  {idx === 0 && <AdCard />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
