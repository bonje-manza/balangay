import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TransactionListItem } from './TransactionListItem';
import type { Transaction, Account, Category } from '../../domain/types';

describe('TransactionListItem Component', () => {
  const mockAccount: Account = {
    id: 'acc-gcash',
    name: 'GCash',
    type: 'ewallet',
    initialBalance: 2500,
    currency: 'PHP',
    color: '#A6CFF2',
    icon: 'Smartphone',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const mockToAccount: Account = {
    id: 'acc-bpi',
    name: 'BPI Savings',
    type: 'bank',
    initialBalance: 15000,
    currency: 'PHP',
    color: '#F2C0CA',
    icon: 'Building2',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const mockCategory: Category = {
    id: 'cat-food',
    name: 'Food & Dining',
    type: 'expense',
    icon: 'Utensils',
    color: '#FFED9E',
  };

  const expenseTx: Transaction = {
    id: 'tx-1',
    amount: 580,
    type: 'expense',
    accountId: 'acc-gcash',
    categoryId: 'cat-food',
    date: '2026-09-12',
    notes: 'Ramen Lunch',
    tags: ['dining', 'weekend'],
    mood: 'Treat',
    createdAt: '2026-09-12T12:00:00.000Z',
    updatedAt: '2026-09-12T12:00:00.000Z',
  };

  const transferTx: Transaction = {
    id: 'tx-2',
    amount: 2000,
    type: 'transfer',
    accountId: 'acc-gcash',
    toAccountId: 'acc-bpi',
    date: '2026-09-12',
    notes: 'Savings deposit',
    mood: 'Essential',
    createdAt: '2026-09-12T13:00:00.000Z',
    updatedAt: '2026-09-12T13:00:00.000Z',
  };

  const incomeTx: Transaction = {
    id: 'tx-3',
    amount: 25000,
    type: 'income',
    accountId: 'acc-bpi',
    date: '2026-09-12',
    notes: 'Paycheck',
    mood: 'Peaceful',
    createdAt: '2026-09-12T09:00:00.000Z',
    updatedAt: '2026-09-12T09:00:00.000Z',
  };

  it('renders expense transaction with notes, account badge, mood, tags, and formatted amount', () => {
    render(
      <TransactionListItem
        transaction={expenseTx}
        account={mockAccount}
        category={mockCategory}
      />
    );

    expect(screen.getByText('Ramen Lunch')).toBeInTheDocument();
    expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    expect(screen.getByText('GCash')).toBeInTheDocument();
    expect(screen.getByText('Treat')).toBeInTheDocument();
    expect(screen.getByText('#dining')).toBeInTheDocument();
    expect(screen.getByText('#weekend')).toBeInTheDocument();
    expect(screen.getByTestId('tx-amount-tx-1')).toHaveTextContent(/-₱580\.00/);
  });

  it('renders transfer transaction with source -> destination badge and slate neutral amount', () => {
    render(
      <TransactionListItem
        transaction={transferTx}
        account={mockAccount}
        toAccount={mockToAccount}
      />
    );

    expect(screen.getByText('Savings deposit')).toBeInTheDocument();
    expect(screen.getByText('GCash → BPI Savings')).toBeInTheDocument();
    expect(screen.getByText('Essential')).toBeInTheDocument();
    expect(screen.getByTestId('tx-amount-tx-2')).toHaveTextContent(/₱2,000\.00/);
  });

  it('renders income transaction with green semantic amount', () => {
    render(
      <TransactionListItem
        transaction={incomeTx}
        account={mockToAccount}
      />
    );

    expect(screen.getByText('Paycheck')).toBeInTheDocument();
    expect(screen.getByText('BPI Savings')).toBeInTheDocument();
    expect(screen.getByText('Peaceful')).toBeInTheDocument();
    expect(screen.getByTestId('tx-amount-tx-3')).toHaveTextContent(/\+₱25,000\.00/);
  });

  it('triggers onClick callback when clicked', () => {
    const onClick = vi.fn();
    render(
      <TransactionListItem
        transaction={expenseTx}
        account={mockAccount}
        category={mockCategory}
        onClick={onClick}
      />
    );

    const item = screen.getByTestId('transaction-item-tx-1');
    fireEvent.click(item);
    expect(onClick).toHaveBeenCalledWith(expenseTx);
  });
});
