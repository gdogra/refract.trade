/**
 * Real Market Data Providers Integration
 * Supports multiple market data providers with fallback mechanisms
 */

export interface RealTimeQuote {
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
  marketCap?: number
  pe?: number
}

export interface OptionQuote {
  symbol: string
  underlying: string
  strike: number
  expiry: Date
  type: 'call' | 'put'
  bid: number
  ask: number
  last: number
  volume: number
  openInterest: number
  impliedVolatility: number
  delta?: number
  gamma?: number
  theta?: number
  vega?: number
  rho?: number
}

export interface HistoricalData {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketDataProvider {
  name: string
  getQuote(symbol: string): Promise<RealTimeQuote>
  getBatchQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>>
  getHistoricalData(symbol: string, period: string): Promise<HistoricalData[]>
  getOptionChain?(symbol: string, expiry?: string): Promise<OptionQuote[]>
  isConnected(): boolean
  getRateLimit(): { remaining: number; resetTime: Date }
}

/**
 * Alpha Vantage Provider (Free tier: 500 calls/day, 5 calls/minute)
 */
export class AlphaVantageProvider implements MarketDataProvider {
  name = 'Alpha Vantage'
  private apiKey: string
  private baseUrl = 'https://www.alphavantage.co/query'
  private rateLimitRemaining = 500
  private rateLimitReset = new Date(Date.now() + 24 * 60 * 60 * 1000)
  private lastCallTime = 0
  private minCallInterval = 12000 // 12 seconds to stay under 5 calls/minute

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getQuote(symbol: string): Promise<RealTimeQuote> {
    await this.enforceRateLimit()
    
    try {
      const response = await fetch(
        `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`,
        { next: { revalidate: 60 } } // Cache for 1 minute
      )
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage error: ${data['Error Message']}`)
      }
      
      if (data['Note']) {
        throw new Error('Alpha Vantage rate limit exceeded')
      }
      
      const quote = data['Global Quote']
      if (!quote) {
        throw new Error('Invalid response from Alpha Vantage')
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date(),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open'])
      }
    } catch (error) {
      console.error(`Alpha Vantage getQuote error:`, error)
      throw error
    }
  }

  async getBatchQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>> {
    const quotes: Record<string, RealTimeQuote> = {}
    
    // Alpha Vantage doesn't support batch requests, so we need to make individual calls
    for (const symbol of symbols) {
      try {
        quotes[symbol] = await this.getQuote(symbol)
        // Add delay between calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, this.minCallInterval))
      } catch (error) {
        console.error(`Failed to get quote for ${symbol}:`, error)
        // Continue with other symbols
      }
    }
    
    return quotes
  }

  async getHistoricalData(symbol: string, period = '1month'): Promise<HistoricalData[]> {
    await this.enforceRateLimit()
    
    try {
      const response = await fetch(
        `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.apiKey}`,
        { next: { revalidate: 3600 } } // Cache for 1 hour
      )
      
      const data = await response.json()
      
      if (data['Error Message'] || data['Note']) {
        throw new Error('Alpha Vantage API error or rate limit')
      }
      
      const timeSeries = data['Time Series (Daily)']
      if (!timeSeries) {
        throw new Error('No historical data available')
      }

      const historicalData: HistoricalData[] = []
      const dates = Object.keys(timeSeries).sort().reverse().slice(0, 30) // Last 30 days
      
      for (const date of dates) {
        const dayData = timeSeries[date]
        historicalData.push({
          date: new Date(date),
          open: parseFloat(dayData['1. open']),
          high: parseFloat(dayData['2. high']),
          low: parseFloat(dayData['3. low']),
          close: parseFloat(dayData['4. close']),
          volume: parseInt(dayData['5. volume'])
        })
      }
      
      return historicalData
    } catch (error) {
      console.error('Alpha Vantage getHistoricalData error:', error)
      throw error
    }
  }

  isConnected(): boolean {
    return this.rateLimitRemaining > 0
  }

  getRateLimit(): { remaining: number; resetTime: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset
    }
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCallTime
    
    if (timeSinceLastCall < this.minCallInterval) {
      const waitTime = this.minCallInterval - timeSinceLastCall
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    this.lastCallTime = Date.now()
    this.rateLimitRemaining--
  }
}

/**
 * Finnhub Provider (Free tier: 60 calls/minute)
 */
export class FinnhubProvider implements MarketDataProvider {
  name = 'Finnhub'
  private apiKey: string
  private baseUrl = 'https://finnhub.io/api/v1'
  private rateLimitRemaining = 60
  private rateLimitReset = new Date(Date.now() + 60 * 1000)

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getQuote(symbol: string): Promise<RealTimeQuote> {
    try {
      const response = await fetch(
        `${this.baseUrl}/quote?symbol=${symbol}&token=${this.apiKey}`,
        { next: { revalidate: 15 } } // Cache for 15 seconds
      )
      
      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.c) {
        throw new Error('Invalid response from Finnhub')
      }

      return {
        symbol,
        price: data.c, // Current price
        change: data.d, // Change
        changePercent: data.dp, // Change percent
        volume: 0, // Finnhub doesn't provide volume in quote endpoint
        timestamp: new Date(data.t * 1000), // Unix timestamp
        high: data.h, // High price of the day
        low: data.l, // Low price of the day
        open: data.o // Open price of the day
      }
    } catch (error) {
      console.error('Finnhub getQuote error:', error)
      throw error
    }
  }

  async getBatchQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>> {
    const quotes: Record<string, RealTimeQuote> = {}
    
    // Make parallel requests for better performance
    const promises = symbols.map(async symbol => {
      try {
        const quote = await this.getQuote(symbol)
        return { symbol, quote }
      } catch (error) {
        console.error(`Failed to get quote for ${symbol}:`, error)
        return null
      }
    })
    
    const results = await Promise.all(promises)
    
    for (const result of results) {
      if (result) {
        quotes[result.symbol] = result.quote
      }
    }
    
    return quotes
  }

  async getHistoricalData(symbol: string, period = '1month'): Promise<HistoricalData[]> {
    const endDate = Math.floor(Date.now() / 1000)
    const startDate = endDate - (30 * 24 * 60 * 60) // 30 days ago
    
    try {
      const response = await fetch(
        `${this.baseUrl}/stock/candle?symbol=${symbol}&resolution=D&from=${startDate}&to=${endDate}&token=${this.apiKey}`,
        { next: { revalidate: 3600 } }
      )
      
      const data = await response.json()
      
      if (data.s !== 'ok') {
        throw new Error('Finnhub historical data error')
      }

      const historicalData: HistoricalData[] = []
      
      for (let i = 0; i < data.t?.length || 0; i++) {
        historicalData.push({
          date: new Date(data.t[i] * 1000),
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i]
        })
      }
      
      return historicalData.reverse() // Most recent first
    } catch (error) {
      console.error('Finnhub getHistoricalData error:', error)
      throw error
    }
  }

  isConnected(): boolean {
    return this.rateLimitRemaining > 0
  }

  getRateLimit(): { remaining: number; resetTime: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset
    }
  }
}

/**
 * Yahoo Finance Provider (Free, no official API key needed but rate limited)
 */
export class YahooFinanceProvider implements MarketDataProvider {
  name = 'Yahoo Finance'
  private baseUrl = 'https://query1.finance.yahoo.com'
  private rateLimitRemaining = 2000 // Estimated
  private rateLimitReset = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  async getQuote(symbol: string): Promise<RealTimeQuote> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v8/finance/chart/${symbol}`,
        { next: { revalidate: 30 } }
      )
      
      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.chart?.result?.[0]) {
        throw new Error('Invalid response from Yahoo Finance')
      }
      
