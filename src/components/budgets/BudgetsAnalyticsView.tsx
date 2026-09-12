import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  PieChart as PieChartIcon,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { db } from '../../storage/db';
import type { Category, Transaction } from '../../domain/types';
import {
  calculateCategorySpending,
  calculateBudgetProgress,
} from '../../domain/calculations';
import { formatPHP } from '../../domain/money';
import { BentoCard } from '../ui/BentoCard';
import { StickerBadge } from '../ui/StickerBadge';
import { Button } from '../ui/Button';
import { CategoryBudgetCard } from './CategoryBudgetCard';
import { SpendingBreakdownChart } from './SpendingBreakdownChart';
import { BudgetFormModal } from './BudgetFormModal';

export interface BudgetsAnalyticsViewProps {
  initialCategories?: Category[];
  initialTransactions?: Transaction[];
  currentDate?: Date;
  className?: string;
  onNavigateTab?: (tab: string) => void;
}

/**
 * BudgetsAnalyticsView: Complete Budgets & Visual Spending Analytics view.
 * Features:
 * - Fraunces serif headline and subtitle
 * - Month/Year interactive navigation with Previous, Next, and Today reset
 * - Overall Monthly Budget Progress Hero Bento with total budgeted, total spent, remaining, and status badge
 * - Pure SVG Spending Breakdown Donut Chart with center total and interactive legend
 * - Responsive grid of Category Budget Cards with real-time progress meters
 * - Quick "Set New Budget" action and accessible limit editing modal
 */
