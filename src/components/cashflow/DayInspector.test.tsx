import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DayInspector } from './DayInspector';
import type { Transaction, Account, Category, CashflowSummary } from '../../domain/types';

describe('DayInspector Component (TDD)', () => {
  const sampleAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'GCash',
      type: 'ewallet',
      initialBalance: 2000,
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
    {
      id: 'cat-salary',
      name: 'Salary',
      type: 'income',
      icon: 'Briefcase',
      color: '#FFED9E',
    },
  ];

  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 1250,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-groceries',
      date: '2026-09-05',
      notes: 'Supermarket supplies',
      createdAt: '2026-09-05T10:00:00Z',
      updatedAt: '2026-09-05T10:00:00Z',
    },
    {
      id: 'tx-2',
      amount: 8000,
      type: 'income',
      accountId: 'acc-1',
      categoryId: 'cat-salary',
      date: '2026-09-05',
      notes: 'Bonus payout',
      createdAt: '2026-09-05T11:00:00Z',
      updatedAt: '2026-09-05T11:00:00Z',
    },
  ];

  const sampleCashflow: CashflowSummary = {
    income: 8000,
    expense: 1250,
    net: 6750,
  };

  it('renders date summary metrics for selected day with transactions', () => {
    render(
      <DayInspector
        dateStr="2026-09-05"
        cashflow={sampleCashflow}
        transactions={sampleTransactions}
        accounts={sampleAccounts}
        categories={sampleCategories}
        onAddTransactionForDate={vi.fn()}
      />
    );

    expect(screen.getByTestId('day-inspector')).toBeInTheDocument();
    expect(screen.getByText(/September 5, 2026/i)).toBeInTheDocument();
    expect(screen.getByText('Supermarket supplies')).toBeInTheDocument();
    expect(screen.getByText('Bonus payout')).toBeInTheDocument();
  });

  it('calls onAddTransactionForDate when clicking "+ Add for this date"', () => {
    const onAdd = vi.fn();
    render(
      <DayInspector
        dateStr="2026-09-05"
        cashflow={sampleCashflow}
        transactions={sampleTransactions}
        accounts={sampleAccounts}
        categories={sampleCategories}
        onAddTransactionForDate={onAdd}
      />
    );

    const addBtn = screen.getByTestId('add-tx-for-date-btn');
    fireEvent.click(addBtn);

    expect(onAdd).toHaveBeenCalledWith('2026-09-05');
  });

  it('displays empty state when no transactions exist for the selected day', () => {
    render(
      <DayInspector
        dateStr="2026-09-06"
        cashflow={{ income: 0, expense: 0, net: 0 }}
        transactions={[]}
        accounts={sampleAccounts}
        categories={sampleCategories}
        onAddTransactionForDate={vi.fn()}
      />
    );

    expect(screen.getByText(/No transactions on this date/i)).toBeInTheDocument();
  });
});
