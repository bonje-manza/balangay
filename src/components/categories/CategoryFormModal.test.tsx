import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryFormModal } from './CategoryFormModal';
import { resetDatabase, db } from '../../storage/db';
import type { Category } from '../../domain/types';

describe('CategoryFormModal', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('renders modal when open with default values', () => {
    render(
      <CategoryFormModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('category-form-modal')).toBeInTheDocument();
    expect(screen.getByLabelText(/Category Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Category/i })).toBeInTheDocument();
  });

  it('validates empty name input', async () => {
    const user = userEvent.setup();
    render(
      <CategoryFormModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Save Category/i });
    await user.click(submitBtn);

    expect(screen.getByTestId('category-name-error')).toHaveTextContent(/Category name is required/i);
  });

  it('creates a new custom expense category with selected icon, color, and budget limit', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <CategoryFormModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Category Name/i);
    await user.type(nameInput, 'Pet Supplies');

    // Select color (Blossom)
    const colorBtn = screen.getByTestId('color-swatch-#F2C0CA');
    await user.click(colorBtn);

    // Select icon (Dog)
    const iconBtn = screen.getByTestId('icon-option-Dog');
    await user.click(iconBtn);

    // Enter budget limit
    const limitInput = screen.getByLabelText(/Monthly Budget Limit/i);
    await user.type(limitInput, '4500');

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Save Category/i });
    await user.click(submitBtn);

    await waitFor(async () => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      const saved = await db.categories.where('name').equals('Pet Supplies').first();
      expect(saved).toBeDefined();
      expect(saved?.color).toBe('#F2C0CA');
      expect(saved?.icon).toBe('Dog');
      expect(saved?.budgetLimit).toBe(4500);
      expect(saved?.type).toBe('expense');
    });
  });

  it('allows editing an existing custom category', async () => {
    const existing: Category = {
      id: 'cat-custom-1',
      name: 'Old Fitness',
      type: 'expense',
      icon: 'Dumbbell',
      color: '#DAE097',
      budgetLimit: 2000,
      isDefault: false,
    };
    await db.categories.add(existing);

    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <CategoryFormModal
        isOpen={true}
        categoryToEdit={existing}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const nameInput = screen.getByLabelText(/Category Name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Gym & Wellness');

    const submitBtn = screen.getByRole('button', { name: /Save Changes/i });
    await user.click(submitBtn);

    await waitFor(async () => {
      expect(onSuccess).toHaveBeenCalled();
      const updated = await db.categories.get('cat-custom-1');
      expect(updated?.name).toBe('Gym & Wellness');
    });
  });

  it('locks name and icon editing when modifying a default category', async () => {
    const defaultCat: Category = {
      id: 'cat-food-dining',
      name: 'Food & Dining',
      type: 'expense',
      icon: 'Utensils',
      color: '#FFED9E',
      budgetLimit: 8000,
      isDefault: true,
    };
    await db.categories.add(defaultCat);

    render(
      <CategoryFormModal
        isOpen={true}
        categoryToEdit={defaultCat}
        onClose={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText(/Category Name/i);
    expect(nameInput).toBeDisabled();
    expect(screen.getByText(/Default category name cannot be changed/i)).toBeInTheDocument();
  });
});
