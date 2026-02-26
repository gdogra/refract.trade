/**
 * Safe numeric formatting utilities to prevent undefined.toFixed() errors
 */

/**
 * Safely format a number with toFixed, handling undefined/null/NaN values
 */
export const safeToFixed = (value: number | undefined | null, precision: number = 2): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return precision === 0 ? '0' : '0.' + '0'.repeat(precision);
  }
  return value.toFixed(precision);
};

/**
 * Safely format a percentage with % symbol
 */
export const safePercentage = (value: number | undefined | null, precision: number = 1): string => {
  return safeToFixed(value, precision) + '%';
};

/**
 * Safely format currency with $ symbol
 */
export const safeCurrency = (value: number | undefined | null, precision: number = 2): string => {
  return '$' + safeToFixed(value, precision);
};

/**
 * Safely format a number with K/M/B suffixes
 */
export const safeFormatLarge = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) {
    return '$0';
  }
  
  if (value >= 1e12) return `$${safeToFixed(value / 1e12, 2)}T`;
  if (value >= 1e9) return `$${safeToFixed(value / 1e9, 2)}B`;
  if (value >= 1e6) return `$${safeToFixed(value / 1e6, 1)}M`;
  if (value >= 1e3) return `$${safeToFixed(value / 1e3, 1)}K`;
  return `$${value.toLocaleString()}`;
};

/**
 * Safely format change with +/- prefix
 */
export const safeChangeFormat = (change: number | undefined | null, changePercent: number | undefined | null): string => {
  const changeVal = change || 0;
  const percentVal = changePercent || 0;
  const sign = changeVal >= 0 ? '+' : '';
  return `${sign}${safeToFixed(changeVal, 2)} (${sign}${safeToFixed(percentVal, 2)}%)`;
};

/**
 * Safely format Greeks values
 */
export const safeGreeks = {
  delta: (value: number | undefined | null) => safeToFixed(value, 3),
  gamma: (value: number | undefined | null) => safeToFixed(value, 4),
  theta: (value: number | undefined | null) => safeToFixed(value, 2),
  vega: (value: number | undefined | null) => safeToFixed(value, 2),
  rho: (value: number | undefined | null) => safeToFixed(value, 4),
  iv: (value: number | undefined | null) => safePercentage((value || 0) * 100, 1)
};

/**
 * Safe division that returns 0 for invalid operations
 */
export const safeDivide = (numerator: number | undefined | null, denominator: number | undefined | null): number => {
  if (!numerator || !denominator || denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
    return 0;
  }
  return numerator / denominator;
};

/**
 * Safe multiplication that returns 0 for invalid operations
 */
export const safeMultiply = (a: number | undefined | null, b: number | undefined | null): number => {
  if (a === undefined || a === null || b === undefined || b === null || isNaN(a) || isNaN(b)) {
    return 0;
  }
  return a * b;
};

/**
 * Validate if a value is a safe number for calculations
 */
export const isSafeNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};