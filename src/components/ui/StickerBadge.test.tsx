import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StickerBadge, StickerBadgeVariant } from './StickerBadge';

describe('StickerBadge Component', () => {
  it('renders children with icon prefix', () => {
    render(
      <StickerBadge icon={<span data-testid="badge-icon">★</span>}>
        <span>Featured</span>
      </StickerBadge>
    );

    expect(screen.getByText('Featured')).toBeInTheDocument();
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  it.each([
    ['butter', 'bg-[#FFED9E]'],
    ['blossom', 'bg-[#F2C0CA]'],
    ['pistachio', 'bg-[#DAE097]'],
    ['sky', 'bg-[#A6CFF2]'],
    ['dark', 'bg-[#111111]'],
  ] as [StickerBadgeVariant, string][])(
    'applies correct styling for variant %s',
    (variant, expectedClass) => {
      const { container } = render(
        <StickerBadge variant={variant}>Badge</StickerBadge>
      );
      const badge = container.firstElementChild as HTMLElement;
      expect(badge.className).toContain(expectedClass);
      expect(badge.className).toContain('rounded-full');
    }
  );

  it('renders flat without rotation tilts', () => {
    const { container: leftContainer } = render(
      <StickerBadge rotation="tilt-left">Left Tilt</StickerBadge>
    );
    expect((leftContainer.firstElementChild as HTMLElement).className).toContain('rotate-0');

    const { container: rightContainer } = render(
      <StickerBadge rotation="tilt-right">Right Tilt</StickerBadge>
    );
    expect((rightContainer.firstElementChild as HTMLElement).className).toContain('rotate-0');

    const { container: flatContainer } = render(
      <StickerBadge rotation="flat">Flat</StickerBadge>
    );
    expect((flatContainer.firstElementChild as HTMLElement).className).toContain('rotate-0');
  });
});
