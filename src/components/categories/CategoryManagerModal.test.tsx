import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryManagerModal } from './CategoryManagerModal';
import { resetDatabase, db } from '../../storage/db';
import type { Category } from '../../domain/types';

describe('CategoryManagerModal', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  const sampleCategories: Category[] = [
    {
      id: 'cat-food',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
      budgetLimit: 8000,
      isDefault: true,
      isArchived: false,
    },
    {
      id: 'cat-pet',
      name: 'Pet Care',
      type: 'expense',
      icon: 'Dog',
      color: '#DAE097',
      budgetLimit: 3000,
      isDefault: false,
      isArchived: false,
    },
    {
      id: 'cat-salary',
      name: 'Salary & Wages',
      type: 'income',
      icon: 'Briefcase',
      color: '#A6CFF2',
      isDefault: true,
      isArchived: false,
    },
    {
      id: 'cat-old-hobby',
      name: 'Old Hobby',
      type: 'expense',
      icon: 'Music',
      color: '#F2C0CA',
      isDefault: false,
      isArchived: true,
    },
  ];

  it('renders expense categories by default with counts', () => {
    render(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        initialCategories={sampleCategories}
      />
    );

    expect(screen.getByTestId('category-manager-modal')).toBeInTheDocument();
    expect(screen.getByText('Food & Dining')).toBeInTheDocument();
    expect(screen.getByText('Pet Care')).toBeInTheDocument();
    expect(screen.queryByText('Salary & Wages')).not.toBeInTheDocument();
  });

  it('switches between Expense, Income, and Archived tabs', async () => {
    const user = userEvent.setup();
    render(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        initialCategories={sampleCategories}
      />
    );

    // Switch to Income tab
    const incomeTab = screen.getByRole('tab', { name: /Income/i });
    await user.click(incomeTab);

    expect(screen.getByText('Salary & Wages')).toBeInTheDocument();
    expect(screen.queryByText('Food & Dining')).not.toBeInTheDocument();

    // Switch to Archived tab
    const archivedTab = screen.getByRole('tab', { name: /Archived/i });
    await user.click(archivedTab);

    expect(screen.getByText('Old Hobby')).toBeInTheDocument();
  });

  it('archives a custom category and moves it to Archived tab', async () => {
    await db.categories.bulkAdd(sampleCategories);
    const user = userEvent.setup();

    render(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pet Care')).toBeInTheDocument();
    });

    const archiveBtn = screen.getByTestId('archive-cat-pet');
    await user.click(archiveBtn);

    await waitFor(async () => {
      const updated = await db.categories.get('cat-pet');
      expect(updated?.isArchived).toBe(true);
    });
  });

  it('opens CategoryFormModal when clicking "+ Add Category"', async () => {
    const user = userEvent.setup();
    render(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        initialCategories={sampleCategories}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Add Category/i });
    await user.click(addBtn);

    expect(screen.getByTestId('category-form-modal')).toBeInTheDocument();
  });

  it('renders gracefully without crashing when a category has a missing name', () => {
    const corruptedCategories: Category[] = [
      {
        id: 'cat-corrupted',
        name: undefined as any,
        type: 'expense',
        icon: 'Utensils',
        color: '#FFED9E',
      },
      {
        id: 'cat-pet',
        name: 'Pet Care',
        type: 'expense',
        icon: 'Dog',
        color: '#DAE097',
      },
    ];

    render(
      <CategoryManagerModal
        isOpen={true}
        onClose={vi.fn()}
        initialCategories={corruptedCategories}
      />
    );

    expect(screen.getByTestId('category-manager-modal')).toBeInTheDocument();
    expect(screen.getByText('Pet Care')).toBeInTheDocument();
    expect(screen.getByText('Unnamed Category')).toBeInTheDocument();
  });
});
