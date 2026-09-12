import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AccountsVaultView } from './AccountsVaultView';
import { db, resetDatabase } from '../../storage/db';
import type { Account, Transaction } from '../../domain/types';

describe('AccountsVaultView Component (TDD)', () => {
  const now = new Date().toISOString();

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
    {
      id: 'acc-cash',
      name: 'Cash Wallet',
      type: 'cash',
      initialBalance: 1000,
      currency: 'PHP',
      color: '#FFED9E',
      icon: 'Wallet',
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const testTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 5000,
      type: 'income',
      accountId: 'acc-bpi',
      date: '2026-09-01',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-2',
      amount: 500,
      type: 'expense',
      accountId: 'acc-gcash',
      date: '2026-09-02',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tx-3',
      amount: 1000,
      type: 'transfer',
      accountId: 'acc-bpi',
      toAccountId: 'acc-gcash',
      date: '2026-09-03',
      createdAt: now,
      updatedAt: now,
    },
  ];

  beforeEach(async () => {
    await resetDatabase();
    vi.clearAllMocks();
    await db.accounts.bulkAdd(testAccounts);
    await db.transactions.bulkAdd(testTransactions);
  });

  it('renders header in Fraunces serif and net worth summary badge', async () => {
    render(
      <AccountsVaultView
        initialAccounts={testAccounts}
        initialTransactions={testTransactions}
      />
    );

    // Header title
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Accounts Vault/i);

    // Net worth summary badge: (15000 + 5000 - 1000) + (2500 - 500 + 1000) + 1000 = 19000 + 3000 + 1000 = 23000
    const netWorthDisplay = screen.getByTestId('vault-net-worth');
    expect(netWorthDisplay).toHaveTextContent('₱23,000.00');
  });

  it('renders list of accounts with correct running balances', () => {
    render(
      <AccountsVaultView
        initialAccounts={testAccounts}
        initialTransactions={testTransactions}
      />
    );

    // GCash card & balance (3000)
    expect(screen.getByTestId('account-name-acc-gcash')).toHaveTextContent('GCash');
    expect(screen.getByTestId('account-balance-acc-gcash')).toHaveTextContent('₱3,000.00');

    // BPI card & balance (19000)
    expect(screen.getByTestId('account-name-acc-bpi')).toHaveTextContent('BPI Savings');
    expect(screen.getByTestId('account-balance-acc-bpi')).toHaveTextContent('₱19,000.00');

    // Cash card & balance (1000)
    expect(screen.getByTestId('account-name-acc-cash')).toHaveTextContent('Cash Wallet');
    expect(screen.getByTestId('account-balance-acc-cash')).toHaveTextContent('₱1,000.00');
  });

  it('filters accounts by type (e.g. only show E-Wallets)', () => {
    render(
      <AccountsVaultView
        initialAccounts={testAccounts}
        initialTransactions={testTransactions}
      />
    );

    // Filter by E-Wallet
    const ewalletFilter = screen.getByTestId('filter-pill-ewallet');
    fireEvent.click(ewalletFilter);

    expect(screen.getByTestId('account-card-acc-gcash')).toBeInTheDocument();
    expect(screen.queryByTestId('account-card-acc-bpi')).not.toBeInTheDocument();
    expect(screen.queryByTestId('account-card-acc-cash')).not.toBeInTheDocument();

    // Filter by Bank
    const bankFilter = screen.getByTestId('filter-pill-bank');
    fireEvent.click(bankFilter);

    expect(screen.queryByTestId('account-card-acc-gcash')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-card-acc-bpi')).toBeInTheDocument();
    expect(screen.queryByTestId('account-card-acc-cash')).not.toBeInTheDocument();

    // Back to All
    const allFilter = screen.getByTestId('filter-pill-all');
    fireEvent.click(allFilter);

    expect(screen.getByTestId('account-card-acc-gcash')).toBeInTheDocument();
    expect(screen.getByTestId('account-card-acc-bpi')).toBeInTheDocument();
    expect(screen.getByTestId('account-card-acc-cash')).toBeInTheDocument();
  });

  it('clicking "New Account" opens form modal', async () => {
    render(
      <AccountsVaultView
        initialAccounts={testAccounts}
        initialTransactions={testTransactions}
      />
    );

    const newAccountBtn = screen.getByTestId('vault-new-account-btn');
    fireEvent.click(newAccountBtn);

    await waitFor(() => {
      expect(screen.getByTestId('account-form')).toBeInTheDocument();
    });
  });

  it('clicking "Transfer Money" opens transfer modal', async () => {
    render(
      <AccountsVaultView
        initialAccounts={testAccounts}
        initialTransactions={testTransactions}
      />
    );

    const transferBtn = screen.getByTestId('vault-transfer-btn');
    fireEvent.click(transferBtn);

    await waitFor(() => {
      expect(screen.getByTestId('transfer-form')).toBeInTheDocument();
    });
  });

  it('clicking "Transfer" on an account card opens transfer modal with source pre-selected', async () => {
    render(
      <AccountsVaultView
        initialAccounts={testAccounts}
        initialTransactions={testTransactions}
      />
    );

    const cardTransferBtn = screen.getByTestId('account-transfer-btn-acc-bpi');
    fireEvent.click(cardTransferBtn);

    await waitFor(() => {
      expect(screen.getByTestId('transfer-from-account-select')).toHaveValue('acc-bpi');
    });
  });

  it('renders empty state when no accounts exist', async () => {
    render(
      <AccountsVaultView
        initialAccounts={[]}
        initialTransactions={[]}
      />
    );

    expect(screen.getByTestId('accounts-vault-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/No accounts found/i)).toBeInTheDocument();
  });
});
