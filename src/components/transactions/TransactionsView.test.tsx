import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TransactionsView } from './TransactionsView';
import { db, resetDatabase } from '../../storage/db';
import type { Account, Category, Transaction } from '../../domain/types';

describe('TransactionsView Component (TDD)', () => {
  const now = new Date().toISOString();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const pastDateStr = '2026-08-15';

  const testAccounts: Account[] = [
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
      id: 'cat-food',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
    },
    {
      id: 'cat-groceries',
      name: 'Groceries',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#DAE097',
    },
  ];

  const testTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 45000,
      type: 'income',
      accountId: 'acc-bpi',
      categoryId: 'cat-salary',
      date: todayStr,
      notes: 'Mid-month Salary Payroll',
      tags: ['salary', 'work'],
      mood: 'Peaceful',
      createdAt: new Date(Date.now() - 5000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'tx-2',
      amount: 580,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-food',
      date: todayStr,
      notes: 'Ramen Nagi Lunch',
      tags: ['dining', 'treat'],
      mood: 'Treat',
      createdAt: new Date(Date.now() - 4000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'tx-3',
      amount: 3200,
      type: 'expense',
      accountId: 'acc-gcash',
      categoryId: 'cat-groceries',
      date: yesterdayStr,
      notes: 'Weekend Grocery Run',
      tags: ['groceries', 'pantry'],
      mood: 'Essential',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: now,
    },
    {
      id: 'tx-4',
      amount: 5000,
      type: 'transfer',
      accountId: 'acc-bpi',
      toAccountId: 'acc-gcash',
      date: pastDateStr,
      notes: 'Fund GCash for bills',
      tags: ['transfer'],
      mood: 'Essential',
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
    },
  ];

  let originalCreateObjectURL: any;
  let originalRevokeObjectURL: any;
  let originalAnchorClick: any;

  beforeEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();

    originalCreateObjectURL = window.URL.createObjectURL;
    originalRevokeObjectURL = window.URL.revokeObjectURL;
    originalAnchorClick = HTMLAnchorElement.prototype.click;

    window.URL.createObjectURL = vi.fn(() => 'blob:mock-csv-download-url');
    window.URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();

    await db.accounts.bulkAdd(testAccounts);
    await db.categories.bulkAdd(testCategories);
    await db.transactions.bulkAdd(testTransactions);
  });

  afterEach(() => {
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    HTMLAnchorElement.prototype.click = originalAnchorClick;
  });

  it('renders header in Fraunces serif and transactions grouped by date', async () => {
    render(<TransactionsView />);

    // Fraunces serif header
    expect(screen.getByText('Transactions Ledger')).toBeInTheDocument();

    // Date group headers (wait for live query to populate)
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
    expect(screen.getByText('Yesterday')).toBeInTheDocument();

    // Verify transactions within date groups
    expect(screen.getByText('Mid-month Salary Payroll')).toBeInTheDocument();
    expect(screen.getByText('Ramen Nagi Lunch')).toBeInTheDocument();
    expect(screen.getByText('Weekend Grocery Run')).toBeInTheDocument();
    expect(screen.getByText('Fund GCash for bills')).toBeInTheDocument();

    // Summary bar displays total count and net amount
    expect(screen.getByTestId('ledger-summary-bar')).toBeInTheDocument();
    expect(screen.getByTestId('summary-tx-count')).toHaveTextContent(/4 transactions/i);
    // Net amount = 45000 - 580 - 3200 = 41220
    expect(screen.getByTestId('summary-net-amount')).toHaveTextContent(/₱41,220\.00/);
  });

  it('search filters transactions by note and tags', async () => {
    render(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByText('Mid-month Salary Payroll')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('filter-search-input');

    // Search by note substring
    fireEvent.change(searchInput, { target: { value: 'Ramen' } });

    await waitFor(() => {
      expect(screen.getByText('Ramen Nagi Lunch')).toBeInTheDocument();
      expect(screen.queryByText('Mid-month Salary Payroll')).not.toBeInTheDocument();
      expect(screen.queryByText('Weekend Grocery Run')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('summary-tx-count')).toHaveTextContent(/1 transaction/i);

    // Search by tag
    fireEvent.change(searchInput, { target: { value: 'pantry' } });

    await waitFor(() => {
      expect(screen.getByText('Weekend Grocery Run')).toBeInTheDocument();
      expect(screen.queryByText('Ramen Nagi Lunch')).not.toBeInTheDocument();
    });
  });

  it('filters transactions by type (Income / Expense / Transfer)', async () => {
    render(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByText('Mid-month Salary Payroll')).toBeInTheDocument();
    });

    // Filter by Income
    const incomeBtn = screen.getByTestId('filter-type-income');
    fireEvent.click(incomeBtn);

    await waitFor(() => {
      expect(screen.getByText('Mid-month Salary Payroll')).toBeInTheDocument();
      expect(screen.queryByText('Ramen Nagi Lunch')).not.toBeInTheDocument();
      expect(screen.queryByText('Fund GCash for bills')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('summary-tx-count')).toHaveTextContent(/1 transaction/i);

    // Filter by Expense
    const expenseBtn = screen.getByTestId('filter-type-expense');
    fireEvent.click(expenseBtn);

    await waitFor(() => {
      expect(screen.getByText('Ramen Nagi Lunch')).toBeInTheDocument();
      expect(screen.getByText('Weekend Grocery Run')).toBeInTheDocument();
      expect(screen.queryByText('Mid-month Salary Payroll')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('summary-tx-count')).toHaveTextContent(/2 transactions/i);

    // Filter by Transfer
    const transferBtn = screen.getByTestId('filter-type-transfer');
    fireEvent.click(transferBtn);

    await waitFor(() => {
      expect(screen.getByText('Fund GCash for bills')).toBeInTheDocument();
      expect(screen.queryByText('Ramen Nagi Lunch')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('summary-tx-count')).toHaveTextContent(/1 transaction/i);
  });

  it('filters transactions by account', async () => {
    render(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByText('Mid-month Salary Payroll')).toBeInTheDocument();
    });

    const accountSelect = screen.getByTestId('filter-account-select');
    fireEvent.change(accountSelect, { target: { value: 'acc-gcash' } });

    await waitFor(() => {
      // GCash has tx-2 (expense), tx-3 (expense), and tx-4 (transfer destination)
      expect(screen.getByText('Ramen Nagi Lunch')).toBeInTheDocument();
      expect(screen.getByText('Weekend Grocery Run')).toBeInTheDocument();
      expect(screen.getByText('Fund GCash for bills')).toBeInTheDocument();
      // Mid-month salary was purely BPI
      expect(screen.queryByText('Mid-month Salary Payroll')).not.toBeInTheDocument();
    });
  });

  it('displays empty state when no transactions match filters', async () => {
    render(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByText('Mid-month Salary Payroll')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('filter-search-input');
    fireEvent.change(searchInput, { target: { value: 'nonexistent-query-xyz' } });

    await waitFor(() => {
      expect(screen.getByText(/No transactions found matching filters/i)).toBeInTheDocument();
    });
  });

  it('clicking "Export CSV" generates CSV and initiates browser download', async () => {
    render(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByText('Transactions Ledger')).toBeInTheDocument();
    });

    const exportBtn = screen.getByTestId('export-csv-btn');
    fireEvent.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = (window.URL.createObjectURL as any).mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
  });

  it('opens TransactionFormModal on + Add button and item click', async () => {
    render(<TransactionsView />);

    await waitFor(() => {
      expect(screen.getByText('Mid-month Salary Payroll')).toBeInTheDocument();
    });

    // Click + Add
    const addBtn = screen.getByTestId('add-transaction-btn');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Add Transaction')).toBeInTheDocument();
    });

    // Close modal
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);

    // Click transaction item to edit
    const item = screen.getByTestId('transaction-item-tx-2');
    fireEvent.click(item);

    await waitFor(() => {
      expect(screen.getByText('Edit Transaction')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-notes-input')).toHaveValue('Ramen Nagi Lunch');
    });
  });
});
