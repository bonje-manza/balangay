import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import type { Transaction, Account, Category } from '../../domain/types';
import { BentoCard } from '../ui/BentoCard';
import { AmountDisplay } from '../ui/AmountDisplay';
import { Button } from '../ui/Button';
import { renderCategoryIcon } from './iconHelpers';

export interface RecentActivityBentoProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onViewAll?: () => void;
  className?: string;
}

/**
 * Formats a transaction date string into 'Today', 'Yesterday', or 'MMM D'.
 */
export function formatTransactionDate(dateStr: string): string {
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

    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  }
  return dateStr;
}

/**
 * Resolves mood pill background color.
 */
function getMoodPillColor(mood: string): string {
  switch (mood.toLowerCase()) {
    case 'peaceful':
      return '#DAE097';
    case 'essential':
      return '#A6CFF2';
    case 'treat':
      return '#FFED9E';
    case 'invest':
      return '#DAE097';
    default:
      return '#FFFDF9';
  }
}

/**
 * RecentActivityBento: Bento card displaying the 5 most recent transactions with
 * category icons, note/category title, account badge, formatted date, semantic amounts,
 * mood tags, and a "View All" button leading to the Transactions tab.
 */
export const RecentActivityBento: React.FC<RecentActivityBentoProps> = ({
  transactions,
  accounts,
  categories,
  onViewAll,
  className = '',
}) => {
  const accountsMap = new Map(accounts.map((a) => [a.id, a]));
  const categoriesMap = new Map(categories.map((c) => [c.id, c]));

  // Sort descending by date, then createdAt, and limit to top 5
  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <BentoCard
      variant="oat"
      sticker={
        <div className="w-10 h-10 rounded-2xl bg-[#A6CFF2] border border-stone-800/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
          <History className="w-5 h-5 text-[#111111]" />
        </div>
      }
      title="Recent Activity"
      subtitle="Latest 5 transactions"
      action={
        onViewAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAll}
            iconRight={<ArrowRight className="w-3.5 h-3.5" />}
            data-testid="recent-activity-view-all"
          >
            View All
          </Button>
        )
      }
      className={`shadow-[3px_3px_0px_0px_#111111] ${className}`}
      data-testid="recent-activity-bento"
    >
      {recentTransactions.length === 0 ? (
        <div className="py-8 text-center" data-testid="recent-activity-empty">
          <p className="text-xs text-stone-600 italic">
            No recent transactions yet. Add a transaction to see your activity here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-stone-800/10" data-testid="recent-transactions-list">
          {recentTransactions.map((tx) => {
            const isTransfer = tx.type === 'transfer';
            const fromAccount = accountsMap.get(tx.accountId);
            const toAccount = tx.toAccountId ? accountsMap.get(tx.toAccountId) : undefined;
            const category = tx.categoryId ? categoriesMap.get(tx.categoryId) : undefined;

            const primaryTitle =
              tx.notes?.trim() ||
              category?.name ||
              (isTransfer ? 'Transfer' : 'Transaction');

            const secondaryCategory =
              tx.notes?.trim() && category ? category.name : undefined;

            const accountLabel = isTransfer
              ? `${fromAccount?.name || 'Account'} → ${toAccount?.name || 'Account'}`
              : fromAccount?.name || 'Account';

            const iconBg = isTransfer
              ? '#A6CFF2'
              : category?.color || '#FFED9E';

            const iconName = isTransfer ? 'ArrowLeftRight' : category?.icon;

            return (
              <div
                key={tx.id}
                data-testid={`recent-tx-item-${tx.id}`}
                className="py-3 flex items-center justify-between gap-3 first:pt-1 last:pb-1"
              >
                {/* Left: Category Icon + Note/Category + Account Badge + Date */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-2xl border border-stone-800/15 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0px_0px_#111111]"
                    style={{ backgroundColor: iconBg }}
                    data-testid={`tx-icon-${tx.id}`}
                  >
                    {renderCategoryIcon(iconName, 'w-4 h-4 text-[#111111]')}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-bold text-xs sm:text-sm text-[#111111] truncate"
                        title={primaryTitle}
                      >
                        {primaryTitle}
                      </span>

                      {tx.mood && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-stone-800/20 text-[#111111] shadow-[1px_1px_0px_0px_#111111] select-none"
                          style={{ backgroundColor: getMoodPillColor(tx.mood) }}
                          data-testid={`tx-mood-${tx.id}`}
                        >
                          {tx.mood}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-stone-600 mt-0.5 flex-wrap">
                      {secondaryCategory && (
                        <>
                          <span className="font-medium text-stone-600">
                            {secondaryCategory}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-stone-200/70 text-stone-700 font-semibold text-[10px]">
                        {accountLabel}
                      </span>
                      <span>•</span>
                      <span>{formatTransactionDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Semantic Amount */}
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
                    showSign={tx.type !== 'transfer'}
                    size="md"
                    data-testid={`tx-amount-${tx.id}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BentoCard>
  );
};
