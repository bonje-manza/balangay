import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CashFlowCalendar } from './CashFlowCalendar';
import type { CashflowSummary } from '../../domain/types';

describe('CashFlowCalendar Component (TDD)', () => {
  const sampleDailyCashflow = new Map<string, CashflowSummary>([
    ['2026-09-05', { income: 15000, expense: 3500, net: 11500 }],
    ['2026-09-18', { income: 0, expense: 1200, net: -1200 }],
  ]);

  it('renders days of week header and all days for September 2026', () => {
    render(
      <CashFlowCalendar
        year={2026}
        month={9}
        dailyCashflow={sampleDailyCashflow}
        selectedDate="2026-09-05"
        onSelectDate={vi.fn()}
      />
    );

    // Days of week header
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();

    // Day 1 to Day 30 in September
    expect(screen.getByTestId('calendar-day-2026-09-01')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-day-2026-09-30')).toBeInTheDocument();
  });

  it('shows income and expense indicators on days with cash flow', () => {
    render(
      <CashFlowCalendar
        year={2026}
        month={9}
        dailyCashflow={sampleDailyCashflow}
        selectedDate="2026-09-01"
        onSelectDate={vi.fn()}
      />
    );

    const day5 = screen.getByTestId('calendar-day-2026-09-05');
    // Day 5 has income and expense indicators
    expect(day5.querySelector('[data-testid="day-income-dot"]')).toBeInTheDocument();
    expect(day5.querySelector('[data-testid="day-expense-dot"]')).toBeInTheDocument();

    const day18 = screen.getByTestId('calendar-day-2026-09-18');
    expect(day18.querySelector('[data-testid="day-income-dot"]')).not.toBeInTheDocument();
    expect(day18.querySelector('[data-testid="day-expense-dot"]')).toBeInTheDocument();
  });

  it('calls onSelectDate when a day cell is clicked', () => {
    const onSelectDate = vi.fn();
    render(
      <CashFlowCalendar
        year={2026}
        month={9}
        dailyCashflow={sampleDailyCashflow}
        selectedDate="2026-09-01"
        onSelectDate={onSelectDate}
      />
    );

    const day15 = screen.getByTestId('calendar-day-2026-09-15');
    fireEvent.click(day15);

    expect(onSelectDate).toHaveBeenCalledWith('2026-09-15');
  });

  it('marks selected day with aria-selected true', () => {
    render(
      <CashFlowCalendar
        year={2026}
        month={9}
        dailyCashflow={sampleDailyCashflow}
        selectedDate="2026-09-05"
        onSelectDate={vi.fn()}
      />
    );

    const day5 = screen.getByTestId('calendar-day-2026-09-05');
    expect(day5).toHaveAttribute('aria-selected', 'true');

    const day6 = screen.getByTestId('calendar-day-2026-09-06');
    expect(day6).toHaveAttribute('aria-selected', 'false');
  });
});
