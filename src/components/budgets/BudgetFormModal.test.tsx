import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BudgetFormModal } from './BudgetFormModal';
import { db, resetDatabase } from '../../storage/db';
import type { Category } from '../../domain/types';

describe('BudgetFormModal Component (TDD)', () => {
  const onClose = vi.fn();
  const onSuccess = vi.fn();

  const testCategories: Category[] = [
    {
      id: 'cat-groceries',
      name: 'Groceries & Market',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#DAE097',
      budgetLimit: 8000,
    },
    {
      id: 'cat-dining',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
      budgetLimit: 4000,
    },
    {
      id: 'cat-transport',
      name: 'Transportation',
      type: 'expense',
      icon: 'Bus',
      color: '#A6CFF2',
    },
  ];

  beforeEach(async () => {
    await resetDatabase();
    await db.categories.bulkAdd(testCategories);
    vi.clearAllMocks();
  });

  it('pre-fills category and existing budget limit when opened', () => {
    render(
      <BudgetFormModal
        isOpen={true}
        onClose={onClose}
        categories={testCategories}
        selectedCategoryId="cat-groceries"
        onSuccess={onSuccess}
      />
    );

    expect(screen.getByText('Set Category Budget')).toBeInTheDocument();

    // Category selector has cat-groceries selected
    const select = screen.getByTestId('budget-category-select') as HTMLSelectElement;
    expect(select.value).toBe('cat-groceries');

    // Input prefilled with 8000
    const input = screen.getByTestId('budget-limit-input') as HTMLInputElement;
    expect(input.value).toBe('8000');

    // Remove Budget button is present because category has an existing budget
    expect(screen.getByTestId('remove-budget-btn')).toBeInTheDocument();
  });

  it('updates budgetLimit in Dexie categories table on save', async () => {
    render(
      <BudgetFormModal
        isOpen={true}
        onClose={onClose}
        categories={testCategories}
        selectedCategoryId="cat-groceries"
        onSuccess={onSuccess}
      />
    );

    const input = screen.getByTestId('budget-limit-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '12500' } });

    const saveButton = screen.getByTestId('save-budget-btn');
    fireEvent.click(saveButton);

    await waitFor(async () => {
      const updated = await db.categories.get('cat-groceries');
      expect(updated?.budgetLimit).toBe(12500);
    });

    expect(onClose).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('removes budget and updates limit to undefined or 0 in Dexie categories table', async () => {
    render(
      <BudgetFormModal
        isOpen={true}
        onClose={onClose}
        categories={testCategories}
        selectedCategoryId="cat-groceries"
        onSuccess={onSuccess}
      />
    );

    const removeButton = screen.getByTestId('remove-budget-btn');
    fireEvent.click(removeButton);

    await waitFor(async () => {
      const updated = await db.categories.get('cat-groceries');
      expect(!updated?.budgetLimit || updated?.budgetLimit === 0).toBe(true);
    });

    expect(onClose).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows error validation when entering an invalid or negative limit', async () => {
    render(
      <BudgetFormModal
        isOpen={true}
        onClose={onClose}
        categories={testCategories}
        selectedCategoryId="cat-groceries"
        onSuccess={onSuccess}
      />
    );

    const input = screen.getByTestId('budget-limit-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '-500' } });

    const saveButton = screen.getByTestId('save-budget-btn');
    fireEvent.click(saveButton);

    expect(screen.getByText(/Please enter a valid budget limit/i)).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    // Dexie should not be updated
    const untouched = await db.categories.get('cat-groceries');
    expect(untouched?.budgetLimit).toBe(8000);
  });

  it('switches category and syncs input value when category selection changes', () => {
    render(
      <BudgetFormModal
        isOpen={true}
        onClose={onClose}
        categories={testCategories}
        selectedCategoryId="cat-groceries"
        onSuccess={onSuccess}
      />
    );

    const select = screen.getByTestId('budget-category-select') as HTMLSelectElement;
    const input = screen.getByTestId('budget-limit-input') as HTMLInputElement;

    // Switch to Dining (4000)
    fireEvent.change(select, { target: { value: 'cat-dining' } });
    expect(input.value).toBe('4000');
    expect(screen.getByTestId('remove-budget-btn')).toBeInTheDocument();

    // Switch to Transport (no budget limit)
    fireEvent.change(select, { target: { value: 'cat-transport' } });
    expect(input.value).toBe('');
    expect(screen.queryByTestId('remove-budget-btn')).not.toBeInTheDocument();
  });
});
