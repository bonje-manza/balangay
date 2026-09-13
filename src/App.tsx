import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Wallet, WifiOff, Lock } from 'lucide-react';
import { db } from './storage/db';
import { getUserSettings } from './storage/settingsRepository';
import { repairCorruptedCategories } from './storage/categoryRepository';
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
import { Toast, type ToastVariant } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const AppShell: React.FC = () => {
  const security = useSecurity();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isAddTxOpen, setIsAddTxOpen] = useState<boolean>(false);
  const [addTxDate, setAddTxDate] = useState<string | undefined>(undefined);
  const [isTransferOpen, setIsTransferOpen] = useState<boolean>(false);
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; variant?: ToastVariant } | null>(null);

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

  // Self-heal corrupted categories on startup if any records are missing required name/icon
  useEffect(() => {
    if (categories && categories.some((c) => !c.name || !c.icon)) {
      repairCorruptedCategories(categories).catch((err) => {
        console.error('Failed to auto-repair corrupted categories', err);
      });
    }
  }, [categories]);

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
          <div className="w-14 h-14 rounded-2xl bg-[#FFED9E] border border-stone-800/15 flex items-center justify-center shadow-sm">
            <Wallet className="w-7 h-7 text-dark-anchor" />
          </div>
          <p className="font-serif font-bold text-lg text-dark-anchor">Balangay Vault</p>
        </div>
      </div>
    );
  }

  // 1. PIN Lock Screen overlay takes top priority if vault session is locked
  if (security.isLocked) {
    return <PinLockScreen pinLength={security.pinLength} onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#111111] font-sans antialiased flex flex-col selection:bg-butter selection:text-dark-anchor">
      {/* PWA Install Banner */}
      <InstallPrompt />

      {/* Top Navigation Header */}
      <header className="w-full border-b border-stone-800/15 bg-[#F7F2E8]/90 backdrop-blur-sm px-4 sm:px-8 py-2.5 sm:py-3.5 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none text-left focus-visible:ring-2 focus-visible:ring-dark-forest focus-visible:outline-none rounded-2xl"
            onClick={() => setActiveTab('dashboard')}
            aria-label="Balangay Dashboard"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-butter border border-stone-800/20 flex items-center justify-center shadow-sm flex-shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-dark-anchor" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg sm:text-2xl tracking-tight leading-none text-dark-anchor">
                Balangay
              </h1>
              <p className="text-[10px] sm:text-[11px] font-medium text-dark-forest/80 tracking-wide mt-0.5">
                Offline Finance Tracker
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-pistachio border border-stone-800/20 text-[11px] sm:text-xs font-bold text-dark-forest shadow-sm">
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
                className="p-2 min-h-[40px] min-w-[40px] rounded-xl bg-white border border-stone-800/20 shadow-sm hover:bg-stone-50 active:translate-y-0.5 cursor-pointer transition-all flex items-center justify-center"
              >
                <Lock className="w-4 h-4 text-dark-anchor" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Active View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-[calc(7rem+env(safe-area-inset-bottom,0px))]">
        <ErrorBoundary>
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateTab={(tab) => setActiveTab(tab as NavigationTab)}
              onOpenAddTransaction={() => {
                setAddTxDate(undefined);
                setIsAddTxOpen(true);
              }}
              onOpenTransfer={() => setIsTransferOpen(true)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              onAddTransaction={() => {
                setAddTxDate(undefined);
                setIsAddTxOpen(true);
              }}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsAnalyticsView
              onNavigateTab={(tab) => setActiveTab(tab as NavigationTab)}
              onOpenAddTransaction={(date) => {
                setAddTxDate(date);
                setIsAddTxOpen(true);
              }}
            />
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
        </ErrorBoundary>
      </main>

      {/* Floating Bottom Navigation Dock */}
      <FloatingNavBar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onAddTransaction={() => {
          setAddTxDate(undefined);
          setIsAddTxOpen(true);
        }}
      />

      {/* Global Modals */}
      <TransactionFormModal
        isOpen={isAddTxOpen}
        initialDate={addTxDate}
        onClose={() => {
          setIsAddTxOpen(false);
          setAddTxDate(undefined);
        }}
        onSuccess={(tx) => {
          setToast({
            message: `${tx.type === 'transfer' ? 'Transfer' : tx.type === 'income' ? 'Income' : 'Expense'} recorded in vault`,
            variant: 'pistachio',
          });
        }}
        accounts={accounts ?? []}
        categories={categories ?? []}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onSuccess={() => {
          setToast({
            message: 'Funds transferred successfully',
            variant: 'pistachio',
          });
        }}
        accounts={accounts ?? []}
      />

      {/* Post-Action Confirmation Toast */}
      <Toast
        isOpen={Boolean(toast)}
        message={toast?.message || ''}
        variant={toast?.variant || 'pistachio'}
        onClose={() => setToast(null)}
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
    <ErrorBoundary>
      <SecurityProvider>
        <AppShell />
      </SecurityProvider>
    </ErrorBoundary>
  );
};

export default App;
