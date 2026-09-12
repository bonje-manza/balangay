import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'forest'
  | 'butter'
  | 'blossom'
  | 'pistachio'
  | 'sky'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
  children?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#111111] text-[#F7F2E8] border border-stone-900 shadow-sm hover:bg-stone-900 active:shadow-none',
  forest:
    'bg-[#124224] text-[#F7F2E8] border border-[#0d301a] shadow-sm hover:bg-[#0e351d] active:shadow-none',
  butter:
    'bg-[#FFED9E] text-[#111111] border border-amber-300/60 shadow-sm hover:bg-[#ffe67c]',
  blossom:
    'bg-[#F2C0CA] text-[#111111] border border-rose-300/60 shadow-sm hover:bg-[#edb0bd]',
  pistachio:
    'bg-[#DAE097] text-[#111111] border border-stone-400/40 shadow-sm hover:bg-[#d0d786]',
  sky:
    'bg-[#A6CFF2] text-[#111111] border border-sky-300/60 shadow-sm hover:bg-[#92c3ed]',
  outline:
    'bg-transparent text-[#111111] border border-stone-800/30 hover:bg-stone-100/60 shadow-sm',
  ghost:
    'bg-transparent text-[#111111] border border-transparent hover:bg-stone-200/50 shadow-none',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5',
  md: 'px-4 py-2.5 text-sm font-bold rounded-2xl gap-2',
  lg: 'px-6 py-3.5 text-base font-bold rounded-2xl gap-2.5',
  icon: 'p-2.5 rounded-2xl flex items-center justify-center',
};

/**
 * Soft Neo-brutalist Button with tactile offset border and smooth press animation.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconRight,
  isLoading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  ...rest
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center transition-all duration-100 select-none cursor-pointer active:translate-y-0.5 ${
        sizeStyles[size]
      } ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${
        isDisabled
          ? 'opacity-50 cursor-not-allowed pointer-events-none active:translate-y-0 shadow-none'
          : ''
      } ${className}`}
      {...rest}
    >
      {isLoading ? (
        <>
          <Loader2
            className="w-4 h-4 animate-spin flex-shrink-0"
            data-testid="button-spinner"
          />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
          {children && <span>{children}</span>}
          {iconRight && (
            <span className="flex-shrink-0 flex items-center justify-center">{iconRight}</span>
          )}
        </>
      )}
    </button>
  );
};
