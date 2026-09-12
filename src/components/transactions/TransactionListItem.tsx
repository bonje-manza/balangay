import React from 'react';
import type { Transaction, Account, Category } from '../../domain/types';
import { AmountDisplay } from '../ui/AmountDisplay';
import { renderCategoryIcon } from '../dashboard/iconHelpers';
import { ArrowLeftRight } from 'lucide-react';

export interface TransactionListItemProps {
  transaction: Transaction;
  account?: Account;
  toAccount?: Account;
  category?: Category;
  accounts?: Account[];
  categories?: Category[];
  onClick?: (transaction: Transaction) => void;
  className?: string;
}

/**
 * Resolves mood pill background color according to soft neo-brutalist palette.
 */
export function getMoodPillColor(mood: string): string {
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
 * TransactionListItem: Renders a single transaction card/row in Soft Neo-Brutalism styling:
 * - Category or Transfer icon in a rounded pastel circle
 * - Note or Category name as primary title with account badge (e.g., GCash or GCash → BPI)
 * - Mood tag chip if present ("Peaceful", "Essential", "Treat", "Invest")
 * - Formatted semantic amount using AmountDisplay
 * - Clickable to trigger edit modal
 */
export const TransactionListItem: React.FC<TransactionListItemProps> = ({
  transaction,
  account,
  toAccount,
  category,
  accounts,
  categories,
  onClick,
  className = '',
}) => {
  const isTransfer = transaction.type === 'transfer';

  // Resolve accounts and category if not passed directly
  const fromAccount =
    account ||
    (accounts ? accounts.find((a) => a.id === transaction.accountId) : undefined);
  const destinationAccount =
    toAccount ||
    (accounts && transaction.toAccountId
      ? accounts.find((a) => a.id === transaction.toAccountId)
      : undefined);
  const resolvedCategory =
    category ||
    (categories && transaction.categoryId
      ? categories.find((c) => c.id === transaction.categoryId)
      : undefined);

  const primaryTitle =
    transaction.notes?.trim() ||
    resolvedCategory?.name ||
    (isTransfer ? 'Transfer' : 'Transaction');

  const secondaryCategory =
    transaction.notes?.trim() && resolvedCategory ? resolvedCategory.name : undefined;

  const accountBadgeLabel = isTransfer
    ? `${fromAccount?.name || 'Account'} → ${destinationAccount?.name || 'Account'}`
    : fromAccount?.name || 'Account';

  const iconBg = isTransfer ? '#A6CFF2' : resolvedCategory?.color || '#FFED9E';
  const iconName = isTransfer ? 'ArrowLeftRight' : resolvedCategory?.icon;

  const handleClick = () => {
    if (onClick) {
      onClick(transaction);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick(transaction);
    }
  };

  return (
    <div
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={`transaction-item-${transaction.id}`}
      className={`group bg-[#FFFDF9] hover:bg-[#FFFBF2] text-[#111111] border border-stone-800/15 rounded-2xl p-3.5 sm:p-4 shadow-[2px_2px_0px_0px_#111111] hover:shadow-[3px_3px_0px_0px_#111111] transition-all flex items-center justify-between gap-3 cursor-pointer select-none active:translate-y-0.5 ${className}`}
    >
      {/* Left: Pastel circle icon + Title + Account Badge + Mood + Tags */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Category / Transfer Icon in pastel circle */}
        <div
          className="w-10 h-10 rounded-full border border-stone-800/20 flex items-center justify-center flex-shrink-0 shadow-[1px_1px_0px_0px_#111111]"
          style={{ backgroundColor: iconBg }}
          data-testid={`tx-icon-${transaction.id}`}
        >
          {isTransfer ? (
            <ArrowLeftRight className="w-4 h-4 text-[#111111]" />
          ) : (
            renderCategoryIcon(iconName, 'w-4 h-4 text-[#111111]')
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-bold text-sm sm:text-base text-[#111111] truncate"
              title={primaryTitle}
            >
              {primaryTitle}
            </span>

            {/* Mood Tag Chip */}
            {transaction.mood && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-stone-800/20 text-[#111111] shadow-[1px_1px_0px_0px_#111111]"
                style={{ backgroundColor: getMoodPillColor(transaction.mood) }}
                data-testid={`tx-mood-${transaction.id}`}
              >
                {transaction.mood}
              </span>
            )}
          </div>

          {/* Subtitle Line: Account Badge + Category + Tags */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1 flex-wrap">
            {secondaryCategory && (
              <>
                <span className="font-medium text-stone-600 truncate max-w-[140px]">
                  {secondaryCategory}
                </span>
                <span>•</span>
              </>
            )}

            {/* Account Badge */}
            <span
              className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-800/15 text-stone-700 font-semibold text-[11px] truncate max-w-[200px]"
              data-testid={`tx-account-badge-${transaction.id}`}
            >
              {accountBadgeLabel}
            </span>

            {/* Tags Chips */}
            {transaction.tags && transaction.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span>•</span>
                {transaction.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.2 rounded bg-stone-200/60 border border-stone-800/10 text-stone-600 text-[10px] font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Semantic Amount */}
      <div className="flex-shrink-0 text-right ml-2">
        <AmountDisplay
          amount={transaction.type === 'expense' ? -transaction.amount : transaction.amount}
          type={
            transaction.type === 'income'
              ? 'income'
              : transaction.type === 'expense'
              ? 'expense'
              : 'neutral'
          }
          showSign={transaction.type !== 'transfer'}
          size="md"
          data-testid={`tx-amount-${transaction.id}`}
        />
      </div>
    </div>
  );
};
