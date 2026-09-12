import React, { useMemo, useState } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import type { Category } from '../../domain/types';
import { roundMoney } from '../../domain/money';
import { formatPHP } from '../../domain/money';
import { BentoCard } from '../ui/BentoCard';
import { renderCategoryIcon } from '../dashboard/iconHelpers';

export interface SpendingBreakdownChartProps {
  categories: Category[];
  spending: Map<string, number>;
  totalExpenses?: number;
  monthName?: string;
  className?: string;
  onSelectCategory?: (category: Category) => void;
}

const PASTEL_PALETTE = [
  '#FFED9E', // Butter Yellow
  '#F2C0CA', // Blossom Pink
  '#DAE097', // Pistachio
  '#A6CFF2', // Sky Blue
  '#FED7AA', // Peach
  '#CCFBF1', // Mint
  '#E9D5FF', // Lavender
  '#FDE68A', // Amber light
];

/**
 * SpendingBreakdownChart: Clean, lightweight SVG spending breakdown:
 * - Pure SVG donut chart with Soft Neo-Brutalism pastel colors
 * - Center display of total expenses for the selected month
 * - Accessible interactive legend displaying category names, percentages, and amounts
 * - Empty state ("No expenses recorded this month") with friendly illustration
 */
export const SpendingBreakdownChart: React.FC<SpendingBreakdownChartProps> = ({
  categories,
  spending,
  totalExpenses,
  monthName,
  className = '',
  onSelectCategory,
}) => {
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);

  // Prepare spending items per category
  const items = useMemo(() => {
    return categories
      .map((cat, index) => {
        const amount = spending.get(cat.id) ?? 0;
        return {
          category: cat,
          amount,
          color: cat.color || PASTEL_PALETTE[index % PASTEL_PALETTE.length],
        };
      })
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [categories, spending]);

  // Determine total expenses
  const computedTotal = useMemo(() => {
    if (typeof totalExpenses === 'number') {
      return totalExpenses;
    }
    return items.reduce((sum, item) => sum + item.amount, 0);
  }, [totalExpenses, items]);

  // Geometry for SVG Donut: Radius 65, center (100, 100), stroke width 22
  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  // Compute SVG circle segments
  const slices = useMemo(() => {
    if (computedTotal <= 0 || items.length === 0) return [];

    let accumulatedOffset = 0;
    return items.map((item) => {
      const fraction = item.amount / computedTotal;
      const strokeLength = fraction * circumference;
      const spaceLength = Math.max(0, circumference - strokeLength);
      const dashoffset = -accumulatedOffset;
      const percentage = roundMoney(fraction * 100);

      accumulatedOffset += strokeLength;

      return {
        ...item,
        fraction,
        percentage,
        strokeDasharray: `${strokeLength} ${spaceLength}`,
        strokeDashoffset: dashoffset,
      };
    });
  }, [items, computedTotal, circumference]);

  const isEmpty = computedTotal <= 0 || items.length === 0;

  return (
    <BentoCard
      variant="oat"
      title="Spending Breakdown"
      subtitle={monthName ? `Expenses for ${monthName}` : 'Monthly expense distribution'}
      className={`shadow-sm ${className}`}
      data-testid="spending-breakdown-card"
    >
      {isEmpty ? (
        <div
          className="py-10 px-4 text-center flex flex-col items-center justify-center space-y-3"
          data-testid="spending-chart-empty"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#FFED9E] border border-stone-800/15 flex items-center justify-center shadow-sm">
            <PieChartIcon className="w-7 h-7 text-[#111111]" />
          </div>
          <h4 className="font-serif font-bold text-base sm:text-lg text-[#111111]">
            No expenses recorded this month
          </h4>
          <p className="text-xs text-stone-600 max-w-sm font-medium leading-relaxed">
            Transactions logged with an expense category will appear here in your visual spending breakdown.
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-6 pt-2">
          {/* SVG Donut Chart with Center Display */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0 flex items-center justify-center">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full transform -rotate-90"
              role="img"
              aria-label={`Spending breakdown chart showing total expenses of ${formatPHP(computedTotal)}`}
              data-testid="spending-breakdown-svg"
            >
              {/* Background ring */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#E7E5E4"
                strokeWidth="22"
              />

              {/* Slices */}
              {slices.map((slice) => {
                const isHovered = hoveredCategoryId === slice.category.id;
                return (
                  <circle
                    key={slice.category.id}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHovered ? 26 : 22}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredCategoryId(slice.category.id)}
                    onMouseLeave={() => setHoveredCategoryId(null)}
                    onClick={() => onSelectCategory?.(slice.category)}
                    data-testid={`donut-slice-${slice.category.id}`}
                  >
                    <title>{`${slice.category.name}: ${formatPHP(slice.amount)} (${slice.percentage}%)`}</title>
                  </circle>
                );
              })}
            </svg>

            {/* Donut Center Display */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-3"
              data-testid="donut-center-display"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600">
                Total Expenses
              </span>
              <span
                className="font-serif font-black text-base sm:text-lg text-[#111111] leading-tight mt-0.5"
                data-testid="total-expenses-display"
              >
                {formatPHP(computedTotal)}
              </span>
              <span className="text-[10px] font-bold text-stone-600 mt-0.5">
                {items.length} {items.length === 1 ? 'category' : 'categories'}
              </span>
            </div>
          </div>

          {/* Interactive Accessible Legend */}
          <div
            className="w-full flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2"
            role="list"
            aria-label="Category spending breakdown legend"
            data-testid="spending-breakdown-legend"
          >
            {slices.map((item) => {
              const isHovered = hoveredCategoryId === item.category.id;
              return (
                <div
                  key={item.category.id}
                  role="listitem"
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    isHovered
                      ? 'bg-stone-100 border-stone-800/40 shadow-sm'
                      : 'bg-stone-50/70 border-stone-800/10 hover:border-stone-800/30'
                  }`}
                  onMouseEnter={() => setHoveredCategoryId(item.category.id)}
                  onMouseLeave={() => setHoveredCategoryId(null)}
                  onClick={() => onSelectCategory?.(item.category)}
                  data-testid={`legend-item-${item.category.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full border border-stone-800/30 flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-stone-700 flex-shrink-0">
                        {renderCategoryIcon(item.category.icon, 'w-3.5 h-3.5')}
                      </span>
                      <span className="font-bold text-xs text-stone-900 truncate" title={item.category.name}>
                        {item.category.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                    <span className="text-[11px] font-mono font-bold text-stone-600">
                      {item.percentage}%
                    </span>
                    <span className="text-xs font-mono font-bold text-stone-900">
                      {formatPHP(item.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </BentoCard>
  );
};
