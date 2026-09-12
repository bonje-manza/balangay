import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecentActivityBento, formatTransactionDate } from './RecentActivityBento';
import type { Transaction, Account, Category } from '../../domain/types';

describe('RecentActivityBento Component', () => {
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
      id: 'cat-salary',
      name: 'Salary & Wages',
      type: 'income',
      icon: 'Briefcase',
      color: '#DAE097',
    },
    {
      id: 'cat-dining',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
    },
  ];

  const todayStr = new Date().toISOString().slice(0, 10);

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 45000,
      type: 'income',
      accountId: 'acc-bpi',
      categoryId: 'cat-salary',
      date: todayStr,
      notes: 'Mid-month Salary',
      mood: 'Peaceful',
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T10:00:00.000Z',
    },
    {
      id: 'tx-2',
      amount: 580,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-dining',
      date: todayStr,
      notes: 'Ramen Dinner',
      mood: 'Treat',
      createdAt: '2026-09-12T12:00:00.000Z',
      updatedAt: '2026-09-12T12:00:00.000Z',
    },
    {
      id: 'tx-3',
      amount: 5000,
      type: 'transfer',
      accountId: 'acc-bpi',
      toAccountId: 'acc-gcash',
      date: todayStr,
      notes: 'Fund GCash from BPI',
      mood: 'Essential',
      createdAt: '2026-09-12T08:00:00.000Z',
      updatedAt: '2026-09-12T08:00:00.000Z',
    },
  ];

  it('renders recent transactions with notes, categories, accounts, and mood tags', () => {
    render(
      <RecentActivityBento
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Mid-month Salary')).toBeInTheDocument();
    expect(screen.getByText('Ramen Dinner')).toBeInTheDocument();
    expect(screen.getByText('Fund GCash from BPI')).toBeInTheDocument();

    // Mood tags
    expect(screen.getByTestId('tx-mood-tx-1')).toHaveTextContent('Peaceful');
    expect(screen.getByTestId('tx-mood-tx-2')).toHaveTextContent('Treat');
    expect(screen.getByTestId('tx-mood-tx-3')).toHaveTextContent('Essential');

    // Transfer account label
    expect(screen.getByText('BPI Savings → GCash')).toBeInTheDocument();
  });

  it('renders semantic amounts for income, expense, and transfer', () => {
    render(
      <RecentActivityBento
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByTestId('tx-amount-tx-1')).toHaveTextContent(/\+₱45,000\.00/);
    expect(screen.getByTestId('tx-amount-tx-2')).toHaveTextContent(/-₱580\.00/);
    expect(screen.getByTestId('tx-amount-tx-3')).toHaveTextContent(/₱5,000\.00/);
  });

  it('limits display to 5 most recent transactions', () => {
    const manyTransactions: Transaction[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `tx-extra-${i}`,
      amount: 100 * (i + 1),
      type: 'expense',
      accountId: 'acc-gcash',
      date: `2026-09-0${i + 1}`,
      notes: `Transaction #${i + 1}`,
      createdAt: new Date(Date.now() - i * 1000).toISOString(),
      updatedAt: new Date(Date.now() - i * 1000).toISOString(),
    }));

    render(
      <RecentActivityBento
        transactions={manyTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    const list = screen.getByTestId('recent-transactions-list');
    expect(list.children).toHaveLength(5);
  });

  it('invokes onViewAll when View All button is clicked', () => {
    const onViewAll = vi.fn();
    render(
      <RecentActivityBento
        transactions={mockTransactions}
        accounts={mockAccounts}
        categories={mockCategories}
        onViewAll={onViewAll}
      />
    );

    const btn = screen.getByTestId('recent-activity-view-all');
    fireEvent.click(btn);
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });

  it('renders empty state when transaction list is empty', () => {
    render(
      <RecentActivityBento
        transactions={[]}
        accounts={mockAccounts}
        categories={mockCategories}
      />
    );

    expect(screen.getByTestId('recent-activity-empty')).toBeInTheDocument();
    expect(screen.getByText(/No recent transactions yet/i)).toBeInTheDocument();
  });

  it('formats dates properly with formatTransactionDate', () => {
    const today = new Date();
    const todayISO = today.toISOString().slice(0, 10);
    expect(formatTransactionDate(todayISO)).toBe('Today');

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().slice(0, 10);
    expect(formatTransactionDate(yesterdayISO)).toBe('Yesterday');

    expect(formatTransactionDate('2026-01-15')).toMatch(/Jan 15|15 Jan/);
  });
});
