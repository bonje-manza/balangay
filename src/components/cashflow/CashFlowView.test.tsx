import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CashFlowView } from './CashFlowView';
import type { Account, Category, Transaction } from '../../domain/types';

describe('CashFlowView Component (TDD)', () => {
  const sampleAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'GCash',
      type: 'ewallet',
      initialBalance: 5000,
      currency: 'PHP',
      color: '#A6CFF2',
      icon: 'Smartphone',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  const sampleCategories: Category[] = [
    {
      id: 'cat-groceries',
      name: 'Groceries',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#DAE097',
    },
  ];

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 1500,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-groceries',
      date: '2026-09-05',
      createdAt: '2026-09-05T00:00:00Z',
      updatedAt: '2026-09-05T00:00:00Z',
    },
  ];

  const fixedDate = new Date(2026, 8, 5); // September 5, 2026

  it('renders Month Calendar view by default with date controls and inspector', () => {
    render(
      <CashFlowView
        currentDate={fixedDate}
        accounts={sampleAccounts}
        categories={sampleCategories}
        transactions={sampleTransactions}
        onOpenAddTransaction={vi.fn()}
      />
    );

    expect(screen.getByTestId('cash-flow-view')).toBeInTheDocument();
    expect(screen.getByText(/September 2026/i)).toBeInTheDocument();
    expect(screen.getByTestId('cash-flow-calendar')).toBeInTheDocument();
    expect(screen.getByTestId('day-inspector')).toBeInTheDocument();
    expect(screen.getByTestId('cashflow-bar-chart')).toBeInTheDocument();
  });

  it('switches to Year Overview mode when clicking Year toggle', () => {
    render(
      <CashFlowView
        currentDate={fixedDate}
        accounts={sampleAccounts}
        categories={sampleCategories}
        transactions={sampleTransactions}
      />
    );

    const yearTab = screen.getByRole('tab', { name: /Year Overview/i });
    fireEvent.click(yearTab);

    expect(screen.getByTestId('yearly-cashflow-grid')).toBeInTheDocument();
    expect(screen.queryByTestId('cash-flow-calendar')).not.toBeInTheDocument();
  });

  it('navigates previous and next months', () => {
    render(
      <CashFlowView
        currentDate={fixedDate}
        accounts={sampleAccounts}
        categories={sampleCategories}
        transactions={sampleTransactions}
      />
    );

    const prevBtn = screen.getByTestId('prev-month-btn');
    fireEvent.click(prevBtn);

    expect(screen.getByText(/August 2026/i)).toBeInTheDocument();

    const nextBtn = screen.getByTestId('next-month-btn');
    fireEvent.click(nextBtn);

    expect(screen.getByText(/September 2026/i)).toBeInTheDocument();
  });
});
