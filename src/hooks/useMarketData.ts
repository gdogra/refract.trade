'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { marketDataService, type MarketDataPoint, type OptionChain } from '@/lib/marketData'

// Custom hook for fetching and subscribing to market data
export function useMarketData(symbol: string | null) {
  const [data, setData] = useState<MarketDataPoint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const fetchData = useCallback(async (sym: string) => {
    if (!sym) return
    
    setLoading(true)
    setError(null)
    
    try {
      const marketData = await marketDataService.getMarketData(sym)
      setData(marketData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!symbol) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    // Subscribe to real-time updates
    unsubscribeRef.current = marketDataService.subscribe(symbol, (marketData) => {
      setData(marketData)
      setLoading(false)
      setError(null)
    })

    // Initial fetch
    fetchData(symbol)

    // Cleanup on unmount or symbol change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [symbol, fetchData])

  const refresh = useCallback(() => {
    if (symbol) {
      fetchData(symbol)
    }
  }, [symbol, fetchData])

  return { data, loading, error, refresh }
}

// Hook for batch market data
export function useBatchMarketData(symbols: string[]) {
  const [data, setData] = useState<Record<string, MarketDataPoint>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBatchData = useCallback(async () => {
    if (symbols.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const batchData = await marketDataService.getBatchMarketData(symbols)
      setData(batchData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batch market data')
      setData({})
    } finally {
      setLoading(false)
    }
  }, [symbols])

  useEffect(() => {
    fetchBatchData()
  }, [fetchBatchData])

  const refresh = useCallback(() => {
    fetchBatchData()
  }, [fetchBatchData])

  return { data, loading, error, refresh }
}

// Hook for option chain data
export function useOptionChain(symbol: string | null, expiry?: string) {
  const [data, setData] = useState<OptionChain | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOptionChain = useCallback(async (sym: string, exp?: string) => {
    setLoading(true)
    setError(null)

    try {
      const optionChain = await marketDataService.getOptionChain(sym, exp)
      setData(optionChain)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch option chain')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!symbol) {
      setData(null)
      setError(null)
      setLoading(false)
      return
    }

    fetchOptionChain(symbol, expiry)
  }, [symbol, expiry, fetchOptionChain])

  const refresh = useCallback(() => {
    if (symbol) {
      fetchOptionChain(symbol, expiry)
    }
  }, [symbol, expiry, fetchOptionChain])

  return { data, loading, error, refresh }
}

// Hook for historical data with caching
export function useHistoricalData(
  symbol: string | null,
  timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day',
  days: number = 30
) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistoricalData = useCallback(async () => {
    if (!symbol) return

    setLoading(true)
    setError(null)

    try {
      const to = new Date().toISOString().split('T')[0]
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]

      const historicalData = await marketDataService.getHistoricalData(
        symbol,
        timespan,
        from,
        to,
        Math.min(days * 24, 1000) // Reasonable limit
      )

      setData(historicalData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch historical data')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [symbol, timespan, days])

  useEffect(() => {
    fetchHistoricalData()
  }, [fetchHistoricalData])

  const refresh = useCallback(() => {
    fetchHistoricalData()
  }, [fetchHistoricalData])

  return { data, loading, error, refresh }
}

// Hook for real-time price updates with throttling
export function useRealTimePrice(symbol: string | null, throttleMs: number = 1000) {
  const [price, setPrice] = useState<number | null>(null)
  const [change, setChange] = useState<number>(0)
  const [changePercent, setChangePercent] = useState<number>(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const throttleRef = useRef<NodeJS.Timeout | null>(null)

  const updatePrice = useCallback((data: MarketDataPoint) => {
    // Throttle updates
    if (throttleRef.current) {
      clearTimeout(throttleRef.current)
    }

    throttleRef.current = setTimeout(() => {
      setPrice(data.price)
      setChange(data.change)
      setChangePercent(data.changePercent)
      setLastUpdate(data.timestamp)
    }, throttleMs)
  }, [throttleMs])

  useEffect(() => {
    if (!symbol) {
      setPrice(null)
      setChange(0)
      setChangePercent(0)
      setLastUpdate(null)
      return
    }

    const unsubscribe = marketDataService.subscribe(symbol, updatePrice)

    return () => {
      unsubscribe()
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }
    }
  }, [symbol, updatePrice])

  return { price, change, changePercent, lastUpdate }
}

// Hook for market status
export function useMarketStatus() {
  const [status, setStatus] = useState<'pre-market' | 'open' | 'after-hours' | 'closed'>('closed')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const now = new Date()
      const day = now.getDay()
      const hour = now.getHours()
      const minute = now.getMinutes()
      const time = hour * 100 + minute

      let newStatus: 'pre-market' | 'open' | 'after-hours' | 'closed' = 'closed'

      // Weekend
      if (day === 0 || day === 6) {
        newStatus = 'closed'
      }
      // Pre-market: 4:00 AM - 9:30 AM ET
      else if (time >= 400 && time < 930) {
        newStatus = 'pre-market'
      }
      // Regular hours: 9:30 AM - 4:00 PM ET
      else if (time >= 930 && time <= 1600) {
        newStatus = 'open'
      }
      // After-hours: 4:00 PM - 8:00 PM ET
      else if (time > 1600 && time <= 2000) {
        newStatus = 'after-hours'
      }

      setStatus(newStatus)
      setIsOpen(newStatus === 'open')
    }

    // Update immediately
    updateStatus()

    // Update every minute
    const interval = setInterval(updateStatus, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return { status, isOpen }
}

// Hook for portfolio market values
export function usePortfolioMarketData(positions: Array<{ symbol: string; quantity: number }>) {
  const symbols = Array.from(new Set(positions.map(p => p.symbol))) // Remove duplicates
  const { data: marketData, loading, error } = useBatchMarketData(symbols)

  const portfolioValue = Object.entries(marketData).reduce((total, [symbol, data]) => {
    const position = positions.find(p => p.symbol === symbol)
    if (position) {
      total += data.price * Math.abs(position.quantity) * 100 // Options multiplier
    }
    return total
  }, 0)

  const totalChange = Object.entries(marketData).reduce((total, [symbol, data]) => {
    const position = positions.find(p => p.symbol === symbol)
    if (position) {
      total += data.change * Math.abs(position.quantity) * 100
    }
    return total
  }, 0)

  const totalChangePercent = portfolioValue > 0 ? (totalChange / portfolioValue) * 100 : 0

  return {
    marketData,
    portfolioValue,
    totalChange,
    totalChangePercent,
    loading,
    error
  }
}

// Hook for options Greeks real-time updates
export function useOptionsGreeks(
  symbol: string | null,
  strike: number,
  expiry: Date | null,
  type: 'call' | 'put'
) {
  const [greeks, setGreeks] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol || !expiry) {
      setGreeks(null)
      return
    }

    setLoading(true)

    const calculateGreeks = async () => {
      try {
        // Get current market data
        const marketData = await marketDataService.getMarketData(symbol)
        
        // Get option chain to find current option price
        const optionChain = await marketDataService.getOptionChain(symbol)
        const options = type === 'call' ? optionChain.calls : optionChain.puts
        
        const option = options.find(opt => 
          opt.strike === strike && 
          Math.abs(opt.expiry.getTime() - expiry.getTime()) < 24 * 60 * 60 * 1000 // Within 1 day
        )

        if (option) {
          setGreeks({
            delta: option.delta,
            gamma: option.gamma,
            theta: option.theta,
            vega: option.vega,
            rho: option.rho,
            impliedVolatility: option.impliedVolatility,
            price: option.lastPrice
          })
        }

        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate Greeks')
        setGreeks(null)
      } finally {
        setLoading(false)
      }
    }

    calculateGreeks()

    // Subscribe to updates for the underlying
    const unsubscribe = marketDataService.subscribe(symbol, () => {
      calculateGreeks() // Recalculate when underlying moves
    })

    return unsubscribe
  }, [symbol, strike, expiry, type])

  return { greeks, loading, error }
}