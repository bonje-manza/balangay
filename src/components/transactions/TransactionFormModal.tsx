import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../storage/db';
import type { Transaction, Account, Category, TransactionType } from '../../domain/types';
import { calculateAccountBalanceAsOf } from '../../domain/calculations';
import { formatPHP, roundMoney } from '../../domain/money';
import {
  createTransaction,
  createTransfer,
  createAdjustment,
  updateTransaction,
  deleteTransaction,
} from '../../storage/transactionRepository';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Trash2, Check, ChevronDown } from 'lucide-react';
import { getMoodPillColor } from './TransactionListItem';

export interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  initialType?: TransactionType;
  initialAccountId?: string;
  initialDate?: string;
  accounts: Account[];
  categories: Category[];
  transactions?: Transaction[];
  onSuccess?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

const MOODS = ['Peaceful', 'Essential', 'Treat', 'Invest'];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
  initialType = 'expense',
  initialAccountId,
  initialDate,
  accounts,
  categories,
  transactions,
  onSuccess,
  onDelete,
}) => {
  const isEdit = Boolean(transactionToEdit);

  // Form state
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [targetBalance, setTargetBalance] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const liveTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];
  const allTransactions = transactions || liveTransactions;

  // Sync state with props when modal opens or transactionToEdit changes
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setTargetBalance(
        transactionToEdit.targetBalance !== undefined
          ? transactionToEdit.targetBalance.toString()
          : ''
      );
      setAccountId(transactionToEdit.accountId);
      setToAccountId(transactionToEdit.toAccountId || '');
      setCategoryId(transactionToEdit.categoryId || '');
      setDate(transactionToEdit.date.slice(0, 10));
      setNotes(transactionToEdit.notes || '');
      setTagsInput(
        transactionToEdit.tags && transactionToEdit.tags.length > 0
          ? transactionToEdit.tags.join(', ')
          : ''
      );
      setMood(transactionToEdit.mood || '');
    } else {
      setType(initialType);
      setAmount('');
      setTargetBalance('');
      const defaultAccount =
        initialAccountId && accounts.some((a) => a.id === initialAccountId)
          ? initialAccountId
          : accounts[0]?.id || '';
      const secondAccount =
        accounts.find((a) => a.id !== defaultAccount)?.id || accounts[1]?.id || '';
      setAccountId(defaultAccount);
      setToAccountId(secondAccount);
      // Auto-select first matching category if available
      const matchingCat = categories.find((c) => c.type === initialType);
      setCategoryId(matchingCat ? matchingCat.id : '');
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setNotes('');
      setTagsInput('');
      setMood('');
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [transactionToEdit, initialType, initialAccountId, initialDate, accounts, categories, isOpen]);

  const baselineBalance = useMemo(() => {
    if (!accountId) return 0;
    return calculateAccountBalanceAsOf(
      accountId,
      accounts,
      allTransactions,
      date,
      transactionToEdit?.id
    );
  }, [accountId, accounts, allTransactions, date, transactionToEdit]);

  const parsedTarget = parseFloat(targetBalance);
  const diff = !isNaN(parsedTarget) ? roundMoney(parsedTarget - baselineBalance) : 0;

  // When type changes, ensure valid category selection
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.category;
      delete copy.transfer;
      delete copy.amount;
      delete copy.targetBalance;
      return copy;
    });

    if (newType === 'expense' || newType === 'income') {
      const firstMatching = categories.find((c) => c.type === newType);
      setCategoryId(firstMatching ? firstMatching.id : '');
    } else {
      setCategoryId('');
      if (newType === 'transfer' && !toAccountId && accounts.length > 1) {
        const other = accounts.find((a) => a.id !== accountId);
        if (other) setToAccountId(other.id);
      }
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (type === 'adjustment') {
      if (!accountId) {
        errs.account = 'Account is required';
      }
      if (!targetBalance || isNaN(parsedTarget)) {
        errs.targetBalance = 'Actual balance is required';
      } else if (diff === 0) {
        errs.targetBalance = 'Actual balance matches current balance (no adjustment needed)';
      }
    } else {
      const parsedAmount = parseFloat(amount);
      if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        errs.amount = 'Amount must be greater than 0';
      }

      if (type === 'expense' || type === 'income') {
        if (!categoryId) {
          errs.category = 'Category is required';
        }
        if (!accountId) {
          errs.account = 'Account is required';
        }
      } else if (type === 'transfer') {
        if (!accountId) {
          errs.account = 'Source account is required';
        }
        if (!toAccountId) {
          errs.toAccount = 'Destination account is required';
        } else if (accountId && accountId === toAccountId) {
          errs.transfer = 'Source and destination accounts must be different';
        }
      }
    }

    if (!date) {
      errs.date = 'Date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const parsedAmount = parseFloat(amount);
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      let savedTx: Transaction;

      if (isEdit && transactionToEdit) {
        const updates: Partial<Omit<Transaction, 'id' | 'createdAt'>> = {
          amount: type === 'adjustment' ? roundMoney(Math.abs(diff)) : parsedAmount,
          type,
          accountId,
          toAccountId: type === 'transfer' ? toAccountId : undefined,
          categoryId: (type === 'expense' || type === 'income') ? categoryId : undefined,
          adjustmentDirection:
            type === 'adjustment' ? (diff >= 0 ? 'increase' : 'decrease') : undefined,
          targetBalance: type === 'adjustment' ? parsedTarget : undefined,
          date,
          notes: notes.trim() ? notes.trim() : '',
          tags: parsedTags,
          mood: mood || '',
        };

        await updateTransaction(transactionToEdit.id, updates);
        savedTx = {
          ...transactionToEdit,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      } else {
        if (type === 'transfer') {
          savedTx = await createTransfer({
            fromAccountId: accountId,
            toAccountId,
            amount: parsedAmount,
            date,
            notes: notes.trim() || undefined,
            mood: mood || undefined,
          });
          if (parsedTags.length > 0) {
            await updateTransaction(savedTx.id, { tags: parsedTags });
            savedTx.tags = parsedTags;
          }
        } else if (type === 'adjustment') {
          savedTx = await createAdjustment({
            accountId,
            currentBalance: baselineBalance,
            targetBalance: parsedTarget,
            date,
            notes: notes.trim() || undefined,
            tags: parsedTags.length > 0 ? parsedTags : undefined,
            mood: mood || undefined,
          });
        } else {
          savedTx = await createTransaction({
            amount: parsedAmount,
            type,
            accountId,
            categoryId,
            date,
            notes: notes.trim() || undefined,
            tags: parsedTags.length > 0 ? parsedTags : undefined,
            mood: mood || undefined,
          });
        }
      }

      if (onSuccess) {
        onSuccess(savedTx);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!transactionToEdit) return;
    try {
      setIsSubmitting(true);
      await deleteTransaction(transactionToEdit.id);
      if (onDelete) {
        onDelete(transactionToEdit.id);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories = categories.filter(
    (c) => c.type === type && (!c.isArchived || c.id === categoryId)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Transaction' : 'Add Transaction'}
      subtitle={
        isEdit
          ? 'Modify or delete this ledger entry'
          : 'Record a new income, expense, or fund transfer'
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="transaction-form">
        {/* Type Selector Tabs */}
        <div
          role="tablist"
          aria-label="Transaction Type"
          className="grid grid-cols-4 gap-1 p-1 bg-stone-150 rounded-2xl border border-stone-800/20"
        >
          {(['expense', 'income', 'transfer', 'adjustment'] as TransactionType[]).map((tabType) => {
            const isSelected = type === tabType;
            return (
              <button
                key={tabType}
                type="button"
                role="tab"
                aria-selected={isSelected}
                data-testid={`type-tab-${tabType}`}
                onClick={() => handleTypeChange(tabType)}
                className={`py-2 text-xs font-bold capitalize rounded-xl transition-all select-none cursor-pointer ${
                  isSelected
                    ? 'bg-[#111111] text-[#F7F2E8] shadow-sm'
                    : 'bg-white/80 text-stone-700 hover:bg-white hover:text-stone-900 border border-stone-200'
                }`}
              >
                {tabType === 'adjustment' ? 'Adjust' : tabType}
              </button>
            );
          })}
        </div>

        {type === 'adjustment' ? (
          <div className="space-y-3.5">
            {/* Account Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Account to Adjust *
              </label>
              <select
                data-testid="transaction-account-select"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="select-custom-chevron w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Tracked Balance Readout */}
            <div className="bg-[#FFFDF9] border border-stone-800/15 rounded-xl p-3 flex items-center justify-between shadow-sm">
              <span className="text-xs font-semibold text-stone-600">Current Tracked Balance</span>
              <span className="text-sm font-bold font-mono text-[#111111]" data-testid="current-tracked-balance">
                {formatPHP(baselineBalance)}
              </span>
            </div>

            {/* Actual Target Balance Input */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Actual Current Balance (PHP) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-lg font-bold font-mono text-stone-700 select-none">
                  ₱
                </span>
                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  data-testid="adjustment-target-balance-input"
                  value={targetBalance}
                  onChange={(e) => {
                    setTargetBalance(e.target.value);
                    if (errors.targetBalance) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.targetBalance;
                        return copy;
                      });
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-stone-800/20 text-lg font-bold font-mono text-[#111111] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent shadow-sm"
                />
              </div>
              {errors.targetBalance && (
                <p data-testid="target-balance-error" className="text-xs font-bold text-rose-600 mt-1">
                  {errors.targetBalance}
                </p>
              )}
            </div>

            {/* Discrepancy Preview */}
            {targetBalance !== '' && !isNaN(parsedTarget) && (
              <div>
                {diff === 0 ? (
                  <div
                    className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5"
                    data-testid="adjustment-zero-diff"
                  >
                    Account balance already matches {formatPHP(baselineBalance)}. No adjustment needed.
                  </div>
                ) : (
                  <div
                    className={`text-xs font-bold px-3 py-2 rounded-xl border flex items-center justify-between ${
                      diff > 0
                        ? 'bg-[#DAE097]/40 text-[#124224] border-[#DAE097]'
                        : 'bg-[#F2C0CA]/40 text-rose-800 border-[#F2C0CA]'
                    }`}
                    data-testid="adjustment-diff-preview"
                  >
                    <span>Adjustment:</span>
                    <span className="font-mono">
                      {diff > 0 ? `+${formatPHP(diff)}` : `-${formatPHP(Math.abs(diff))}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Amount (PHP) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-lg font-bold font-mono text-stone-700 select-none">
                  ₱
                </span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0.00"
                  data-testid="transaction-amount-input"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.amount;
                        return copy;
                      });
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-stone-800/20 text-lg font-bold font-mono text-[#111111] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent shadow-sm"
                />
              </div>
              {errors.amount && (
                <p data-testid="amount-error" className="text-xs font-bold text-rose-600 mt-1">
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Account Selection (Expense / Income: Single account; Transfer: From & To accounts) */}
            {type === 'transfer' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    From Account *
                  </label>
                  <select
                    data-testid="transaction-from-account-select"
                    value={accountId}
                    onChange={(e) => {
                      setAccountId(e.target.value);
                      if (errors.transfer || errors.account) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.transfer;
                          delete copy.account;
                          return copy;
                        });
                      }
                    }}
                    className="select-custom-chevron w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    To Account *
                  </label>
                  <select
                    data-testid="transaction-to-account-select"
                    value={toAccountId}
                    onChange={(e) => {
                      setToAccountId(e.target.value);
                      if (errors.transfer || errors.toAccount) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.transfer;
                          delete copy.toAccount;
                          return copy;
                        });
                      }
                    }}
                    className="select-custom-chevron w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.transfer && (
                  <div className="col-span-full">
                    <p
                      data-testid="transfer-account-error"
                      className="text-xs font-bold text-rose-600 mt-0.5"
                    >
                      {errors.transfer}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Account *
                  </label>
                  <select
                    data-testid="transaction-account-select"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="select-custom-chevron w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Category *
                  </label>
                  <select
                    data-testid="transaction-category-select"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      if (errors.category) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.category;
                          return copy;
                        });
                      }
                    }}
                    className="select-custom-chevron w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
                  >
                    <option value="">Select a category</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p data-testid="category-error" className="text-xs font-bold text-rose-600 mt-1">
                      {errors.category}
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Progressive Disclosure: Additional Details Accordion */}
        <details
          data-testid="transaction-details-accordion"
          open={Boolean(isEdit || notes || tagsInput || mood || type === 'adjustment')}
          className="group border border-stone-800/20 rounded-2xl bg-stone-50/60 p-3 transition-all"
        >
          <summary className="flex items-center justify-between cursor-pointer list-none select-none text-xs font-bold text-stone-700 hover:text-[#111111]">
            <span className="flex items-center gap-1.5">
              <span>Additional Details</span>
              <span className="text-[11px] font-normal text-stone-500">(Date, Notes, Mood, Tags)</span>
            </span>
            <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 text-stone-600" />
          </summary>

          <div className="pt-3 space-y-3.5">
            {/* Date Picker */}
            <div>
              <label htmlFor="transaction-date-input" className="block text-xs font-bold text-stone-800 mb-1">
                Date *
              </label>
              <input
                id="transaction-date-input"
                type="date"
                data-testid="transaction-date-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
              />
            </div>

            {/* Notes / Memo Input */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Notes / Memo
              </label>
              <input
                type="text"
                placeholder="e.g. Ramen Nagi with team"
                data-testid="transaction-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-medium text-stone-900 placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
              />
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. food, team, grab"
                data-testid="transaction-tags-input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-medium text-stone-900 placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
              />
            </div>

            {/* Mood Selector Pill Picker */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                Mood Tag
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {MOODS.map((m) => {
                  const isSelected = mood.toLowerCase() === m.toLowerCase();
                  return (
                    <button
                      key={m}
                      type="button"
                      data-testid={`mood-pill-${m.toLowerCase()}`}
                      onClick={() => setMood(isSelected ? '' : m)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer select-none active:translate-y-0.5 flex items-center gap-1 border border-stone-800/20 ${
                        isSelected
                          ? 'shadow-sm scale-105 font-bold'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: getMoodPillColor(m) }}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{m}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </details>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-stone-800/10 flex items-center justify-between gap-3">
          {isEdit ? (
            <div>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  data-testid="transaction-delete-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-rose-600 font-bold">Confirm?</span>
                  <button
                    type="button"
                    data-testid="confirm-delete-btn"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-2.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1.5 text-xs text-stone-600 hover:text-stone-900 cursor-pointer"
                  >
                    Cancel
                  </button>
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
              disabled={
                isSubmitting ||
                (type === 'adjustment' && (targetBalance === '' || isNaN(parsedTarget) || diff === 0))
              }
              data-testid="transaction-submit-btn"
            >
              {type === 'adjustment'
                ? isEdit
                  ? 'Save Changes'
                  : 'Adjust Balance'
                : isEdit
                ? 'Save Changes'
                : type === 'transfer'
                ? 'Save Transfer'
                : 'Save Transaction'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
