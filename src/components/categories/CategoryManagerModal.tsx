import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../storage/db';
import type { Category } from '../../domain/types';
import { archiveCategory, deleteCategory } from '../../storage/categoryRepository';
import { renderCategoryIcon } from '../dashboard/iconHelpers';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { StickerBadge } from '../ui/StickerBadge';
import { CategoryFormModal } from './CategoryFormModal';
import { Plus, Edit2, Archive, RotateCcw, Trash2, FolderKanban } from 'lucide-react';
import { formatPHP } from '../../domain/money';

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategories?: Category[];
}

type TabType = 'expense' | 'income' | 'archived';

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  initialCategories,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('expense');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Live query from Dexie with prop fallback for tests
  const liveCategories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const categories = initialCategories || liveCategories;

  // Tab counts
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense' && !c.isArchived),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income' && !c.isArchived),
    [categories]
  );
  const archivedCategories = useMemo(
    () => categories.filter((c) => Boolean(c.isArchived)),
    [categories]
  );

  const displayedList = useMemo(() => {
    switch (activeTab) {
      case 'expense':
        return [...expenseCategories].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'en-PH'));
      case 'income':
        return [...incomeCategories].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'en-PH'));
      case 'archived':
        return [...archivedCategories].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'en-PH'));
    }
  }, [activeTab, expenseCategories, incomeCategories, archivedCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
    setDeleteError(null);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
    setDeleteError(null);
  };

  const handleArchive = async (categoryId: string) => {
    try {
      await archiveCategory(categoryId, true);
      setDeleteError(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to archive category.');
    }
  };

  const handleRestore = async (categoryId: string) => {
    try {
      await archiveCategory(categoryId, false);
      setDeleteError(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to restore category.');
    }
  };

  const handleDeletePermanent = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      setDeleteError(null);
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete category.');
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Category Manager"
        subtitle="Manage spending categories, income streams, and budget caps"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4" data-testid="category-manager-modal">
          {/* Header Action & Notification */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-stone-600">
              Customize colors, icons, and monthly budgets. Archived categories preserve historical data.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleOpenAdd}
              className="flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-1 stroke-[2.5]" />
              Add Category
            </Button>
          </div>

          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {deleteError}
            </div>
          )}

          {/* Segmented Filter Tabs */}
          <div
            role="tablist"
            aria-label="Category Filters"
            className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-800/15"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'expense'}
              onClick={() => {
                setActiveTab('expense');
                setDeleteError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'expense'
                  ? 'bg-[#111111] text-[#F7F2E8] shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <span>Expense</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-200 text-stone-800 font-mono">
                {expenseCategories.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'income'}
              onClick={() => {
                setActiveTab('income');
                setDeleteError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'income'
                  ? 'bg-[#111111] text-[#F7F2E8] shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <span>Income</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-200 text-stone-800 font-mono">
                {incomeCategories.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'archived'}
              onClick={() => {
                setActiveTab('archived');
                setDeleteError(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'archived'
                  ? 'bg-[#111111] text-[#F7F2E8] shadow-sm'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              <span>Archived</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-stone-200 text-stone-800 font-mono">
                {archivedCategories.length}
              </span>
            </button>
          </div>

          {/* Categories List */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {displayedList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-stone-50 border-2 border-dashed border-stone-800/10 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-stone-600">
                  {activeTab === 'archived'
                    ? 'No archived categories. Inactive categories will appear here.'
                    : `No ${activeTab} categories found.`}
                </p>
                {activeTab !== 'archived' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAdd}
                    className="mt-1"
                  >
                    Create a Category
                  </Button>
                )}
              </div>
            ) : (
              displayedList.map((category) => (
                <div
                  key={category.id}
                  data-testid={`category-row-${category.id}`}
                  className="p-3 bg-white rounded-2xl border border-stone-800/15 flex items-center justify-between gap-3 shadow-sm hover:border-stone-800/30 transition-all"
                >
                  {/* Category Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl border border-stone-800/20 flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: category.color }}
                    >
                      {renderCategoryIcon(category.icon, 'w-5 h-5 text-[#111111]')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-[#111111] truncate">
                          {category.name || 'Unnamed Category'}
                        </span>
                        {category.isDefault && (
                          <StickerBadge variant="butter">Default</StickerBadge>
                        )}
                        {category.isArchived && (
                          <StickerBadge variant="blossom">Archived</StickerBadge>
                        )}
                      </div>
                      {category.type === 'expense' &&
                        typeof category.budgetLimit === 'number' &&
                        category.budgetLimit > 0 && (
                          <span className="inline-block text-[11px] font-mono font-bold text-dark-forest mt-0.5">
                            Limit: {formatPHP(category.budgetLimit)} / mo
                          </span>
                        )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!category.isArchived ? (
                      <>
                        <button
                          type="button"
                          data-testid={`edit-${category.id}`}
                          title="Edit category"
                          aria-label={`Edit ${category.name || 'category'}`}
                          onClick={() => handleOpenEdit(category)}
                          className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          data-testid={`archive-${category.id}`}
                          title="Archive category"
                          aria-label={`Archive ${category.name || 'category'}`}
                          onClick={() => handleArchive(category.id)}
                          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 transition-all cursor-pointer"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          data-testid={`restore-${category.id}`}
                          title="Restore category"
                          aria-label={`Restore ${category.name || 'category'}`}
                          onClick={() => handleRestore(category.id)}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        {!category.isDefault && (
                          <button
                            type="button"
                            data-testid={`delete-${category.id}`}
                            title="Delete category"
                            aria-label={`Delete ${category.name || 'category'}`}
                            onClick={() => handleDeletePermanent(category.id)}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>

      {/* Sub-modal: Category Form */}
      <CategoryFormModal
        isOpen={isFormOpen}
        categoryToEdit={editingCategory}
        defaultType={activeTab === 'income' ? 'income' : 'expense'}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCategory(null);
        }}
      />
    </>
  );
};
