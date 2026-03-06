import { useState } from "react";
import { format } from "date-fns";
import { RefreshCcw } from "lucide-react";
import { TopHeader } from "./components/layout/TopHeader";
import { BottomTabBar } from "./components/layout/BottomTabBar";
import { DesktopSidebar } from "./components/layout/DesktopSidebar";
import { LoginView } from "./components/views/LoginView";
import { DashboardView } from "./components/views/DashboardView";
import { ContributorsView } from "./components/views/ContributorsView";
import { CollectionView } from "./components/views/CollectionView";
import { InvestmentsView } from "./components/views/InvestmentsView";
import { ReportsView } from "./components/views/ReportsView";
import { SettingsView } from "./components/views/SettingsView";
import { validateAppLogin } from "./data/auth";
import { useDonations } from "./hooks/useDonations";
import { useContributors } from "./hooks/useContributors";
import { useInvestments } from "./hooks/useInvestments";
import { generateDonationReceipt } from "./services/receipt";
import type { Donation, DonationFilters } from "./types/donation";
import type { AppTab } from "./types/ui";

const AuthenticatedApp = () => {
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
    void generateDonationReceipt(donation).catch((error: unknown) => {
      window.alert(error instanceof Error ? error.message : "Could not generate receipt.");
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
      <TopHeader onOpenSettings={() => setActiveTab("settings")} />

      <div className="tf-app-layout">
        <DesktopSidebar activeTab={activeTab} onChange={setActiveTab} />

        <main className="tf-main-surface">
          <div className="tf-main-inner">
            <div className="tf-desktop-toolbar">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {format(new Date(), "EEEE, MMMM d")}
                </p>
                <h2 className="text-2xl font-bold text-[var(--tf-navy)]">Hello, Taba Team</h2>
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (email: string, password: string) => {
    const isValid = validateAppLogin(email, password);
    if (isValid) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  if (!isAuthenticated) {
    return (
      <div className="tf-app-shell">
        <LoginView onLogin={handleLogin} />
      </div>
    );
  }

  return <AuthenticatedApp />;
}

export default App;
