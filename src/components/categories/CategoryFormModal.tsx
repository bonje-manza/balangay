import React, { useState, useEffect } from 'react';
import type { Category } from '../../domain/types';
import { createCategory, updateCategory } from '../../storage/categoryRepository';
import {
  renderCategoryIcon,
  AVAILABLE_CATEGORY_COLORS,
  AVAILABLE_CATEGORY_ICONS,
} from '../dashboard/iconHelpers';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Check, AlertCircle } from 'lucide-react';

export interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: Category | null;
  defaultType?: 'expense' | 'income';
  onSuccess?: (category: Category) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  categoryToEdit,
  defaultType = 'expense',
  onSuccess,
}) => {
  const isEdit = Boolean(categoryToEdit);
  const isDefaultCategory = Boolean(categoryToEdit?.isDefault);

  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'expense' | 'income'>(defaultType);
  const [color, setColor] = useState<string>(AVAILABLE_CATEGORY_COLORS[0].hex);
  const [icon, setIcon] = useState<string>(AVAILABLE_CATEGORY_ICONS[0].name);
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setType(categoryToEdit.type);
      setColor(categoryToEdit.color || AVAILABLE_CATEGORY_COLORS[0].hex);
      setIcon(categoryToEdit.icon || AVAILABLE_CATEGORY_ICONS[0].name);
      setBudgetLimit(
        typeof categoryToEdit.budgetLimit === 'number' && categoryToEdit.budgetLimit > 0
          ? categoryToEdit.budgetLimit.toString()
          : ''
      );
    } else {
      setName('');
      setType(defaultType);
      setColor(AVAILABLE_CATEGORY_COLORS[0].hex);
      setIcon(defaultType === 'income' ? 'Briefcase' : 'Utensils');
      setBudgetLimit('');
    }
    setErrors({});
  }, [categoryToEdit, defaultType, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmed = name.trim();

    if (!trimmed) {
      errs.name = 'Category name is required';
    }

    if (budgetLimit) {
      const parsed = parseFloat(budgetLimit);
      if (isNaN(parsed) || parsed < 0) {
        errs.budgetLimit = 'Budget limit must be 0 or greater';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const parsedLimit = budgetLimit ? parseFloat(budgetLimit) : undefined;

      let savedCategory: Category;

      if (isEdit && categoryToEdit) {
        await updateCategory(categoryToEdit.id, {
          name: isDefaultCategory ? undefined : name.trim(),
          color,
          icon: isDefaultCategory ? undefined : icon,
          budgetLimit: type === 'expense' ? parsedLimit : undefined,
        });
        savedCategory = {
          ...categoryToEdit,
          name: isDefaultCategory ? categoryToEdit.name : name.trim(),
          color,
          icon: isDefaultCategory ? categoryToEdit.icon : icon,
          budgetLimit: type === 'expense' ? parsedLimit : undefined,
          updatedAt: new Date().toISOString(),
        };
      } else {
        savedCategory = await createCategory({
          name: name.trim(),
          type,
          color,
          icon,
          budgetLimit: type === 'expense' ? parsedLimit : undefined,
        });
      }

      if (onSuccess) {
        onSuccess(savedCategory);
      }
      onClose();
    } catch (err: any) {
      setErrors({ form: err?.message || 'Failed to save category.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Category' : 'New Category'}
      subtitle={
        isEdit
          ? 'Modify category attributes and spending limits'
          : 'Create a custom spending or income category'
      }
      maxWidth="max-w-lg"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        data-testid="category-form-modal"
      >
        {errors.form && (
          <div
            data-testid="category-form-error"
            className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-bold text-rose-700"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Category Type Toggle */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Category Type
          </label>
          <div
            role="tablist"
            aria-label="Category Type"
            className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-800/15"
          >
            <button
              type="button"
              role="tab"
              aria-selected={type === 'expense'}
              disabled={isEdit}
              onClick={() => setType('expense')}
              className={`py-2 text-xs font-bold rounded-xl transition-all select-none cursor-pointer ${
                type === 'expense'
                  ? 'bg-[#111111] text-[#F7F2E8] shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              } ${isEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              Expense (Spending)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={type === 'income'}
              disabled={isEdit}
              onClick={() => setType('income')}
              className={`py-2 text-xs font-bold rounded-xl transition-all select-none cursor-pointer ${
                type === 'income'
                  ? 'bg-[#111111] text-[#F7F2E8] shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              } ${isEdit ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              Income (Earnings)
            </button>
          </div>
        </div>

        {/* Category Name Input */}
        <div>
          <label
            htmlFor="category-name-input"
            className="block text-xs font-bold text-stone-800 mb-1"
          >
            Category Name *
          </label>
          <input
            id="category-name-input"
            type="text"
            disabled={isDefaultCategory}
            placeholder="e.g. Pet Care, Subscriptions, Freelance"
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
            className={`w-full px-3.5 py-2.5 bg-white rounded-xl border border-stone-800/20 text-sm font-bold text-[#111111] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent shadow-sm ${
              isDefaultCategory ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : ''
            }`}
          />
          {isDefaultCategory && (
            <p className="text-[11px] font-medium text-stone-500 mt-1">
              Default category name cannot be changed.
            </p>
          )}
          {errors.name && (
            <p
              data-testid="category-name-error"
              className="text-xs font-bold text-rose-600 mt-1"
            >
              {errors.name}
            </p>
          )}
        </div>

        {/* Color Picker Swatches */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Category Pastel Color
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {AVAILABLE_CATEGORY_COLORS.map((c) => {
              const isSelected = color === c.hex;
              return (
                <button
                  key={c.hex}
                  type="button"
                  data-testid={`color-swatch-${c.hex}`}
                  title={c.name}
                  aria-label={`Select color ${c.name}`}
                  onClick={() => setColor(c.hex)}
                  className={`h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-stone-900 ring-2 ring-stone-900 scale-105'
                      : 'border-stone-800/20 hover:scale-102'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && <Check className="w-4 h-4 text-stone-900 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-bold text-stone-800 mb-1.5">
            Category Icon
          </label>
          {isDefaultCategory ? (
            <div className="flex items-center gap-2 p-2.5 bg-stone-100 rounded-xl border border-stone-200">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center border border-stone-800/20"
                style={{ backgroundColor: color }}
              >
                {renderCategoryIcon(icon, 'w-4 h-4 text-stone-900')}
              </div>
              <span className="text-xs font-medium text-stone-600">
                Default category icon is locked.
              </span>
            </div>
          ) : (
            <div className="max-h-36 overflow-y-auto grid grid-cols-5 sm:grid-cols-6 gap-2 p-2 bg-stone-50 rounded-2xl border border-stone-800/15">
              {AVAILABLE_CATEGORY_ICONS.map((item) => {
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    data-testid={`icon-option-${item.name}`}
                    title={item.label}
                    aria-label={`Select icon ${item.label}`}
                    onClick={() => setIcon(item.name)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                        : 'bg-white text-stone-700 hover:bg-stone-100 border-stone-200'
                    }`}
                  >
                    {renderCategoryIcon(item.name, 'w-4 h-4')}
                    <span className="text-[9px] font-semibold truncate w-full text-center mt-1">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Budget Limit (Expense only) */}
        {type === 'expense' && (
          <div>
            <label
              htmlFor="category-budget-limit-input"
              className="block text-xs font-bold text-stone-800 mb-1"
            >
              Monthly Budget Limit (PHP, Optional)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold font-mono text-stone-600 select-none">
                ₱
              </span>
              <input
                id="category-budget-limit-input"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 5000"
                value={budgetLimit}
                onChange={(e) => {
                  setBudgetLimit(e.target.value);
                  if (errors.budgetLimit) {
                    setErrors((prev) => {
                      const copy = { ...prev };
                      delete copy.budgetLimit;
                      return copy;
                    });
                  }
                }}
                className="w-full pl-8 pr-4 py-2 bg-white rounded-xl border border-stone-800/20 text-sm font-bold font-mono text-[#111111] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#124224] focus:border-transparent shadow-sm"
              />
            </div>
            {errors.budgetLimit && (
              <p className="text-xs font-bold text-rose-600 mt-1">
                {errors.budgetLimit}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-800/10">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isEdit ? 'Save Changes' : 'Save Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
