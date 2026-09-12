import React from 'react';

export type StickerBadgeVariant = 'butter' | 'blossom' | 'pistachio' | 'sky' | 'dark';
export type StickerBadgeRotation = 'tilt-left' | 'tilt-right' | 'flat' | 'left' | 'right' | 'none';

export interface StickerBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StickerBadgeVariant;
  rotation?: StickerBadgeRotation;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<StickerBadgeVariant, string> = {
  butter: 'bg-[#FFED9E] text-[#111111] border-stone-800/20',
  blossom: 'bg-[#F2C0CA] text-[#111111] border-stone-800/20',
  pistachio: 'bg-[#DAE097] text-[#111111] border-stone-800/20',
  sky: 'bg-[#A6CFF2] text-[#111111] border-stone-800/20',
  dark: 'bg-[#111111] text-[#F7F2E8] border-stone-700/50',
};

const rotationStyles: Record<StickerBadgeRotation, string> = {
  'tilt-left': 'rotate-[-2deg]',
  left: 'rotate-[-2deg]',
  'tilt-right': 'rotate-[2deg]',
  right: 'rotate-[2deg]',
  flat: 'rotate-0',
  none: 'rotate-0',
};

/**
 * StickerBadge: Playful pill badge with crisp borders, pastel fills, and optional slight rotation.
 */
export const StickerBadge: React.FC<StickerBadgeProps> = ({
  variant = 'butter',
  rotation = 'none',
  icon,
  children,
  className = '',
  ...rest
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold tracking-tight transition-transform duration-150 select-none shadow-sm ${variantStyles[variant]} ${rotationStyles[rotation]} ${className}`}
      {...rest}
    >
      {icon && <span className="flex-shrink-0 flex items-center justify-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
