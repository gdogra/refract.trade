import { useState, useEffect, useCallback, useRef } from 'react'
import { OptionsChain, OptionContract } from '@/lib/options/yahooOptions'

interface UseOptionsChainState {
  data: OptionsChain | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  isStale: boolean
}

interface UseOptionsChainReturn extends UseOptionsChainState {
  refresh: () => Promise<void>
  calls: OptionContract[]
  puts: OptionContract[]
  expirations: string[]
  underlyingPrice: number | null
}

export function useOptionsChain(symbol?: string, expiration?: string): UseOptionsChainReturn {
  const [state, setState] = useState<UseOptionsChainState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
    isStale: false
  })
  
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const staleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const fetchOptionsChain = useCallback(async (isRefresh = false) => {
    if (!symbol) return
    
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const controller = new AbortController()
    abortControllerRef.current = controller
    
    setState(prev => ({ 
      ...prev, 
      loading: !isRefresh, // Don't show loading on refresh if we have data
      error: null 
    }))
    
    try {
      const params = new URLSearchParams({ symbol })
      if (expiration) {
        params.append('expiration', expiration)
      }
      
      const response = await fetch(`/api/options/chain?${params}`, {
        signal: controller.signal
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error)
      }
      
      const now = new Date()
      
      setState(prev => ({
        ...prev,
        data: result.data,
        loading: false,
        error: null,
        lastUpdated: now,
        isStale: false
      }))
      
      // Set up stale indicator after 60 seconds
      if (staleTimeoutRef.current) {
        clearTimeout(staleTimeoutRef.current)
      }
      staleTimeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isStale: true }))
      }, 60000)
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Ignore aborted requests
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch options chain'
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isStale: false
      }))
    }
  }, [symbol, expiration])
  
  const refresh = useCallback(async () => {
    await fetchOptionsChain(true)
  }, [fetchOptionsChain])
  
  // Initial fetch and fetch when symbol/expiration changes
  useEffect(() => {
    if (symbol) {
      fetchOptionsChain()
    } else {
      setState({
        data: null,
        loading: false,
        error: null,
        lastUpdated: null,
        isStale: false
      })
    }
  }, [fetchOptionsChain])
  
  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!symbol || !state.data) return
    
    const setupAutoRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      
      refreshTimeoutRef.current = setTimeout(() => {
        fetchOptionsChain(true) // Silent refresh
        setupAutoRefresh() // Schedule next refresh
      }, 60000)
    }
    
    setupAutoRefresh()
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [symbol, state.data, fetchOptionsChain])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (staleTimeoutRef.current) {
        clearTimeout(staleTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    ...state,
    refresh,
    calls: state.data?.calls ?? [],
    puts: state.data?.puts ?? [],
    expirations: state.data?.expirationDates ?? [],
    underlyingPrice: state.data?.underlyingPrice ?? null
  }
}