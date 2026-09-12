import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetsAnalyticsView } from './BudgetsAnalyticsView';
import { db, resetDatabase } from '../../storage/db';
import type { Category, Transaction } from '../../domain/types';

describe('BudgetsAnalyticsView Component (TDD)', () => {
  const testCategories: Category[] = [
    {
      id: 'cat-groceries',
      name: 'Groceries & Market',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#DAE097',
      budgetLimit: 10000,
    },
    {
      id: 'cat-dining',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
      budgetLimit: 5000,
    },
  ];

  const testTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 4000,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-groceries',
      date: '2026-09-05',
      createdAt: '2026-09-05T10:00:00.000Z',
      updatedAt: '2026-09-05T10:00:00.000Z',
    },
    {
      id: 'tx-2',
      amount: 2000,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-dining',
      date: '2026-09-10',
      createdAt: '2026-09-10T12:00:00.000Z',
      updatedAt: '2026-09-10T12:00:00.000Z',
    },
    // Transaction in August 2026
    {
      id: 'tx-aug-1',
      amount: 8500,
      type: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-groceries',
      date: '2026-08-15',
      createdAt: '2026-08-15T12:00:00.000Z',
      updatedAt: '2026-08-15T12:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await resetDatabase();
    await db.categories.bulkAdd(testCategories);
    await db.transactions.bulkAdd(testTransactions);
    vi.clearAllMocks();
  });

  it('renders header in Fraunces serif and monthly overview hero bento with category budget cards', () => {
    render(
      <BudgetsAnalyticsView
        currentDate={new Date(2026, 8, 12)} // September 2026
        initialCategories={testCategories}
        initialTransactions={testTransactions}
      />
    );

    // Header in Fraunces serif
    const header = screen.getByRole('heading', { name: /Budgets & Spending Analytics/i });
    expect(header).toBeInTheDocument();
    expect(header.className).toContain('font-serif');

    // Overall Monthly Budget Hero Bento: Total Budgeted (10,000 + 5,000 = 15,000)
    expect(screen.getByTestId('hero-total-budgeted')).toHaveTextContent('₱15,000.00');
    // Total Spent across categories in September (4,000 + 2,000 = 6,000)
    expect(screen.getByTestId('hero-total-spent')).toHaveTextContent('₱6,000.00');
    // Remaining (15,000 - 6,000 = 9,000)
    expect(screen.getByTestId('hero-total-remaining')).toHaveTextContent('₱9,000.00 left');

    // Category Budget Cards rendered
    expect(screen.getByTestId('category-budget-card-cat-groceries')).toBeInTheDocument();
    expect(screen.getByTestId('category-budget-card-cat-dining')).toBeInTheDocument();
  });

  it('month navigator updates month/year and recalculates spending', () => {
    render(
      <BudgetsAnalyticsView
        currentDate={new Date(2026, 8, 12)} // September 2026
        initialCategories={testCategories}
        initialTransactions={testTransactions}
      />
    );

    expect(screen.getByTestId('current-month-display')).toHaveTextContent(/September 2026/i);
    expect(screen.getByTestId('hero-total-spent')).toHaveTextContent('₱6,000.00');

    // Click Previous Month (to August 2026)
    const prevBtn = screen.getByTestId('prev-month-button');
    fireEvent.click(prevBtn);

    expect(screen.getByTestId('current-month-display')).toHaveTextContent(/August 2026/i);
    // August had 8500 spent on Groceries
    expect(screen.getByTestId('hero-total-spent')).toHaveTextContent('₱8,500.00');

    // Click Next Month (back to September 2026)
    const nextBtn = screen.getByTestId('next-month-button');
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('current-month-display')).toHaveTextContent(/September 2026/i);
    expect(screen.getByTestId('hero-total-spent')).toHaveTextContent('₱6,000.00');

    // Click Today button
    const todayBtn = screen.getByTestId('today-month-button');
    fireEvent.click(todayBtn);
    const now = new Date();
    const currentMonthName = now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    expect(screen.getByTestId('current-month-display')).toHaveTextContent(currentMonthName);
  });

  it('warning badge displays when category spending is between 80% and 100%', () => {
    const warningTransactions: Transaction[] = [
      {
        id: 'tx-warn',
        amount: 8500, // 85% of 10000
        type: 'expense',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        date: '2026-09-02',
        createdAt: '2026-09-02T10:00:00.000Z',
        updatedAt: '2026-09-02T10:00:00.000Z',
      },
    ];

    render(
      <BudgetsAnalyticsView
        currentDate={new Date(2026, 8, 12)}
        initialCategories={testCategories}
        initialTransactions={warningTransactions}
      />
    );

    expect(screen.getByTestId('budget-badge-warning-cat-groceries')).toHaveTextContent(/Near Limit/i);
  });

  it('over-budget badge displays when category spending exceeds 100%', () => {
    const overBudgetTransactions: Transaction[] = [
      {
        id: 'tx-over',
        amount: 12000, // 120% of 10000
        type: 'expense',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        date: '2026-09-02',
        createdAt: '2026-09-02T10:00:00.000Z',
        updatedAt: '2026-09-02T10:00:00.000Z',
      },
    ];

    render(
      <BudgetsAnalyticsView
        currentDate={new Date(2026, 8, 12)}
        initialCategories={testCategories}
        initialTransactions={overBudgetTransactions}
      />
    );

    expect(screen.getByTestId('budget-badge-over-cat-groceries')).toHaveTextContent(/Over Budget/i);
    expect(screen.getByTestId('budget-remaining-cat-groceries')).toHaveTextContent(/₱2,000\.00 over budget/i);
  });

  it('SVG breakdown chart renders slices matching category expenses', () => {
    render(
      <BudgetsAnalyticsView
        currentDate={new Date(2026, 8, 12)}
        initialCategories={testCategories}
        initialTransactions={testTransactions}
      />
    );

    // SVG donut chart is rendered
    expect(screen.getByTestId('spending-breakdown-svg')).toBeInTheDocument();
    expect(screen.getByTestId('donut-slice-cat-groceries')).toBeInTheDocument();
    expect(screen.getByTestId('donut-slice-cat-dining')).toBeInTheDocument();
  });

  it('renders empty state when no expenses or budgets are set', () => {
    render(
      <BudgetsAnalyticsView
        currentDate={new Date(2026, 8, 12)}
        initialCategories={[]}
        initialTransactions={[]}
      />
    );

    expect(screen.getByTestId('spending-chart-empty')).toBeInTheDocument();
    expect(screen.getByTestId('no-budgets-empty')).toBeInTheDocument();
  });

  it('opens BudgetFormModal when clicking quick Set Budget action or Edit Budget on card', async () => {
    render(
      <BudgetsAnalyticsView
        currentDate={new Date(2026, 8, 12)}
        initialCategories={testCategories}
        initialTransactions={testTransactions}
      />
    );

    // Click quick Set Budget button
    const setBudgetBtn = screen.getByTestId('quick-set-budget-btn');
    fireEvent.click(setBudgetBtn);

    expect(screen.getByText('Set Category Budget')).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Set Category Budget')).not.toBeInTheDocument();
    });

    // Click Edit Budget on Groceries card
    const editBtn = screen.getByTestId('edit-budget-btn-cat-groceries');
    fireEvent.click(editBtn);

    expect(screen.getByText('Set Category Budget')).toBeInTheDocument();
    const select = screen.getByTestId('budget-category-select') as HTMLSelectElement;
    expect(select.value).toBe('cat-groceries');
  });
});
