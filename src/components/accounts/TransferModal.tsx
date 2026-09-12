import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Check, ArrowRight, AlertCircle } from 'lucide-react';
import type { Account, Transaction } from '../../domain/types';
import { createTransfer } from '../../storage/transactionRepository';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  sourceAccountId?: string;
  onSuccess?: (transaction: Transaction) => void;
}

const MOOD_OPTIONS = [
  { name: 'Peaceful', color: '#DAE097' },
  { name: 'Essential', color: '#A6CFF2' },
  { name: 'Treat', color: '#FFED9E' },
];

/**
 * TransferModal: Fast, dedicated account-to-account funds transfer dialog.
 * Pre-selects source account, validates non-identical endpoints, formats PHP amounts,
 * filters destination accounts, displays error messages per field, and handles < 2 accounts gracefully.
 */
export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  sourceAccountId,
  onSuccess,
}) => {
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const hasInsufficientAccounts = accounts.length < 2;

  // Sync state on open or sourceAccountId change
  useEffect(() => {
    const initialFrom = sourceAccountId || accounts[0]?.id || '';
    const otherAccount = accounts.find((a) => a.id !== initialFrom)?.id || '';

    setFromAccountId(initialFrom);
    setToAccountId(otherAccount);
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    setMood('');
    setErrors({});
  }, [sourceAccountId, accounts, isOpen]);

  // Destination accounts excluding source account
  const destinationAccounts = accounts.filter((acc) => acc.id !== fromAccountId);

  const handleFromAccountChange = (newFromId: string) => {
    setFromAccountId(newFromId);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.fromAccount;
      delete copy.accounts;
      return copy;
    });

    if (toAccountId === newFromId) {
      const nextDest = accounts.find((a) => a.id !== newFromId)?.id || '';
      setToAccountId(nextDest);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const parsedAmount = parseFloat(amount);

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Amount must be greater than 0';
    }

    if (!fromAccountId) {
      errs.fromAccount = 'Source account is required';
    }

    if (!toAccountId) {
      errs.toAccount = 'Destination account is required';
    } else if (fromAccountId && fromAccountId === toAccountId) {
      errs.accounts = 'Source and destination accounts must be different';
    }

    if (!date) {
      errs.date = 'Date is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasInsufficientAccounts) return;
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const parsedAmount = parseFloat(amount);

      const transferTx = await createTransfer({
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        date,
        notes: notes.trim() || undefined,
        mood: mood || undefined,
      });

      if (onSuccess) {
        onSuccess(transferTx);
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
      title="Transfer Money"
      subtitle="Instantly move funds between wallets and accounts"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="transfer-form">
        {/* Banner for fewer than 2 accounts */}
        {hasInsufficientAccounts && (
          <div
            data-testid="insufficient-accounts-banner"
            className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-amber-900 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>You need at least two accounts to make a transfer.</span>
          </div>
        )}

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
              data-testid="transfer-amount-input"
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
              className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-stone-800/20 text-lg font-bold font-mono text-[#111111] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent shadow-sm"
            />
          </div>
          {errors.amount && (
            <p data-testid="transfer-amount-error" className="text-xs font-bold text-rose-600 mt-1">
              {errors.amount}
            </p>
          )}
        </div>

        {/* Source and Destination Accounts */}
        <div className="p-3.5 bg-stone-100/60 rounded-2xl border border-stone-800/15 space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              From (Source Account) *
            </label>
            <select
              data-testid="transfer-from-account-select"
              value={fromAccountId}
              onChange={(e) => handleFromAccountChange(e.target.value)}
              className="select-custom-chevron w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
            >
              <option value="">Select source account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            {errors.fromAccount && (
              <p
                data-testid="transfer-from-account-error"
                className="text-xs font-bold text-rose-600 mt-1"
              >
                {errors.fromAccount}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-white border border-stone-800/20 flex items-center justify-center text-stone-600 shadow-sm">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              To (Destination Account) *
            </label>
            <select
              data-testid="transfer-to-account-select"
              value={toAccountId}
              onChange={(e) => {
                setToAccountId(e.target.value);
                if (errors.toAccount || errors.accounts) {
                  setErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.toAccount;
                    delete copy.accounts;
                    return copy;
                  });
                }
              }}
              className="select-custom-chevron w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
            >
              <option value="">Select destination account</option>
              {destinationAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            {errors.toAccount && (
              <p
                data-testid="transfer-to-account-error"
                className="text-xs font-bold text-rose-600 mt-1"
              >
                {errors.toAccount}
              </p>
            )}
          </div>

          {errors.accounts && (
            <p data-testid="transfer-accounts-error" className="text-xs font-bold text-rose-600 mt-1">
              {errors.accounts}
            </p>
          )}
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1">
            Date *
          </label>
          <input
            type="date"
            data-testid="transfer-date-input"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) {
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.date;
                  return copy;
                });
              }
            }}
            className="w-full px-3 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-semibold text-stone-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
          />
          {errors.date && (
            <p data-testid="transfer-date-error" className="text-xs font-bold text-rose-600 mt-1">
              {errors.date}
            </p>
          )}
        </div>

        {/* Notes / Memo */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
            Notes / Memo
          </label>
          <input
            type="text"
            placeholder="e.g. InstaPay transfer, Allowance, Savings"
            data-testid="transfer-notes-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-white rounded-xl border border-stone-800/20 text-xs font-normal text-stone-900 placeholder:text-stone-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent"
          />
        </div>

        {/* Mood Selector Tag */}
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
            Mood Tag
          </label>
          <div className="flex items-center gap-2">
            {MOOD_OPTIONS.map((item) => {
              const isSelected = mood.toLowerCase() === item.name.toLowerCase();
              return (
                <button
                  key={item.name}
                  type="button"
                  data-testid={`transfer-mood-${item.name.toLowerCase()}`}
                  onClick={() => setMood(isSelected ? '' : item.name)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer select-none active:translate-y-0.5 flex items-center gap-1 border border-stone-800/20 ${
                    isSelected
                      ? 'ring-2 ring-[#124224] ring-offset-1 font-bold shadow-sm'
                      : 'opacity-70 hover:opacity-100 shadow-none'
                  }`}
                  style={{ backgroundColor: item.color }}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-stone-800/10 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="forest"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || hasInsufficientAccounts}
            icon={<ArrowLeftRight className="w-3.5 h-3.5" />}
            data-testid="transfer-submit-btn"
          >
            Confirm Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
