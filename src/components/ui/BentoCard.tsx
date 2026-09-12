import React from 'react';

export type BentoCardVariant = 'oat' | 'butter' | 'blossom' | 'pistachio' | 'sky' | 'dark';

export interface BentoCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: BentoCardVariant;
  sticker?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BentoCardVariant, string> = {
  oat: 'bg-[#FFFDF9] text-[#111111] border-stone-800/15',
  butter: 'bg-[#FFED9E] text-[#111111] border-stone-800/15',
  blossom: 'bg-[#F2C0CA] text-[#111111] border-stone-800/15',
  pistachio: 'bg-[#DAE097] text-[#111111] border-stone-800/15',
  sky: 'bg-[#A6CFF2] text-[#111111] border-stone-800/15',
  dark: 'bg-[#111111] text-[#F7F2E8] border-stone-800/20',
};

/**
 * BentoCard: Flat Soft Neo-brutalist bento card container with generous 24px-32px rounded corners,
 * crisp hairline borders, and zero heavy blur or artificial shadows.
 */
export const BentoCard: React.FC<BentoCardProps> = ({
  variant = 'oat',
  sticker,
  title,
  subtitle,
  action,
  children,
  className = '',
  ...rest
}) => {
  const hasHeader = Boolean(title || subtitle || sticker || action);
  const isDark = variant === 'dark';

  return (
    <div
      className={`rounded-3xl border p-5 sm:p-6 transition-all relative overflow-hidden ${variantStyles[variant]} ${className}`}
      {...rest}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            {sticker && (
              <div className="flex-shrink-0 flex items-center justify-center">
                {sticker}
              </div>
            )}
            <div>
              {title && (
                <h3
                  className={`font-serif font-bold text-lg sm:text-xl tracking-tight leading-snug ${
                    isDark ? 'text-[#F7F2E8]' : 'text-[#111111]'
                  }`}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className={`text-xs sm:text-sm font-medium mt-0.5 ${
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
