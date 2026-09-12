import React from 'react';
import {
  Smartphone,
  Building2,
  Wallet,
  CreditCard,
  Landmark,
  PiggyBank,
  ArrowLeftRight,
  Pencil,
} from 'lucide-react';
import type { Account, AccountType } from '../../domain/types';
import { AmountDisplay } from '../ui/AmountDisplay';
import { formatPHP } from '../../domain/money';
import { Button } from '../ui/Button';

export interface AccountCardProps {
  account: Account;
  balance: number;
  onTransfer?: (account: Account) => void;
  onEdit?: (account: Account) => void;
  className?: string;
}

/**
 * Returns formatted human-readable account type label.
 */
export function formatAccountTypeName(type: AccountType): string {
  switch (type) {
    case 'bank':
      return 'Bank';
    case 'ewallet':
      return 'E-Wallet';
    case 'cash':
      return 'Cash';
    case 'credit':
      return 'Credit Card';
    case 'savings':
      return 'Savings';
    default:
      return type;
  }
}

/**
 * Renders account icon with fallback to Wallet.
 */
export function renderAccountCardIcon(iconName: string, className = 'w-5 h-5'): React.ReactNode {
  switch (iconName) {
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Building2':
      return <Building2 className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'CreditCard':
      return <CreditCard className={className} />;
    case 'Landmark':
      return <Landmark className={className} />;
    case 'PiggyBank':
      return <PiggyBank className={className} />;
    default:
      return <Wallet className={className} />;
  }
}

/**
 * AccountCard: Bento card for a single financial account.
 * Features:
 * - Account icon with matching pastel color fill
 * - Account name and Type badge (Bank, E-Wallet, Cash, Credit Card, Savings)
 * - Running balance displayed with AmountDisplay
 * - Initial balance note formatted with formatPHP
 * - "Transfer" and "Edit" action buttons
 */
export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  balance,
  onTransfer,
  onEdit,
  className = '',
}) => {
  const isDarkColor = account.color === '#111111' || account.color === '#124224';

  return (
    <div
      data-testid={`account-card-${account.id}`}
      className={`bg-[#FFFDF9] rounded-3xl border-2 border-[#111111] p-5 shadow-[4px_4px_0px_0px_#111111] flex flex-col justify-between transition-transform hover:-translate-y-0.5 relative overflow-hidden ${className}`}
    >
      {/* Top Section: Icon, Name & Type Badge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Account Icon */}
            <div
              data-testid={`account-icon-${account.id}`}
              className={`w-11 h-11 rounded-2xl border-2 border-[#111111] flex items-center justify-center shadow-[2px_2px_0px_0px_#111111] flex-shrink-0 ${
                isDarkColor ? 'text-[#F7F2E8]' : 'text-[#111111]'
              }`}
              style={{ backgroundColor: account.color }}
            >
              {renderAccountCardIcon(account.icon, 'w-5 h-5 stroke-[2]')}
            </div>

            {/* Account Name */}
            <div>
              <h3
                data-testid={`account-name-${account.id}`}
                className="font-serif font-bold text-lg text-[#111111] tracking-tight leading-tight"
              >
                {account.name}
              </h3>
              <span
                data-testid={`account-type-badge-${account.id}`}
                className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border border-stone-800/20 bg-stone-100 text-stone-700"
              >
                {formatAccountTypeName(account.type)}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Running Balance */}
        <div className="my-3 pt-2">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
            Current Balance
          </span>
          <AmountDisplay
            amount={balance}
            size="lg"
            type="auto"
            data-testid={`account-balance-${account.id}`}
          />
        </div>

        {/* Initial Balance Note */}
        <div
          data-testid={`account-initial-balance-${account.id}`}
          className="text-xs text-stone-500 font-medium mb-4"
        >
          <span>Initial: </span>
          <span className="font-mono font-semibold text-stone-700">
            {formatPHP(account.initialBalance)}
          </span>
        </div>
      </div>

      {/* Bottom Actions: Transfer and Edit */}
      <div className="flex items-center gap-2 pt-3 border-t border-stone-800/10">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeftRight className="w-3.5 h-3.5 stroke-[2]" />}
          onClick={() => onTransfer?.(account)}
          data-testid={`account-transfer-btn-${account.id}`}
          className="flex-1 text-xs py-1.5"
        >
          Transfer
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<Pencil className="w-3.5 h-3.5 stroke-[2]" />}
          onClick={() => onEdit?.(account)}
          data-testid={`account-edit-btn-${account.id}`}
          className="text-xs py-1.5 px-3 border border-stone-800/15 hover:bg-stone-100"
        >
          Edit
        </Button>
      </div>
    </div>
  );
};
