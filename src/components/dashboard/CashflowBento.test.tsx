import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CashflowBento } from './CashflowBento';
import type { CashflowSummary } from '../../domain/types';

describe('CashflowBento Component', () => {
  it('renders income, expense, and net cashflow correctly', () => {
    const cashflow: CashflowSummary = {
      income: 50000,
      expense: 20000,
      net: 30000,
    };

    render(<CashflowBento cashflow={cashflow} monthName="September 2026" />);

    expect(screen.getByText('Monthly Cashflow')).toBeInTheDocument();
    expect(screen.getByText('September 2026')).toBeInTheDocument();

    expect(screen.getByTestId('cashflow-income-amount')).toHaveTextContent(/₱50,000\.00/);
    expect(screen.getByTestId('cashflow-expense-amount')).toHaveTextContent(/₱20,000\.00/);
    expect(screen.getByTestId('cashflow-net-amount')).toHaveTextContent(/\+₱30,000\.00/);

    // Savings rate = (30000 / 50000) * 100 = 60%
    expect(screen.getByText(/Savings Rate:/i)).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('renders Pistachio and Blossom accents for income and expense cards', () => {
    const cashflow: CashflowSummary = {
      income: 10000,
      expense: 5000,
      net: 5000,
    };

    render(<CashflowBento cashflow={cashflow} />);

    const incomeCard = screen.getByTestId('cashflow-income-card');
    const expenseCard = screen.getByTestId('cashflow-expense-card');

    expect(incomeCard.className).toContain('bg-[#DAE097]');
    expect(expenseCard.className).toContain('bg-[#F2C0CA]');
  });

  it('handles zero cashflow state gracefully', () => {
    const cashflow: CashflowSummary = {
      income: 0,
      expense: 0,
      net: 0,
    };

    render(<CashflowBento cashflow={cashflow} />);

    expect(screen.getByText(/No cashflow recorded yet/i)).toBeInTheDocument();
  });

  it('handles zero income with expenses', () => {
    const cashflow: CashflowSummary = {
      income: 0,
      expense: 4500,
      net: -4500,
    };

    render(<CashflowBento cashflow={cashflow} />);

    expect(screen.getByText(/Outflow with no recorded income/i)).toBeInTheDocument();
    expect(screen.getByTestId('cashflow-expense-amount')).toHaveTextContent(/₱4,500\.00/);
  });
});
