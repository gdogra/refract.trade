/**
 * Market Data Integration Service
 * Handles real-time market data, options chains, and historical data
 */

import { 
  MarketDataProviderFactory, 
  MultiProviderMarketDataService,
  type RealTimeQuote,
  type HistoricalData as ProviderHistoricalData 
} from './providers/marketDataProviders'

export interface MarketDataPoint {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: Date
  bid?: number
  ask?: number
  high?: number
  low?: number
  open?: number
}

export interface OptionData {
  symbol: string
  expiry: Date
  strike: number
  type: 'call' | 'put'
  bid: number
  ask: number
  lastPrice: number
  volume: number
  openInterest: number
  impliedVolatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  rho: number
  intrinsicValue: number
  timeValue: number
  updated: Date
}

export interface OptionChain {
  symbol: string
  underlyingPrice: number
  expiries: Date[]
  strikes: number[]
  calls: OptionData[]
  puts: OptionData[]
  updated: Date
}

export interface HistoricalDataPoint {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose?: number
}

export interface MarketDataProvider {
  name: string
  isConnected: boolean
  rateLimits: {
    requestsPerMinute: number
    requestsPerDay: number
  }
}

// Mock data for development - replace with real API integration
const MOCK_MARKET_DATA: Record<string, MarketDataPoint> = {
  'AAPL': {
    symbol: 'AAPL',
    price: 190.50,
    change: 2.35,
    changePercent: 1.25,
    volume: 45234567,
    timestamp: new Date(),
    bid: 190.48,
    ask: 190.52,
    high: 192.15,
    low: 188.20,
    open: 189.10
  },
  'TSLA': {
    symbol: 'TSLA',
    price: 250.00,
    change: -5.20,
    changePercent: -2.04,
    volume: 28345123,
    timestamp: new Date(),
    bid: 249.95,
    ask: 250.05,
    high: 255.80,
    low: 248.50,
    open: 254.20
  },
  'MSFT': {
    symbol: 'MSFT',
    price: 380.25,
    change: 1.85,
    changePercent: 0.49,
    volume: 23456789,
    timestamp: new Date(),
    bid: 380.20,
    ask: 380.30,
    high: 382.50,
    low: 378.15,
    open: 379.40
  },
  'GOOGL': {
    symbol: 'GOOGL',
    price: 140.75,
    change: 0.95,
    changePercent: 0.68,
    volume: 18765432,
    timestamp: new Date(),
    bid: 140.70,
    ask: 140.80,
    high: 142.20,
    low: 139.85,
    open: 140.30
  },
  'NVDA': {
    symbol: 'NVDA',
    price: 450.00,
    change: 12.50,
    changePercent: 2.86,
    volume: 34567890,
    timestamp: new Date(),
    bid: 449.85,
    ask: 450.15,
    high: 455.20,
    low: 442.30,
    open: 443.80
  },
  'SPY': {
    symbol: 'SPY',
    price: 485.00,
    change: 1.20,
    changePercent: 0.25,
    volume: 67890123,
    timestamp: new Date(),
    bid: 484.98,
    ask: 485.02,
    high: 486.50,
    low: 483.20,
    open: 484.10
  }
}

