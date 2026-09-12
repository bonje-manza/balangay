import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Download, FileSpreadsheet } from 'lucide-react';
import { db } from '../../storage/db';
import type { Account, Category, Transaction } from '../../domain/types';
import { exportTransactionsToCSV } from '../../services/csvService';
import { Button } from '../ui/Button';
import { AmountDisplay } from '../ui/AmountDisplay';
import { formatPHP } from '../../domain/money';
import { TransactionListItem } from './TransactionListItem';
import {
  TransactionFilterBar,
  TransactionFilterState,
} from './TransactionFilterBar';
import { TransactionFormModal } from './TransactionFormModal';

export interface TransactionsViewProps {
  className?: string;
  initialTransactions?: Transaction[];
  initialAccounts?: Account[];
  initialCategories?: Category[];
  onAddTransaction?: () => void;
}

/**
 * Formats a transaction date string into 'Today', 'Yesterday', or 'MMM D, YYYY'.
 */
export function getDateGroupTitle(dateStr: string): string {
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    const today = new Date();

    const isToday =
      today.getFullYear() === y &&
      today.getMonth() === m &&
      today.getDate() === d;
    if (isToday) return 'Today';

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      yesterday.getFullYear() === y &&
      yesterday.getMonth() === m &&
      yesterday.getDate() === d;
    if (isYesterday) return 'Yesterday';

    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return dateStr;
}

/**
 * TransactionsView: Full ledger view featuring Soft Neo-brutalism aesthetics,
 * multi-criteria live filtering, date-grouped list items, summary metrics,
 * quick RFC-compliant CSV export, and accessible transaction creation/editing modals.
 */
