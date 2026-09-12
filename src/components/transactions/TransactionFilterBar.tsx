import React from 'react';
import { Search, X } from 'lucide-react';
import type { Account, Category } from '../../domain/types';
import { Button } from '../ui/Button';

export type FilterType = 'all' | 'expense' | 'income' | 'transfer';

export interface TransactionFilterState {
  search: string;
  type: FilterType;
  accountId: string;
  categoryId: string;
  startDate?: string;
  endDate?: string;
}

export interface TransactionFilterBarProps {
  filters: TransactionFilterState;
  onFilterChange: (filters: TransactionFilterState) => void;
  onClearFilters?: () => void;
  accounts: Account[];
  categories: Category[];
  className?: string;
}

const typeOptions: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Expense', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfer', value: 'transfer' },
];

/**
 * TransactionFilterBar: Soft Neo-brutalist interactive filter bar
 * supporting full text search, transaction type pills, account and category dropdowns,
 * and an active clear filters trigger.
 */
export const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  accounts,
  categories,
  className = '',
}) => {
  const isFiltered = Boolean(
    (filters.search && filters.search.trim() !== '') ||
      (filters.type && filters.type !== 'all') ||
      (filters.accountId && filters.accountId !== 'all') ||
      (filters.categoryId && filters.categoryId !== 'all') ||
      filters.startDate ||
      filters.endDate
  );

  const handleClear = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      onFilterChange({
        search: '',
        type: 'all',
        accountId: 'all',
        categoryId: 'all',
      });
    }
  };

  const handleTypeChange = (type: FilterType) => {
    // If switching type and current category does not match, reset category
    let newCategoryId = filters.categoryId;
    if (type === 'expense' || type === 'income') {
      const cat = categories.find((c) => c.id === filters.categoryId);
      if (cat && cat.type !== type) {
        newCategoryId = 'all';
      }
    } else if (type === 'transfer') {
      newCategoryId = 'all';
    }

    onFilterChange({
      ...filters,
      type,
      categoryId: newCategoryId,
    });
  };

  // Filter categories by type if selected
  const availableCategories =
    filters.type === 'expense'
      ? categories.filter((c) => c.type === 'expense')
      : filters.type === 'income'
      ? categories.filter((c) => c.type === 'income')
      : categories;

  return (
    <div
      data-testid="transaction-filter-bar"
      className={`bg-[#FFFDF9] border-2 border-[#111111] rounded-3xl p-4 sm:p-5 shadow-[4px_4px_0px_0px_#111111] space-y-3 sm:space-y-4 ${className}`}
    >
      {/* Top Row: Search Bar & Clear Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4 text-stone-600" />
          </div>
          <input
            type="text"
            data-testid="filter-search-input"
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Search notes, tags, or categories..."
            className="w-full pl-10 pr-10 py-2.5 bg-white rounded-2xl border-2 border-[#111111] text-sm text-[#111111] placeholder:text-stone-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#124224] transition-all shadow-[2px_2px_0px_0px_#111111]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              aria-label="Clear search input"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear Filters Button (Visible only when filters active) */}
        {isFiltered && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            data-testid="clear-filters-btn"
            icon={<X className="w-3.5 h-3.5" />}
            className="self-start sm:self-auto flex-shrink-0"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Bottom Row: Type Pills + Account & Category Selects */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* Type Pills */}
        <div
          role="group"
          aria-label="Transaction Type Filter"
          className="flex items-center gap-1.5 flex-wrap"
        >
          {typeOptions.map((opt) => {
            const isSelected = filters.type === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                data-testid={`filter-type-${opt.value}`}
                onClick={() => handleTypeChange(opt.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer select-none active:translate-y-0.5 ${
                  isSelected
                    ? 'bg-[#111111] text-[#F7F2E8] border-2 border-[#111111] shadow-[2px_2px_0px_0px_#124224]'
                    : 'bg-white text-stone-700 border border-stone-800/25 hover:bg-stone-100 hover:border-stone-800/40 shadow-[1px_1px_0px_0px_#111111]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-6 w-[1px] bg-stone-800/20 mx-1" />

        {/* Account Filter Select */}
        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[140px]">
          <select
            data-testid="filter-account-select"
            aria-label="Filter by account"
            value={filters.accountId || 'all'}
            onChange={(e) => onFilterChange({ ...filters, accountId: e.target.value })}
            className="w-full sm:w-auto px-3 py-1.5 text-xs font-bold bg-white text-stone-800 rounded-xl border border-stone-800/30 focus:outline-none focus:ring-2 focus:ring-[#124224] shadow-[1px_1px_0px_0px_#111111] cursor-pointer"
          >
            <option value="all">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter Select (only relevant for all, expense, or income) */}
        {filters.type !== 'transfer' && (
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[140px]">
            <select
              data-testid="filter-category-select"
              aria-label="Filter by category"
              value={filters.categoryId || 'all'}
              onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value })}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-bold bg-white text-stone-800 rounded-xl border border-stone-800/30 focus:outline-none focus:ring-2 focus:ring-[#124224] shadow-[1px_1px_0px_0px_#111111] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
