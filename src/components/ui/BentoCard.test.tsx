import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BentoCard, BentoCardVariant } from './BentoCard';
import { SparkleStar } from './StickerIcons';

describe('BentoCard Component', () => {
  it('renders title, subtitle, sticker badge, and child content', () => {
    render(
      <BentoCard
        title="Monthly Budget"
        subtitle="Tracking spending limits"
        sticker={<SparkleStar data-testid="card-sticker" />}
        action={<button data-testid="card-action">View</button>}
      >
        <div data-testid="card-child">Children Content Here</div>
      </BentoCard>
    );

    expect(screen.getByText('Monthly Budget')).toBeInTheDocument();
    expect(screen.getByText('Tracking spending limits')).toBeInTheDocument();
    expect(screen.getByTestId('card-sticker')).toBeInTheDocument();
    expect(screen.getByTestId('card-action')).toBeInTheDocument();
    expect(screen.getByTestId('card-child')).toBeInTheDocument();
  });

  it('renders only children when title and subtitle are omitted', () => {
    render(
      <BentoCard>
        <p>Simple content</p>
      </BentoCard>
    );

    expect(screen.getByText('Simple content')).toBeInTheDocument();
  });

  it.each([
    ['oat', 'bg-[#FFFDF9]'],
    ['butter', 'bg-[#FFED9E]'],
    ['blossom', 'bg-[#F2C0CA]'],
    ['pistachio', 'bg-[#DAE097]'],
    ['sky', 'bg-[#A6CFF2]'],
    ['dark', 'bg-[#111111]'],
  ] as [BentoCardVariant, string][])(
    'applies correct pastel variant style for %s',
    (variant, expectedClass) => {
      const { container } = render(
        <BentoCard variant={variant}>
          <span>Content</span>
        </BentoCard>
      );

      const card = container.firstElementChild as HTMLElement;
      expect(card.className).toContain(expectedClass);
      expect(card.className).toContain('rounded-3xl');
      expect(card.className).toMatch(/border-stone-800\/15|border-stone-900\/12|border-stone-800\/20/);
    }
  );

  it('merges custom className cleanly', () => {
    const { container } = render(
      <BentoCard className="custom-class col-span-2">
        <span>Merged</span>
      </BentoCard>
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('custom-class');
    expect(card.className).toContain('col-span-2');
  });
});
