import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Wallet, WifiOff, Lock } from 'lucide-react';
import { db } from './storage/db';
import { getUserSettings } from './storage/settingsRepository';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { PinLockScreen } from './components/security/PinLockScreen';
import { OnboardingModal } from './components/onboarding/OnboardingModal';
import { FloatingNavBar, type NavigationTab } from './components/navigation/FloatingNavBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { BudgetsAnalyticsView } from './components/budgets/BudgetsAnalyticsView';
import { AccountsVaultView } from './components/accounts/AccountsVaultView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { TransferModal } from './components/accounts/TransferModal';
import { InstallPrompt } from './components/pwa/InstallPrompt';

const AppShell: React.FC = () => {
  const security = useSecurity();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isAddTxOpen, setIsAddTxOpen] = useState<boolean>(false);
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState<boolean>(false);

  // Live queries for reactive data
  const userSettings = useLiveQuery(getUserSettings, []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  // When database indicates onboarding has been reset, synchronize local dismissal state
  useEffect(() => {
    if (userSettings && !userSettings.hasCompletedOnboarding) {
      setIsOnboardingDismissed(false);
    }
  }, [userSettings?.hasCompletedOnboarding]);

  const isLoading =
    security.isLoading ||
    userSettings === undefined ||
    accounts === undefined ||
    categories === undefined;
  const hasCompletedOnboarding =
    isOnboardingDismissed || Boolean(userSettings?.hasCompletedOnboarding);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F2E8] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFED9E] border-2 border-dark-anchor flex items-center justify-center shadow-[3px_3px_0px_0px_#111111] animate-bounce">
            <Wallet className="w-7 h-7 text-dark-anchor" />
          </div>
          <p className="font-serif font-bold text-lg text-dark-anchor">Balangay Vault</p>
        </div>
      </div>
    );
  }

  // 1. PIN Lock Screen overlay takes top priority if vault session is locked
  if (security.isLocked) {
    return <PinLockScreen onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#111111] font-sans antialiased flex flex-col selection:bg-butter selection:text-dark-anchor">
      {/* PWA Install Banner */}
      <InstallPrompt />

      {/* Top Navigation Header */}
      <header className="w-full border-b-2 border-dark-anchor bg-[#F7F2E8] px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-2xl bg-butter border-2 border-dark-anchor flex items-center justify-center shadow-[2px_2px_0px_0px_#111111]">
              <Wallet className="w-5 h-5 text-dark-anchor" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl sm:text-2xl tracking-tight leading-none text-dark-anchor">
                Balangay
              </h1>
              <p className="text-[11px] font-medium text-dark-forest/80 tracking-wide mt-0.5">
                Offline Finance Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pistachio border border-dark-anchor text-xs font-bold text-dark-forest shadow-[1px_1px_0px_0px_#111111]">
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Offline Ready</span>
            </div>

            {security.isPinSet && (
              <button
                type="button"
                onClick={() => security.lock()}
                data-testid="header-lock-btn"
                title="Lock Vault"
                aria-label="Lock Vault"
                className="p-2 rounded-xl bg-white border-2 border-dark-anchor shadow-[2px_2px_0px_0px_#111111] hover:bg-stone-50 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all"
              >
                <Lock className="w-4 h-4 text-dark-anchor" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Active View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-28">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={(tab) => setActiveTab(tab as NavigationTab)}
            onOpenAddTransaction={() => setIsAddTxOpen(true)}
            onOpenTransfer={() => setIsTransferOpen(true)}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView onAddTransaction={() => setIsAddTxOpen(true)} />
        )}

        {activeTab === 'budgets' && (
          <BudgetsAnalyticsView onNavigateTab={(tab) => setActiveTab(tab as NavigationTab)} />
        )}

        {activeTab === 'accounts' && (
          <AccountsVaultView onNavigateTab={(tab) => setActiveTab(tab as NavigationTab)} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onDataReset={() => {
              setIsOnboardingDismissed(false);
              setActiveTab('dashboard');
            }}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Dock */}
      <FloatingNavBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onAddTransaction={() => setIsAddTxOpen(true)}
      />

      {/* Global Modals */}
      <TransactionFormModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        accounts={accounts ?? []}
        categories={categories ?? []}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        accounts={accounts ?? []}
      />

      {/* Onboarding Dialog */}
      <OnboardingModal
        isOpen={!hasCompletedOnboarding}
        onComplete={() => {
          setIsOnboardingDismissed(true);
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <SecurityProvider>
      <AppShell />
    </SecurityProvider>
  );
};

export default App;
