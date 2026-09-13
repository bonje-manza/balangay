import { db } from './db';
import type { Category } from '../domain/types';

export interface GetCategoriesOptions {
  includeArchived?: boolean;
  type?: 'expense' | 'income';
}

/**
 * Retrieves categories from the database with optional type and archive filtering.
 * Active categories are returned by default.
 */
export async function getCategories(options: GetCategoriesOptions = {}): Promise<Category[]> {
  const { includeArchived = false, type } = options;

  let categories = await db.categories.toArray();

  if (!includeArchived) {
    categories = categories.filter((c) => c.isArchived !== true);
  }

  if (type) {
    categories = categories.filter((c) => c.type === type);
  }

  // Sort alphabetically by name for consistent UI display
  categories.sort((a, b) => a.name.localeCompare(b.name, 'en-PH'));

  return categories;
}

/**
 * Retrieves a single category by its ID.
 */
export async function getCategoryById(id: string): Promise<Category | undefined> {
  return await db.categories.get(id);
}

/**
 * Creates and persists a new category.
 * Enforces non-empty name and case-insensitive uniqueness per category type.
 */
export async function createCategory(
  category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Category> {
  const trimmedName = category.name ? category.name.trim() : '';
  if (!trimmedName) {
    throw new Error('Category name cannot be empty');
  }

  // Check case-insensitive uniqueness within the same category type
  const existing = await db.categories
    .filter(
      (c) => c.type === category.type && c.name.toLowerCase() === trimmedName.toLowerCase()
    )
    .first();

  if (existing) {
    throw new Error(`Category "${trimmedName}" already exists for type ${category.type}`);
  }

  const now = new Date().toISOString();
  const id =
    category.id ||
    (typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  const newCategory: Category = {
    ...category,
    id,
    name: trimmedName,
    isDefault: category.isDefault ?? false,
    isArchived: category.isArchived ?? false,
    createdAt: now,
    updatedAt: now,
  };

  await db.categories.add(newCategory);
  return newCategory;
}

/**
 * Updates an existing category by ID.
 * Protects default categories from name or icon changes, while allowing budgetLimit edits.
 */
export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, 'id' | 'createdAt'>>
): Promise<void> {
  const existing = await db.categories.get(id);
  if (!existing) {
    throw new Error(`Category with ID ${id} not found`);
  }

  // Protection for default categories
  if (existing.isDefault) {
    if (updates.name !== undefined && updates.name.trim() !== existing.name) {
      throw new Error('Default category name and icon cannot be modified');
    }
    if (updates.icon !== undefined && updates.icon !== existing.icon) {
      throw new Error('Default category name and icon cannot be modified');
    }
  }

  // Check uniqueness if name is updated
  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (!trimmed) {
      throw new Error('Category name cannot be empty');
    }

    const targetType = updates.type || existing.type;
    const conflict = await db.categories
      .filter(
        (c) =>
          c.id !== id &&
          c.type === targetType &&
          c.name.toLowerCase() === trimmed.toLowerCase()
      )
      .first();

    if (conflict) {
      throw new Error(`Category "${trimmed}" already exists for type ${targetType}`);
    }

    updates.name = trimmed;
  }

  await db.categories.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Archives or restores a category.
 */
export async function archiveCategory(id: string, isArchived = true): Promise<void> {
  await updateCategory(id, { isArchived });
}

/**
 * Deletes a category if it is not a default category and has no transactions associated.
 */
export async function deleteCategory(id: string): Promise<void> {
  const existing = await db.categories.get(id);
  if (!existing) {
    return;
  }

  if (existing.isDefault) {
    throw new Error('Default categories cannot be deleted. You can archive them instead.');
  }

  const txCount = await db.transactions.where('categoryId').equals(id).count();
  if (txCount > 0) {
    throw new Error(
      'Cannot delete category with existing transactions. Archive it instead.'
    );
  }

  await db.categories.delete(id);
}
