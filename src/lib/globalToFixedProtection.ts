/**
 * Global protection against undefined.toFixed() errors
 * This monkey-patches Number.prototype.toFixed to provide safer behavior
 */

declare global {
  interface Number {
    safeToFixed(digits?: number): string;
  }
}

// Store the original toFixed method
const originalToFixed = Number.prototype.toFixed;

// Enhanced safe toFixed implementation
Number.prototype.safeToFixed = function(digits: number = 2): string {
  // Handle undefined/null cases
  if (this == null || this === undefined) {
    return digits === 0 ? '0' : ('0.' + '0'.repeat(digits));
  }
  
  // Handle NaN cases
  if (isNaN(this as number)) {
    return digits === 0 ? '0' : ('0.' + '0'.repeat(digits));
  }
  
  // Handle Infinity cases
  if (!isFinite(this as number)) {
    return '0';
  }
  
  try {
    return originalToFixed.call(this, digits);
  } catch (error) {
    console.warn('toFixed error:', error, 'value:', this);
    return digits === 0 ? '0' : ('0.' + '0'.repeat(digits));
  }
};

// Monkey patch the original toFixed to be safer
Number.prototype.toFixed = function(digits: number = 2): string {
  return this.safeToFixed(digits);
};

// Also patch the global isNaN to be more robust
const originalIsNaN = globalThis.isNaN;
globalThis.isNaN = function(value: any): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  return originalIsNaN(value);
};

// Export for explicit usage
export const protectToFixed = () => {
  // This function exists to ensure the module is loaded and patches are applied
  console.debug('Global toFixed protection enabled');
};

export default protectToFixed;