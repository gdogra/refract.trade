/**
 * Finnhub Client
 * Real-time stock and options data provider
 */

interface FinnhubQuote {
  c: number  // Current price
  d: number  // Change
  dp: number // Percent change
  h: number  // High price of the day
  l: number  // Low price of the day
  o: number  // Open price of the day
  pc: number // Previous close price
  t: number  // Timestamp
}

interface EnrichedQuote {
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
  source: 'finnhub'
  cached: boolean
}

export class FinnhubClient {
  private apiKey: string
  private baseUrl = 'https://finnhub.io/api/v1'
  private lastRequestTime = 0
  private rateLimitDelay = 1000 // 60 requests per minute = 1 request per second

  constructor() {
    this.apiKey = process.env.FINNHUB_API_KEY || ''
    if (!this.apiKey) {
      console.warn('Finnhub API key not configured')
    }
  }

  private async rateLimitedFetch(url: string): Promise<any> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime

    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    this.lastRequestTime = Date.now()

    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    // Check for API error response
    if (data.error) {
      throw new Error(`Finnhub API error: ${data.error}`)
    }

    return data
  }

  async getQuote(symbol: string): Promise<EnrichedQuote> {
    if (!this.apiKey) {
      throw new Error('Finnhub API key not configured')
    }

    const url = `${this.baseUrl}/quote?symbol=${symbol.toUpperCase()}&token=${this.apiKey}`
    
    try {
      const data: FinnhubQuote = await this.rateLimitedFetch(url)

      // Validate response
      if (typeof data.c !== 'number' || data.c <= 0) {
        throw new Error(`Invalid quote data for ${symbol}`)
      }

      return {
        symbol: symbol.toUpperCase(),
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        volume: 0, // Finnhub doesn't include volume in basic quote
        high: data.h,
        low: data.l,
        open: data.o,
        close: data.pc,
        timestamp: data.t * 1000, // Convert to milliseconds
        source: 'finnhub' as const,
        cached: false
      }
    } catch (error) {
      console.error(`Finnhub quote error for ${symbol}:`, error)
      throw error
    }
  }

  async batchQuotes(symbols: string[]): Promise<EnrichedQuote[]> {
    // Finnhub doesn't have a batch endpoint, so we'll make individual requests
    const results: EnrichedQuote[] = []
    
    for (const symbol of symbols) {
      try {
        const quote = await this.getQuote(symbol)
        results.push(quote)
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error)
        // Continue with other symbols
      }
    }

    return results
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false
    }

    try {
      await this.getQuote('AAPL')
      return true
    } catch (error) {
      console.warn('Finnhub health check failed:', error)
      return false
    }
  }

  // Rate limit info
  getRateLimit(): { requestsPerMinute: number; delay: number } {
    return {
      requestsPerMinute: 60,
      delay: this.rateLimitDelay
    }
  }
}

// Singleton instance
let client: FinnhubClient | null = null

export function getFinnhubClient(): FinnhubClient {
  if (!client) {
    client = new FinnhubClient()
  }
  return client
}