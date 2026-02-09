import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Format percentage
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

// Format number with commas
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

// Get time until expiration in days
export function getDaysToExpiry(expiryDate: Date): number {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Calculate time value (fraction of year)
export function getTimeToExpiry(expiryDate: Date): number {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - now.getTime()
  return diffTime / (1000 * 60 * 60 * 24 * 365)
}

// Determine if option is ITM
export function isInTheMoney(
  optionType: 'call' | 'put',
  strike: number,
  currentPrice: number
): boolean {
  if (optionType === 'call') {
    return currentPrice > strike
  } else {
    return currentPrice < strike
  }
}

// Get option moneyness
export function getMoneyness(
  optionType: 'call' | 'put',
  strike: number,
  currentPrice: number
): 'ITM' | 'OTM' | 'ATM' {
  const threshold = 0.01 // 1% threshold for ATM
  
  if (Math.abs(currentPrice - strike) / currentPrice < threshold) {
    return 'ATM'
  }
  
  return isInTheMoney(optionType, strike, currentPrice) ? 'ITM' : 'OTM'
}

// Color coding for P&L
export function getPnLColor(value: number): string {
  if (value > 0) return 'text-green-600'
  if (value < 0) return 'text-red-600'
  return 'text-gray-600'
}

// Color coding for Greeks
export function getGreekColor(greek: string, value: number): string {
  switch (greek) {
    case 'delta':
      return value > 0 ? 'text-green-600' : 'text-red-600'
    case 'gamma':
      return value > 0.1 ? 'text-orange-600' : 'text-gray-600'
    case 'theta':
      return value < -10 ? 'text-red-600' : 'text-yellow-600'
    case 'vega':
      return value > 20 ? 'text-purple-600' : 'text-gray-600'
    default:
      return 'text-gray-600'
  }
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Local storage helpers
export function setLocalStorage(key: string, value: any): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value))
  }
}

export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key)
    if (item) {
      try {
        return JSON.parse(item)
      } catch {
        return defaultValue
      }
    }
  }
  return defaultValue
}

// API error handling
export function handleApiError(error: any): string {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

// Validation helpers
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidSymbol(symbol: string): boolean {
  const symbolRegex = /^[A-Z]{1,5}$/
  return symbolRegex.test(symbol.toUpperCase())
}

// Risk level helpers
export function getRiskLevel(
  value: number,
  thresholds: { low: number; medium: number }
): 'low' | 'medium' | 'high' {
  if (Math.abs(value) <= thresholds.low) return 'low'
  if (Math.abs(value) <= thresholds.medium) return 'medium'
  return 'high'
}

export function getRiskColor(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'low': return 'text-green-600 bg-green-100'
    case 'medium': return 'text-yellow-600 bg-yellow-100'
    case 'high': return 'text-red-600 bg-red-100'
  }
}