/**
 * Symbol Search using Yahoo Finance
 */

interface SymbolSearchResult {
  symbol: string
  name: string
  exchange: string
  type: 'EQUITY' | 'ETF'
}

interface YahooSearchResponse {
  quotes: Array<{
    symbol: string
    shortname?: string
    longname?: string
    exchange: string
    quoteType: string
    typeDisp?: string
  }>
}

export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
  if (!query || query.length < 1) {
    return []
  }
  
  const cleanQuery = query.trim().toUpperCase()
  
  try {
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQuery)}&quotesCount=10`
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      console.error('Symbol search API error:', response.status, response.statusText)
      return []
    }
    
    const data: YahooSearchResponse = await response.json()
    
    if (!data.quotes || !Array.isArray(data.quotes)) {
      return []
    }
    
    // Filter to equities and ETFs only
    return data.quotes
      .filter(quote => 
        quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'
      )
      .map(quote => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange || 'Unknown',
        type: quote.quoteType as 'EQUITY' | 'ETF'
      }))
      .slice(0, 8) // Limit to 8 results
    
  } catch (error) {
    console.error('Symbol search error:', error)
    return []
  }
}

// Popular symbols for quick access
export const POPULAR_SYMBOLS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  { symbol: 'META', name: 'Meta Platforms Inc.' }
]