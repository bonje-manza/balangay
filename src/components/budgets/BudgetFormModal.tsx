import React, { useState, useEffect } from 'react';
import { Trash2, Check, AlertCircle } from 'lucide-react';
import type { Category } from '../../domain/types';
import { db } from '../../storage/db';
import { roundMoney, formatPHP } from '../../domain/money';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategoryId?: string;
  onSuccess?: (category: Category) => void;
}

const PRESET_AMOUNTS = [3000, 5000, 8000, 12000, 20000];

/**
 * BudgetFormModal: Accessible dialog modal to set, edit, or remove monthly category budget limits.
 * Updates the Dexie categories table directly and notifies caller via onSuccess.
 */
export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategoryId,
  onSuccess,
}) => {
  const [categoryId, setCategoryId] = useState<string>('');
  const [limit, setLimit] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync category and budget limit when modal opens or selectedCategoryId changes
  useEffect(() => {
    if (!isOpen) return;

    const targetCategory =
      categories.find((c) => c.id === selectedCategoryId) ||
      categories.find((c) => c.type === 'expense') ||
      categories[0];

    if (targetCategory) {
      setCategoryId(targetCategory.id);
      setLimit(
        targetCategory.budgetLimit && targetCategory.budgetLimit > 0
          ? targetCategory.budgetLimit.toString()
          : ''
      );
    } else {
      setCategoryId('');
      setLimit('');
    }
    setError(null);
  }, [isOpen, selectedCategoryId, categories]);

  // Handle category change in selector dropdown
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setCategoryId(newId);
    const cat = categories.find((c) => c.id === newId);
    setLimit(
      cat?.budgetLimit && cat.budgetLimit > 0 ? cat.budgetLimit.toString() : ''
    );
    setError(null);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const hasExistingBudget = Boolean(
    selectedCategory?.budgetLimit && selectedCategory.budgetLimit > 0
  );

  // Save budget limit
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    const parsedLimit = parseFloat(limit.replace(/,/g, ''));
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('Please enter a valid budget limit greater than 0.');
      return;
    }

    const rounded = roundMoney(parsedLimit);

    try {
      setIsSubmitting(true);
      await db.categories.update(categoryId, { budgetLimit: rounded });
      const updated = await db.categories.get(categoryId);
      if (updated && onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setError('Failed to update category budget in local database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove budget limit
  const handleRemove = async () => {
    if (!categoryId) return;

    try {
      setIsSubmitting(true);
      // In Dexie, updating with undefined or 0 clears the monthly spending cap
      await db.categories.update(categoryId, { budgetLimit: undefined });
      const updated = await db.categories.get(categoryId);
      if (updated && onSuccess) {
        onSuccess(updated);
      }
      onClose();
    } catch (err) {
      setError('Failed to remove budget limit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Category Budget"
      subtitle="Define a monthly spending cap to keep track of spending progress."
      maxWidth="max-w-md"
    >
      <form noValidate onSubmit={handleSave} className="space-y-5 mt-2">
        {/* Category Dropdown */}
        <div className="space-y-1.5">
          <label
            htmlFor="budget-category-select"
            className="block text-xs font-bold uppercase tracking-wider text-stone-700"
          >
            Category
          </label>
          <div className="relative">
            <select
              id="budget-category-select"
              data-testid="budget-category-select"
              value={categoryId}
              onChange={handleCategoryChange}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F7F2E8] border-2 border-stone-800 text-sm font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111] cursor-pointer shadow-[2px_2px_0px_0px_#111111]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.budgetLimit ? `(Current: ${formatPHP(cat.budgetLimit)})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Monthly Budget Limit Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="budget-limit-input"
            className="block text-xs font-bold uppercase tracking-wider text-stone-700"
          >
            Monthly Budget Cap (PHP)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-base font-bold text-stone-700 select-none">
              ₱
            </span>
            <input
              id="budget-limit-input"
              data-testid="budget-limit-input"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 8000"
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value);
                setError(null);
              }}
              className="w-full pl-8 pr-4 py-2.5 rounded-2xl bg-[#F7F2E8] border-2 border-stone-800 text-base font-mono font-bold text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111] shadow-[2px_2px_0px_0px_#111111]"
            />
          </div>
        </div>

        {/* Quick Amount Presets */}
        <div className="space-y-1.5">
          <span className="block text-[11px] font-semibold text-stone-500">
            Quick Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setLimit(amt.toString())}
                className="px-2.5 py-1 text-xs font-bold rounded-xl bg-stone-100 hover:bg-[#FFED9E] text-stone-800 border border-stone-800/20 transition-all cursor-pointer select-none active:translate-y-0.5"
              >
                ₱{amt.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#F2C0CA]/40 border border-[#9E2A3B]/30 text-xs font-semibold text-[#9E2A3B]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-stone-800/10 flex items-center justify-between gap-3">
          {hasExistingBudget ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              isLoading={isSubmitting}
              icon={<Trash2 className="w-4 h-4 text-[#9E2A3B]" />}
              data-testid="remove-budget-btn"
              className="text-[#9E2A3B] hover:bg-[#F2C0CA]/30 border-red-300"
            >
              Remove
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              icon={<Check className="w-4 h-4" />}
              data-testid="save-budget-btn"
            >
              Save Budget
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
