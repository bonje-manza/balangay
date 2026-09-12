import React, { useState } from 'react';
import {
  Smartphone,
  Building2,
  Wallet,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { StickerBadge } from '../ui/StickerBadge';
import { SparkleStar, Starburst } from '../ui/StickerIcons';
import {
  PHILIPPINE_STARTER_ACCOUNTS,
  seedDefaultCategories,
  loadSampleDemoData,
} from '../../storage/seedData';
import { createAccount } from '../../storage/accountRepository';
import { saveUserSettings } from '../../storage/settingsRepository';

export interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

/**
 * Renders an account icon based on template icon key.
 */
const renderAccountIcon = (iconName: string, className = 'w-4 h-4 text-[#111111]') => {
  switch (iconName) {
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    default:
      return <Wallet className={className} />;
  }
};

/**
 * OnboardingModal: Charming 2-step onboarding dialog with Soft Neo-brutalism
 * styling, Philippine Peso (₱) confirmation, starter account selection,
 * and one-click sample demo mode.
 */
export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loadingAction, setLoadingAction] = useState<'demo' | 'custom' | null>(null);

  // Starter accounts selection state
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PHILIPPINE_STARTER_ACCOUNTS.forEach((acc) => {
      initial[acc.id] = true;
    });
    return initial;
  });

  // Starting balance state
  const [balances, setBalances] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    PHILIPPINE_STARTER_ACCOUNTS.forEach((acc) => {
      initial[acc.id] = acc.initialBalance;
    });
    return initial;
  });

  if (!isOpen) return null;

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleBalanceChange = (id: string, val: string) => {
    const parsed = parseFloat(val);
    setBalances((prev) => ({
      ...prev,
      [id]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  // Path A: One-Click Demo Mode ("Try with Sample Data")
  const handleTryDemo = async () => {
    try {
      setLoadingAction('demo');
      await seedDefaultCategories();
      await loadSampleDemoData();
      await saveUserSettings({ hasCompletedOnboarding: true });
      onComplete();
    } catch (err) {
      console.error('Failed to load sample demo data:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  // Path B: Step 2 Completion ("Get Started")
  const handleCustomSetup = async () => {
    try {
      setLoadingAction('custom');
      await seedDefaultCategories();

      const templatesToCreate = PHILIPPINE_STARTER_ACCOUNTS.filter(
        (tpl) => selectedAccounts[tpl.id]
      );

      for (const tpl of templatesToCreate) {
        const initialBalance = balances[tpl.id] ?? tpl.initialBalance;
        await createAccount({
          id: tpl.id,
          name: tpl.name,
          type: tpl.type,
          initialBalance,
          currency: tpl.currency || 'PHP',
          color: tpl.color,
          icon: tpl.icon,
          isArchived: false,
        });
      }

      await saveUserSettings({ hasCompletedOnboarding: true });
      onComplete();
    } catch (err) {
      console.error('Failed to complete custom account setup:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop Scrim */}
      <div
        data-testid="onboarding-backdrop"
        className="fixed inset-0 bg-[#111111]/50 transition-opacity"
      />

      {/* Bento Dialog Box on Oat Milk Canvas */}
      <div className="relative z-10 w-full max-w-2xl bg-[#F7F2E8] text-[#111111] rounded-3xl border-2 border-[#111111] shadow-[6px_6px_0px_0px_#111111] p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {step === 1 ? (
          /* ========================================================== */
          /* STEP 1: Welcome & Currency Confirmation + Demo Trigger      */
          /* ========================================================== */
          <div>
            {/* Playful Stickers & Badges Header */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <StickerBadge
                  variant="butter"
                  rotation="tilt-left"
                  icon={<SparkleStar size={14} className="text-[#111111] fill-[#111111]" />}
                >
                  Offline & Private
                </StickerBadge>
                <StickerBadge variant="pistachio" rotation="tilt-right">
                  100% Local-First
                </StickerBadge>
              </div>
              <Starburst
                size={28}
                className="text-[#FFED9E] fill-[#FFED9E] stroke-[#111111] stroke-[1.5] flex-shrink-0"
              />
            </div>

            {/* Headline in Fraunces serif */}
            <h2
              id="onboarding-modal-title"
              className="font-serif font-bold text-2xl sm:text-3xl text-[#111111] tracking-tight leading-snug"
            >
              Mabuhay! Welcome to Balangay
            </h2>
            <p className="text-sm sm:text-base font-normal text-stone-700 mt-2 leading-relaxed">
              Your mindful, private, offline-first personal financial companion. Designed for
              intentional Philippine daily cashflow, e-wallets, and zero cloud dependencies.
            </p>

            {/* Currency Confirmation Bento Card */}
            <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border-2 border-[#111111] shadow-[3px_3px_0px_0px_#111111] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#DAE097] border-2 border-[#111111] flex items-center justify-center font-serif font-bold text-2xl text-[#111111] shadow-[2px_2px_0px_0px_#111111] flex-shrink-0">
                  ₱
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg text-[#111111]">
                      Philippine Peso
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#111111] text-[#F7F2E8] font-bold text-xs">
                      PHP
                    </span>
                    <span className="text-xs font-bold text-stone-500">(₱)</span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5 leading-normal">
                    Standard national currency configured. All transactions, budgets, and ledgers
                    calculate in ₱ with zero telemetry.
                  </p>
                </div>
              </div>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DAE097]/40 border border-[#111111]/30 text-xs font-bold text-[#124224] flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#124224]" />
                <span>Confirmed</span>
              </div>
            </div>

            {/* Two Action Pathways */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Path A: One-Click Demo Mode */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border-2 border-[#111111] shadow-[3px_3px_0px_0px_#111111] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Explore Fast
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFED9E] border border-[#111111] text-[#111111]">
                      <SparkleStar size={10} className="fill-[#111111]" /> Instant
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#111111] mb-1">
                    Try with Sample Data
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-4">
                    Explore with 18 realistic Philippine transactions, starter accounts, and
                    active budgets right now.
                  </p>
                </div>
                <Button
                  variant="butter"
                  size="md"
                  fullWidth
                  icon={<SparkleStar size={16} className="text-[#111111] fill-[#111111]" />}
                  isLoading={loadingAction === 'demo'}
                  disabled={Boolean(loadingAction)}
                  onClick={handleTryDemo}
                >
                  Try with Sample Data
                </Button>
              </div>

              {/* Path B: Custom Setup */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#FFFDF9] border-2 border-[#111111] shadow-[3px_3px_0px_0px_#111111] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Clean Slate
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#A6CFF2] border border-[#111111] text-[#111111]">
                      Custom
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#111111] mb-1">
                    Setup My Accounts
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-4">
                    Choose your personal e-wallets, bank accounts, and starting balances to begin
                    tracking immediately.
                  </p>
                </div>
                <Button
                  variant="forest"
                  size="md"
                  fullWidth
                  iconRight={<ArrowRight className="w-4 h-4" />}
                  disabled={Boolean(loadingAction)}
                  onClick={() => setStep(2)}
                >
                  Setup My Accounts
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================== */
          /* STEP 2: Starter Account Selection & Initial Balances       */
          /* ========================================================== */
          <div>
            {/* Header with Back button and Step badge */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={Boolean(loadingAction)}
                aria-label="Previous step"
                className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-stone-950 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <StickerBadge variant="sky" rotation="none">
                Step 2 of 2: Starter Accounts
              </StickerBadge>
            </div>

            {/* Headline */}
            <h2
              id="onboarding-modal-title"
              className="font-serif font-bold text-2xl sm:text-3xl text-[#111111] tracking-tight"
            >
              Choose Your Starter Accounts
            </h2>
            <p className="text-xs sm:text-sm font-normal text-stone-700 mt-1 leading-normal">
              Select which Philippine accounts to create, and enter your starting balance for each.
              You can adjust balances or add more accounts at any time later.
            </p>

            {/* Accounts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
              {PHILIPPINE_STARTER_ACCOUNTS.map((acc) => {
                const isSelected = Boolean(selectedAccounts[acc.id]);
                const balance = balances[acc.id] ?? acc.initialBalance;

                return (
                  <div
                    key={acc.id}
                    className={`p-3.5 rounded-2xl border-2 border-[#111111] transition-all flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#FFFDF9] shadow-[3px_3px_0px_0px_#111111]'
                        : 'bg-stone-200/50 opacity-60 border-dashed shadow-none'
                    }`}
                  >
                    {/* Top Row: Checkbox, Icon, Name */}
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id={`checkbox-${acc.id}`}
                        aria-label={acc.name}
                        checked={isSelected}
                        onChange={() => toggleAccount(acc.id)}
                        disabled={Boolean(loadingAction)}
                        className="w-4 h-4 rounded border-2 border-[#111111] text-[#124224] focus:ring-0 cursor-pointer"
                      />
                      <div
                        className="w-8 h-8 rounded-xl border border-[#111111] flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: acc.color }}
                      >
                        {renderAccountIcon(acc.icon, 'w-4 h-4 text-[#111111]')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <label
                          htmlFor={`checkbox-${acc.id}`}
                          className="font-bold text-xs sm:text-sm text-[#111111] block truncate cursor-pointer select-none"
                        >
                          {acc.name}
                        </label>
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                          {acc.type}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Balance Input */}
                    <div className="flex items-center gap-2 bg-[#F7F2E8] border border-[#111111] rounded-xl px-2.5 py-1.5">
                      <span className="text-xs font-bold text-stone-600 select-none">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        id={`balance-${acc.id}`}
                        data-testid={`balance-input-${acc.id}`}
                        aria-label="Starting balance"
                        value={balance === 0 ? '0' : balance || ''}
                        onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
                        disabled={!isSelected || Boolean(loadingAction)}
                        placeholder="0.00"
                        className="w-full bg-transparent text-xs font-bold text-[#111111] focus:outline-none disabled:text-stone-400 placeholder:text-stone-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t-2 border-[#111111]/15">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setStep(1)}
                disabled={Boolean(loadingAction)}
              >
                Back
              </Button>
              <Button
                variant="forest"
                size="md"
                iconRight={
                  <SparkleStar size={16} className="text-[#F7F2E8] fill-[#F7F2E8]" />
                }
                isLoading={loadingAction === 'custom'}
                disabled={Boolean(loadingAction)}
                onClick={handleCustomSetup}
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
