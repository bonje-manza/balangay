/**
 * Money rounding and currency formatting engine for the Philippine Peso (PHP, ₱).
 */

export interface FormatPHPOptions {
  showSign?: boolean;
  hideSymbol?: boolean;
}

/**
 * Rounds an amount to 2 decimal places using half-up rounding,
 * resolving IEEE 754 floating-point inaccuracies and preventing negative zero.
 */
export function roundMoney(amount: number): number {
  if (amount === 0 || Object.is(amount, -0)) {
    return 0;
  }
  const sign = amount < 0 ? -1 : 1;
  const absAmount = Math.abs(amount);
  const rounded = sign * (Math.round((absAmount + Number.EPSILON) * 100) / 100);
  return rounded === 0 ? 0 : rounded;
}

/**
 * Formats a monetary amount into Philippine Peso representation using en-PH locale formatting.
 *
 * @param amount - The numeric monetary value to format.
 * @param options - Formatting options:
 *   - showSign: whether to show '+' for positive numbers (defaults to auto where only '-' is shown)
 *   - hideSymbol: whether to omit the '₱' currency symbol
 * @returns Formatted currency string (e.g. "₱12,450.50", "-₱500.00", "+₱12,450.50", "12,450.50")
 */
export function formatPHP(amount: number, options?: FormatPHPOptions): string {
  const normalized = roundMoney(amount);
  const signDisplay = options?.showSign ? 'exceptZero' : 'auto';

  if (options?.hideSymbol) {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay,
    }).format(normalized);
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    signDisplay,
  }).format(normalized);
}
