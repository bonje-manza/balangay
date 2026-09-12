import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, ArrowLeftRight, Wallet, Sparkles, Filter } from 'lucide-react';
import { db } from '../../storage/db';
import type { Account, AccountType, Transaction } from '../../domain/types';
import { calculateAccountBalances, calculateNetWorth } from '../../domain/calculations';
import { seedStarterAccounts } from '../../storage/seedData';
import { Button } from '../ui/Button';
import { AmountDisplay } from '../ui/AmountDisplay';
import { AccountCard } from './AccountCard';
import { AccountFormModal } from './AccountFormModal';
import { TransferModal } from './TransferModal';

export interface AccountsVaultViewProps {
  initialAccounts?: Account[];
  initialTransactions?: Transaction[];
  className?: string;
  onNavigateTab?: (tab: string) => void;
}

type FilterAccountType = 'all' | AccountType;

interface FilterOption {
  type: FilterAccountType;
  label: string;
  testId: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { type: 'all', label: 'All', testId: 'filter-pill-all' },
  { type: 'bank', label: 'Bank', testId: 'filter-pill-bank' },
  { type: 'ewallet', label: 'E-Wallet', testId: 'filter-pill-ewallet' },
  { type: 'cash', label: 'Cash', testId: 'filter-pill-cash' },
  { type: 'credit', label: 'Credit Card', testId: 'filter-pill-credit' },
  { type: 'savings', label: 'Savings', testId: 'filter-pill-savings' },
];

/**
 * AccountsVaultView: Full accounts vault view featuring Soft Neo-brutalism aesthetics,
 * live running balances, type filters, custom account creation/editing, and dedicated transfers.
 */
