import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardView } from './DashboardView';
import { db, resetDatabase } from '../../storage/db';
import type { Account, Category, Transaction } from '../../domain/types';

describe('DashboardView Component', () => {
  const onNavigateTab = vi.fn();
  const onOpenAddTransaction = vi.fn();
  const onOpenTransfer = vi.fn();

  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  beforeEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
  });

  const seedTestData = async () => {
    const testAccounts: Account[] = [
      {
        id: 'acc-bpi',
        name: 'BPI Savings',
        type: 'bank',
        initialBalance: 15000,
        currency: 'PHP',
        color: '#F2C0CA',
        icon: 'Building2',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acc-gcash',
        name: 'GCash',
        type: 'ewallet',
        initialBalance: 2500,
        currency: 'PHP',
        color: '#A6CFF2',
        icon: 'Smartphone',
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const testCategories: Category[] = [
      {
        id: 'cat-salary',
        name: 'Salary & Wages',
        type: 'income',
        icon: 'Briefcase',
        color: '#DAE097',
      },
      {
        id: 'cat-groceries',
        name: 'Groceries & Market',
        type: 'expense',
        icon: 'ShoppingCart',
        color: '#DAE097',
        budgetLimit: 10000,
      },
      {
        id: 'cat-food',
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
        amount: 30000,
        type: 'income',
        accountId: 'acc-bpi',
        categoryId: 'cat-salary',
        date: todayStr,
        notes: 'Monthly Payroll',
        mood: 'Peaceful',
        createdAt: new Date(Date.now() - 3000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'tx-2',
        amount: 8500,
        type: 'expense',
        accountId: 'acc-gcash',
        categoryId: 'cat-groceries',
        date: todayStr,
        notes: 'Supermarket Groceries',
        mood: 'Essential',
        createdAt: new Date(Date.now() - 2000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'tx-3',
        amount: 6000,
        type: 'expense',
        accountId: 'acc-gcash',
        categoryId: 'cat-food',
        date: todayStr,
        notes: 'Weekend Feast',
        mood: 'Treat',
        createdAt: new Date(Date.now() - 1000).toISOString(),
        updatedAt: now,
      },
      {
        id: 'tx-4',
        amount: 5000,
        type: 'transfer',
        accountId: 'acc-bpi',
        toAccountId: 'acc-gcash',
        date: todayStr,
        notes: 'Transfer funds to GCash',
        mood: 'Essential',
        createdAt: now,
        updatedAt: now,
      },
    ];

    await db.accounts.bulkAdd(testAccounts);
    await db.categories.bulkAdd(testCategories);
    await db.transactions.bulkAdd(testTransactions);
  };

  it('renders greeting and net worth correctly based on Dexie accounts and transactions', async () => {
    await seedTestData();

    render(
      <DashboardView
        onNavigateTab={onNavigateTab}
        onOpenAddTransaction={onOpenAddTransaction}
        onOpenTransfer={onOpenTransfer}
      />
    );

    // Check greeting header
    await waitFor(() => {
      expect(screen.getByText(/Kumusta/i)).toBeInTheDocument();
    });

    // Net worth = 15000 (BPI) + 2500 (GCash) + 30000 (salary) - 8500 (groceries) - 6000 (food) = 33000
    // Transfer does not change net worth
    await waitFor(() => {
      expect(screen.getByTestId('net-worth-amount')).toHaveTextContent(/₱33,000\.00/);
    });

    // Active accounts breakdown strip rendered
    const strip = screen.getByTestId('accounts-breakdown-strip');
    expect(within(strip).getByText('BPI Savings')).toBeInTheDocument();
    expect(within(strip).getByText('GCash')).toBeInTheDocument();
  });

  it('renders monthly income, expense, and net cashflow', async () => {
    await seedTestData();

    render(
      <DashboardView
        onNavigateTab={onNavigateTab}
        onOpenAddTransaction={onOpenAddTransaction}
        onOpenTransfer={onOpenTransfer}
      />
    );

    // Wait for cashflow bento to populate
    await waitFor(() => {
      // Income = 30000
      expect(screen.getByTestId('cashflow-income-amount')).toHaveTextContent(/₱30,000\.00/);
    });

    // Expense = 8500 + 6000 = 14500
    expect(screen.getByTestId('cashflow-expense-amount')).toHaveTextContent(/₱14,500\.00/);

    // Net cashflow = 30000 - 14500 = +15500
    expect(screen.getByTestId('cashflow-net-amount')).toHaveTextContent(/\+₱15,500\.00/);
  });

  it('renders category budget progress meters with warning indicators', async () => {
    await seedTestData();

    render(
      <DashboardView
        onNavigateTab={onNavigateTab}
        onOpenAddTransaction={onOpenAddTransaction}
        onOpenTransfer={onOpenTransfer}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('budget-quick-meter')).toBeInTheDocument();
    });

    const meter = screen.getByTestId('budget-quick-meter');
    // Groceries (85%) and Food (120%)
    expect(within(meter).getByText('Food & Dining')).toBeInTheDocument();
    expect(within(meter).getByText('Groceries & Market')).toBeInTheDocument();

    // Food is 120% (over budget), so Over Budget sticker badge should be present
    expect(screen.getByTestId('budget-badge-over')).toHaveTextContent(/Over Budget/i);

    // Check food progress bar has blossom fill class (#F2C0CA)
    const foodBar = screen.getByTestId('budget-bar-fill-cat-food');
    expect(foodBar.className).toContain('bg-[#F2C0CA]');
  });

  it('renders recent transactions list with correct amounts and mood tags', async () => {
    await seedTestData();

    render(
      <DashboardView
        onNavigateTab={onNavigateTab}
        onOpenAddTransaction={onOpenAddTransaction}
        onOpenTransfer={onOpenTransfer}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('recent-activity-bento')).toBeInTheDocument();
    });

    // Verify transaction items
    expect(screen.getByText('Weekend Feast')).toBeInTheDocument();
    expect(screen.getByText('Supermarket Groceries')).toBeInTheDocument();
    expect(screen.getByText('Monthly Payroll')).toBeInTheDocument();

    // Verify mood tag chips
    expect(screen.getByTestId('tx-mood-tx-3')).toHaveTextContent('Treat');
    expect(screen.getByTestId('tx-mood-tx-2')).toHaveTextContent('Essential');
    expect(screen.getByTestId('tx-mood-tx-1')).toHaveTextContent('Peaceful');

    // Verify semantic amounts
    expect(screen.getByTestId('tx-amount-tx-1')).toHaveTextContent(/\+₱30,000\.00/);
    expect(screen.getByTestId('tx-amount-tx-2')).toHaveTextContent(/-₱8,500\.00/);
    expect(screen.getByTestId('tx-amount-tx-3')).toHaveTextContent(/-₱6,000\.00/);
  });

  it('clicking "+ Add Transaction" and "Transfer" invokes callback props', async () => {
    await seedTestData();

    render(
      <DashboardView
        onNavigateTab={onNavigateTab}
        onOpenAddTransaction={onOpenAddTransaction}
        onOpenTransfer={onOpenTransfer}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /\+ Add Transaction/i })).toBeInTheDocument();
    });

    // Click Add Transaction
    const addBtn = screen.getByRole('button', { name: /\+ Add Transaction/i });
    fireEvent.click(addBtn);
    expect(onOpenAddTransaction).toHaveBeenCalledTimes(1);

    // Click Transfer
    const transferBtn = screen.getByRole('button', { name: /Transfer/i });
    fireEvent.click(transferBtn);
    expect(onOpenTransfer).toHaveBeenCalledTimes(1);
  });

  it('clicking "View All" in recent transactions triggers navigation to "transactions" tab', async () => {
    await seedTestData();

    render(
      <DashboardView
        onNavigateTab={onNavigateTab}
        onOpenAddTransaction={onOpenAddTransaction}
        onOpenTransfer={onOpenTransfer}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('recent-activity-view-all')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('recent-activity-view-all'));
    expect(onNavigateTab).toHaveBeenCalledWith('transactions');
  });

  it('displays empty state when database has no transactions', async () => {
    // Seed accounts only, zero transactions
    await db.accounts.add({
      id: 'acc-cash',
      name: 'Cash Wallet',
      type: 'cash',
      initialBalance: 1000,
      currency: 'PHP',
      color: '#FFED9E',
      icon: 'Wallet',
      createdAt: now,
      updatedAt: now,
    });

    render(
      <DashboardView
        onNavigateTab={onNavigateTab}
        onOpenAddTransaction={onOpenAddTransaction}
        onOpenTransfer={onOpenTransfer}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-empty-state')).toBeInTheDocument();
    });

    // Has option to add transaction
    expect(
      screen.getByRole('button', { name: /Add First Transaction/i })
    ).toBeInTheDocument();

    // Has option to load demo data
    expect(
      screen.getByRole('button', { name: /Try with Sample Data/i })
    ).toBeInTheDocument();

    // Clicking Add First Transaction triggers callback
    fireEvent.click(screen.getByRole('button', { name: /Add First Transaction/i }));
    expect(onOpenAddTransaction).toHaveBeenCalledTimes(1);
  });
});
