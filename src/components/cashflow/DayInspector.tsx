import React, { useMemo } from 'react';
import type { Transaction, Account, Category, CashflowSummary } from '../../domain/types';
import { BentoCard } from '../ui/BentoCard';
import { Button } from '../ui/Button';
import { AmountDisplay } from '../ui/AmountDisplay';
import { renderCategoryIcon } from '../dashboard/iconHelpers';
import { Calendar, Plus, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react';

export interface DayInspectorProps {
  dateStr: string; // 'YYYY-MM-DD'
  cashflow?: CashflowSummary;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onAddTransactionForDate: (dateStr: string) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  className?: string;
}

export const DayInspector: React.FC<DayInspectorProps> = ({
  dateStr,
  cashflow,
  transactions,
  accounts,
  categories,
  onAddTransactionForDate,
  onEditTransaction,
  className = '',
}) => {
  // Format date display (e.g. "Saturday, September 5, 2026")
  const formattedDate = useMemo(() => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-PH', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [dateStr]);

  // Filter transactions for this day
  const dayTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.slice(0, 10) === dateStr);
  }, [transactions, dateStr]);

  const accountMap = useMemo(() => {
    return new Map(accounts.map((a) => [a.id, a]));
  }, [accounts]);

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const income = cashflow?.income ?? 0;
  const expense = cashflow?.expense ?? 0;
  const net = cashflow?.net ?? 0;

  return (
    <BentoCard
      variant="oat"
      sticker={
        <div className="w-9 h-9 rounded-2xl bg-[#FFED9E] border border-stone-800/15 flex items-center justify-center shadow-sm">
          <Calendar className="w-4 h-4 text-dark-anchor" />
        </div>
      }
      title={formattedDate || 'Selected Date'}
      subtitle={`Daily breakdown (${dayTransactions.length} ${
        dayTransactions.length === 1 ? 'transaction' : 'transactions'
      })`}
      action={
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="add-tx-for-date-btn"
          icon={<Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
          onClick={() => onAddTransactionForDate(dateStr)}
        >
          Add for this date
        </Button>
      }
      className={className}
      data-testid="day-inspector"
    >
      <div className="space-y-4 pt-2">
        {/* Metric Summary Chips */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-stone-50 rounded-2xl border border-stone-800/10">
          <div className="flex flex-col p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] font-bold text-dark-forest uppercase">
              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
              <span>Inflow</span>
            </div>
            <div className="mt-1">
              <AmountDisplay amount={income} size="sm" />
            </div>
          </div>

          <div className="flex flex-col p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-800 uppercase">
              <ArrowUpRight className="w-3 h-3 text-rose-600" />
              <span>Outflow</span>
            </div>
            <div className="mt-1">
              <AmountDisplay amount={expense} size="sm" />
            </div>
          </div>

          <div className="flex flex-col p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1 text-[10px] font-bold text-stone-600 uppercase">
              <span>Net</span>
            </div>
            <div className="mt-1">
              <AmountDisplay amount={net} size="sm" showSign withPill />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-2">
          {dayTransactions.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-stone-50 border-2 border-dashed border-stone-800/10 flex flex-col items-center gap-1.5">
              <Receipt className="w-6 h-6 text-stone-400" />
              <p className="text-xs font-bold text-stone-600">
                No transactions on this date.
              </p>
              <p className="text-[11px] text-stone-500">
                Tap 'Add for this date' above to log an entry here.
              </p>
            </div>
          ) : (
            dayTransactions.map((tx) => {
              const cat = tx.categoryId ? categoryMap.get(tx.categoryId) : undefined;
              const acc = accountMap.get(tx.accountId);
              const toAcc = tx.toAccountId ? accountMap.get(tx.toAccountId) : undefined;
              const isTransfer = tx.type === 'transfer';

              return (
                <button
                  key={tx.id}
                  type="button"
                  data-testid={`day-tx-item-${tx.id}`}
                  onClick={() => onEditTransaction && onEditTransaction(tx)}
                  disabled={!onEditTransaction}
                  className={`w-full p-3 rounded-2xl border border-stone-800/15 bg-white flex items-center justify-between gap-3 shadow-sm hover:border-stone-800/30 transition-all text-left select-none focus-visible:ring-2 focus-visible:ring-dark-forest focus-visible:outline-none ${
                    onEditTransaction ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl border border-stone-800/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: cat?.color || '#FFED9E' }}
                    >
                      {renderCategoryIcon(cat?.icon, 'w-4 h-4 text-[#111111]')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111111] truncate">
                        {tx.notes || cat?.name || (isTransfer ? 'Transfer' : 'Transaction')}
                      </p>
                      <p className="text-[10px] font-medium text-stone-500 truncate">
                        {isTransfer
                          ? `${acc?.name || 'Source'} → ${toAcc?.name || 'Destination'}`
                          : acc?.name || 'Account'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <AmountDisplay
                      amount={tx.type === 'expense' ? -tx.amount : tx.amount}
                      type={
                        tx.type === 'income'
                          ? 'income'
                          : tx.type === 'expense'
                          ? 'expense'
                          : 'neutral'
                      }
                      size="sm"
                      showSign={!isTransfer}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </BentoCard>
  );
};
