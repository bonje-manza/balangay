import React from 'react';
import { PieChart, AlertCircle, ArrowUpRight } from 'lucide-react';
import type { Category } from '../../domain/types';
import { calculateBudgetProgress } from '../../domain/calculations';
import { formatPHP } from '../../domain/money';
import { BentoCard } from '../ui/BentoCard';
import { StickerBadge } from '../ui/StickerBadge';
import { renderCategoryIcon } from './iconHelpers';

export interface BudgetQuickMeterProps {
  categories: Category[];
  spending: Map<string, number>;
  onViewBudgets?: () => void;
  className?: string;
}

/**
 * BudgetQuickMeter: Bento card displaying monthly category budget progress meters
 * with Pistachio (<80%), Butter (80-100%), and Blossom (>100%) status fills,
 * and warning sticker badge indicators.
 */
export const BudgetQuickMeter: React.FC<BudgetQuickMeterProps> = ({
  categories,
  spending,
  onViewBudgets,
  className = '',
}) => {
  // Filter categories with a defined positive budget limit
  const budgeted = categories
    .filter((c) => typeof c.budgetLimit === 'number' && c.budgetLimit > 0)
    .map((cat) => {
      const spent = spending.get(cat.id) ?? 0;
      const progress = calculateBudgetProgress(cat.budgetLimit!, spent);
      return {
        category: cat,
        ...progress,
      };
    })
    // Sort descending by percentage to prioritize categories that are over or near budget
    .sort((a, b) => b.percent - a.percent);

  // Determine top-level badge status
  const hasOverBudget = budgeted.some((b) => b.isOverBudget);
  const hasWarning = budgeted.some((b) => b.isWarning);

  const renderStatusBadge = () => {
    if (budgeted.length === 0) return null;

    if (hasOverBudget) {
      return (
        <StickerBadge
          variant="blossom"
          rotation="right"
          icon={<AlertCircle className="w-3 h-3 text-[#9E2A3B]" />}
          data-testid="budget-badge-over"
        >
          Over Budget
        </StickerBadge>
      );
    }

    if (hasWarning) {
      return (
        <StickerBadge
          variant="butter"
          rotation="tilt-left"
          icon={<AlertCircle className="w-3 h-3 text-[#111111]" />}
          data-testid="budget-badge-warning"
        >
          Near Limit
        </StickerBadge>
      );
    }

    return (
      <StickerBadge
        variant="pistachio"
        rotation="flat"
        data-testid="budget-badge-safe"
      >
        On Track
      </StickerBadge>
    );
  };

  return (
    <BentoCard
      variant="oat"
      sticker={
        <div className="w-10 h-10 rounded-2xl bg-[#FFED9E] border border-stone-800/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
          <PieChart className="w-5 h-5 text-[#111111]" />
        </div>
      }
      title="Budget Health"
      subtitle="Monthly category limits"
      action={renderStatusBadge()}
      className={`shadow-[3px_3px_0px_0px_#111111] ${className}`}
      data-testid="budget-quick-meter"
    >
      {budgeted.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-stone-600 italic">
            No category budgets set yet. Set limits in the Budgets tab to track your spending.
          </p>
        </div>
      ) : (
        <div className="space-y-4 my-2" data-testid="budget-meters-list">
          {budgeted.slice(0, 4).map(({ category, limit, spent, remaining, percent, isOverBudget, isWarning }) => {
            // Fill color based on status: Pistachio < 80%, Butter Yellow 80-100%, Blossom Pink > 100%
            let fillClass = 'bg-[#DAE097]';
            if (isOverBudget) {
              fillClass = 'bg-[#F2C0CA]';
            } else if (isWarning) {
              fillClass = 'bg-[#FFED9E]';
            }

            return (
              <div
                key={category.id}
                data-testid={`budget-item-${category.id}`}
                className="space-y-1.5"
              >
                {/* Header: Icon, Name, Percentage & Remaining */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-6 h-6 rounded-lg border border-stone-800/15 flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: category.color || '#FFED9E' }}
                    >
                      {renderCategoryIcon(category.icon, 'w-3 h-3 text-[#111111]')}
                    </div>
                    <span className="font-bold text-[#111111] truncate" title={category.name}>
                      {category.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`font-mono font-bold text-xs ${
                        isOverBudget
                          ? 'text-[#9E2A3B]'
                          : isWarning
                          ? 'text-amber-800'
                          : 'text-[#124224]'
                      }`}
                    >
                      {Math.round(percent)}%
                    </span>
                    <span className="text-[11px] font-medium text-stone-600">
                      {isOverBudget ? (
                        <span className="text-[#9E2A3B] font-semibold">
                          +{formatPHP(Math.abs(remaining))} over
                        </span>
                      ) : (
                        <span>{formatPHP(remaining)} left</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Visual Progress Bar */}
                <div
                  className="w-full h-2.5 bg-stone-200/80 rounded-full overflow-hidden border border-stone-800/10"
                  role="progressbar"
                  aria-valuenow={Math.min(100, Math.round(percent))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`h-full transition-all duration-300 ${fillClass}`}
                    style={{ width: `${Math.min(100, percent)}%` }}
                    data-testid={`budget-bar-fill-${category.id}`}
                  />
                </div>

                {/* Bottom caption: Spent of Limit */}
                <div className="flex items-center justify-between text-[11px] text-stone-600 font-medium">
                  <span>
                    Spent:{' '}
                    <strong className="text-stone-800 font-mono font-semibold">
                      {formatPHP(spent)}
                    </strong>
                  </span>
                  <span>
                    Limit:{' '}
                    <span className="font-mono text-stone-600">{formatPHP(limit)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link to Budgets */}
      {onViewBudgets && (
        <div className="mt-4 pt-3 border-t border-stone-800/10 flex justify-end">
          <button
            type="button"
            onClick={onViewBudgets}
            className="inline-flex items-center gap-1 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
            data-testid="budget-view-all-button"
          >
            <span>Manage Budgets</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </BentoCard>
  );
};
