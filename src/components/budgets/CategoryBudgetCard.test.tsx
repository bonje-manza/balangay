import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryBudgetCard } from './CategoryBudgetCard';
import type { Category } from '../../domain/types';

describe('CategoryBudgetCard Component', () => {
  const mockCategory: Category = {
    id: 'cat-groceries',
    name: 'Groceries & Market',
    type: 'expense',
    icon: 'ShoppingCart',
    color: '#DAE097',
    budgetLimit: 10000,
  };

  it('renders on track state when spending is below 80%', () => {
    const onEditBudget = vi.fn();
    render(
      <CategoryBudgetCard
        category={mockCategory}
        spent={5000}
        onEditBudget={onEditBudget}
      />
    );

    expect(screen.getByText('Groceries & Market')).toBeInTheDocument();
    expect(screen.getByTestId('budget-badge-safe-cat-groceries')).toHaveTextContent('On Track');
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByTestId('budget-remaining-cat-groceries')).toHaveTextContent('₱5,000.00 left');

    const bar = screen.getByTestId('budget-bar-fill-cat-groceries');
    expect(bar.className).toContain('bg-[#DAE097]');
    expect(bar.style.width).toBe('50%');
  });

  it('renders warning state when spending is between 80% and 100%', () => {
    const onEditBudget = vi.fn();
    render(
      <CategoryBudgetCard
        category={mockCategory}
        spent={8500}
        onEditBudget={onEditBudget}
      />
    );

    expect(screen.getByTestId('budget-badge-warning-cat-groceries')).toHaveTextContent('Near Limit');
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByTestId('budget-remaining-cat-groceries')).toHaveTextContent('₱1,500.00 left');

    const bar = screen.getByTestId('budget-bar-fill-cat-groceries');
    expect(bar.className).toContain('bg-[#FFED9E]');
    expect(bar.style.width).toBe('85%');
  });

  it('renders over-budget alert state when spending exceeds 100%', () => {
    const onEditBudget = vi.fn();
    render(
      <CategoryBudgetCard
        category={mockCategory}
        spent={12500}
        onEditBudget={onEditBudget}
      />
    );

    expect(screen.getByTestId('budget-badge-over-cat-groceries')).toHaveTextContent('Over Budget');
    expect(screen.getByText('125%')).toBeInTheDocument();
    expect(screen.getByTestId('budget-remaining-cat-groceries')).toHaveTextContent('₱2,500.00 over budget');

    const bar = screen.getByTestId('budget-bar-fill-cat-groceries');
    expect(bar.className).toContain('bg-[#F2C0CA]');
    // ProgressBar width is clamped to 100%
    expect(bar.style.width).toBe('100%');
  });

  it('invokes onEditBudget when clicking Edit Budget button', () => {
    const onEditBudget = vi.fn();
    render(
      <CategoryBudgetCard
        category={mockCategory}
        spent={3000}
        onEditBudget={onEditBudget}
      />
    );

    const editBtn = screen.getByTestId('edit-budget-btn-cat-groceries');
    fireEvent.click(editBtn);
    expect(onEditBudget).toHaveBeenCalledTimes(1);
    expect(onEditBudget).toHaveBeenCalledWith(mockCategory);
  });
});
