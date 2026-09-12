import React from 'react';

export interface StickerIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * ✦ SparkleStar: 4-point playful sparkle star with neo-brutalist crisp curves.
 */
export const SparkleStar: React.FC<StickerIconProps> = ({
  size = 24,
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 1.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    data-testid="sticker-sparkle-star"
    className={className}
    {...props}
  >
    <polygon points="12,2 14.8,9.2 22,12 14.8,14.8 12,22 9.2,14.8 2,12 9.2,9.2" />
  </svg>
);

/**
 * ✹ Starburst: Irregular joyful multi-point sticker burst.
 */
export const Starburst: React.FC<StickerIconProps> = ({
  size = 24,
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 1.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    data-testid="sticker-starburst"
    className={className}
    {...props}
  >
    <polygon points="12,2 14.8,7.2 21,5 17.5,11 22,15.5 16,17 15.5,22.5 11.5,17.8 6.5,21.5 7.8,15.5 2,12 7.5,8.5" />
  </svg>
);

/**
 * 🖤 PuffyHeart: Soft, chubby rounded playful heart with crisp outline.
 */
export const PuffyHeart: React.FC<StickerIconProps> = ({
  size = 24,
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 1.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    data-testid="sticker-puffy-heart"
    className={className}
    {...props}
  >
    <path d="M12 21.2C11.6 21.2 11.25 21.05 10.95 20.8C7.2 17.4 2 12.8 2 8.5C2 5.4 4.4 3 7.5 3C9.4 3 11.1 4 12 5.5C12.9 4 14.6 3 16.5 3C19.6 3 22 5.4 22 8.5C22 12.8 16.8 17.4 13.05 20.8C12.75 21.05 12.4 21.2 12 21.2Z" />
  </svg>
);

/**
 * 🌸 PetalBadge: Flower-petal radial scalloped badge sticker.
 */
export const PetalBadge: React.FC<StickerIconProps> = ({
  size = 24,
  className = '',
  fill = 'currentColor',
  stroke = 'currentColor',
  strokeWidth = 1.5,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    data-testid="sticker-petal-badge"
    className={className}
    {...props}
  >
    <path d="M12 3C13.8 3 15 4.5 15.6 5.8C17.2 5.3 18.9 6 19.6 7.5C20.3 9.1 19.8 10.9 18.8 12C19.8 13.1 20.3 14.9 19.6 16.5C18.9 18 17.2 18.7 15.6 18.2C15 19.5 13.8 21 12 21C10.2 21 9 19.5 8.4 18.2C6.8 18.7 5.1 18 4.4 16.5C3.7 14.9 4.2 13.1 5.2 12C4.2 10.9 3.7 9.1 4.4 7.5C5.1 6 6.8 5.3 8.4 5.8C9 4.5 10.2 3 12 3Z" />
    <circle cx="12" cy="12" r="2.5" fill="none" stroke={stroke} strokeWidth={strokeWidth} />
  </svg>
);
