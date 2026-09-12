import React from 'react';
import { formatPHP, FormatPHPOptions } from '../../domain/money';

export type AmountType = 'income' | 'expense' | 'neutral' | 'auto';
export type AmountScale = 'sm' | 'md' | 'lg' | 'xl' | 'hero';

export interface AmountDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number;
  type?: AmountType;
  size?: AmountScale;
  showSign?: boolean;
  hideSymbol?: boolean;
  withPill?: boolean;
  className?: string;
}

const scaleStyles: Record<AmountScale, string> = {
  sm: 'text-sm font-semibold tracking-tight',
  md: 'text-base sm:text-lg font-bold tracking-tight',
  lg: 'text-xl sm:text-2xl font-bold tracking-tight',
  xl: 'text-2xl sm:text-3xl font-extrabold tracking-tight',
  hero: 'text-4xl sm:text-5xl font-black tracking-tight',
};

/**
 * AmountDisplay: High-clarity currency display with tabular numbers,
 * scalable sizing, and semantic neo-brutalist cashflow coloring.
 */
export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  type = 'auto',
  size = 'md',
  showSign,
  hideSymbol = false,
  withPill = false,
  className = '',
  ...rest
}) => {
  // Resolve effective cashflow type
  let resolvedType: 'income' | 'expense' | 'neutral' = 'neutral';
  if (type === 'auto') {
    if (amount > 0) resolvedType = 'income';
    else if (amount < 0) resolvedType = 'expense';
    else resolvedType = 'neutral';
  } else {
    resolvedType = type;
  }

  // Determine text color and optional pill styling
  let colorClass = 'text-[#111111]';
  let pillClass = '';

  if (resolvedType === 'income') {
    colorClass = 'text-[#124224]';
    pillClass = withPill ? 'bg-[#DAE097] border border-stone-800/15 px-2.5 py-0.5 rounded-full' : '';
  } else if (resolvedType === 'expense') {
    colorClass = 'text-[#9E2A3B]';
    pillClass = withPill ? 'bg-[#F2C0CA] border border-stone-800/15 px-2.5 py-0.5 rounded-full' : '';
  } else {
    colorClass = 'text-[#111111]';
    pillClass = withPill ? 'bg-white/80 border border-stone-800/15 px-2.5 py-0.5 rounded-full' : '';
  }

  const options: FormatPHPOptions = {
    showSign,
    hideSymbol,
  };

  const formattedValue = formatPHP(amount, options);

  return (
    <span
      className={`inline-flex items-baseline tabular-nums font-mono ${scaleStyles[size]} ${colorClass} ${pillClass} ${className}`}
      {...rest}
    >
      {formattedValue}
    </span>
  );
};
