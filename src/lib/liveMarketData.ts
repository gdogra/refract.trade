// Live market data integration with multiple providers
interface MarketDataProvider {
  name: string
  fetchStock: (symbol: string) => Promise<StockQuote>
  fetchOptions?: (symbol: string, expiry?: string) => Promise<OptionsChain>
  fetchQuote: (symbols: string[]) => Promise<StockQuote[]>
  rateLimits: {
    requestsPerSecond: number
    requestsPerDay: number
  }
  apiKey?: string
}

interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: number
}

interface OptionsData {
  symbol: string
  strike: number
  expiry: string
  type: 'call' | 'put'
  bid: number
  ask: number
  lastPrice: number
  volume: number
  openInterest: number
  impliedVolatility: number
  delta?: number
  gamma?: number
  theta?: number
  vega?: number
}

interface OptionsChain {
  symbol: string
  expiries: string[]
  chains: {
    [expiry: string]: {
      calls: OptionsData[]
      puts: OptionsData[]
    }
  }
}

// Alpha Vantage Provider (Free tier: 25 requests/day, 5/minute)
class AlphaVantageProvider implements MarketDataProvider {
  name = 'AlphaVantage'
  rateLimits = { requestsPerSecond: 0.083, requestsPerDay: 25 }
  apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async fetchStock(symbol: string): Promise<StockQuote> {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`
    
    try {
      const response = await fetch(url)
      const data = await response.json()
      
      if (data['Error Message'] || data['Note']) {
        throw new Error(data['Error Message'] || 'API limit reached')
      }

      const quote = data['Global Quote']
      if (!quote) {
        throw new Error('No data returned')
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close']),
        timestamp: Date.now()
      }
    } catch (error) {
      console.error(`AlphaVantage error for ${symbol}:`, error)
      throw error
    }
  }

  async fetchQuote(symbols: string[]): Promise<StockQuote[]> {
    // Alpha Vantage doesn't support batch quotes, so we fetch individually
    // This is rate-limited, so use sparingly
    const results: StockQuote[] = []
    
    for (const symbol of symbols.slice(0, 5)) { // Limit to 5 to avoid hitting rate limits
      try {
        const quote = await this.fetchStock(symbol)
        results.push(quote)
        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1200)) // 5 requests per minute = 12s between requests
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error)
      }
    }
    
    return results
  }
}

// Yahoo Finance (unofficial API - higher rate limits but less reliable)
class YahooFinanceProvider implements MarketDataProvider {
  name = 'YahooFinance'
  rateLimits = { requestsPerSecond: 10, requestsPerDay: 10000 }

  async fetchStock(symbol: string): Promise<StockQuote> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      const result = data.chart.result[0]
      
      if (!result) {
        throw new Error('No data returned')
      }

      const meta = result.meta
      const quote = result.indicators.quote[0]
      
      return {
        symbol: meta.symbol,
        price: meta.regularMarketPrice || meta.previousClose,
        change: (meta.regularMarketPrice || meta.previousClose) - meta.previousClose,
        changePercent: ((meta.regularMarketPrice || meta.previousClose) - meta.previousClose) / meta.previousClose * 100,
        volume: meta.regularMarketVolume || 0,
        high: meta.regularMarketDayHigh || meta.previousClose,
        low: meta.regularMarketDayLow || meta.previousClose,
        open: quote.open?.[quote.open.length - 1] || meta.previousClose,
        previousClose: meta.previousClose,
        marketCap: meta.marketCap,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error(`Yahoo Finance error for ${symbol}:`, error)
      throw error
    }
  }

  async fetchQuote(symbols: string[]): Promise<StockQuote[]> {
    const symbolString = symbols.join(',')
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolString}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      const data = await response.json()
      const quotes = data.quoteResponse.result
      
      return quotes.map((quote: any) => ({
        symbol: quote.symbol,
        price: quote.regularMarketPrice || quote.previousClose,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        high: quote.regularMarketDayHigh || quote.previousClose,
        low: quote.regularMarketDayLow || quote.previousClose,
        open: quote.regularMarketOpen || quote.previousClose,
        previousClose: quote.previousClose,
        marketCap: quote.marketCap,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Yahoo Finance batch error:', error)
      return []
    }
  }

  async fetchOptions(symbol: string, expiry?: string): Promise<OptionsChain> {
    const url = expiry 
      ? `https://query2.finance.yahoo.com/v7/finance/options/${symbol}?date=${Math.floor(new Date(expiry).getTime() / 1000)}`
      : `https://query2.finance.yahoo.com/v7/finance/options/${symbol}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      const data = await response.json()
      const result = data.optionChain.result[0]
      
      if (!result) {
        throw new Error('No options data')
      }

      const chains: any = {}
      
      result.options.forEach((option: any) => {
        const expiryDate = new Date(option.expirationDate * 1000).toISOString().split('T')[0]
        
        chains[expiryDate] = {
          calls: option.calls?.map((call: any) => ({
            symbol: call.contractSymbol,
            strike: call.strike,
            expiry: expiryDate,
            type: 'call' as const,
            bid: call.bid || 0,
            ask: call.ask || 0,
            lastPrice: call.lastPrice || 0,
            volume: call.volume || 0,
            openInterest: call.openInterest || 0,
            impliedVolatility: call.impliedVolatility || 0
          })) || [],
          puts: option.puts?.map((put: any) => ({
            symbol: put.contractSymbol,
            strike: put.strike,
            expiry: expiryDate,
            type: 'put' as const,
            bid: put.bid || 0,
            ask: put.ask || 0,
            lastPrice: put.lastPrice || 0,
            volume: put.volume || 0,
            openInterest: put.openInterest || 0,
            impliedVolatility: put.impliedVolatility || 0
          })) || []
        }
      })

      return {
        symbol: result.underlyingSymbol,
        expiries: result.expirationDates.map((date: number) => 
          new Date(date * 1000).toISOString().split('T')[0]
        ),
        chains
      }
    } catch (error) {
      console.error(`Options error for ${symbol}:`, error)
      throw error
    }
  }
}

// Fallback provider using Finnhub (Free tier: 60 calls/minute)
class FinnhubProvider implements MarketDataProvider {
  name = 'Finnhub'
  rateLimits = { requestsPerSecond: 1, requestsPerDay: 1000 }
  apiKey: string
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async fetchStock(symbol: string): Promise<StockQuote> {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.apiKey}`
    
    try {
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      return {
        symbol: symbol,
        price: data.c, // current price
        change: data.d, // change
        changePercent: data.dp, // change percent
        volume: 0, // Finnhub doesn't provide volume in quote endpoint
        high: data.h, // high
        low: data.l, // low
        open: data.o, // open
        previousClose: data.pc, // previous close
        timestamp: Date.now()
      }
    } catch (error) {
      console.error(`Finnhub error for ${symbol}:`, error)
      throw error
    }
  }

