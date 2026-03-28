import { useEffect, useState } from "react";
import { format } from "date-fns";
import { RefreshCcw } from "lucide-react";
import { BottomTabBar } from "./components/layout/BottomTabBar";
import { DesktopSidebar } from "./components/layout/DesktopSidebar";
import { TopHeader } from "./components/layout/TopHeader";
import { CollectionView } from "./components/views/CollectionView";
import { ContributorsView } from "./components/views/ContributorsView";
import { DashboardView } from "./components/views/DashboardView";
import { InvestmentsView } from "./components/views/InvestmentsView";
import { LoginView } from "./components/views/LoginView";
import { ReportsView } from "./components/views/ReportsView";
import { SettingsView } from "./components/views/SettingsView";
import { useContributors } from "./hooks/useContributors";
import { useDonations } from "./hooks/useDonations";
import { useInvestments } from "./hooks/useInvestments";
import { AUTH_EXPIRED_EVENT, authApi, authStorage } from "./services/api";
import { generateDonationReceipt, printDonationReceipt } from "./services/receipt";
import type { AuthSession, AuthUser } from "./types/auth";
import type { Donation, DonationFilters } from "./types/donation";
import type { AppTab } from "./types/ui";

interface AuthenticatedAppProps {
  currentUser: AuthUser;
  onLogout: () => void;
}

const AuthenticatedApp = ({ currentUser, onLogout }: AuthenticatedAppProps) => {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [filters, setFilters] = useState<DonationFilters>({});
  const [activeReceiptId, setActiveReceiptId] = useState<string | null>(null);
  const { donations, loading, submitting, error, createDonation, refreshData, emailReceipt } =
    useDonations(filters);
  const {
    contributors,
    loading: contributorsLoading,
    submitting: contributorSubmitting,
    error: contributorError,
    createContributor,
    updateContributor,
    deleteContributor,
    refreshContributors,
  } = useContributors();
  const {
    investments,
    totalInvested,
    loading: investmentsLoading,
    submitting: investmentSubmitting,
    error: investmentError,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    refreshInvestments,
  } = useInvestments();

  const handleDownloadReceipt = (donation: Donation) => {
    void generateDonationReceipt(donation).catch((requestError: unknown) => {
      window.alert(requestError instanceof Error ? requestError.message : "Could not generate receipt.");
    });
  };

  const handlePrintReceipt = (donation: Donation) => {
    void printDonationReceipt(donation).catch((requestError: unknown) => {
      window.alert(requestError instanceof Error ? requestError.message : "Could not print receipt.");
    });
  };

  const handleEmailReceipt = async (donation: Donation) => {
    const email = window.prompt("Send receipt to email", donation.donorEmail ?? "");
    if (!email) {
      return;
    }

    setActiveReceiptId(donation._id);
    try {
      await emailReceipt(donation._id, email);
      window.alert("Receipt email queued successfully.");
    } catch (requestError) {
      window.alert(
        requestError instanceof Error ? requestError.message : "Could not send receipt email.",
      );
    } finally {
      setActiveReceiptId(null);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "contributors":
        return (
          <ContributorsView
            contributors={contributors}
            donations={donations}
            loading={contributorsLoading}
            submitting={contributorSubmitting}
            error={contributorError}
            onSearch={refreshContributors}
            onCreateContributor={createContributor}
            onUpdateContributor={updateContributor}
            onDeleteContributor={deleteContributor}
          />
        );
      case "collection":
        return (
          <CollectionView
            filters={filters}
            onChangeFilters={setFilters}
            donations={donations}
            contributors={contributors}
            loading={loading}
            submitting={submitting}
            activeReceiptId={activeReceiptId}
            onSubmit={createDonation}
            onPrintReceipt={handlePrintReceipt}
            onDownloadReceipt={handleDownloadReceipt}
            onEmailReceipt={handleEmailReceipt}
            onRefresh={refreshData}
            onContributorCreated={refreshContributors}
          />
        );
      case "investments":
        return (
          <InvestmentsView
            investments={investments}
            totalInvested={totalInvested}
            loading={investmentsLoading}
            submitting={investmentSubmitting}
            error={investmentError}
            onSearch={refreshInvestments}
            onCreateInvestment={createInvestment}
            onUpdateInvestment={updateInvestment}
            onDeleteInvestment={deleteInvestment}
          />
        );
      case "reports":
        return (
          <ReportsView
            donations={donations}
            investments={investments}
            loading={loading || investmentsLoading}
          />
        );
      case "settings":
        return (
          <SettingsView
            currentUser={currentUser}
            contributors={contributors}
            donations={donations}
            investments={investments}
            onRefreshAll={async () => {
              await Promise.all([refreshData(), refreshContributors(), refreshInvestments()]);
            }}
          />
        );
      default:
        return (
          <DashboardView
            donations={donations}
            investments={investments}
            onCreateCollection={() => setActiveTab("collection")}
            onViewContributors={() => setActiveTab("contributors")}
          />
        );
    }
  };

  return (
    <div className="tf-app-shell">
      <TopHeader
        currentUser={currentUser}
        onOpenSettings={() => setActiveTab("settings")}
        onLogout={onLogout}
      />

      <div className="tf-app-layout">
        <DesktopSidebar currentUser={currentUser} activeTab={activeTab} onChange={setActiveTab} />

        <main className="tf-main-surface">
          <div className="tf-main-inner">
            <div className="tf-desktop-toolbar">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {format(new Date(), "EEEE, MMMM d")}
                </p>
                <h2 className="text-2xl font-bold text-[var(--tf-navy)]">Hello, {currentUser.name}</h2>
              </div>
              <button
                className="tf-btn-outline"
                type="button"
                onClick={() => {
                  if (activeTab === "contributors") {
                    void refreshContributors();
                    return;
                  }
                  if (activeTab === "investments") {
                    void refreshInvestments();
                    return;
                  }
                  void Promise.all([refreshData(), refreshContributors(), refreshInvestments()]);
                }}
              >
                <RefreshCcw
                  size={16}
                  className={loading || contributorsLoading || investmentsLoading ? "animate-spin" : ""}
                />
                Refresh Data
              </button>
            </div>

            {(error || contributorError || investmentError) && (
              <p className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-600">
                {error ?? contributorError ?? investmentError}
              </p>
            )}

            {renderContent()}
          </div>
        </main>
      </div>

      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
};

function App() {
  const [session, setSession] = useState<AuthSession | null>(() => authStorage.getSession());

  useEffect(() => {
    const handleAuthExpired = () => {
      authStorage.clearSession();
      setSession(null);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }

    let cancelled = false;
    const verifySession = async () => {
      try {
        const user = await authApi.getCurrentUser();
        if (cancelled) {
          return;
        }
        const nextSession = { token: session.token, user };
        authStorage.setSession(nextSession);
        setSession(nextSession);
      } catch {
        if (cancelled) {
          return;
        }
        authStorage.clearSession();
        setSession(null);
      }
    };

    void verifySession();
    return () => {
      cancelled = true;
    };
  }, [session?.token]);

  const handleLogin = async (email: string, password: string) => {
    const nextSession = await authApi.login(email, password);
    authStorage.setSession(nextSession);
    setSession(nextSession);
  };

  const handleLogout = () => {
    authStorage.clearSession();
    setSession(null);
  };

  if (!session) {
    return (
      <div className="tf-app-shell">
        <LoginView onLogin={handleLogin} />
      </div>
    );
  }

  return <AuthenticatedApp currentUser={session.user} onLogout={handleLogout} />;
}

export default App;
