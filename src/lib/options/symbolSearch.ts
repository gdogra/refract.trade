/**
 * Symbol Search using Yahoo Finance
 */

export interface SymbolSearchResult {
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
  if (!query || query?.length || 0 < 1) {
    return []
  }
  
  const cleanQuery = query.trim().toUpperCase()
  
  try {
    // Use our backend proxy API to avoid CORS issues
    const response = await fetch(`/api/symbols/search?q=${encodeURIComponent(cleanQuery)}`)
    
    if (!response.ok) {
      console.error('Symbol search API error:', response.status, response.statusText)
      return getFallbackResults(cleanQuery)
    }
    
    const apiResponse = await response.json()
    
    if (!apiResponse.success || !apiResponse.data?.quotes) {
      return getFallbackResults(cleanQuery)
    }
    
    const data = apiResponse.data
    
    if (!Array.isArray(data.quotes)) {
      return getFallbackResults(cleanQuery)
    }
    
    // Filter to equities and ETFs only
    const results = data.quotes
      .filter((quote: any) => 
        quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'
      )
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange || 'Unknown',
        type: quote.quoteType as 'EQUITY' | 'ETF'
      }))
      .slice(0, 8) // Limit to 8 results

    // If no results from API, try fallback
    if (results?.length || 0 === 0) {
      return getFallbackResults(cleanQuery)
    }

    return results
    
  } catch (error) {
    console.error('Symbol search error:', error)
    return getFallbackResults(cleanQuery)
  }
}

// Fallback symbol database for when Yahoo Finance fails
function getFallbackResults(query: string): SymbolSearchResult[] {
  const fallbackDatabase = [
    { symbol: 'LUV', name: 'Southwest Airlines Co.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'DAL', name: 'Delta Air Lines Inc.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'UAL', name: 'United Airlines Holdings Inc.', exchange: 'NASDAQ', type: 'EQUITY' as const },
    { symbol: 'AAL', name: 'American Airlines Group Inc.', exchange: 'NASDAQ', type: 'EQUITY' as const },
    { symbol: 'BA', name: 'Boeing Co.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'BAC', name: 'Bank of America Corp.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'WFC', name: 'Wells Fargo & Co.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'CVX', name: 'Chevron Corp.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'KO', name: 'Coca-Cola Co.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ', type: 'EQUITY' as const },
    { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE', type: 'EQUITY' as const },
    { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', type: 'EQUITY' as const },
    { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', type: 'EQUITY' as const }
  ]

  return fallbackDatabase.filter(stock => 
    stock.symbol.includes(query) || 
    stock.name.toLowerCase().includes(query.toLowerCase())
  )
}

// Popular symbols for quick access
export const POPULAR_SYMBOLS: SymbolSearchResult[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE', type: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust ETF', exchange: 'NASDAQ', type: 'ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF', exchange: 'NYSE', type: 'ETF' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'EQUITY' },
  { symbol: 'LUV', name: 'Southwest Airlines Co.', exchange: 'NYSE', type: 'EQUITY' }
]