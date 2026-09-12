import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Building2,
  Wallet,
  CreditCard,
  Landmark,
  PiggyBank,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import type { Account, AccountType } from '../../domain/types';
import {
  createAccount,
  updateAccount,
  deleteAccount,
} from '../../storage/accountRepository';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
  onSuccess?: (account: Account) => void;
  onDelete?: (accountId: string) => void;
}

export interface AccountPresetConfig {
  name: string;
  type: AccountType;
  color: string;
  icon: string;
  presetKey: string;
}

export const ACCOUNT_PRESETS: AccountPresetConfig[] = [
  { presetKey: 'gcash', name: 'GCash', type: 'ewallet', color: '#A6CFF2', icon: 'Smartphone' },
  { presetKey: 'maya', name: 'Maya', type: 'ewallet', color: '#DAE097', icon: 'Smartphone' },
  { presetKey: 'bpi', name: 'BPI', type: 'bank', color: '#F2C0CA', icon: 'Building2' },
  { presetKey: 'bdo', name: 'BDO', type: 'bank', color: '#A6CFF2', icon: 'Building2' },
  { presetKey: 'cash', name: 'Cash', type: 'cash', color: '#FFED9E', icon: 'Wallet' },
  { presetKey: 'credit-card', name: 'Credit Card', type: 'credit', color: '#111111', icon: 'CreditCard' },
];

export const COLOR_OPTIONS = [
  { value: '#FFED9E', label: 'Butter' },
  { value: '#F2C0CA', label: 'Blossom' },
  { value: '#DAE097', label: 'Pistachio' },
  { value: '#A6CFF2', label: 'Sky' },
  { value: '#111111', label: 'Dark Anchor' },
];

export const ICON_OPTIONS = [
  { name: 'Smartphone', icon: Smartphone, label: 'E-Wallet / Phone' },
  { name: 'Building2', icon: Building2, label: 'Bank Branch' },
  { name: 'Wallet', icon: Wallet, label: 'Cash Wallet' },
  { name: 'CreditCard', icon: CreditCard, label: 'Credit Card' },
  { name: 'Landmark', icon: Landmark, label: 'Landmark Bank' },
  { name: 'PiggyBank', icon: PiggyBank, label: 'Piggy Savings' },
];

/**
 * AccountFormModal: Accessible modal dialog for creating and modifying accounts.
 * Includes Philippine starter quick presets, custom color/icon pickers,
 * balance initialization, and safe delete flow with transaction cleanup warnings.
 */
