import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CashFlowBarChart } from './CashFlowBarChart';

describe('CashFlowBarChart Component (TDD)', () => {
  const sampleMonthlyData = [
    { label: 'Jan', dateKey: '2026-01', income: 15000, expense: 8000, net: 7000 },
    { label: 'Feb', dateKey: '2026-02', income: 12000, expense: 9500, net: 2500 },
    { label: 'Mar', dateKey: '2026-03', income: 0, expense: 4000, net: -4000 },
  ];

  it('renders SVG chart with income and expense bars', () => {
    render(
      <CashFlowBarChart
        mode="monthly"
        data={sampleMonthlyData}
      />
    );

    expect(screen.getByTestId('cashflow-bar-chart')).toBeInTheDocument();
    // Verify labels Jan, Feb, Mar are present
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
  });

  it('handles clicks on bars when onSelectBar is provided', () => {
    const onSelect = vi.fn();
    render(
      <CashFlowBarChart
        mode="monthly"
        data={sampleMonthlyData}
        onSelectBar={onSelect}
      />
    );

    const janBarGroup = screen.getByTestId('bar-group-Jan');
    fireEvent.click(janBarGroup);

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Jan', dateKey: '2026-01' })
    );
  });

  it('renders friendly empty state when all data is zero', () => {
    render(
      <CashFlowBarChart
        mode="monthly"
        data={[]}
      />
    );

    expect(screen.getByText(/No cash flow activity to visualize/i)).toBeInTheDocument();
  });
});
