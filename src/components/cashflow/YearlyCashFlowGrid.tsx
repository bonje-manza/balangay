import React from 'react';
import type { YearlyCashflowSummary } from '../../domain/calculations';
import { BentoCard } from '../ui/BentoCard';
import { AmountDisplay } from '../ui/AmountDisplay';
import { CalendarRange, ArrowDownLeft, ArrowUpRight, ChevronRight } from 'lucide-react';

export interface YearlyCashFlowGridProps {
  year: number;
  yearlySummary: YearlyCashflowSummary;
  onSelectMonth?: (month: number) => void;
  className?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const YearlyCashFlowGrid: React.FC<YearlyCashFlowGridProps> = ({
  year,
  yearlySummary,
  onSelectMonth,
  className = '',
}) => {
  const { months, total } = yearlySummary;

  return (
    <div className={`space-y-5 ${className}`} data-testid="yearly-cashflow-grid">
      {/* Annual Summary Hero */}
      <BentoCard
        variant="oat"
        sticker={
          <div className="w-9 h-9 rounded-2xl bg-[#FFED9E] border border-stone-800/15 flex items-center justify-center shadow-sm">
            <CalendarRange className="w-4 h-4 text-dark-anchor" />
          </div>
        }
        title={`${year} Annual Cash Flow Summary`}
        subtitle="Aggregated inflows, outflows, and net savings for the full year"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 bg-white rounded-2xl border border-stone-800/15 shadow-sm flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-bold text-dark-forest uppercase">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Annual Inflows</span>
            </div>
            <div className="mt-1.5">
              <AmountDisplay amount={total.income} size="md" />
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-stone-800/15 shadow-sm flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Annual Outflows</span>
            </div>
            <div className="mt-1.5">
              <AmountDisplay amount={total.expense} size="md" />
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-2xl border border-stone-800/15 shadow-sm flex flex-col">
            <div className="text-xs font-bold text-stone-600 uppercase">
              <span>Annual Net</span>
            </div>
            <div className="mt-1.5">
              <AmountDisplay amount={total.net} size="md" showSign withPill />
            </div>
          </div>
        </div>
      </BentoCard>

      {/* 12-Month Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {months.map((item) => {
          const monthName = MONTH_NAMES[item.month - 1];
          const hasActivity = item.income > 0 || item.expense > 0;

          return (
            <div
              key={item.month}
              data-testid={`year-month-card-${item.month}`}
              onClick={() => onSelectMonth && onSelectMonth(item.month)}
              className={`p-3.5 rounded-2xl border border-stone-800/15 bg-white flex flex-col justify-between space-y-3 shadow-sm hover:border-stone-800/30 transition-all ${
                onSelectMonth ? 'cursor-pointer hover:-translate-y-0.5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-[#111111]">
                  {monthName}
                </span>
                {onSelectMonth && (
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
                )}
              </div>

              {hasActivity ? (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Inflow:</span>
                    <span className="font-bold text-dark-forest">
                      +{Math.round(item.income).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-stone-600">
                    <span>Outflow:</span>
                    <span className="font-bold text-rose-700">
                      -{Math.round(item.expense).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-500 uppercase">
                      Net:
                    </span>
                    <AmountDisplay amount={item.net} size="sm" showSign withPill />
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-stone-600 font-medium py-2">
                  No activity recorded
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
