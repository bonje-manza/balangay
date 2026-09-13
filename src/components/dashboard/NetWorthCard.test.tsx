import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NetWorthCard } from './NetWorthCard';
import type { Account } from '../../domain/types';

describe('NetWorthCard Component', () => {
  const mockAccounts: Account[] = [
    {
      id: 'acc-1',
      name: 'GCash',
      type: 'ewallet',
      initialBalance: 2500,
      currency: 'PHP',
      color: '#A6CFF2',
      icon: 'Smartphone',
      isArchived: false,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'acc-2',
      name: 'BPI Savings',
      type: 'bank',
      initialBalance: 15000,
      currency: 'PHP',
      color: '#F2C0CA',
      icon: 'Building2',
      isArchived: false,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
    {
      id: 'acc-3',
      name: 'Old Closed Wallet',
      type: 'cash',
      initialBalance: 0,
      currency: 'PHP',
      color: '#FFED9E',
      icon: 'Wallet',
      isArchived: true,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    },
  ];

  const mockBalances = new Map<string, number>([
    ['acc-1', 3200],
    ['acc-2', 18500],
  ]);

  it('renders total net worth formatted with ₱ and hero scale', () => {
    render(
      <NetWorthCard
        netWorth={21700}
        accounts={mockAccounts}
        balances={mockBalances}
      />
    );

    expect(screen.getByText('Total Net Worth')).toBeInTheDocument();
    expect(screen.getByTestId('net-worth-amount')).toHaveTextContent(/₱21,700\.00/);
    expect(screen.getByText('Real-time')).toBeInTheDocument();
  });

  it('renders active accounts in breakdown strip and excludes archived accounts', () => {
    render(
      <NetWorthCard
        netWorth={21700}
        accounts={mockAccounts}
        balances={mockBalances}
      />
    );

    // Active accounts are rendered
    expect(screen.getByText('GCash')).toBeInTheDocument();
    expect(screen.getByText(/₱3,200\.00/)).toBeInTheDocument();
    expect(screen.getByText('BPI Savings')).toBeInTheDocument();
    expect(screen.getByText(/₱18,500\.00/)).toBeInTheDocument();

    // Archived account is excluded
    expect(screen.queryByText('Old Closed Wallet')).not.toBeInTheDocument();
  });

  it('renders fallback when no active accounts are present', () => {
    render(
      <NetWorthCard
        netWorth={0}
        accounts={[]}
        balances={new Map()}
      />
    );

    expect(screen.getByText(/No active accounts found/i)).toBeInTheDocument();
  });

  it('supports oat variant rendering', () => {
    render(
      <NetWorthCard
        netWorth={5000}
        accounts={mockAccounts}
        balances={mockBalances}
        variant="oat"
      />
    );

    const card = screen.getByTestId('net-worth-card');
    expect(card.className).toContain('bg-[#FFFDF9]');
  });
});