  async fetchQuote(symbols: string[]): Promise<StockQuote[]> {
    // Finnhub doesn't support batch quotes
    const results: StockQuote[] = []
    
    for (const symbol of symbols) {
      try {
        const quote = await this.fetchStock(symbol)
        results.push(quote)
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1100)) // 1 per second with buffer
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error)
      }
    }
    
    return results
  }
}

// Market data manager with free providers (Yahoo Finance primary)
class MarketDataManager {
  private providers: MarketDataProvider[] = []
  private cache = new Map<string, { data: StockQuote, timestamp: number }>()
  private cacheTimeout = 60000 // 1 minute cache for free data

  constructor() {
    // Use Yahoo Finance as primary (free, no API key required)
    this.providers.push(new YahooFinanceProvider())
    
    // Add paid providers only if API keys are available
    const alphaVantageKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY
    const finnhubKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY

    if (alphaVantageKey) {
      this.providers.push(new AlphaVantageProvider(alphaVantageKey))
    }
    
    if (finnhubKey) {
      this.providers.push(new FinnhubProvider(finnhubKey))
    }
  }

  private getCachedQuote(symbol: string): StockQuote | null {
    const cached = this.cache.get(symbol)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    return null
  }

  private setCachedQuote(symbol: string, data: StockQuote): void {
    this.cache.set(symbol, { data, timestamp: Date.now() })
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    // Check cache first
    const cached = this.getCachedQuote(symbol)
    if (cached) {
      return cached
    }

    // Try each provider until one succeeds
    for (const provider of this.providers) {
      try {
        const quote = await provider.fetchStock(symbol)
        this.setCachedQuote(symbol, quote)
        return quote
      } catch (error) {
        console.warn(`${provider.name} failed for ${symbol}, trying next provider`)
      }
    }

    throw new Error(`Failed to fetch quote for ${symbol} from all providers`)
  }