export const AccountsVaultView: React.FC<AccountsVaultViewProps> = ({
  initialAccounts,
  initialTransactions,
  className = '',
}) => {
  // Dexie live queries (fallback to test props when provided)
  const liveAccounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];
  const liveTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];

  const accounts = initialAccounts || liveAccounts;
  const transactions = initialTransactions || liveTransactions;

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterAccountType>('all');

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [transferSourceAccountId, setTransferSourceAccountId] = useState<string | undefined>(undefined);
  const [isSeedingPresets, setIsSeedingPresets] = useState<boolean>(false);

  // Calculate live running balances and net worth
  const accountBalances = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  const netWorth = useMemo(() => {
    return calculateNetWorth(accounts, transactions);
  }, [accounts, transactions]);

  // Filter accounts by active type
  const filteredAccounts = useMemo(() => {
    if (activeFilter === 'all') {
      return accounts;
    }
    return accounts.filter((acc) => acc.type === activeFilter);
  }, [accounts, activeFilter]);

  // Handlers
  const handleOpenNewAccount = () => {
    setAccountToEdit(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setAccountToEdit(account);
    setIsAccountModalOpen(true);
  };

  const handleOpenTransfer = (sourceAcc?: Account) => {
    setTransferSourceAccountId(sourceAcc ? sourceAcc.id : undefined);
    setIsTransferModalOpen(true);
  };

  const handleLoadPresets = async () => {
    try {
      setIsSeedingPresets(true);
      await seedStarterAccounts();
    } catch (err) {
      console.error('Failed to load starter presets:', err);
    } finally {
      setIsSeedingPresets(false);
    }
  };

  return (
    <div
      className={`min-h-full bg-[#F7F2E8] p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto ${className}`}
      data-testid="accounts-vault-view"
    >
      {/* Top Header & Actions Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b-2 border-stone-800/10">
        <div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#111111] tracking-tight">
            Accounts Vault
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            All your Philippine wallets and bank accounts, with live running balances.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenTransfer()}
            icon={<ArrowLeftRight className="w-4 h-4" />}
            data-testid="vault-transfer-btn"
          >
            Transfer Money
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNewAccount}
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            data-testid="vault-new-account-btn"
          >
            + New Account
          </Button>
        </div>
      </header>

      {/* Net Worth Summary Badge Bento Card */}
      <section>
        <div
          data-testid="vault-summary-card"
          className="bg-[#FFFDF9] border-2 border-[#111111] rounded-3xl p-5 sm:p-6 shadow-[4px_4px_0px_0px_#111111] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#DAE097] border-2 border-[#111111] flex items-center justify-center shadow-[2px_2px_0px_0px_#111111] flex-shrink-0">
              <Wallet className="w-6 h-6 text-[#111111]" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                Total Net Worth
              </span>
              <div data-testid="vault-net-worth" className="mt-0.5">
                <AmountDisplay
                  amount={netWorth}
                  size="xl"
                  type="auto"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-100 px-3.5 py-2 rounded-2xl border border-stone-800/15">
            <span className="text-stone-700">Total Accounts:</span>
            <span className="font-mono font-bold text-[#111111] text-sm">{accounts.length}</span>
            <span className="mx-1 text-stone-400">•</span>
            <span className="text-stone-700">Active Ledger Entries:</span>
            <span className="font-mono font-bold text-[#111111] text-sm">{transactions.length}</span>
          </div>
        </div>
      </section>

      {/* Account Type Filter Pills */}
      <section className="flex flex-wrap items-center gap-2 select-none">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 uppercase tracking-wider mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter:</span>
        </div>

        {FILTER_OPTIONS.map((opt) => {
          const isSelected = activeFilter === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              data-testid={opt.testId}
              onClick={() => setActiveFilter(opt.type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:translate-y-0.5 border ${
                isSelected
                  ? 'bg-[#111111] text-[#F7F2E8] border-[#111111] shadow-[2px_2px_0px_0px_#124224]'
                  : 'bg-[#FFFDF9] text-stone-700 hover:bg-stone-100 border-stone-800/20 shadow-[1px_1px_0px_0px_#111111]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </section>

      {/* Accounts Grid or Empty State */}
      {filteredAccounts.length === 0 ? (
        <section
          data-testid="accounts-vault-empty-state"
          className="text-center py-14 px-6 bg-white/70 rounded-3xl border-2 border-stone-800/15 shadow-[4px_4px_0px_0px_#111111] space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFED9E] border-2 border-[#111111] flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_#111111]">
            <Wallet className="w-7 h-7 text-[#111111]" />
          </div>

          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-serif font-bold text-xl text-[#111111]">
              {accounts.length === 0
                ? 'No accounts found'
                : `No ${activeFilter} accounts found`}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {accounts.length === 0
                ? 'Create custom local accounts or quickly load popular Philippine starter presets like GCash, Maya, and BPI.'
                : 'Try choosing another account type filter pill or add a new account.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenNewAccount}
              icon={<Plus className="w-4 h-4" />}
              data-testid="empty-new-account-btn"
            >
              + New Account
            </Button>

            {accounts.length === 0 && (
              <Button
                variant="butter"
                size="md"
                onClick={handleLoadPresets}
                isLoading={isSeedingPresets}
                icon={<Sparkles className="w-4 h-4" />}
                data-testid="empty-load-presets-btn"
              >
                Load Philippine Presets
              </Button>
            )}
          </div>
        </section>
      ) : (
        <section
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
          data-testid="accounts-grid"
        >
          {filteredAccounts.map((acc) => (
            <AccountCard
              key={acc.id}
              account={acc}
              balance={accountBalances.get(acc.id) ?? acc.initialBalance}
              onTransfer={handleOpenTransfer}
              onEdit={handleEditAccount}
            />
          ))}
        </section>
      )}

      {/* Account Form Modal (Add / Edit) */}
      {isAccountModalOpen && (
        <AccountFormModal
          isOpen={isAccountModalOpen}
          onClose={() => {
            setIsAccountModalOpen(false);
            setAccountToEdit(null);
          }}
          accountToEdit={accountToEdit}
        />
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <TransferModal
          isOpen={isTransferModalOpen}
          onClose={() => {
            setIsTransferModalOpen(false);
            setTransferSourceAccountId(undefined);
          }}
          accounts={accounts}
          sourceAccountId={transferSourceAccountId}
        />
      )}
    </div>
  );
};
