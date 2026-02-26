import { useState, useEffect, useCallback } from 'react'

interface UseExpirationDatesState {
  dates: string[]
  loading: boolean
  error: string | null
}

interface UseExpirationDatesReturn extends UseExpirationDatesState {
  nearest: string | null
  monthly: string[]
  weekly: string[]
}

// Cache for expiration dates (they rarely change)
const expirationCache = new Map<string, { dates: string[]; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export function useExpirationDates(symbol?: string): UseExpirationDatesReturn {
  const [state, setState] = useState<UseExpirationDatesState>({
    dates: [],
    loading: false,
    error: null
  })
  
  const fetchExpirationDates = useCallback(async () => {
    if (!symbol) return
    
    // Check cache first
    const cached = expirationCache.get(symbol)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setState({
        dates: cached.dates,
        loading: false,
        error: null
      })
      return
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch(`/api/options/expirations?symbol=${symbol}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      const dates = result.expirations
      
      // Cache the result
      expirationCache.set(symbol, {
        dates,
        timestamp: Date.now()
      })
      
      setState({
        dates,
        loading: false,
        error: null
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch expiration dates'
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }))
    }
  }, [symbol])
  
  useEffect(() => {
    if (symbol) {
      fetchExpirationDates()
    } else {
      setState({
        dates: [],
        loading: false,
        error: null
      })
    }
  }, [fetchExpirationDates])
  
  // Process dates for different categories
  const nearest = state.dates?.length || 0 > 0 ? state.dates[0] : null
  
  const monthly = state.dates.filter(dateStr => {
    const date = new Date(dateStr)
    const dayOfMonth = date.getDate()
    const dayOfWeek = date.getDay() // 0 = Sunday, 5 = Friday
    
    // Third Friday of the month (typically between 15th-21st and is a Friday)
    return dayOfWeek === 5 && dayOfMonth >= 15 && dayOfMonth <= 21
  })
  
  const weekly = state.dates // All dates (including monthlies)
  
  return {
    ...state,
    nearest,
    monthly,
    weekly
  }
}