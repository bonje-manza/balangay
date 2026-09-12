import React from 'react';
import type { Account } from '../../domain/types';
import { formatPHP } from '../../domain/money';
import { BentoCard, BentoCardVariant } from '../ui/BentoCard';
import { AmountDisplay } from '../ui/AmountDisplay';
import { SparkleStar } from '../ui/StickerIcons';
import { StickerBadge } from '../ui/StickerBadge';
import { renderAccountIcon } from './iconHelpers';

export interface NetWorthCardProps {
  netWorth: number;
  accounts: Account[];
  balances: Map<string, number>;
  variant?: BentoCardVariant;
  className?: string;
}

/**
 * NetWorthCard: Hero Bento card displaying total net worth with AmountDisplay (hero),
 * sparkling sticker badge, and a breakdown strip of active account balances and icons.
 */
export const NetWorthCard: React.FC<NetWorthCardProps> = ({
  netWorth,
  accounts,
  balances,
  variant = 'dark',
  className = '',
}) => {
  const isDark = variant === 'dark';
  const activeAccounts = accounts.filter((acc) => !acc.isArchived);

  return (
    <BentoCard
      variant={variant}
      sticker={
        <div className="w-10 h-10 rounded-2xl bg-[#FFED9E] border border-stone-800/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
          <SparkleStar className="w-5 h-5 text-[#111111]" fill="#FFED9E" stroke="#111111" />
        </div>
      }
      title="Total Net Worth"
      subtitle="Live across all active accounts"
      action={
        <StickerBadge variant="pistachio" icon={<SparkleStar className="w-3 h-3 text-[#124224]" />}>
          Real-time
        </StickerBadge>
      }
      className={`shadow-[4px_4px_0px_0px_#111111] ${className}`}
      data-testid="net-worth-card"
    >
      {/* Hero Amount Display */}
      <div className="my-4">
        <AmountDisplay
          amount={netWorth}
          size="hero"
          className={isDark ? '!text-[#FFFDF9]' : ''}
          data-testid="net-worth-amount"
        />
      </div>

      {/* Active Accounts Breakdown Strip */}
      <div className="mt-6 pt-5 border-t border-stone-800/20">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-stone-400' : 'text-stone-500'
            }`}
          >
            Active Accounts ({activeAccounts.length})
          </span>
        </div>

        {activeAccounts.length === 0 ? (
          <p
            className={`text-xs font-medium italic ${
              isDark ? 'text-stone-500' : 'text-stone-400'
            }`}
          >
            No active accounts found.
          </p>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5"
            data-testid="accounts-breakdown-strip"
          >
            {activeAccounts.map((account) => {
              const balance = balances.get(account.id) ?? account.initialBalance;
              return (
                <div
                  key={account.id}
                  data-testid={`account-strip-item-${account.id}`}
                  className={`rounded-2xl p-2.5 sm:p-3 border transition-transform hover:-translate-y-0.5 flex flex-col justify-between gap-1.5 ${
                    isDark
                      ? 'bg-[#1C1C1C] border-stone-800 text-[#F7F2E8]'
                      : 'bg-white/80 border-stone-800/15 text-[#111111]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-[#111111] border border-stone-800/20 flex-shrink-0 shadow-[1px_1px_0px_0px_#000000]"
                      style={{ backgroundColor: account.color || '#FFED9E' }}
                    >
                      {renderAccountIcon(account.icon, 'w-3.5 h-3.5')}
                    </div>
                    <span
                      className={`text-xs font-bold truncate ${
                        isDark ? 'text-[#F7F2E8]' : 'text-[#111111]'
                      }`}
                      title={account.name}
                    >
                      {account.name}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-mono font-semibold tabular-nums truncate ${
                      isDark ? 'text-stone-300' : 'text-stone-700'
                    }`}
                  >
                    {formatPHP(balance)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BentoCard>
  );
};
