/**
 * Polygon API Client
 * Serverless-optimized client for Polygon.io Starter plan
 */

export interface PolygonQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  close: number
  timestamp: number
  marketCap?: number
}

export interface PolygonOptionContract {
  symbol: string
  underlying: string
  strike: number
  expiry: string
  type: 'call' | 'put'
  bid: number
  ask: number
  last: number
  volume: number
  openInterest: number
  impliedVolatility?: number
  updated: number
}

export interface PolygonOptionsChain {
  underlying: string
  underlyingPrice: number
  contracts: PolygonOptionContract[]
  expirations: string[]
  timestamp: number
}

class PolygonClient {
  private apiKey: string
  private baseUrl = 'https://api.polygon.io'
  private rateLimitDelay = 12000 // 5 requests per minute on starter plan

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async rateLimitedFetch(url: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Polygon API key not configured')
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'RefractTrade/1.0'
      }
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(`Polygon API rate limit exceeded. Starter plan: 5 requests/minute`)
      }
      throw new Error(`Polygon API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getQuote(symbol: string): Promise<PolygonQuote> {
    const url = `${this.baseUrl}/v2/aggs/ticker/${symbol}/prev?adjusted=true`
    
    try {
      const data = await this.rateLimitedFetch(url)
      
      if (!data.results || data.results.length === 0) {
        throw new Error(`No data found for symbol ${symbol}`)
      }

      const result = data.results[0]
      
      return {
        symbol,
        price: result.c, // close price
        change: result.c - result.o,
        changePercent: ((result.c - result.o) / result.o) * 100,
        volume: result.v,
        high: result.h,
        low: result.l,
        open: result.o,
        close: result.c,
        timestamp: result.t,
        marketCap: undefined // Not available in this endpoint
      }
    } catch (error) {
      console.error(`Polygon quote error for ${symbol}:`, error)
      throw error
    }
  }

  async getOptionsChain(symbol: string, expiration?: string): Promise<PolygonOptionsChain> {
    // Note: Options data requires higher Polygon plan
    // For Starter plan, we'll need to use a different approach
    throw new Error('Options chain data requires Polygon Basic plan or higher. Starter plan only includes stocks.')
  }

  async batchQuotes(symbols: string[]): Promise<PolygonQuote[]> {
    // Polygon Starter doesn't support batch endpoints
    // We'll need to make individual calls with rate limiting
    const quotes: PolygonQuote[] = []
    
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol)
        quotes.push(quote)
        
        // Rate limiting for Starter plan
        if (symbols.length > 1) {
          await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
        }
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error)
        // Continue with other symbols
      }
    }
    
    return quotes
  }

  async getMarketStatus(): Promise<{ isOpen: boolean; nextOpen?: string; nextClose?: string }> {
    const url = `${this.baseUrl}/v1/marketstatus/now`
    
    try {
      const data = await this.rateLimitedFetch(url)
      
      return {
        isOpen: data.market === 'open',
        nextOpen: data.serverTime,
        nextClose: data.serverTime
      }
    } catch (error) {
      console.error('Polygon market status error:', error)
      // Fallback to basic market hours logic
      const now = new Date()
      const hours = now.getHours()
      const day = now.getDay()
      const isWeekend = day === 0 || day === 6
      const isMarketHours = hours >= 9 && hours < 16
      
      return {
        isOpen: !isWeekend && isMarketHours
      }
    }
  }
}

// Singleton instance
let polygonClient: PolygonClient | null = null

export function getPolygonClient(): PolygonClient {
  if (!polygonClient) {
    const apiKey = process.env.POLYGON_API_KEY || ''
    polygonClient = new PolygonClient(apiKey)
  }
  return polygonClient
}

export { PolygonClient }