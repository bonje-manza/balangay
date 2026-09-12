import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpendingBreakdownChart } from './SpendingBreakdownChart';
import type { Category } from '../../domain/types';

describe('SpendingBreakdownChart Component', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-groceries',
      name: 'Groceries & Market',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#DAE097',
    },
    {
      id: 'cat-dining',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
    },
    {
      id: 'cat-transport',
      name: 'Transportation',
      type: 'expense',
      icon: 'Bus',
      color: '#A6CFF2',
    },
  ];

  it('renders pure SVG donut slices matching category expenses and displays center total', () => {
    const spending = new Map<string, number>([
      ['cat-groceries', 6000],
      ['cat-dining', 4000],
    ]);

    render(
      <SpendingBreakdownChart
        categories={mockCategories}
        spending={spending}
        monthName="September 2026"
      />
    );

    // Center display of total expenses (6000 + 4000 = 10,000)
    expect(screen.getByTestId('total-expenses-display')).toHaveTextContent('₱10,000.00');
    expect(screen.getByText(/September 2026/)).toBeInTheDocument();

    // SVG element is present
    const svg = screen.getByTestId('spending-breakdown-svg');
    expect(svg).toBeInTheDocument();

    // Slices for each category with expenses
    const groceriesSlice = screen.getByTestId('donut-slice-cat-groceries');
    const diningSlice = screen.getByTestId('donut-slice-cat-dining');
    expect(groceriesSlice).toBeInTheDocument();
    expect(diningSlice).toBeInTheDocument();
    expect(screen.queryByTestId('donut-slice-cat-transport')).not.toBeInTheDocument();

    // Legend items with names, percentages, and amounts
    expect(screen.getByTestId('legend-item-cat-groceries')).toHaveTextContent('Groceries & Market');
    expect(screen.getByTestId('legend-item-cat-groceries')).toHaveTextContent('60%');
    expect(screen.getByTestId('legend-item-cat-groceries')).toHaveTextContent('₱6,000.00');

    expect(screen.getByTestId('legend-item-cat-dining')).toHaveTextContent('Food & Dining');
    expect(screen.getByTestId('legend-item-cat-dining')).toHaveTextContent('40%');
    expect(screen.getByTestId('legend-item-cat-dining')).toHaveTextContent('₱4,000.00');
  });

  it('renders friendly empty state when no expenses are recorded', () => {
    render(
      <SpendingBreakdownChart
        categories={mockCategories}
        spending={new Map()}
      />
    );

    expect(screen.getByTestId('spending-chart-empty')).toBeInTheDocument();
    expect(screen.getByText('No expenses recorded this month')).toBeInTheDocument();
    expect(screen.queryByTestId('spending-breakdown-svg')).not.toBeInTheDocument();
  });

  it('invokes onSelectCategory when clicking legend item or slice', () => {
    const onSelectCategory = vi.fn();
    const spending = new Map<string, number>([['cat-groceries', 5000]]);

    render(
      <SpendingBreakdownChart
        categories={mockCategories}
        spending={spending}
        onSelectCategory={onSelectCategory}
      />
    );

    const legendItem = screen.getByTestId('legend-item-cat-groceries');
    fireEvent.click(legendItem);
    expect(onSelectCategory).toHaveBeenCalledWith(mockCategories[0]);

    const slice = screen.getByTestId('donut-slice-cat-groceries');
    fireEvent.click(slice);
    expect(onSelectCategory).toHaveBeenCalledTimes(2);
  });
});
