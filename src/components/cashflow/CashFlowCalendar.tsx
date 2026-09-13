import React, { useMemo } from 'react';
import type { CashflowSummary } from '../../domain/types';
import { formatPHP } from '../../domain/money';

export interface CashFlowCalendarProps {
  year: number;
  month: number; // 1-indexed (1 to 12)
  dailyCashflow: Map<string, CashflowSummary>;
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void;
  className?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CashFlowCalendar: React.FC<CashFlowCalendarProps> = ({
  year,
  month,
  dailyCashflow,
  selectedDate,
  onSelectDate,
  className = '',
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Compute total days in month & starting weekday
  const { daysInMonth, startWeekday } = useMemo(() => {
    const days = new Date(year, month, 0).getDate();
    const start = new Date(year, month - 1, 1).getDay();
    return { daysInMonth: days, startWeekday: start };
  }, [year, month]);

  // Calendar cells array (padding + days)
  const calendarDays = useMemo(() => {
    const items: Array<{
      dayNumber: number;
      dateKey: string;
      isPadding: boolean;
    }> = [];

    // Leading padding cells
    for (let i = 0; i < startWeekday; i++) {
      items.push({
        dayNumber: 0,
        dateKey: `pad-start-${i}`,
        isPadding: true,
      });
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      items.push({
        dayNumber: day,
        dateKey,
        isPadding: false,
      });
    }

    return items;
  }, [year, month, daysInMonth, startWeekday]);

  return (
    <div
      className={`bg-white rounded-3xl border-2 border-stone-800/15 p-3 sm:p-5 shadow-sm ${className}`}
      data-testid="cash-flow-calendar"
    >
      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            className="text-center text-[10px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider py-1 select-none"
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        role="grid"
        aria-label="Monthly Cash Flow Calendar"
        className="grid grid-cols-7 gap-1 sm:gap-2"
      >
        {calendarDays.map((item) => {
          if (item.isPadding) {
            return (
              <div
                key={item.dateKey}
                aria-hidden="true"
                className="min-h-[52px] sm:min-h-[72px] rounded-2xl bg-stone-50/50 border border-transparent select-none opacity-40"
              />
            );
          }

          const { dayNumber, dateKey } = item;
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === todayStr;
          const cf = dailyCashflow.get(dateKey);
          const hasIncome = Boolean(cf && cf.income > 0);
          const hasExpense = Boolean(cf && cf.expense > 0);

          return (
            <button
              key={dateKey}
              type="button"
              role="gridcell"
              data-testid={`calendar-day-${dateKey}`}
              aria-selected={isSelected}
              aria-label={`${dateKey}${
                cf ? `, Income: ${formatPHP(cf.income)}, Expense: ${formatPHP(cf.expense)}` : ''
              }`}
              onClick={() => onSelectDate(dateKey)}
              className={`min-h-[52px] sm:min-h-[72px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left select-none relative ${
                isSelected
                  ? 'border-2 border-[#111111] bg-[#FFED9E]/40 shadow-sm ring-2 ring-[#111111]/20 -translate-y-0.5'
                  : 'border-stone-800/10 hover:border-stone-800/30 hover:bg-stone-50 bg-white'
              }`}
            >
              {/* Day Number and Today Indicator */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs sm:text-sm font-bold leading-none ${
                    isSelected ? 'text-dark-anchor font-black' : 'text-stone-700'
                  }`}
                >
                  {dayNumber}
                </span>
                {isToday && (
                  <span
                    title="Today"
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#124224] ring-2 ring-emerald-200"
                  />
                )}
              </div>

              {/* Cashflow Indicators / Badges */}
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {hasIncome && (
                  <div
                    data-testid="day-income-dot"
                    title={`Income: ${formatPHP(cf!.income)}`}
                    className="flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-full bg-[#DAE097] border border-stone-800/15 text-[9px] font-bold text-dark-forest shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-dark-forest hidden sm:inline-block" />
                    <span className="truncate max-w-[38px] sm:max-w-[48px] text-[8px] sm:text-[9px]">
                      +{Math.round(cf!.income)}
                    </span>
                  </div>
                )}
                {hasExpense && (
                  <div
                    data-testid="day-expense-dot"
                    title={`Expense: ${formatPHP(cf!.expense)}`}
                    className="flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded-full bg-[#F2C0CA] border border-stone-800/15 text-[9px] font-bold text-rose-900 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-900 hidden sm:inline-block" />
                    <span className="truncate max-w-[38px] sm:max-w-[48px] text-[8px] sm:text-[9px]">
                      -{Math.round(cf!.expense)}
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
