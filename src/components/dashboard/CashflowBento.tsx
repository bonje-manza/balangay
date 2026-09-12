import React from 'react';
import { TrendingUp, TrendingDown, ArrowDownLeft, Scale } from 'lucide-react';
import type { CashflowSummary } from '../../domain/types';
import { formatPHP } from '../../domain/money';
import { BentoCard } from '../ui/BentoCard';
import { AmountDisplay } from '../ui/AmountDisplay';

export interface CashflowBentoProps {
  cashflow: CashflowSummary;
  monthName?: string;
  className?: string;
}

/**
 * CashflowBento: Bento card displaying monthly cashflow with Pistachio Income,
 * Blossom Expense, Net cashflow summary pill, and savings ratio comparison.
 */
export const CashflowBento: React.FC<CashflowBentoProps> = ({
  cashflow,
  monthName,
  className = '',
}) => {
  const { income, expense, net } = cashflow;

  // Compute savings rate & expense ratio
  const hasCashflow = income > 0 || expense > 0;
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;
  const expenseRatio = income > 0 ? Math.min(100, Math.round((expense / income) * 100)) : 100;

  return (
    <BentoCard
      variant="oat"
      sticker={
        <div className="w-9 h-9 rounded-xl bg-[#DAE097] border border-stone-800/15 flex items-center justify-center shadow-sm">
          <ArrowDownLeft className="w-4 h-4 text-[#124224]" />
        </div>
      }
      title="Monthly Cashflow"
      subtitle={monthName || 'Income vs Expenses'}
      action={
        <div className="flex items-center gap-1.5" data-testid="cashflow-net-pill">
          <span className="text-xs font-bold text-stone-600 hidden sm:inline">Net:</span>
          <AmountDisplay
            amount={net}
            size="sm"
            showSign
            withPill
            data-testid="cashflow-net-amount"
          />
        </div>
      }
      className={className}
      data-testid="cashflow-bento"
    >
      {/* 2-Column Split: Pistachio Income vs Blossom Expense */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-3">
        {/* Income Card */}
        <div
          className="bg-[#DAE097] border border-stone-800/15 rounded-2xl p-4 flex flex-col justify-between"
          data-testid="cashflow-income-card"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#124224]">
              Income
            </span>
            <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-[#124224]" />
            </div>
          </div>
          <div className="mt-1">
            <AmountDisplay
              amount={income}
              type="income"
              size="lg"
              className="font-black !text-[#124224]"
              data-testid="cashflow-income-amount"
            />
          </div>
          <span className="text-[11px] font-semibold text-[#124224]/80 mt-1">
            Total inflow
          </span>
        </div>

        {/* Expense Card */}
        <div
          className="bg-[#F2C0CA] border border-stone-800/15 rounded-2xl p-4 flex flex-col justify-between"
          data-testid="cashflow-expense-card"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#9E2A3B]">
              Expenses
            </span>
            <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center">
              <TrendingDown className="w-3.5 h-3.5 text-[#9E2A3B]" />
            </div>
          </div>
          <div className="mt-1">
            <AmountDisplay
              amount={expense}
              type="expense"
              size="lg"
              className="font-black !text-[#9E2A3B]"
              data-testid="cashflow-expense-amount"
            />
          </div>
          <span className="text-[11px] font-semibold text-[#9E2A3B]/80 mt-1">
            Total outflow
          </span>
        </div>
      </div>

      {/* Ratio / Comparison Footer */}
      <div className="mt-4 pt-3.5 border-t border-stone-800/10">
        {!hasCashflow ? (
          <div className="flex items-center gap-2 text-xs font-medium text-stone-600 italic py-1">
            <Scale className="w-4 h-4 text-stone-500" />
            <span>No cashflow recorded yet for this period.</span>
          </div>
        ) : income > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                <span>Savings Rate:</span>
                <span
                  className={`font-black ${
                    savingsRate >= 20
                      ? 'text-[#124224]'
                      : savingsRate >= 0
                      ? 'text-stone-800'
                      : 'text-[#9E2A3B]'
                  }`}
                >
                  {savingsRate}%
                </span>
              </span>
              <span className="text-stone-600 font-medium text-[11px]">
                {expenseRatio}% spent
              </span>
            </div>

            {/* Visual ratio bar */}
            <div
              className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden flex border border-stone-800/10"
              role="progressbar"
              aria-valuenow={Math.max(0, savingsRate)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-[#F2C0CA] h-full transition-all duration-300"
                style={{ width: `${Math.min(100, expenseRatio)}%` }}
                title={`Spent: ${expenseRatio}%`}
              />
              {savingsRate > 0 && (
                <div
                  className="bg-[#DAE097] h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, savingsRate)}%` }}
                  title={`Saved: ${savingsRate}%`}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-600">
              Outflow with no recorded income:
            </span>
            <span className="font-bold text-[#9E2A3B]">{formatPHP(expense)}</span>
          </div>
        )}
      </div>
    </BentoCard>
  );
};
