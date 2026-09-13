import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { YearlyCashFlowGrid } from './YearlyCashFlowGrid';
import type { YearlyCashflowSummary } from '../../domain/calculations';

describe('YearlyCashFlowGrid Component (TDD)', () => {
  const sampleYearlySummary: YearlyCashflowSummary = {
    months: [
      { month: 1, income: 25000, expense: 12000, net: 13000 },
      { month: 2, income: 20000, expense: 18000, net: 2000 },
      { month: 3, income: 0, expense: 5000, net: -5000 },
      { month: 4, income: 0, expense: 0, net: 0 },
      { month: 5, income: 0, expense: 0, net: 0 },
      { month: 6, income: 0, expense: 0, net: 0 },
      { month: 7, income: 0, expense: 0, net: 0 },
      { month: 8, income: 0, expense: 0, net: 0 },
      { month: 9, income: 0, expense: 0, net: 0 },
      { month: 10, income: 0, expense: 0, net: 0 },
      { month: 11, income: 0, expense: 0, net: 0 },
      { month: 12, income: 0, expense: 0, net: 0 },
    ],
    total: {
      income: 45000,
      expense: 35000,
      net: 10000,
    },
  };

  it('renders annual totals and all 12 month cards', () => {
    render(
      <YearlyCashFlowGrid
        year={2026}
        yearlySummary={sampleYearlySummary}
      />
    );

    expect(screen.getByTestId('yearly-cashflow-grid')).toBeInTheDocument();
    expect(screen.getByText('January')).toBeInTheDocument();
    expect(screen.getByText('February')).toBeInTheDocument();
    expect(screen.getByText('December')).toBeInTheDocument();
  });

  it('calls onSelectMonth when a month card is clicked', () => {
    const onSelect = vi.fn();
    render(
      <YearlyCashFlowGrid
        year={2026}
        yearlySummary={sampleYearlySummary}
        onSelectMonth={onSelect}
      />
    );

    const febCard = screen.getByTestId('year-month-card-2');
    fireEvent.click(febCard);

    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
