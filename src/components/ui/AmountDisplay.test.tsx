import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AmountDisplay } from './AmountDisplay';

describe('AmountDisplay Component', () => {
  it('formats PHP currency with ₱ and commas', () => {
    render(<AmountDisplay amount={12450.5} />);
    expect(screen.getByText(/₱12,450\.50/)).toBeInTheDocument();
  });

  it('formats negative amounts correctly', () => {
    render(<AmountDisplay amount={-8900.25} />);
    expect(screen.getByText(/-₱8,900\.25/)).toBeInTheDocument();
  });

  it('formats zero correctly', () => {
    render(<AmountDisplay amount={0} />);
    expect(screen.getByText(/₱0\.00/)).toBeInTheDocument();
  });

  it('applies semantic cashflow coloring for positive income', () => {
    const { container } = render(<AmountDisplay amount={5000} type="income" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('text-[#124224]');
  });

  it('applies semantic cashflow coloring for negative expense', () => {
    const { container } = render(<AmountDisplay amount={-1500} type="expense" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('text-[#9E2A3B]');
  });

  it('applies neutral dark anchor color for neutral value', () => {
    const { container } = render(<AmountDisplay amount={25000} type="neutral" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('text-[#111111]');
  });

  it('automatically detects semantic coloring when type="auto"', () => {
    const { container: pos } = render(<AmountDisplay amount={100} type="auto" />);
    expect((pos.firstElementChild as HTMLElement).className).toContain('text-[#124224]');

    const { container: neg } = render(<AmountDisplay amount={-100} type="auto" />);
    expect((neg.firstElementChild as HTMLElement).className).toContain('text-[#9E2A3B]');

    const { container: zero } = render(<AmountDisplay amount={0} type="auto" />);
    expect((zero.firstElementChild as HTMLElement).className).toContain('text-[#111111]');
  });

  it('applies size classes correctly', () => {
    const { container } = render(<AmountDisplay amount={100} size="hero" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toMatch(/text-4xl|text-5xl/);
    expect(el.className).toContain('tabular-nums');
  });

  it('renders with background pill when withPill is true', () => {
    const { container: incomePill } = render(
      <AmountDisplay amount={100} type="income" withPill />
    );
    expect((incomePill.firstElementChild as HTMLElement).className).toContain('bg-[#DAE097]');

    const { container: expensePill } = render(
      <AmountDisplay amount={-100} type="expense" withPill />
    );
    expect((expensePill.firstElementChild as HTMLElement).className).toContain('bg-[#F2C0CA]');
  });
});
