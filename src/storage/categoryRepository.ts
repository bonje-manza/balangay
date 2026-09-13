import { db } from './db';
import type { Category } from '../domain/types';
import { DEFAULT_CATEGORIES } from './seedData';

export interface GetCategoriesOptions {
  includeArchived?: boolean;
  type?: 'expense' | 'income';
}

/**
 * Repairs categories that may have corrupted or missing names or icons
 * (e.g. from prior bug where updating default category budget erased required fields).
 * Restores canonical metadata for default categories and provides fallbacks for custom ones.
 */
export async function repairCorruptedCategories(categories: Category[]): Promise<Category[]> {
  const defaultMap = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

  const repaired = await Promise.all(
    categories.map(async (cat) => {
      const defaultMatch = defaultMap.get(cat.id);
      const isMissingName = !cat.name || typeof cat.name !== 'string' || cat.name.trim() === '';
      const isMissingIcon = !cat.icon || typeof cat.icon !== 'string' || cat.icon.trim() === '';

      if (isMissingName || isMissingIcon) {
        const restoredName = isMissingName
          ? (defaultMatch?.name || (cat.isDefault ? defaultMatch?.name : undefined) || 'Unnamed Category')
          : cat.name;
        const restoredIcon = isMissingIcon
          ? (defaultMatch?.icon || 'Tag')
          : cat.icon;

        const fixed: Category = {
          ...cat,
          name: restoredName,
          icon: restoredIcon,
          updatedAt: new Date().toISOString(),
        };

        try {
          await db.categories.update(cat.id, {
            name: restoredName,
            icon: restoredIcon,
            updatedAt: fixed.updatedAt,
          });
        } catch {
          // Ignore DB write errors during read repair
        }

        return fixed;
      }
      return cat;
    })
  );

  return repaired;
}

/**
 * Retrieves categories from the database with optional type and archive filtering.
 * Active categories are returned by default.
 */
export async function getCategories(options: GetCategoriesOptions = {}): Promise<Category[]> {
  const { includeArchived = false, type } = options;

  let categories = await db.categories.toArray();

  // Heal corrupted categories if any
  categories = await repairCorruptedCategories(categories);

  if (!includeArchived) {
    categories = categories.filter((c) => c.isArchived !== true);
  }

  if (type) {
    categories = categories.filter((c) => c.type === type);
  }

  // Sort alphabetically by name for consistent UI display (with null-safety)
  categories.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'en-PH'));

  return categories;
}

/**
 * Retrieves a single category by its ID, repairing if missing required metadata.
 */
export async function getCategoryById(id: string): Promise<Category | undefined> {
  const category = await db.categories.get(id);
  if (!category) return undefined;

  const defaultMatch = DEFAULT_CATEGORIES.find((d) => d.id === category.id);
  const isMissingName = !category.name || typeof category.name !== 'string' || category.name.trim() === '';
  const isMissingIcon = !category.icon || typeof category.icon !== 'string' || category.icon.trim() === '';

  if (isMissingName || isMissingIcon) {
    const restoredName = isMissingName
      ? (defaultMatch?.name || 'Unnamed Category')
      : category.name;
    const restoredIcon = isMissingIcon
      ? (defaultMatch?.icon || 'Tag')
      : category.icon;

    category.name = restoredName;
    category.icon = restoredIcon;
    category.updatedAt = new Date().toISOString();

    try {
      await db.categories.update(id, {
        name: restoredName,
        icon: restoredIcon,
        updatedAt: category.updatedAt,
      });
    } catch {
      // Ignore DB write errors during read repair
    }
  }

  return category;
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
          (c.name || '').toLowerCase() === trimmed.toLowerCase()
      )
      .first();

    if (conflict) {
      throw new Error(`Category "${trimmed}" already exists for type ${targetType}`);
    }

    updates.name = trimmed;
  }

  const sanitizedChanges: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  // Only pass required fields to Dexie if they are defined, preventing accidental deletion
  if (updates.name !== undefined) sanitizedChanges.name = updates.name;
  if (updates.icon !== undefined) sanitizedChanges.icon = updates.icon;
  if (updates.color !== undefined) sanitizedChanges.color = updates.color;
  if (updates.type !== undefined) sanitizedChanges.type = updates.type;
  if (updates.isArchived !== undefined) sanitizedChanges.isArchived = updates.isArchived;
  if (updates.isDefault !== undefined) sanitizedChanges.isDefault = updates.isDefault;

  // budgetLimit can be explicitly cleared by passing undefined or set to a number
  if ('budgetLimit' in updates) {
    sanitizedChanges.budgetLimit = updates.budgetLimit;
  }

  await db.categories.update(id, sanitizedChanges);
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
