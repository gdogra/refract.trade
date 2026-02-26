import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query?.length || 0 < 1) {
      return NextResponse.json({
        success: true,
        data: { quotes: [] },
        timestamp: new Date().toISOString()
      })
    }
    
    const cleanQuery = query.trim().toUpperCase()
    
    try {
      const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQuery)}&quotesCount=10`
      
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
      
      const response = await fetch(url, { headers })
      
      if (!response.ok) {
        throw new Error(`Yahoo API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      return NextResponse.json({
        success: true,
        data,
        timestamp: new Date().toISOString()
      })
      
    } catch (yahooError) {
      console.error('Yahoo Finance API error:', yahooError)
      
      // Return fallback data
      const fallbackDatabase = [
        { symbol: 'LUV', shortname: 'Southwest Airlines Co.', exchange: 'NYSE', quoteType: 'EQUITY' },
        { symbol: 'DAL', shortname: 'Delta Air Lines Inc.', exchange: 'NYSE', quoteType: 'EQUITY' },
        { symbol: 'UAL', shortname: 'United Airlines Holdings Inc.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
        { symbol: 'AAL', shortname: 'American Airlines Group Inc.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
        { symbol: 'BA', shortname: 'Boeing Co.', exchange: 'NYSE', quoteType: 'EQUITY' },
        { symbol: 'AAPL', shortname: 'Apple Inc.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
        { symbol: 'TSLA', shortname: 'Tesla Inc.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
        { symbol: 'MSFT', shortname: 'Microsoft Corp.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
        { symbol: 'GOOGL', shortname: 'Alphabet Inc.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
        { symbol: 'AMZN', shortname: 'Amazon.com Inc.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
        { symbol: 'NVDA', shortname: 'NVIDIA Corp.', exchange: 'NASDAQ', quoteType: 'EQUITY' },
        { symbol: 'META', shortname: 'Meta Platforms Inc.', exchange: 'NASDAQ', quoteType: 'EQUITY' }
      ]
      
      const fallbackResults = fallbackDatabase.filter(stock => 
        stock.symbol.includes(cleanQuery) || 
        stock.shortname.toLowerCase().includes(cleanQuery.toLowerCase())
      )
      
      return NextResponse.json({
        success: true,
        data: { quotes: fallbackResults },
        fallback: true,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('Symbol search API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search symbols',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}