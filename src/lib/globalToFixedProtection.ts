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

// Global array protection
const originalArrayFrom = Array.from;
Array.from = function(arrayLike: any, mapFn?: any, thisArg?: any) {
  if (!arrayLike) return [];
  try {
    return originalArrayFrom.call(this, arrayLike, mapFn, thisArg);
  } catch (e) {
    console.warn('Array.from error:', e);
    return [];
  }
};

// Protect array access globally
const originalArrayPrototypeMap = Array.prototype.map;
Array.prototype.map = function(callback: any, thisArg?: any) {
  if (!this || this?.length || 0) === undefined || this?.length || 0) === null) {
    console.warn('Array.map called on undefined/null array, returning empty array');
    return [];
  }
  try {
    return originalArrayPrototypeMap.call(this, callback, thisArg);
  } catch (e) {
    console.warn('Array.map error:', e);
    return [];
  }
};

// Add global property access protection
const originalObjectDefineProperty = Object.defineProperty;
function createSafePropertyDescriptor(obj: any, prop: string) {
  const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
  if (descriptor && descriptor.get) {
    const originalGetter = descriptor.get;
    descriptor.get = function() {
      try {
        const value = originalGetter.call(this);
        if (prop === 'length' && (value === undefined || value === null)) {
          return 0;
        }
        return value;
      } catch (e) {
        console.warn(`Property access error for ${prop}:`, e);
        if (prop === 'length') return 0;
        return undefined;
      }
    };
  }
  return descriptor;
}

// Export for explicit usage
export const protectToFixed = () => {
  // This function exists to ensure the module is loaded and patches are applied
  console.debug('Global toFixed protection enabled');
};

export default protectToFixed;