import React, { useState, useMemo } from 'react';
import { formatPHP } from '../../domain/money';
import { BarChart3 } from 'lucide-react';

export interface CashFlowBarItem {
  label: string;
  dateKey?: string;
  income: number;
  expense: number;
  net: number;
}

export interface CashFlowBarChartProps {
  mode: 'daily' | 'monthly';
  data: CashFlowBarItem[];
  onSelectBar?: (item: CashFlowBarItem) => void;
  className?: string;
}

export const CashFlowBarChart: React.FC<CashFlowBarChartProps> = ({
  mode,
  data,
  onSelectBar,
  className = '',
}) => {
  const [hoveredItem, setHoveredItem] = useState<CashFlowBarItem | null>(null);

  // Determine if there is any data
  const hasData = useMemo(() => {
    return data.some((d) => d.income > 0 || d.expense > 0);
  }, [data]);

  // Max value for Y scaling
  const maxVal = useMemo(() => {
    const highest = Math.max(
      ...data.map((d) => Math.max(d.income, d.expense)),
      1000
    );
    // Round to next clean step
    const magnitude = Math.pow(10, Math.floor(Math.log10(highest)));
    return Math.ceil(highest / magnitude) * magnitude;
  }, [data]);

  // Chart dimensions (internal SVG space)
  const svgWidth = 800;
  const svgHeight = 260;
  const marginLeft = 55;
  const marginRight = 20;
  const marginTop = 35;
  const marginBottom = 45;

  const chartWidth = svgWidth - marginLeft - marginRight;
  const chartHeight = svgHeight - marginTop - marginBottom;

  const barSlotWidth = data.length > 0 ? chartWidth / data.length : chartWidth;
  const singleBarWidth = Math.max(
    3,
    Math.min(mode === 'daily' ? 8 : 18, barSlotWidth * 0.38)
  );

  return (
    <div
      className={`bg-white rounded-3xl border-2 border-stone-800/15 p-4 sm:p-6 shadow-sm space-y-3 ${className}`}
      data-testid="cashflow-bar-chart"
    >
      {/* Chart Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-800/10">
        <div>
          <h3 className="font-serif font-bold text-base text-[#111111]">
            {mode === 'daily' ? 'Daily Cash Flow Breakdown' : 'Monthly Cash Flow Trajectory'}
          </h3>
          <p className="text-[11px] text-stone-500 font-medium">
            Side-by-side comparison of total inflows and outflows
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#DAE097] border border-stone-800/20" />
            <span className="text-stone-700">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-[#F2C0CA] border border-stone-800/20" />
            <span className="text-stone-700">Expense</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="py-12 text-center flex flex-col items-center justify-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-stone-600">
            No cash flow activity to visualize for this period.
          </p>
          <p className="text-[11px] text-stone-500">
            Recorded expenses and income will appear in this chart.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Hover Tooltip display */}
          {hoveredItem && (
            <div
              data-testid="bar-chart-tooltip"
              className="absolute top-1 left-1/2 -translate-x-1/2 bg-[#111111] text-[#F7F2E8] px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg z-10 pointer-events-none flex items-center gap-2.5 animate-fadeIn"
            >
              <span className="font-bold text-[#FFED9E]">{hoveredItem.label}:</span>
              <span className="text-emerald-300">+{formatPHP(hoveredItem.income)}</span>
              <span className="text-rose-300">-{formatPHP(hoveredItem.expense)}</span>
              <span className="font-mono border-l border-stone-700 pl-2">
                Net: {formatPHP(hoveredItem.net)}
              </span>
            </div>
          )}

          {/* SVG Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[500px]"
              role="img"
              aria-label="Cash Flow Bar Chart"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = marginTop + chartHeight - ratio * chartHeight;
                const valueLabel = Math.round(maxVal * ratio);
                return (
                  <g key={ratio}>
                    <line
                      x1={marginLeft}
                      y1={y}
                      x2={svgWidth - marginRight}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth={1}
                      strokeDasharray={ratio > 0 && ratio < 1 ? '4 4' : undefined}
                    />
                    <text
                      x={marginLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      fontSize="9"
                      fontWeight="600"
                      fill="#9CA3AF"
                    >
                      {valueLabel >= 1000 ? `${Math.round(valueLabel / 1000)}k` : valueLabel}
                    </text>
                  </g>
                );
              })}

              {/* Baseline axis */}
              <line
                x1={marginLeft}
                y1={marginTop + chartHeight}
                x2={svgWidth - marginRight}
                y2={marginTop + chartHeight}
                stroke="#111111"
                strokeWidth={1.5}
              />

              {/* Data Bars */}
              {data.map((item, index) => {
                const slotCenterX = marginLeft + index * barSlotWidth + barSlotWidth / 2;
                const incomeH = maxVal > 0 ? (item.income / maxVal) * chartHeight : 0;
                const expenseH = maxVal > 0 ? (item.expense / maxVal) * chartHeight : 0;

                const incomeX = slotCenterX - singleBarWidth - 1;
                const expenseX = slotCenterX + 1;
                const incomeY = marginTop + chartHeight - incomeH;
                const expenseY = marginTop + chartHeight - expenseH;

                const isHovered = hoveredItem?.label === item.label;

                return (
                  <g
                    key={item.label}
                    data-testid={`bar-group-${item.label}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${item.label}: In ${formatPHP(item.income)}, Out ${formatPHP(item.expense)}`}
                    onClick={() => onSelectBar && onSelectBar(item)}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onFocus={() => setHoveredItem(item)}
                    onBlur={() => setHoveredItem(null)}
                    className="cursor-pointer outline-none group"
                  >
                    {/* Hover column background highlight */}
                    <rect
                      x={slotCenterX - barSlotWidth / 2}
                      y={marginTop}
                      width={barSlotWidth}
                      height={chartHeight}
                      fill={isHovered ? '#FFED9E' : 'transparent'}
                      opacity={0.25}
                      rx={6}
                    />

                    {/* Income Bar */}
                    {incomeH > 0 && (
                      <rect
                        x={incomeX}
                        y={incomeY}
                        width={singleBarWidth}
                        height={incomeH}
                        rx={2}
                        fill="#DAE097"
                        stroke="#111111"
                        strokeWidth={0.75}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Expense Bar */}
                    {expenseH > 0 && (
                      <rect
                        x={expenseX}
                        y={expenseY}
                        width={singleBarWidth}
                        height={expenseH}
                        rx={2}
                        fill="#F2C0CA"
                        stroke="#111111"
                        strokeWidth={0.75}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* X-axis Label */}
                    <text
                      x={slotCenterX}
                      y={marginTop + chartHeight + 16}
                      textAnchor="middle"
                      fontSize={mode === 'daily' ? '8' : '10'}
                      fontWeight={isHovered ? '800' : '600'}
                      fill={isHovered ? '#111111' : '#6B7280'}
                      className="select-none"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