      const result = data.chart.result[0]
      const meta = result.meta
      const quote = result.indicators?.quote?.[0]
      
      if (!meta || !quote) {
        throw new Error('Incomplete data from Yahoo Finance')
      }

      const lastIndex = quote.close?.length || 0 - 1
      const currentPrice = quote.close[lastIndex]
      const previousClose = meta.previousClose
      
      return {
        symbol: meta.symbol,
        price: currentPrice,
        change: currentPrice - previousClose,
        changePercent: ((currentPrice - previousClose) / previousClose) * 100,
        volume: quote.volume[lastIndex] || 0,
        timestamp: new Date(),
        high: quote.high[lastIndex],
        low: quote.low[lastIndex],
        open: quote.open[lastIndex],
        marketCap: meta.marketCap
      }
    } catch (error) {
      console.error('Yahoo Finance getQuote error:', error)
      throw error
    }
  }

  async getBatchQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>> {
    const quotes: Record<string, RealTimeQuote> = {}
    const symbolsStr = symbols.join(',')
    
    try {
      const response = await fetch(
        `${this.baseUrl}/v7/finance/quote?symbols=${symbolsStr}`,
        { next: { revalidate: 30 } }
      )
      
      const data = await response.json()
      
      if (data.quoteResponse?.result) {
        for (const quote of data.quoteResponse.result) {
          quotes[quote.symbol] = {
            symbol: quote.symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            timestamp: new Date(),
            high: quote.regularMarketDayHigh,
            low: quote.regularMarketDayLow,
            open: quote.regularMarketOpen,
            marketCap: quote.marketCap
          }
        }
      }
      
      return quotes
    } catch (error) {
      console.error('Yahoo Finance getBatchQuotes error:', error)
      
      // Fallback to individual requests
      for (const symbol of symbols) {
        try {
          quotes[symbol] = await this.getQuote(symbol)
        } catch (err) {
          console.error(`Failed to get quote for ${symbol}:`, err)
        }
      }
      
      return quotes
    }
  }

  async getHistoricalData(symbol: string, period = '1month'): Promise<HistoricalData[]> {
    const endDate = Math.floor(Date.now() / 1000)
    const startDate = endDate - (30 * 24 * 60 * 60) // 30 days ago
    
    try {
      const response = await fetch(
        `${this.baseUrl}/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`,
        { next: { revalidate: 3600 } }
      )
      
      const data = await response.json()
      const result = data.chart?.result?.[0]
      
      if (!result) {
        throw new Error('No historical data available')
      }

      const timestamps = result.timestamp || []
      const quote = result.indicators?.quote?.[0] || {}
      const historicalData: HistoricalData[] = []
      
      for (let i = 0; i < timestamps?.length || 0; i++) {
        if (quote.close[i] !== null) {
          historicalData.push({
            date: new Date(timestamps[i] * 1000),
            open: quote.open[i] || 0,
            high: quote.high[i] || 0,
            low: quote.low[i] || 0,
            close: quote.close[i] || 0,
            volume: quote.volume[i] || 0
          })
        }
      }
      
      return historicalData.reverse()
    } catch (error) {
      console.error('Yahoo Finance getHistoricalData error:', error)
      throw error
    }
  }

  isConnected(): boolean {
    return this.rateLimitRemaining > 0
  }

  getRateLimit(): { remaining: number; resetTime: Date } {
    return {
      remaining: this.rateLimitRemaining,
      resetTime: this.rateLimitReset
    }
  }
}

