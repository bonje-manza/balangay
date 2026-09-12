import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AccountCard } from './AccountCard';
import type { Account } from '../../domain/types';

describe('AccountCard Component', () => {
  const mockAccount: Account = {
    id: 'acc-gcash-test',
    name: 'GCash Wallet',
    type: 'ewallet',
    initialBalance: 2500,
    currency: 'PHP',
    color: '#A6CFF2',
    icon: 'Smartphone',
    isArchived: false,
    createdAt: '2026-09-12T00:00:00.000Z',
    updatedAt: '2026-09-12T00:00:00.000Z',
  };

  it('renders account name, type badge, running balance and initial balance note', () => {
    render(<AccountCard account={mockAccount} balance={4250.75} />);

    expect(screen.getByTestId('account-name-acc-gcash-test')).toHaveTextContent('GCash Wallet');
    expect(screen.getByTestId('account-type-badge-acc-gcash-test')).toHaveTextContent('E-Wallet');
    expect(screen.getByTestId('account-balance-acc-gcash-test')).toHaveTextContent('₱4,250.75');
    expect(screen.getByTestId('account-initial-balance-acc-gcash-test')).toHaveTextContent('Initial:');
    expect(screen.getByTestId('account-initial-balance-acc-gcash-test')).toHaveTextContent('₱2,500.00');
  });

  it('fires onTransfer and onEdit callbacks when action buttons are clicked', () => {
    const onTransfer = vi.fn();
    const onEdit = vi.fn();

    render(
      <AccountCard
        account={mockAccount}
        balance={4250.75}
        onTransfer={onTransfer}
        onEdit={onEdit}
      />
    );

    const transferBtn = screen.getByTestId('account-transfer-btn-acc-gcash-test');
    fireEvent.click(transferBtn);
    expect(onTransfer).toHaveBeenCalledWith(mockAccount);

    const editBtn = screen.getByTestId('account-edit-btn-acc-gcash-test');
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(mockAccount);
  });
});