export const TransactionsView: React.FC<TransactionsViewProps> = ({
  className = '',
  initialTransactions,
  initialAccounts,
  initialCategories,
  onAddTransaction,
}) => {
  // Dexie live queries (fallback to prop overrides for testing if provided)
  const liveAccounts = useLiveQuery(() => db.accounts.toArray(), []) ?? [];
  const liveTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const liveCategories = useLiveQuery(() => db.categories.toArray(), []) ?? [];

  const accounts = initialAccounts || liveAccounts;
  const transactions = initialTransactions || liveTransactions;
  const categories = initialCategories || liveCategories;

  // Filter state
  const [filterState, setFilterState] = useState<TransactionFilterState>({
    search: '',
    type: 'all',
    accountId: 'all',
    categoryId: 'all',
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTxToEdit, setSelectedTxToEdit] = useState<Transaction | null>(null);

  // Filter transactions based on current criteria
  const filteredTransactions = useMemo(() => {
    const searchLower = filterState.search.trim().toLowerCase();
    const categoryMap = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));

    return transactions
      .filter((tx) => {
        // Type filter
        if (filterState.type !== 'all' && tx.type !== filterState.type) {
          return false;
        }

        // Account filter (matches either source or destination)
        if (filterState.accountId !== 'all') {
          if (tx.accountId !== filterState.accountId && tx.toAccountId !== filterState.accountId) {
            return false;
          }
        }

        // Category filter
        if (filterState.categoryId !== 'all') {
          if (tx.categoryId !== filterState.categoryId) {
            return false;
          }
        }

        // Date range filter
        const txDate = tx.date.slice(0, 10);
        if (filterState.startDate && txDate < filterState.startDate) {
          return false;
        }
        if (filterState.endDate && txDate > filterState.endDate) {
          return false;
        }

        // Search filter (notes, category name, or tags)
        if (searchLower) {
          const noteMatch = tx.notes?.toLowerCase().includes(searchLower);
          const catName = tx.categoryId ? categoryMap.get(tx.categoryId) : '';
          const catMatch = catName?.includes(searchLower);
          const tagMatch = tx.tags?.some((t) => t.toLowerCase().includes(searchLower));
          if (!noteMatch && !catMatch && !tagMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, filterState, categories]);

  // Group filtered transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; label: string; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    for (const tx of filteredTransactions) {
      const dateKey = tx.date.split('T')[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(tx);
    }

    for (const [dateKey, items] of map.entries()) {
      groups.push({
        date: dateKey,
        label: getDateGroupTitle(dateKey),
        items,
      });
    }

    return groups;
  }, [filteredTransactions]);

  // Summary computations
  const { totalIncome, totalExpense, netTotal } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') inc += tx.amount;
      else if (tx.type === 'expense') exp += tx.amount;
    }
    return {
      totalIncome: inc,
      totalExpense: exp,
      netTotal: inc - exp,
    };
  }, [filteredTransactions]);

  // Export to CSV
  const handleExportCSV = () => {
    const csv = exportTransactionsToCSV(filteredTransactions, accounts, categories);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    if (typeof window !== 'undefined' && window.URL && window.URL.createObjectURL) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (window.URL.revokeObjectURL) {
        window.URL.revokeObjectURL(url);
      }
    }
  };

  const handleOpenAdd = () => {
    if (onAddTransaction) {
      onAddTransaction();
    }
    setSelectedTxToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setSelectedTxToEdit(tx);
    setIsModalOpen(true);
  };

  const isFilterActive = Boolean(
    filterState.search ||
      filterState.type !== 'all' ||
      filterState.accountId !== 'all' ||
      filterState.categoryId !== 'all' ||
      filterState.startDate ||
      filterState.endDate
  );

  return (
    <div
      className={`min-h-full bg-[#F7F2E8] p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto ${className}`}
      data-testid="transactions-view"
    >
      {/* Header with Fraunces serif and Action Buttons */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b-2 border-stone-800/10">
        <div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-[#111111] tracking-tight">
            Transactions Ledger
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
            All your recorded entries, searchable and filterable. Export to CSV any time.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4" />}
            data-testid="export-csv-btn"
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAdd}
            icon={<Plus className="w-4 h-4" />}
            data-testid="add-transaction-btn"
          >
            + Add
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <TransactionFilterBar
        filters={filterState}
        onFilterChange={setFilterState}
        accounts={accounts}
        categories={categories}
      />

      {/* Summary Bar */}
      <div
        data-testid="ledger-summary-bar"
        className="bg-[#FFFDF9] border-2 border-[#111111] rounded-2xl p-4 sm:p-5 shadow-[3px_3px_0px_0px_#111111] flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-6 flex-wrap">
          <div>
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
              Filtered Records
            </span>
            <p
              data-testid="summary-tx-count"
              className="font-serif font-bold text-base sm:text-lg text-[#111111]"
            >
              {filteredTransactions.length}{' '}
              {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
            </p>
          </div>

          <div className="hidden sm:block h-8 w-[1px] bg-stone-800/15" />

          <div>
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
              Net Flow
            </span>
            <AmountDisplay
              amount={netTotal}
              type="auto"
              showSign
              size="md"
              data-testid="summary-net-amount"
            />
          </div>
        </div>

        {/* Detailed Breakdown Pill */}
        <div className="text-xs font-semibold text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-800/15">
          <span className="text-[#124224] font-bold">+{formatPHP(totalIncome)}</span>
          <span className="mx-2 text-stone-500">•</span>
          <span className="text-[#9E2A3B] font-bold">-{formatPHP(totalExpense)}</span>
        </div>
      </div>

      {/* Transaction List / Groups */}
      {filteredTransactions.length === 0 ? (
        <div
          data-testid="empty-state"
          className="text-center py-12 px-4 bg-white/70 rounded-3xl border-2 border-stone-800/15 shadow-[3px_3px_0px_0px_#111111] space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FFED9E] border border-stone-800/20 flex items-center justify-center mx-auto shadow-[1px_1px_0px_0px_#111111]">
            <FileSpreadsheet className="w-6 h-6 text-[#111111]" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#111111]">
              {isFilterActive
                ? 'No transactions found matching filters'
                : 'No transactions recorded yet'}
            </h3>
            <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
              {isFilterActive
                ? 'Try adjusting your search term, changing transaction type, or clearing active filters.'
                : 'Click "+ Add" to create your first transaction and start tracking your finances.'}
            </p>
          </div>
          {isFilterActive && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFilterState({
                    search: '',
                    type: 'all',
                    accountId: 'all',
                    categoryId: 'all',
                    startDate: undefined,
                    endDate: undefined,
                  })
                }
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6" data-testid="grouped-transactions-list">
          {groupedTransactions.map((group) => (
            <section key={group.date} className="space-y-2.5">
              {/* Date Group Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-xs sm:text-sm font-mono uppercase tracking-wider text-stone-700 bg-stone-200/70 px-2.5 py-0.5 rounded-md border border-stone-800/10">
                    {group.label}
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-stone-600">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Transactions in Date Group */}
              <div className="space-y-2">
                {group.items.map((tx) => (
                  <TransactionListItem
                    key={tx.id}
                    transaction={tx}
                    accounts={accounts}
                    categories={categories}
                    onClick={handleEditTx}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Transaction Add / Edit Modal */}
      {isModalOpen && (
        <TransactionFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTxToEdit(null);
          }}
          transactionToEdit={selectedTxToEdit}
          accounts={accounts}
          categories={categories}
        />
      )}
    </div>
  );
};