export const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
  onSuccess,
  onDelete,
}) => {
  const isEdit = Boolean(accountToEdit);

  // Form states
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<AccountType>('bank');
  const [initialBalance, setInitialBalance] = useState<string>('');
  const [color, setColor] = useState<string>('#A6CFF2');
  const [icon, setIcon] = useState<string>('Smartphone');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state when modal opens or accountToEdit changes
  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setInitialBalance(accountToEdit.initialBalance.toString());
      setColor(accountToEdit.color || '#A6CFF2');
      setIcon(accountToEdit.icon || 'Smartphone');
    } else {
      setName('');
      setType('bank');
      setInitialBalance('0');
      setColor('#A6CFF2');
      setIcon('Smartphone');
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [accountToEdit, isOpen]);

  const handleApplyPreset = (preset: AccountPresetConfig) => {
    setName(preset.name);
    setType(preset.type);
    setColor(preset.color);
    setIcon(preset.icon);
    if (errors.name) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.name;
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Account name is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const parsedBalance = parseFloat(initialBalance);
      const safeBalance = isNaN(parsedBalance) ? 0 : parsedBalance;

      let resultAccount: Account;

      if (isEdit && accountToEdit) {
        const updates: Partial<Omit<Account, 'id' | 'createdAt'>> = {
          name: name.trim(),
          type,
          initialBalance: safeBalance,
          color,
          icon,
        };

        await updateAccount(accountToEdit.id, updates);
        resultAccount = {
          ...accountToEdit,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      } else {
        resultAccount = await createAccount({
          name: name.trim(),
          type,
          initialBalance: safeBalance,
          currency: 'PHP',
          color,
          icon,
          isArchived: false,
        });
      }

      if (onSuccess) {
        onSuccess(resultAccount);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!accountToEdit) return;
    try {
      setIsSubmitting(true);
      await deleteAccount(accountToEdit.id);
      if (onDelete) {
        onDelete(accountToEdit.id);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Account' : 'Add New Account'}
      subtitle={
        isEdit
          ? 'Update account credentials, icon, color, or starting balance'
          : 'Create a local wallet or bank account to track offline funds'
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4.5" data-testid="account-form">
        {/* Quick Presets Section (only for new accounts or to quickly auto-populate) */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#124224]" />
            <span>Philippine Favorites Presets</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ACCOUNT_PRESETS.map((preset) => (
              <button
                key={preset.presetKey}
                type="button"
                data-testid={`preset-btn-${preset.presetKey}`}
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-stone-800/15 bg-stone-100/70 hover:bg-[#FFED9E] text-stone-800 hover:border-stone-800/30 transition-all cursor-pointer select-none active:translate-y-0.5 shadow-sm"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            Account Name *
          </label>
          <input
            type="text"
            placeholder="e.g. Maya Savings, GCash Main, BPI"
            data-testid="account-name-input"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) {
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.name;
                  return copy;
                });
              }
            }}
            className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-800/20 text-sm font-semibold text-[#111111] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent shadow-sm"
          />
          {errors.name && (
            <p data-testid="account-name-error" className="text-xs font-bold text-rose-600 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Account Type Selector */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            Account Type *
          </label>
          <select
            data-testid="account-type-select"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            className="select-custom-chevron w-full px-3.5 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
          >
            <option value="bank">Bank</option>
            <option value="ewallet">E-Wallet</option>
            <option value="cash">Cash</option>
            <option value="credit">Credit Card</option>
            <option value="savings">Savings</option>
          </select>
        </div>

        {/* Initial Balance Input */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            Starting Balance (PHP)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-sm font-bold font-mono text-stone-600 select-none">
              ₱
            </span>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              data-testid="account-balance-input"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-white rounded-xl border border-stone-800/20 text-sm font-semibold font-mono text-[#111111] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Color Picker from Soft Neo-Brutalism Palette */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Card Accent Color
          </label>
          <div className="flex items-center gap-2">
            {COLOR_OPTIONS.map((c) => {
              const isSelected = color === c.value;
              const isDark = c.value === '#111111';
              return (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  data-testid={`color-option-${c.value}`}
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-xl border border-stone-800/20 flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'scale-110 shadow-md ring-2 ring-offset-2 ring-[#124224]'
                      : 'hover:scale-105 shadow-sm'
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {isSelected && (
                    <Check
                      className={`w-4 h-4 stroke-[3] ${
                        isDark ? 'text-[#F7F2E8]' : 'text-[#111111]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Account Icon
          </label>
          <div className="grid grid-cols-6 gap-2">
            {ICON_OPTIONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = icon === item.name;
              return (
                <button
                  key={item.name}
                  type="button"
                  title={item.label}
                  data-testid={`icon-option-${item.name}`}
                  onClick={() => setIcon(item.name)}
                  className={`h-10 rounded-xl border border-stone-800/20 flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111111] text-[#F7F2E8] shadow-sm scale-105'
                      : 'bg-white text-stone-700 hover:bg-stone-50 shadow-none'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions & Delete Confirmation */}
        <div className="pt-3 border-t border-stone-800/10 flex items-center justify-between gap-3">
          {isEdit ? (
            <div>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  data-testid="account-delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <div className="flex flex-col gap-1.5 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                  <span
                    data-testid="delete-warning-text"
                    className="text-[11px] text-rose-700 font-semibold leading-tight"
                  >
                    Deleting this account will remove all associated transactions.
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      data-testid="confirm-delete-account-btn"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              data-testid="account-submit-btn"
            >
              {isEdit ? 'Save Changes' : 'Create Account'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
