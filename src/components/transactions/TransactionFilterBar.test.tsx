import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  TransactionFilterBar,
  TransactionFilterState,
} from './TransactionFilterBar';
import type { Account, Category } from '../../domain/types';

describe('TransactionFilterBar Component', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-gcash',
      name: 'GCash',
      type: 'ewallet',
      initialBalance: 2500,
      currency: 'PHP',
      color: '#A6CFF2',
      icon: 'Smartphone',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'acc-bpi',
      name: 'BPI Savings',
      type: 'bank',
      initialBalance: 15000,
      currency: 'PHP',
      color: '#F2C0CA',
      icon: 'Building2',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  const mockCategories: Category[] = [
    {
      id: 'cat-food',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
    },
    {
      id: 'cat-salary',
      name: 'Salary & Wages',
      type: 'income',
      icon: 'Briefcase',
      color: '#DAE097',
    },
  ];

  const defaultFilters: TransactionFilterState = {
    search: '',
    type: 'all',
    accountId: 'all',
    categoryId: 'all',
  };

  it('renders search input, type pills, account and category dropdowns', () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionFilterBar
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByTestId('filter-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('filter-type-all')).toBeInTheDocument();
    expect(screen.getByTestId('filter-type-expense')).toBeInTheDocument();
    expect(screen.getByTestId('filter-type-income')).toBeInTheDocument();
    expect(screen.getByTestId('filter-type-transfer')).toBeInTheDocument();
    expect(screen.getByTestId('filter-account-select')).toBeInTheDocument();
    expect(screen.getByTestId('filter-category-select')).toBeInTheDocument();

    // Clear filters button should not be present when no filter active
    expect(screen.queryByTestId('clear-filters-btn')).not.toBeInTheDocument();
  });

  it('changes search query on input', () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionFilterBar
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    const input = screen.getByTestId('filter-search-input');
    fireEvent.change(input, { target: { value: 'Grab' } });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Grab' })
    );
  });

  it('changes type on clicking type pills', () => {
    const onFilterChange = vi.fn();
    render(
      <TransactionFilterBar
        filters={defaultFilters}
        onFilterChange={onFilterChange}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    fireEvent.click(screen.getByTestId('filter-type-income'));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'income' })
    );
  });

  it('displays Clear Filters button when filters are active and clears on click', () => {
    const onFilterChange = vi.fn();
    const activeFilters: TransactionFilterState = {
      search: 'Coffee',
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-food',
    };

    render(
      <TransactionFilterBar
        filters={activeFilters}
        onFilterChange={onFilterChange}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    const clearBtn = screen.getByTestId('clear-filters-btn');
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(onFilterChange).toHaveBeenCalledWith({
      search: '',
      type: 'all',
      accountId: 'all',
      categoryId: 'all',
    });
  });
});
