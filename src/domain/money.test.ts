import { describe, it, expect } from 'vitest';
import { roundMoney, formatPHP } from './money';

describe('roundMoney', () => {
  it('preserves exact integer amounts', () => {
    expect(roundMoney(100)).toBe(100);
    expect(roundMoney(0)).toBe(0);
  });

  it('preserves 2 decimal place numbers', () => {
    expect(roundMoney(12.34)).toBe(12.34);
    expect(roundMoney(99.99)).toBe(99.99);
  });

  it('rounds half up at the third decimal place', () => {
    expect(roundMoney(12.345)).toBe(12.35);
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it('rounds down when third decimal is less than 5', () => {
    expect(roundMoney(12.344)).toBe(12.34);
    expect(roundMoney(1.004)).toBe(1.00);
  });

  it('resolves floating point precision errors', () => {
    // 0.1 + 0.2 is 0.30000000000000004 in IEEE 754
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    // 1.05 + 0.05 is 1.1000000000000001
    expect(roundMoney(1.05 + 0.05)).toBe(1.1);
  });

  it('correctly handles negative numbers with symmetrical half-up rounding', () => {
    expect(roundMoney(-12.345)).toBe(-12.35);
    expect(roundMoney(-1.005)).toBe(-1.01);
    expect(roundMoney(-12.344)).toBe(-12.34);
    expect(roundMoney(-500)).toBe(-500);
  });

  it('normalizes negative zero to positive zero', () => {
    const result = roundMoney(-0);
    expect(result).toBe(0);
    expect(Object.is(result, -0)).toBe(false);
  });

  it('rounds sub-cent dust amounts to 0 without negative zero', () => {
    const pos = roundMoney(0.0001);
    const neg = roundMoney(-0.0001);
    expect(pos).toBe(0);
    expect(neg).toBe(0);
    expect(Object.is(neg, -0)).toBe(false);
  });

  it('handles large financial numbers accurately', () => {
    expect(roundMoney(1000000.999)).toBe(1000001);
    expect(roundMoney(987654321.123)).toBe(987654321.12);
  });
});

describe('formatPHP', () => {
  it('formats positive amount with PHP currency symbol and commas', () => {
    expect(formatPHP(12450.5)).toBe('₱12,450.50');
    expect(formatPHP(1000000)).toBe('₱1,000,000.00');
    expect(formatPHP(5)).toBe('₱5.00');
  });

  it('formats zero as ₱0.00', () => {
    expect(formatPHP(0)).toBe('₱0.00');
    expect(formatPHP(-0)).toBe('₱0.00');
  });

  it('formats negative amounts with a leading minus sign', () => {
    expect(formatPHP(-500)).toBe('-₱500.00');
    expect(formatPHP(-12450.5)).toBe('-₱12,450.50');
  });

  it('rounds fractional amounts before formatting', () => {
    expect(formatPHP(12.345)).toBe('₱12.35');
    expect(formatPHP(0.1 + 0.2)).toBe('₱0.30');
    expect(formatPHP(-0.001)).toBe('₱0.00');
  });

  describe('options', () => {
    it('shows plus sign for positive numbers when showSign is true', () => {
      expect(formatPHP(12450.5, { showSign: true })).toBe('+₱12,450.50');
      expect(formatPHP(500, { showSign: true })).toBe('+₱500.00');
    });

    it('shows minus sign for negative numbers when showSign is true', () => {
      expect(formatPHP(-500, { showSign: true })).toBe('-₱500.00');
    });

    it('does not show sign for zero even when showSign is true', () => {
      expect(formatPHP(0, { showSign: true })).toBe('₱0.00');
      expect(formatPHP(-0, { showSign: true })).toBe('₱0.00');
    });

    it('hides currency symbol when hideSymbol is true', () => {
      expect(formatPHP(12450.5, { hideSymbol: true })).toBe('12,450.50');
      expect(formatPHP(-500, { hideSymbol: true })).toBe('-500.00');
      expect(formatPHP(0, { hideSymbol: true })).toBe('0.00');
    });

    it('supports both hideSymbol and showSign together', () => {
      expect(formatPHP(12450.5, { hideSymbol: true, showSign: true })).toBe('+12,450.50');
      expect(formatPHP(-500, { hideSymbol: true, showSign: true })).toBe('-500.00');
      expect(formatPHP(0, { hideSymbol: true, showSign: true })).toBe('0.00');
    });
  });
});
