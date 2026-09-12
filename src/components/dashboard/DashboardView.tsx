import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, ArrowLeftRight, Database } from 'lucide-react';
import { db } from '../../storage/db';
import { loadSampleDemoData } from '../../storage/seedData';
import {
  calculateAccountBalances,
  calculateNetWorth,
  calculateMonthlyCashflow,
  calculateCategorySpending,
} from '../../domain/calculations';
import { Button } from '../ui/Button';
import { BentoCard } from '../ui/BentoCard';
import { Starburst } from '../ui/StickerIcons';
import { NetWorthCard } from './NetWorthCard';
import { CashflowBento } from './CashflowBento';
import { BudgetQuickMeter } from './BudgetQuickMeter';
import { RecentActivityBento } from './RecentActivityBento';

export interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenAddTransaction: () => void;
  onOpenTransfer: () => void;
  className?: string;
  currentDate?: Date;
}

/**
 * DashboardView: Main Bento Hub dashboard view featuring live Net Worth calculation,
 * monthly Cashflow breakdown (Income vs Expense), Category Budget meters, and Recent Activity
 * using Dexie reactive live queries (useLiveQuery).
 */
export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenAddTransaction,
  onOpenTransfer,
  className = '',
  currentDate,
}) => {
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Reactive queries via Dexie useLiveQuery
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];
  const transactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? [];

  // Determine target month and year for calculations
  const targetDate = currentDate || new Date();
  const currentYear = targetDate.getFullYear();
  const currentMonth = targetDate.getMonth() + 1;
  const monthName = targetDate.toLocaleDateString('en-PH', {
    month: 'long',
    year: 'numeric',
  });

  // Calculate live domain metrics
  const balances = calculateAccountBalances(accounts, transactions);
  const netWorth = calculateNetWorth(accounts, transactions);
  const cashflow = calculateMonthlyCashflow(transactions, currentYear, currentMonth);
  const spending = calculateCategorySpending(transactions, currentYear, currentMonth);

  const handleLoadDemo = async () => {
    try {
      setIsLoadingDemo(true);
      await loadSampleDemoData();
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const hasTransactions = transactions.length > 0;

  return (
    <div
      className={`min-h-full bg-[#F7F2E8] p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto ${className}`}
      data-testid="dashboard-view"
    >
      {/* Top Greeting Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b-2 border-stone-800/10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#111111] tracking-tight">
              Kumusta, here's what's happening with your money.
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            100% offline, private, and stored locally on your device.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<ArrowLeftRight className="w-4 h-4" />}
            onClick={onOpenTransfer}
            data-testid="dashboard-quick-transfer-btn"
          >
            Transfer
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={onOpenAddTransaction}
            data-testid="dashboard-quick-add-btn"
          >
            + Add Transaction
          </Button>
        </div>
      </header>

      {/* Empty State when zero transactions exist */}
      {!hasTransactions ? (
        <div
          className="space-y-6"
          data-testid="dashboard-empty-state"
        >
          <BentoCard
            variant="butter"
            sticker={
              <div className="w-12 h-12 rounded-2xl bg-[#FFED9E] border-2 border-stone-800 flex items-center justify-center shadow-[2px_2px_0px_0px_#111111]">
                <Starburst className="w-6 h-6 text-[#111111]" fill="#FFED9E" stroke="#111111" />
              </div>
            }
            title="Ready to record your first transaction?"
            subtitle="Your offline ledger is clean and ready."
            className="shadow-[4px_4px_0px_0px_#111111]"
          >
            <div className="max-w-2xl mt-2 space-y-4">
              <p className="text-sm sm:text-base text-stone-800 font-normal leading-relaxed">
                Welcome to Balangay. All your financial accounts, transactions, and budgets
                are encrypted and stored 100% locally in your browser's IndexedDB. Get started
                by recording your first income or expense, or try with realistic sample Philippine
                demo data.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={onOpenAddTransaction}
                  data-testid="empty-add-transaction-btn"
                >
                  Add First Transaction
                </Button>

                <Button
                  variant="forest"
                  size="md"
                  icon={<Database className="w-4 h-4" />}
                  onClick={handleLoadDemo}
                  isLoading={isLoadingDemo}
                  data-testid="empty-load-demo-btn"
                >
                  Try with Sample Data
                </Button>
              </div>
            </div>
          </BentoCard>

          {/* If accounts exist, still show Net Worth card */}
          {accounts.length > 0 && (
            <NetWorthCard
              netWorth={netWorth}
              accounts={accounts}
              balances={balances}
              variant="dark"
            />
          )}
        </div>
      ) : (
        /* Bento Grid Hub */
        <div className="space-y-6">
          {/* Row 1: Hero Net Worth Bento Card */}
          <NetWorthCard
            netWorth={netWorth}
            accounts={accounts}
            balances={balances}
            variant="dark"
          />

          {/* Row 2: 2-Column Bento Grid (Cashflow & Budget Meter) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <CashflowBento
                cashflow={cashflow}
                monthName={monthName}
              />
            </div>

            <div className="lg:col-span-5">
              <BudgetQuickMeter
                categories={categories}
                spending={spending}
                onViewBudgets={() => onNavigateTab('budgets')}
              />
            </div>
          </div>

          {/* Row 3: Recent Activity Bento Card */}
          <RecentActivityBento
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onViewAll={() => onNavigateTab('transactions')}
          />
        </div>
      )}
    </div>
  );
};