class MarketDataService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private subscribers = new Map<string, Set<(data: any) => void>>()
  private websocket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private realDataService: MultiProviderMarketDataService | null = null

  // Configuration
  private config = {
    baseUrl: process.env.NEXT_PUBLIC_MARKET_DATA_URL || 'https://api.polygon.io',
    apiKey: process.env.NEXT_PUBLIC_POLYGON_API_KEY || '',
    wsUrl: process.env.NEXT_PUBLIC_MARKET_DATA_WS || 'wss://socket.polygon.io',
    cacheTTL: 30 * 1000, // 30 seconds default cache
    requestTimeout: 10 * 1000, // 10 seconds timeout
    enableRealData: process.env.NEXT_PUBLIC_ENABLE_REAL_DATA === 'true',
    provider: process.env.NEXT_PUBLIC_MARKET_DATA_PROVIDER || 'alpha_vantage'
  }

  /**
   * Initialize market data connection
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return // Skip SSR
    
    try {
      // Initialize real data providers if enabled
      if (this.config.enableRealData) {
        await this.initializeRealDataProviders()
        console.log('Real market data providers initialized')
      }

      // Connect to WebSocket for real-time data
      await this.connectWebSocket()
      console.log('Market data service initialized')
    } catch (error) {
      console.error('Failed to initialize market data service:', error)
      // Fallback to polling mode
      this.startPollingMode()
    }
  }

  /**
   * Initialize real market data providers
   */
  private async initializeRealDataProviders(): Promise<void> {
    try {
      const providers = []

      // Primary provider (Alpha Vantage) - use demo key if no key provided
      const alphaVantageKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo'
      if (alphaVantageKey) {
        try {
          providers.push(MarketDataProviderFactory.createProvider('alpha_vantage', {
            apiKey: alphaVantageKey
          }))
          console.log('Added Alpha Vantage provider')
        } catch (error) {
          console.warn('Failed to add Alpha Vantage provider:', error)
        }
      }

      // Fallback providers
      if (process.env.FINNHUB_API_KEY) {
        try {
          providers.push(MarketDataProviderFactory.createProvider('finnhub', {
            apiKey: process.env.FINNHUB_API_KEY
          }))
          console.log('Added Finnhub provider')
        } catch (error) {
          console.warn('Failed to add Finnhub provider:', error)
        }
      }

      // Yahoo Finance (no API key needed) - always try to add as ultimate fallback
      try {
        providers.push(MarketDataProviderFactory.createProvider('yahoo_finance', {}))
        console.log('Added Yahoo Finance provider')
      } catch (error) {
        console.warn('Failed to add Yahoo Finance provider:', error)
      }

      if (providers.length > 0) {
        this.realDataService = new MultiProviderMarketDataService(providers)
        console.log(`Initialized ${providers.length} market data providers`)
      } else {
        console.warn('No market data providers could be initialized')
      }
    } catch (error) {
      console.error('Failed to initialize real data providers:', error)
    }
  }

  /**
   * Get current market data for a symbol
   */
  async getMarketData(symbol: string): Promise<MarketDataPoint> {
    const cacheKey = `market_${symbol}`
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached as MarketDataPoint
    }

    try {
      // Try real data providers first if enabled
      if (this.config.enableRealData && this.realDataService) {
        try {
          const realQuote = await this.realDataService.getQuote(symbol)
          const marketData: MarketDataPoint = {
            symbol: realQuote.symbol,
            price: realQuote.price,
            change: realQuote.change,
            changePercent: realQuote.changePercent,
            volume: realQuote.volume,
            timestamp: realQuote.timestamp,
            bid: realQuote.bid,
            ask: realQuote.ask,
            high: realQuote.high,
            low: realQuote.low,
            open: realQuote.open
          }

          this.setCache(cacheKey, marketData, this.config.cacheTTL)
          this.notifySubscribers(`market_${symbol}`, marketData)
          return marketData
        } catch (realDataError) {
          console.warn(`Real data providers failed for ${symbol}:`, realDataError)
          // Fall through to mock data or legacy API
        }
      }

      // Fallback to mock data in development or when real data fails
      const mockData = MOCK_MARKET_DATA[symbol.toUpperCase()]
      if (mockData) {
        this.setCache(cacheKey, mockData, this.config.cacheTTL)
        this.notifySubscribers(`market_${symbol}`, mockData)
        return mockData
      }

      // Legacy API call (Polygon.io) as final fallback
      const response = await this.makeAPICall(`/v2/aggs/ticker/${symbol}/prev`, {
        apikey: this.config.apiKey
      })

      const marketData: MarketDataPoint = {
        symbol,
        price: response.results[0]?.c || 0,
        change: (response.results[0]?.c || 0) - (response.results[0]?.o || 0),
        changePercent: ((response.results[0]?.c || 0) / (response.results[0]?.o || 1) - 1) * 100,
        volume: response.results[0]?.v || 0,
        timestamp: new Date(),
        bid: response.results[0]?.c - 0.01,
        ask: response.results[0]?.c + 0.01,
        high: response.results[0]?.h || 0,
        low: response.results[0]?.l || 0,
        open: response.results[0]?.o || 0
      }

      this.setCache(cacheKey, marketData, this.config.cacheTTL)
      this.notifySubscribers(`market_${symbol}`, marketData)
      return marketData

    } catch (error) {
      console.error(`Failed to fetch market data for ${symbol}:`, error)
      
      // Final fallback to mock data
      const mockData = MOCK_MARKET_DATA[symbol.toUpperCase()]
      if (mockData) {
        return mockData
      }
      
      throw new Error(`Failed to fetch market data for ${symbol}`)
    }
  }

  /**
   * Get option chain for a symbol and expiry
   */
  async getOptionChain(symbol: string, expiry?: string): Promise<OptionChain> {
    const cacheKey = `options_${symbol}_${expiry || 'all'}`
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached as OptionChain
    }

    try {
      // Get underlying price
      const underlyingData = await this.getMarketData(symbol)
      
      // In development, return mock option chain
      if (process.env.NODE_ENV === 'development') {
        const mockChain = this.generateMockOptionChain(symbol, underlyingData.price, expiry)
        this.setCache(cacheKey, mockChain, this.config.cacheTTL * 2) // Cache longer for options
        return mockChain
      }

      // Real API call for options data
      const expiryFilter = expiry ? `&expiry=${expiry}` : ''
      const response = await this.makeAPICall(
        `/v3/reference/options/contracts?underlying_ticker=${symbol}${expiryFilter}&limit=1000`,
        { apikey: this.config.apiKey }
      )

      // Process and format option data
      const optionChain = this.processOptionChainResponse(response, underlyingData.price)
      
      this.setCache(cacheKey, optionChain, this.config.cacheTTL * 2)
      return optionChain

    } catch (error) {
      console.error(`Failed to fetch option chain for ${symbol}:`, error)
      
      // Return mock data as fallback
      const underlyingData = await this.getMarketData(symbol)
      return this.generateMockOptionChain(symbol, underlyingData.price, expiry)
    }
  }

  /**
   * Get historical data for a symbol
   */
  async getHistoricalData(
    symbol: string, 
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day',
    from: string,
    to: string,
    limit: number = 120
  ): Promise<HistoricalDataPoint[]> {
    const cacheKey = `history_${symbol}_${timespan}_${from}_${to}`
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached as HistoricalDataPoint[]
    }

    try {
      const response = await this.makeAPICall(
        `/v2/aggs/ticker/${symbol}/range/1/${timespan}/${from}/${to}`,
        {
          apikey: this.config.apiKey,
          adjusted: 'true',
          sort: 'desc',
          limit
        }
      )

      const historicalData: HistoricalDataPoint[] = (response.results || []).map((bar: any) => ({
        date: new Date(bar.t),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
        adjustedClose: bar.c // Simplified - real implementation would handle splits/dividends
      }))

      // Cache for longer period
      this.setCache(cacheKey, historicalData, this.config.cacheTTL * 10)
      return historicalData

    } catch (error) {
      console.error(`Failed to fetch historical data for ${symbol}:`, error)
      throw new Error(`Failed to fetch historical data for ${symbol}`)
    }
  }

  /**
   * Subscribe to real-time updates for a symbol
   */
  subscribe(symbol: string, callback: (data: MarketDataPoint) => void): () => void {
    const key = `market_${symbol}`
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    
    this.subscribers.get(key)!.add(callback)
    
    // Send current data immediately if available
    const cached = this.getFromCache(key)
    if (cached) {
      callback(cached as MarketDataPoint)
    } else {
      // Fetch current data
      this.getMarketData(symbol).then(callback).catch(console.error)
    }

    // Subscribe to WebSocket updates
    this.subscribeToWebSocket(symbol)
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback)
      if (this.subscribers.get(key)?.size === 0) {
        this.subscribers.delete(key)
        this.unsubscribeFromWebSocket(symbol)
      }
    }
  }

  /**
   * Get multiple symbols' data in batch
   */
  async getBatchMarketData(symbols: string[]): Promise<Record<string, MarketDataPoint>> {
    try {
      // Try real data providers first if enabled
      if (this.config.enableRealData && this.realDataService) {
        try {
          const realQuotes = await this.realDataService.getBatchQuotes(symbols)
          const batchData: Record<string, MarketDataPoint> = {}
          
          for (const [symbol, quote] of Object.entries(realQuotes)) {
            batchData[symbol] = {
              symbol: quote.symbol,
              price: quote.price,
              change: quote.change,
              changePercent: quote.changePercent,
              volume: quote.volume,
              timestamp: quote.timestamp,
              bid: quote.bid,
              ask: quote.ask,
              high: quote.high,
              low: quote.low,
              open: quote.open
            }
            
            // Cache individual results
            this.setCache(`market_${symbol}`, batchData[symbol], this.config.cacheTTL)
            this.notifySubscribers(`market_${symbol}`, batchData[symbol])
          }
          
          return batchData
        } catch (realDataError) {
          console.warn('Real data batch request failed:', realDataError)
          // Fall through to individual requests
        }
      }
    } catch (error) {
      console.warn('Batch request setup failed:', error)
    }

    // Fallback to individual requests
    const promises = symbols.map(symbol => 
      this.getMarketData(symbol).catch(error => {
        console.error(`Failed to fetch data for ${symbol}:`, error)
        return null
      })
    )
    
    const results = await Promise.all(promises)
    const batchData: Record<string, MarketDataPoint> = {}
    
    results.forEach((data, index) => {
      if (data) {
        batchData[symbols[index]] = data
      }
    })
    
    return batchData
  }

  /**
   * Get market data provider status
   */
  getProviderStatus(): Array<{ name: string; connected: boolean; rateLimit: any }> {
    if (this.realDataService) {
      return this.realDataService.getProviderStatus()
    }
    return []
  }

  /**
   * Get service configuration info
   */
  getServiceInfo() {
    return {
      enableRealData: this.config.enableRealData,
      provider: this.config.provider,
      hasRealDataService: !!this.realDataService,
      providerCount: this.realDataService ? this.realDataService.getProviderStatus().length : 0,
      cacheSize: this.cache.size,
      subscriberCount: this.subscribers.size
    }
  }

  /**
   * Calculate implied volatility for an option
   */
  async calculateImpliedVolatility(
    symbol: string,
    strike: number,
    expiry: Date,
    optionType: 'call' | 'put',
    marketPrice: number
  ): Promise<number> {
    try {
      const underlyingData = await this.getMarketData(symbol)
      
      // Use Black-Scholes implied vol calculation
      // This is a simplified implementation - real version would use Newton-Raphson
      const timeToExpiry = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 365)
      const riskFreeRate = 0.05 // 5% default risk-free rate
      
      // Mock calculation - replace with real Black-Scholes solver
      let impliedVol = 0.30 // Start with 30% vol
      
      // In real implementation, iterate to find vol that matches market price
      for (let i = 0; i < 10; i++) {
        // Black-Scholes calculation would go here
        // For now, return a reasonable estimate
        impliedVol = 0.20 + Math.random() * 0.40
      }
      
      return Math.max(0.01, Math.min(2.0, impliedVol))
      
    } catch (error) {
      console.error('Failed to calculate implied volatility:', error)
      return 0.30 // Default 30% vol
    }
  }

  // Private methods

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.websocket = new WebSocket(`${this.config.wsUrl}/stocks`)
        
        this.websocket.onopen = () => {
          console.log('Market data WebSocket connected')
          this.reconnectAttempts = 0
          
          // Authenticate
          this.websocket?.send(JSON.stringify({
            action: 'auth',
            params: this.config.apiKey
          }))
          
          resolve()
        }
        
        this.websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleWebSocketMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
        
        this.websocket.onclose = () => {
          console.log('Market data WebSocket disconnected')
          this.handleWebSocketDisconnect()
        }
        
      } catch (error) {
        reject(error)
      }
    })
  }

  private handleWebSocketMessage(message: any): void {
    if (Array.isArray(message)) {
      message.forEach(msg => {
        if (msg.ev === 'T') { // Trade message
          const marketData: MarketDataPoint = {
            symbol: msg.sym,
            price: msg.p,
            change: 0, // Would need to calculate from previous
            changePercent: 0,
            volume: msg.s,
            timestamp: new Date(msg.t),
            bid: msg.p - 0.01,
            ask: msg.p + 0.01
          }
          
          this.setCache(`market_${msg.sym}`, marketData, this.config.cacheTTL)
          this.notifySubscribers(`market_${msg.sym}`, marketData)
        }
      })
    }
  }

  private handleWebSocketDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connectWebSocket().catch(console.error)
      }, Math.pow(2, this.reconnectAttempts) * 1000) // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached, falling back to polling mode')
      this.startPollingMode()
    }
  }

  private subscribeToWebSocket(symbol: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        action: 'subscribe',
        params: `T.${symbol}`
      }))
    }
  }

  private unsubscribeFromWebSocket(symbol: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        action: 'unsubscribe',
        params: `T.${symbol}`
      }))
    }
  }

  private startPollingMode(): void {
    // Poll for updates every 30 seconds for subscribed symbols
    setInterval(() => {
      this.subscribers.forEach(async (callbacks, key) => {
        if (key.startsWith('market_')) {
          const symbol = key.replace('market_', '')
          try {
            const data = await this.getMarketData(symbol)
            this.notifySubscribers(key, data)
          } catch (error) {
            console.error(`Polling failed for ${symbol}:`, error)
          }
        }
      })
    }, 30000)
  }

  private async makeAPICall(endpoint: string, params: Record<string, any>): Promise<any> {
    const url = new URL(endpoint, this.config.baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString())
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout)

    try {
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private generateMockOptionChain(symbol: string, underlyingPrice: number, expiry?: string): OptionChain {
    const now = new Date()
    const expiries = expiry ? [new Date(expiry)] : [
      new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),    // 1 week
      new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),   // 2 weeks  
      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),   // 1 month
      new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)    // 2 months
    ]

    const strikes: number[] = []
    const stepSize = underlyingPrice > 100 ? 5 : 2.5
    for (let i = -10; i <= 10; i++) {
      strikes.push(Math.round((underlyingPrice + i * stepSize) * 2) / 2)
    }

    const calls: OptionData[] = []
    const puts: OptionData[] = []

    expiries.forEach(exp => {
      strikes.forEach(strike => {
        const timeToExpiry = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365)
        const isCall = true
        const isPut = false
        
        // Mock option prices using rough estimates
        const intrinsicValueCall = Math.max(0, underlyingPrice - strike)
        const intrinsicValuePut = Math.max(0, strike - underlyingPrice)
        const timeValueCall = Math.max(0.01, timeToExpiry * 10 + Math.random() * 5)
        const timeValuePut = Math.max(0.01, timeToExpiry * 10 + Math.random() * 5)
        
        const callPrice = intrinsicValueCall + timeValueCall
        const putPrice = intrinsicValuePut + timeValuePut

        calls.push({
          symbol: `${symbol}${exp.toISOString().slice(2,10).replace(/-/g, '')}C${strike.toString().padStart(8, '0')}`,
          expiry: exp,
          strike,
          type: 'call',
          bid: callPrice - 0.05,
          ask: callPrice + 0.05,
          lastPrice: callPrice,
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: 0.20 + Math.random() * 0.40,
          delta: 0.3 + Math.random() * 0.4,
          gamma: 0.01 + Math.random() * 0.05,
          theta: -(5 + Math.random() * 20),
          vega: 10 + Math.random() * 30,
          rho: 2 + Math.random() * 8,
          intrinsicValue: intrinsicValueCall,
          timeValue: timeValueCall,
          updated: now
        })

        puts.push({
          symbol: `${symbol}${exp.toISOString().slice(2,10).replace(/-/g, '')}P${strike.toString().padStart(8, '0')}`,
          expiry: exp,
          strike,
          type: 'put',
          bid: putPrice - 0.05,
          ask: putPrice + 0.05,
          lastPrice: putPrice,
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: 0.20 + Math.random() * 0.40,
          delta: -(0.3 + Math.random() * 0.4),
          gamma: 0.01 + Math.random() * 0.05,
          theta: -(5 + Math.random() * 20),
          vega: 10 + Math.random() * 30,
          rho: -(2 + Math.random() * 8),
          intrinsicValue: intrinsicValuePut,
          timeValue: timeValuePut,
          updated: now
        })
      })
    })

    return {
      symbol,
      underlyingPrice,
      expiries,
      strikes,
      calls,
      puts,
      updated: now
    }
  }

  private processOptionChainResponse(response: any, underlyingPrice: number): OptionChain {
    // Process real API response into OptionChain format
    // This would vary based on the actual API provider
    return {
      symbol: response.underlying_ticker || '',
      underlyingPrice,
      expiries: [],
      strikes: [],
      calls: [],
      puts: [],
      updated: new Date()
    }
  }

  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private notifySubscribers(key: string, data: any): void {
    this.subscribers.get(key)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('Subscriber callback error:', error)
      }
    })
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService()