  async getQuotes(symbols: string[]): Promise<StockQuote[]> {
    const results: StockQuote[] = []
    const uncachedSymbols: string[] = []

    // Check cache for each symbol
    symbols.forEach(symbol => {
      const cached = this.getCachedQuote(symbol)
      if (cached) {
        results.push(cached)
      } else {
        uncachedSymbols.push(symbol)
      }
    })

    if (uncachedSymbols.length === 0) {
      return results
    }

    // Try batch fetch with Yahoo Finance first (best for multiple symbols)
    try {
      const yahooProvider = this.providers.find(p => p.name === 'YahooFinance')
      if (yahooProvider) {
        const batchQuotes = await yahooProvider.fetchQuote(uncachedSymbols)
        batchQuotes.forEach(quote => {
          this.setCachedQuote(quote.symbol, quote)
          results.push(quote)
        })
        return results
      }
    } catch (error) {
      console.warn('Batch fetch failed, falling back to individual requests')
    }

    // Fallback to individual requests
    for (const symbol of uncachedSymbols) {
      try {
        const quote = await this.getQuote(symbol)
        results.push(quote)
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error)
      }
    }

    return results
  }

  async getOptionsChain(symbol: string, expiry?: string): Promise<OptionsChain> {
    // Only Yahoo Finance supports options for now
    const yahooProvider = this.providers.find(p => p.name === 'YahooFinance') as YahooFinanceProvider
    if (yahooProvider?.fetchOptions) {
      return yahooProvider.fetchOptions(symbol, expiry)
    }
    
    throw new Error('No options data provider available')
  }

  // Get real-time market status
  async getMarketStatus(): Promise<{
    isOpen: boolean
    nextOpen: string
    nextClose: string
    timezone: string
  }> {
    try {
      const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/SPY', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      const data = await response.json()
      const meta = data.chart.result[0].meta
      
      return {
        isOpen: meta.tradingPeriods !== undefined,
        nextOpen: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : '',
        nextClose: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : '',
        timezone: meta.timezone || 'EST'
      }
    } catch (error) {
      console.error('Failed to get market status:', error)
      return {
        isOpen: false,
        nextOpen: '',
        nextClose: '',
        timezone: 'EST'
      }
    }
  }
}

// Singleton instance
export const marketData = new MarketDataManager()

// Export types and main functions
export type { StockQuote, OptionsData, OptionsChain, MarketDataProvider }

export async function getLiveQuote(symbol: string): Promise<StockQuote & { dataSource: string, disclaimer: string }> {
  const quote = await marketData.getQuote(symbol)
  return {
    ...quote,
    dataSource: 'Yahoo Finance',
    disclaimer: 'Data may be delayed up to 15-20 minutes. For real-time quotes, please consult your broker.'
  }
}

export async function getLiveQuotes(symbols: string[]): Promise<Array<StockQuote & { dataSource: string, disclaimer: string }>> {
  const quotes = await marketData.getQuotes(symbols)
  return quotes.map(quote => ({
    ...quote,
    dataSource: 'Yahoo Finance',
    disclaimer: 'Data may be delayed up to 15-20 minutes. For real-time quotes, please consult your broker.'
  }))
}

export async function getLiveOptionsChain(symbol: string, expiry?: string): Promise<OptionsChain> {
  return marketData.getOptionsChain(symbol, expiry)
}

export async function getMarketStatus() {
  return marketData.getMarketStatus()
}

// Helper function to check if market data is stale
export function isDataStale(timestamp: number, maxAgeMinutes: number = 5): boolean {
  return Date.now() - timestamp > maxAgeMinutes * 60 * 1000
}

// Get data freshness indicator
export function getDataFreshness(timestamp: number): {
  status: 'fresh' | 'delayed' | 'stale'
  ageMinutes: number
  description: string
} {
  const ageMs = Date.now() - timestamp
  const ageMinutes = Math.floor(ageMs / (60 * 1000))
  
  if (ageMinutes < 2) {
    return {
      status: 'fresh',
      ageMinutes,
      description: 'Data is current'
    }
  } else if (ageMinutes < 20) {
    return {
      status: 'delayed',
      ageMinutes,
      description: `Data is ${ageMinutes} minute(s) old`
    }
  } else {
    return {
      status: 'stale',
      ageMinutes,
      description: `Data is ${ageMinutes} minute(s) old - may be outdated`
    }
  }
}

// Market data disclaimer
export const MARKET_DATA_DISCLAIMER = {
  short: 'Data delayed up to 20 minutes',
  full: 'Market data provided by Yahoo Finance and may be delayed up to 15-20 minutes. This data is for informational purposes only and should not be used as the sole basis for investment decisions. For real-time quotes and trading, please consult your broker or financial advisor.',
  sources: 'Data sources: Yahoo Finance (free), Alpha Vantage (optional), Finnhub (optional)'
}