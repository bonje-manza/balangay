import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SparkleStar, Starburst, PuffyHeart, PetalBadge } from './StickerIcons';

describe('StickerIcons Component', () => {
  it('renders SparkleStar with default and custom props', () => {
    const { rerender } = render(<SparkleStar />);
    const icon = screen.getByTestId('sticker-sparkle-star');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '24');

    rerender(<SparkleStar size={32} className="custom-sparkle" />);
    expect(icon).toHaveAttribute('width', '32');
    expect(icon).toHaveClass('custom-sparkle');
  });

  it('renders Starburst correctly', () => {
    render(<Starburst size={28} />);
    const icon = screen.getByTestId('sticker-starburst');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '28');
  });

  it('renders PuffyHeart correctly', () => {
    render(<PuffyHeart size={20} />);
    const icon = screen.getByTestId('sticker-puffy-heart');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '20');
  });

  it('renders PetalBadge correctly', () => {
    render(<PetalBadge size={26} />);
    const icon = screen.getByTestId('sticker-petal-badge');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('width', '26');
  });
});
