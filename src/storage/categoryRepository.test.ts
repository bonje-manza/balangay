import { describe, it, expect, beforeEach } from 'vitest';
import { db, resetDatabase } from './db';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  archiveCategory,
  deleteCategory,
} from './categoryRepository';
import { createTransaction } from './transactionRepository';

describe('categoryRepository', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  describe('createCategory', () => {
    it('creates a custom category with generated id and timestamps', async () => {
      const created = await createCategory({
        name: 'Pet Care',
        type: 'expense',
        icon: 'Dog',
        color: '#DAE097',
        budgetLimit: 3000,
      });

      expect(created.id).toBeDefined();
      expect(created.name).toBe('Pet Care');
      expect(created.type).toBe('expense');
      expect(created.icon).toBe('Dog');
      expect(created.color).toBe('#DAE097');
      expect(created.budgetLimit).toBe(3000);
      expect(created.isDefault).toBe(false);
      expect(created.isArchived).toBe(false);
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();

      const fetched = await getCategoryById(created.id);
      expect(fetched).toEqual(created);
    });

    it('trims category names and rejects empty names', async () => {
      await expect(
        createCategory({
          name: '   ',
          type: 'expense',
          icon: 'Utensils',
          color: '#FFED9E',
        })
      ).rejects.toThrow('Category name cannot be empty');

      const created = await createCategory({
        name: '  Coffee & Tea  ',
        type: 'expense',
        icon: 'Coffee',
        color: '#FFED9E',
      });

      expect(created.name).toBe('Coffee & Tea');
    });

    it('prevents creating duplicate category names for the same type (case-insensitive)', async () => {
      await createCategory({
        name: 'Freelance',
        type: 'income',
        icon: 'Laptop',
        color: '#A6CFF2',
      });

      await expect(
        createCategory({
          name: 'freelance',
          type: 'income',
          icon: 'Briefcase',
          color: '#FFED9E',
        })
      ).rejects.toThrow('Category "freelance" already exists for type income');

      // But allows the same name under a different type
      const expenseVersion = await createCategory({
        name: 'Freelance',
        type: 'expense',
        icon: 'Laptop',
        color: '#F2C0CA',
      });
      expect(expenseVersion.id).toBeDefined();
    });
  });

  describe('getCategories', () => {
    it('returns only active categories by default and filters by type', async () => {
      const cat1 = await createCategory({
        name: 'Gym & Fitness',
        type: 'expense',
        icon: 'Dumbbell',
        color: '#DAE097',
      });

      const cat2 = await createCategory({
        name: 'Side Gig',
        type: 'income',
        icon: 'Laptop',
        color: '#A6CFF2',
      });

      const cat3 = await createCategory({
        name: 'Old Expense',
        type: 'expense',
        icon: 'Zap',
        color: '#F2C0CA',
      });

      await archiveCategory(cat3.id, true);

      // Default: active only
      const allActive = await getCategories();
      expect(allActive).toHaveLength(2);
      expect(allActive.map((c) => c.name)).toEqual(['Gym & Fitness', 'Side Gig']);

      // Filter by type: expense
      const expenseActive = await getCategories({ type: 'expense' });
      expect(expenseActive).toHaveLength(1);
      expect(expenseActive[0].id).toBe(cat1.id);

      // Filter by type: income
      const incomeActive = await getCategories({ type: 'income' });
      expect(incomeActive).toHaveLength(1);
      expect(incomeActive[0].id).toBe(cat2.id);

      // Include archived
      const allWithArchived = await getCategories({ includeArchived: true });
      expect(allWithArchived).toHaveLength(3);
    });
  });

  describe('updateCategory', () => {
    it('updates custom category fields and updatedAt timestamp', async () => {
      const cat = await createCategory({
        name: 'Travel',
        type: 'expense',
        icon: 'Plane',
        color: '#A6CFF2',
        budgetLimit: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await updateCategory(cat.id, {
        name: 'Vacations & Travel',
        budgetLimit: 12000,
        color: '#FFED9E',
      });

      const updated = await getCategoryById(cat.id);
      expect(updated?.name).toBe('Vacations & Travel');
      expect(updated?.budgetLimit).toBe(12000);
      expect(updated?.color).toBe('#FFED9E');
      expect(updated?.icon).toBe('Plane');
      expect(new Date(updated!.updatedAt!).getTime()).toBeGreaterThan(
        new Date(cat.updatedAt!).getTime()
      );
    });

    it('protects default categories from renaming or icon changes, but allows budgetLimit edits', async () => {
      await db.categories.add({
        id: 'cat-food-dining',
        name: 'Food & Dining',
        type: 'expense',
        icon: 'Utensils',
        color: '#FFED9E',
        budgetLimit: 8000,
        isDefault: true,
      });

      await expect(
        updateCategory('cat-food-dining', {
          name: 'Eating Out',
        })
      ).rejects.toThrow('Default category name and icon cannot be modified');

      await expect(
        updateCategory('cat-food-dining', {
          icon: 'Coffee',
        })
      ).rejects.toThrow('Default category name and icon cannot be modified');

      // Updating budget limit or color on default categories is allowed
      await updateCategory('cat-food-dining', {
        budgetLimit: 15000,
        color: '#DAE097',
      });

      const updated = await getCategoryById('cat-food-dining');
      expect(updated?.budgetLimit).toBe(15000);
      expect(updated?.color).toBe('#DAE097');
      expect(updated?.name).toBe('Food & Dining');
    });
  });

  describe('archiveCategory & deleteCategory', () => {
    it('archives and unarchives categories', async () => {
      const cat = await createCategory({
        name: 'Subscriptions',
        type: 'expense',
        icon: 'Music',
        color: '#F2C0CA',
      });

      await archiveCategory(cat.id, true);
      let fetched = await getCategoryById(cat.id);
      expect(fetched?.isArchived).toBe(true);

      await archiveCategory(cat.id, false);
      fetched = await getCategoryById(cat.id);
      expect(fetched?.isArchived).toBe(false);
    });

    it('prevents deleting default categories', async () => {
      await db.categories.add({
        id: 'cat-groceries',
        name: 'Groceries & Market',
        type: 'expense',
        icon: 'ShoppingCart',
        color: '#DAE097',
        isDefault: true,
      });

      await expect(deleteCategory('cat-groceries')).rejects.toThrow(
        'Default categories cannot be deleted. You can archive them instead.'
      );
    });

    it('prevents deleting categories that have transactions associated', async () => {
      const cat = await createCategory({
        name: 'Books',
        type: 'expense',
        icon: 'BookOpen',
        color: '#FFED9E',
      });

      await createTransaction({
        amount: 500,
        type: 'expense',
        accountId: 'acc-cash',
        categoryId: cat.id,
        date: '2026-09-01',
      });

      await expect(deleteCategory(cat.id)).rejects.toThrow(
        'Cannot delete category with existing transactions. Archive it instead.'
      );

      // Verify archiving still works cleanly
      await archiveCategory(cat.id, true);
      const fetched = await getCategoryById(cat.id);
      expect(fetched?.isArchived).toBe(true);
    });

    it('deletes custom category when it has no transactions', async () => {
      const cat = await createCategory({
        name: 'Temporary',
        type: 'expense',
        icon: 'Zap',
        color: '#FFED9E',
      });

      await deleteCategory(cat.id);
      const fetched = await getCategoryById(cat.id);
      expect(fetched).toBeUndefined();
    });
  });
});