/**
 * Provider Factory
 */
export class MarketDataProviderFactory {
  static createProvider(providerName: string, config: any): MarketDataProvider {
    switch (providerName.toLowerCase()) {
      case 'alpha_vantage':
        return new AlphaVantageProvider(config.apiKey || 'demo')
      
      case 'finnhub':
        return new FinnhubProvider(config.apiKey)
      
      case 'yahoo':
      case 'yahoo_finance':
        return new YahooFinanceProvider()
      
      default:
        throw new Error(`Unknown provider: ${providerName}`)
    }
  }

  static getAvailableProviders(): string[] {
    return ['alpha_vantage', 'finnhub', 'yahoo_finance']
  }
}

/**
 * Multi-Provider Market Data Service with fallbacks
 */
export class MultiProviderMarketDataService {
  private providers: MarketDataProvider[] = []
  private primaryProvider: MarketDataProvider | null = null
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  constructor(providers: MarketDataProvider[]) {
    this.providers = providers
    this.primaryProvider = providers[0] || null
  }

  async getQuote(symbol: string): Promise<RealTimeQuote> {
    const cacheKey = `quote_${symbol}`
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached
    }

    for (const provider of this.providers) {
      try {
        if (!provider.isConnected()) continue
        
        const quote = await provider.getQuote(symbol)
        
        // Cache successful result
        this.setCache(cacheKey, quote, 30000) // 30 seconds
        
        return quote
      } catch (error) {
        console.warn(`Provider ${provider.name} failed for ${symbol}:`, error)
        continue
      }
    }
    
    throw new Error(`All providers failed for symbol: ${symbol}`)
  }

  async getBatchQuotes(symbols: string[]): Promise<Record<string, RealTimeQuote>> {
    const quotes: Record<string, RealTimeQuote> = {}
    const uncachedSymbols: string[] = []
    
    // Check cache first
    for (const symbol of symbols) {
      const cached = this.getFromCache(`quote_${symbol}`)
      if (cached) {
        quotes[symbol] = cached
      } else {
        uncachedSymbols.push(symbol)
      }
    }
    
    if (uncachedSymbols?.length || 0 === 0) {
      return quotes
    }

    // Try providers in order
    for (const provider of this.providers) {
      try {
        if (!provider.isConnected()) continue
        
        const providerQuotes = await provider.getBatchQuotes(uncachedSymbols)
        
        // Cache and merge results
        for (const [symbol, quote] of Object.entries(providerQuotes)) {
          quotes[symbol] = quote
          this.setCache(`quote_${symbol}`, quote, 30000)
        }
        
        return quotes
      } catch (error) {
        console.warn(`Provider ${provider.name} failed for batch quotes:`, error)
        continue
      }
    }
    
    // Fallback to individual requests
    for (const symbol of uncachedSymbols) {
      try {
        quotes[symbol] = await this.getQuote(symbol)
      } catch (error) {
        console.warn(`Failed to get quote for ${symbol}:`, error)
      }
    }
    
    return quotes
  }

  async getHistoricalData(symbol: string, period = '1month'): Promise<HistoricalData[]> {
    const cacheKey = `history_${symbol}_${period}`
    const cached = this.getFromCache(cacheKey)
    
    if (cached) {
      return cached
    }

    for (const provider of this.providers) {
      try {
        if (!provider.isConnected()) continue
        
        const data = await provider.getHistoricalData(symbol, period)
        
        // Cache for 1 hour
        this.setCache(cacheKey, data, 3600000)
        
        return data
      } catch (error) {
        console.warn(`Provider ${provider.name} failed for historical data:`, error)
        continue
      }
    }
    
    throw new Error(`All providers failed for historical data: ${symbol}`)
  }

  getProviderStatus(): Array<{ name: string; connected: boolean; rateLimit: any }> {
    return this.providers.map(provider => ({
      name: provider.name,
      connected: provider.isConnected(),
      rateLimit: provider.getRateLimit()
    }))
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
}