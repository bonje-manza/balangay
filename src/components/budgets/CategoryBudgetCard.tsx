import React from 'react';
import { AlertCircle, AlertTriangle, SlidersHorizontal } from 'lucide-react';
import type { Category } from '../../domain/types';
import { calculateBudgetProgress } from '../../domain/calculations';
import { formatPHP } from '../../domain/money';
import { BentoCard } from '../ui/BentoCard';
import { StickerBadge } from '../ui/StickerBadge';
import { Button } from '../ui/Button';
import { renderCategoryIcon } from '../dashboard/iconHelpers';

export interface CategoryBudgetCardProps {
  category: Category;
  spent: number;
  limit?: number;
  onEditBudget: (category: Category) => void;
  className?: string;
}

/**
 * CategoryBudgetCard: Bento card for a single category budget displaying:
 * - Category icon with pastel fill and category name
 * - Formatted spent amount (formatPHP(spent)) and budget limit (formatPHP(limit))
 * - Dynamic progress bar (<80% Pistachio, 80-100% Butter Yellow, >100% Blossom Pink)
 * - Remaining amount (e.g. ₱2,450.00 left or ₱500.00 over budget)
 * - Status sticker badges ("On Track", "Near Limit", "Over Budget")
 * - "Edit Budget" action button
 */
export const CategoryBudgetCard: React.FC<CategoryBudgetCardProps> = ({
  category,
  spent,
  limit: customLimit,
  onEditBudget,
  className = '',
}) => {
  const budgetLimit = customLimit ?? category.budgetLimit ?? 0;
  const progress = calculateBudgetProgress(budgetLimit, spent);
  const { limit, remaining, percent, isWarning, isOverBudget } = progress;

  // Progress bar fill class and status badge variant
  let fillClass = 'bg-[#DAE097]';
  if (isOverBudget) {
    fillClass = 'bg-[#F2C0CA]';
  } else if (isWarning) {
    fillClass = 'bg-[#FFED9E]';
  }

  const renderStatusBadge = () => {
    if (isOverBudget) {
      return (
        <StickerBadge
          variant="blossom"
          rotation="none"
          icon={<AlertTriangle className="w-3 h-3 text-[#9E2A3B]" />}
          data-testid={`budget-badge-over-${category.id}`}
        >
          Over Budget
        </StickerBadge>
      );
    }

    if (isWarning) {
      return (
        <StickerBadge
          variant="butter"
          rotation="none"
          icon={<AlertCircle className="w-3 h-3 text-[#111111]" />}
          data-testid={`budget-badge-warning-${category.id}`}
        >
          Near Limit
        </StickerBadge>
      );
    }

    return (
      <StickerBadge
        variant="pistachio"
        rotation="none"
        data-testid={`budget-badge-safe-${category.id}`}
      >
        On Track
      </StickerBadge>
    );
  };

  return (
    <BentoCard
      variant="oat"
      sticker={
        <div
          className="w-10 h-10 rounded-2xl border border-stone-800/15 flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ backgroundColor: category.color || '#FFED9E' }}
        >
          {renderCategoryIcon(category.icon, 'w-5 h-5 text-[#111111]')}
        </div>
      }
      title={category.name}
      action={renderStatusBadge()}
      className={`shadow-sm ${className}`}
      data-testid={`category-budget-card-${category.id}`}
    >
      <div className="space-y-3.5 mt-2">
        {/* Progress Bar and Percentage */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-stone-600">Progress</span>
            <span
              className={`font-mono font-bold ${
                isOverBudget
                  ? 'text-[#9E2A3B]'
                  : isWarning
                  ? 'text-amber-800'
                  : 'text-[#124224]'
              }`}
            >
              {Math.round(percent)}%
            </span>
          </div>

          <div
            className="w-full h-3 bg-stone-200/80 rounded-full overflow-hidden border border-stone-800/10"
            role="progressbar"
            aria-valuenow={Math.min(100, Math.round(percent))}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${category.name} budget progress`}
          >
            <div
              className={`h-full transition-all duration-300 ${fillClass}`}
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              data-testid={`budget-bar-fill-${category.id}`}
            />
          </div>
        </div>

        {/* Financial Details: Spent, Limit, and Remaining */}
        <div className="grid grid-cols-2 gap-2 pt-1 pb-1 text-xs border-y border-stone-800/10">
          <div>
            <span className="text-stone-500 font-medium block">Spent</span>
            <span className="font-mono font-bold text-stone-900 text-sm">
              {formatPHP(spent)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-stone-500 font-medium block">Budget Limit</span>
            <span className="font-mono font-bold text-stone-800 text-sm">
              {formatPHP(limit)}
            </span>
          </div>
        </div>

        {/* Remaining amount caption & Edit Action */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="text-xs">
            {remaining < 0 ? (
              <span className="font-bold text-[#9E2A3B]" data-testid={`budget-remaining-${category.id}`}>
                {formatPHP(Math.abs(remaining))} over budget
              </span>
            ) : (
              <span className="font-bold text-[#124224]" data-testid={`budget-remaining-${category.id}`}>
                {formatPHP(remaining)} left
              </span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditBudget(category)}
            icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            data-testid={`edit-budget-btn-${category.id}`}
            className="text-xs py-1 px-2.5 h-8 font-bold"
          >
            Edit Budget
          </Button>
        </div>
      </div>
    </BentoCard>
  );
};
