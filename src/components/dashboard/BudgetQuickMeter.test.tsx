import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BudgetQuickMeter } from './BudgetQuickMeter';
import type { Category } from '../../domain/types';

describe('BudgetQuickMeter Component', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-groceries',
      name: 'Groceries & Market',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#DAE097',
      budgetLimit: 10000,
    },
    {
      id: 'cat-dining',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
      budgetLimit: 5000,
    },
    {
      id: 'cat-salary',
      name: 'Salary',
      type: 'income',
      icon: 'Briefcase',
      color: '#DAE097',
    },
  ];

  it('renders budgeted categories with spent and remaining amounts', () => {
    const spending = new Map<string, number>([
      ['cat-groceries', 4000], // 40% -> Pistachio (<80%)
      ['cat-dining', 2500], // 50% -> Pistachio (<80%)
    ]);

    render(<BudgetQuickMeter categories={mockCategories} spending={spending} />);

    expect(screen.getByText('Budget Health')).toBeInTheDocument();
    expect(screen.getByText('Groceries & Market')).toBeInTheDocument();
    expect(screen.getByText('Food & Dining')).toBeInTheDocument();

    // 4000 spent of 10000 -> 6000 left
    expect(screen.getByText(/₱4,000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/₱6,000\.00 left/)).toBeInTheDocument();

    // Safe status badge
    expect(screen.getByTestId('budget-badge-safe')).toHaveTextContent(/On Track/i);

    // Pistachio fill color for < 80%
    const groceriesBar = screen.getByTestId('budget-bar-fill-cat-groceries');
    expect(groceriesBar.className).toContain('bg-[#DAE097]');
  });

  it('renders Near Limit warning badge when category is between 80% and 100%', () => {
    const spending = new Map<string, number>([
      ['cat-groceries', 8500], // 85% -> Butter
      ['cat-dining', 2000],
    ]);

    render(<BudgetQuickMeter categories={mockCategories} spending={spending} />);

    expect(screen.getByTestId('budget-badge-warning')).toHaveTextContent(/Near Limit/i);

    const groceriesBar = screen.getByTestId('budget-bar-fill-cat-groceries');
    expect(groceriesBar.className).toContain('bg-[#FFED9E]');
  });

  it('renders Over Budget warning badge and Blossom fill when category exceeds 100%', () => {
    const spending = new Map<string, number>([
      ['cat-groceries', 12000], // 120% -> Blossom
    ]);

    render(<BudgetQuickMeter categories={mockCategories} spending={spending} />);

    expect(screen.getByTestId('budget-badge-over')).toHaveTextContent(/Over Budget/i);
    expect(screen.getByText(/\+₱2,000\.00 over/i)).toBeInTheDocument();

    const groceriesBar = screen.getByTestId('budget-bar-fill-cat-groceries');
    expect(groceriesBar.className).toContain('bg-[#F2C0CA]');
  });

  it('renders empty message when no categories have budgets defined', () => {
    render(
      <BudgetQuickMeter
        categories={[
          {
            id: 'cat-no-budget',
            name: 'No Budget',
            type: 'expense',
            icon: 'Tag',
            color: '#FFED9E',
          },
        ]}
        spending={new Map()}
      />
    );

    expect(screen.getByText(/No category budgets set yet/i)).toBeInTheDocument();
  });

  it('invokes onViewBudgets when Manage Budgets button is clicked', () => {
    const onViewBudgets = vi.fn();
    render(
      <BudgetQuickMeter
        categories={mockCategories}
        spending={new Map()}
        onViewBudgets={onViewBudgets}
      />
    );

    const btn = screen.getByTestId('budget-view-all-button');
    fireEvent.click(btn);
    expect(onViewBudgets).toHaveBeenCalledTimes(1);
  });
});