// Initialize on client-side
if (typeof window !== 'undefined') {
  marketDataService.initialize().catch(console.error)
}

// Helper functions for common operations
export async function getSymbolPrice(symbol: string): Promise<number> {
  const data = await marketDataService.getMarketData(symbol)
  return data.price
}

export async function getOptionPrice(
  symbol: string,
  strike: number,
  expiry: Date,
  type: 'call' | 'put'
): Promise<number> {
  const chain = await marketDataService.getOptionChain(symbol)
  const options = type === 'call' ? chain.calls : chain.puts
  
  const option = options.find(opt => 
    opt.strike === strike && 
    opt.expiry.getTime() === expiry.getTime()
  )
  
  return option?.lastPrice || 0
}

export function formatMarketData(data: MarketDataPoint): string {
  const changeIndicator = data.change >= 0 ? '+' : ''
  return `${data.symbol}: $${data.price.toFixed(2)} (${changeIndicator}${data.change.toFixed(2)}, ${data.changePercent.toFixed(2)}%)`
}

export function isMarketOpen(): boolean {
  const now = new Date()
  const day = now.getDay() // 0 = Sunday, 6 = Saturday
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 100 + minute

  // Market is closed on weekends
  if (day === 0 || day === 6) return false
  
  // Regular market hours: 9:30 AM - 4:00 PM ET
  return time >= 930 && time <= 1600
}

export function getMarketStatus(): 'pre-market' | 'open' | 'after-hours' | 'closed' {
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  const minute = now.getMinutes()
  const time = hour * 100 + minute

  // Weekend
  if (day === 0 || day === 6) return 'closed'
  
  // Pre-market: 4:00 AM - 9:30 AM ET
  if (time >= 400 && time < 930) return 'pre-market'
  
  // Regular hours: 9:30 AM - 4:00 PM ET
  if (time >= 930 && time <= 1600) return 'open'
  
  // After-hours: 4:00 PM - 8:00 PM ET
  if (time > 1600 && time <= 2000) return 'after-hours'
  
  return 'closed'
}