export const BudgetsAnalyticsView: React.FC<BudgetsAnalyticsViewProps> = ({
  initialCategories,
  initialTransactions,
  currentDate,
  className = '',
}) => {
  // Reactive Dexie data with optional test prop fallbacks
  const liveCategories = useLiveQuery(() => db.categories.toArray(), []) ?? [];
  const liveTransactions = useLiveQuery(() => db.transactions.toArray(), []) ?? [];

  const categories = initialCategories || liveCategories;
  const transactions = initialTransactions || liveTransactions;

  // Selected date state for month navigation
  const [selectedDate, setSelectedDate] = useState<Date>(() => currentDate || new Date());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>(undefined);

  // Derive target year and 1-indexed month
  const targetYear = selectedDate.getFullYear();
  const targetMonth = selectedDate.getMonth() + 1;

  // Formatted month name display (e.g. "September 2026")
  const monthDisplay = useMemo(() => {
    return selectedDate.toLocaleDateString('en-PH', {
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Filter categories to expenses
  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  // Categories with positive budget limit
  const budgetedCategories = useMemo(() => {
    return expenseCategories.filter(
      (c) => typeof c.budgetLimit === 'number' && c.budgetLimit > 0
    );
  }, [expenseCategories]);

  // Calculate category spending for selected month/year
  const spending = useMemo(() => {
    return calculateCategorySpending(transactions, targetYear, targetMonth);
  }, [transactions, targetYear, targetMonth]);

  // Calculate overall budget metrics
  const { totalBudgeted, totalSpent, overallProgress } = useMemo(() => {
    const totalBudget = budgetedCategories.reduce(
      (sum, c) => sum + (c.budgetLimit || 0),
      0
    );

    // Sum spending across budgeted categories
    const spentAcrossBudgeted = budgetedCategories.reduce((sum, c) => {
      return sum + (spending.get(c.id) ?? 0);
    }, 0);

    const progress = calculateBudgetProgress(totalBudget, spentAcrossBudgeted);

    return {
      totalBudgeted: totalBudget,
      totalSpent: spentAcrossBudgeted,
      overallProgress: progress,
    };
  }, [budgetedCategories, spending]);

  // Overall hero progress bar fill class
  let overallFillClass = 'bg-[#DAE097]';
  if (overallProgress.isOverBudget) {
    overallFillClass = 'bg-[#F2C0CA]';
  } else if (overallProgress.isWarning) {
    overallFillClass = 'bg-[#FFED9E]';
  }

  // Open modal handlers
  const handleOpenNewBudget = () => {
    setEditingCategoryId(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditBudget = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategoryId(undefined);
  };

  return (
    <div
      className={`min-h-full bg-[#F7F2E8] p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto ${className}`}
      data-testid="budgets-analytics-view"
    >
      {/* Top Header & Quick Action */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b-2 border-stone-800/10">
        <div>
          <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#111111] tracking-tight">
            Budgets & Spending Analytics
          </h1>
          <p className="text-xs sm:text-sm font-medium text-stone-600 mt-1">
            Monitor monthly limits, track progress, and analyze category distributions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4 stroke-[2.5]" />}
            onClick={handleOpenNewBudget}
            data-testid="quick-set-budget-btn"
            className="shadow-[3px_3px_0px_0px_#111111]"
          >
            Set Budget
          </Button>
        </div>
      </header>

      {/* Month/Year Navigator Bar */}
      <div className="flex items-center justify-between bg-[#FFFDF9] rounded-2xl border-2 border-stone-800 px-3.5 py-2 shadow-[3px_3px_0px_0px_#111111]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Previous Month"
            data-testid="prev-month-button"
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer select-none active:translate-y-0.5"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next Month"
            data-testid="next-month-button"
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 flex items-center justify-center text-stone-700 transition-colors cursor-pointer select-none active:translate-y-0.5"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="font-serif font-black text-base sm:text-lg text-[#111111] tracking-tight"
            data-testid="current-month-display"
          >
            {monthDisplay}
          </span>
        </div>

        <div>
          <button
            type="button"
            data-testid="today-month-button"
            onClick={handleToday}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-stone-100 hover:bg-[#FFED9E] text-stone-800 border border-stone-800/20 transition-all cursor-pointer select-none active:translate-y-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* Hero Bento: Overall Monthly Budget Progress */}
      <section>
        <BentoCard
          variant="oat"
          sticker={
            <div className="w-10 h-10 rounded-2xl bg-[#FFED9E] border border-stone-800/20 flex items-center justify-center shadow-[1px_1px_0px_0px_#111111]">
              <TrendingDown className="w-5 h-5 text-[#111111]" />
            </div>
          }
          title="Monthly Budget Overview"
          subtitle={`Overall progress across all budgeted categories for ${monthDisplay}`}
          action={
            totalBudgeted > 0 ? (
              overallProgress.isOverBudget ? (
                <StickerBadge
                  variant="blossom"
                  rotation="right"
                  icon={<AlertTriangle className="w-3 h-3 text-[#9E2A3B]" />}
                  data-testid="hero-badge-over"
                >
                  Over Budget
                </StickerBadge>
              ) : overallProgress.isWarning ? (
                <StickerBadge
                  variant="butter"
                  rotation="tilt-left"
                  icon={<AlertCircle className="w-3 h-3 text-[#111111]" />}
                  data-testid="hero-badge-warning"
                >
                  Near Limit
                </StickerBadge>
              ) : (
                <StickerBadge
                  variant="pistachio"
                  rotation="flat"
                  data-testid="hero-badge-safe"
                >
                  On Track
                </StickerBadge>
              )
            ) : null
          }
          className="shadow-[4px_4px_0px_0px_#111111]"
        >
          {totalBudgeted === 0 ? (
            <div className="py-6 text-center space-y-2" data-testid="no-budgets-hero">
              <p className="text-xs text-stone-500 font-medium">
                No monthly budgets set yet. Set spending caps for your categories to view overall budget progress.
              </p>
              <Button
                variant="butter"
                size="sm"
                onClick={handleOpenNewBudget}
                className="mt-2 text-xs font-bold"
              >
                + Set First Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-4 my-2">
              {/* Stat Counters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 pb-2">
                <div className="bg-[#F7F2E8] p-3.5 rounded-2xl border border-stone-800/15 shadow-[1px_1px_0px_0px_#111111]">
                  <span className="text-xs text-stone-500 font-medium block">
                    Total Budgeted
                  </span>
                  <span
                    className="font-serif font-black text-lg sm:text-xl text-stone-900 block mt-0.5"
                    data-testid="hero-total-budgeted"
                  >
                    {formatPHP(totalBudgeted)}
                  </span>
                </div>

                <div className="bg-[#F7F2E8] p-3.5 rounded-2xl border border-stone-800/15 shadow-[1px_1px_0px_0px_#111111]">
                  <span className="text-xs text-stone-500 font-medium block">
                    Total Spent
                  </span>
                  <span
                    className="font-serif font-black text-lg sm:text-xl text-stone-900 block mt-0.5"
                    data-testid="hero-total-spent"
                  >
                    {formatPHP(totalSpent)}
                  </span>
                </div>

                <div className="bg-[#F7F2E8] p-3.5 rounded-2xl border border-stone-800/15 shadow-[1px_1px_0px_0px_#111111]">
                  <span className="text-xs text-stone-500 font-medium block">
                    Remaining
                  </span>
                  <span
                    className={`font-serif font-black text-lg sm:text-xl block mt-0.5 ${
                      overallProgress.remaining < 0
                        ? 'text-[#9E2A3B]'
                        : 'text-[#124224]'
                    }`}
                    data-testid="hero-total-remaining"
                  >
                    {overallProgress.remaining < 0
                      ? `${formatPHP(Math.abs(overallProgress.remaining))} over budget`
                      : `${formatPHP(overallProgress.remaining)} left`}
                  </span>
                </div>
              </div>

              {/* Overall Progress Meter */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-stone-600">Total Budget Consumed</span>
                  <span
                    className="font-mono font-bold text-stone-900"
                    data-testid="hero-total-percentage"
                  >
                    {Math.round(overallProgress.percent)}%
                  </span>
                </div>

                <div
                  className="w-full h-3.5 bg-stone-200/80 rounded-full overflow-hidden border border-stone-800/10"
                  role="progressbar"
                  aria-valuenow={Math.min(100, Math.round(overallProgress.percent))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Overall monthly budget progress"
                >
                  <div
                    className={`h-full transition-all duration-300 ${overallFillClass}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, overallProgress.percent))}%`,
                    }}
                    data-testid="hero-progress-bar-fill"
                  />
                </div>
              </div>
            </div>
          )}
        </BentoCard>
      </section>

      {/* SVG Spending Breakdown Donut Chart Section */}
      <section>
        <SpendingBreakdownChart
          categories={expenseCategories}
          spending={spending}
          monthName={monthDisplay}
          onSelectCategory={(cat) => handleOpenEditBudget(cat)}
        />
      </section>

      {/* Category Budgets Grid / List Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-xl text-[#111111] tracking-tight">
              Category Budgets
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-stone-200 text-xs font-mono font-bold text-stone-700">
              {budgetedCategories.length}
            </span>
          </div>

          {budgetedCategories.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleOpenNewBudget}
              className="text-xs py-1"
            >
              Add Budget
            </Button>
          )}
        </div>

        {budgetedCategories.length === 0 ? (
          <BentoCard
            variant="oat"
            className="py-10 text-center shadow-[3px_3px_0px_0px_#111111]"
            data-testid="no-budgets-empty"
          >
            <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#DAE097] border-2 border-stone-800 flex items-center justify-center shadow-[2px_2px_0px_0px_#111111]">
                <PieChartIcon className="w-7 h-7 text-[#111111]" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#111111]">
                No category budgets set yet
              </h3>
              <p className="text-xs text-stone-600 font-medium leading-relaxed">
                Create monthly budget caps for your expense categories (e.g. Groceries, Dining, Utilities) to keep your personal finances balanced.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenNewBudget}
                icon={<Plus className="w-4 h-4" />}
                className="mt-2 text-xs font-bold"
              >
                Set Category Budget
              </Button>
            </div>
          </BentoCard>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            data-testid="category-budgets-grid"
          >
            {budgetedCategories.map((category) => (
              <CategoryBudgetCard
                key={category.id}
                category={category}
                spent={spending.get(category.id) ?? 0}
                onEditBudget={handleOpenEditBudget}
              />
            ))}
          </div>
        )}
      </section>

      {/* Budget Limit Form Modal */}
      <BudgetFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        categories={expenseCategories.length > 0 ? expenseCategories : categories}
        selectedCategoryId={editingCategoryId}
      />
    </div>
  );
};
