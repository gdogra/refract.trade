import { NextRequest, NextResponse } from 'next/server'
import { getStockData } from '@/lib/realMarketData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')?.toUpperCase()
    
    // Validate symbol parameter
    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol parameter is required',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    // Validate symbol format
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol must be 1-5 uppercase letters',
          symbol,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    let quoteData
    try {
      const stockData = await getStockData(symbol)
      
      // Transform real market data to match expected format
      quoteData = {
        symbol: stockData.symbol,
        regularMarketPrice: stockData.price,
        regularMarketChange: stockData.change,
        regularMarketChangePercent: stockData.changePercent,
        regularMarketVolume: stockData.volume,
        regularMarketDayHigh: stockData.yearHigh || stockData.price * 1.02,
        regularMarketDayLow: stockData.yearLow || stockData.price * 0.98,
        marketCap: stockData.marketCap,
        averageDailyVolume10Day: stockData.avgVolume,
        beta: 1.0,
        trailingPE: 20,
        dividendRate: 0,
        dividendYield: 0,
        earningsTimestamp: null,
        impliedVolatility: 0.25
      }
      
      console.log(`✅ Real market data fetched for ${symbol}: $${stockData.price}`)
    } catch (error) {
      console.error(`Failed to get real market data for ${symbol}:`, error)
      
      return NextResponse.json(
        {
          success: false,
          error: `Unable to fetch real market data for ${symbol}. ${error instanceof Error ? error.message : 'API error'}`,
          symbol,
          timestamp: new Date().toISOString(),
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 503 } // Service Unavailable
      )
    }
    
    const response = NextResponse.json({
      success: true,
      data: quoteData,
      cached: false,
      timestamp: new Date().toISOString()
    })
    
    // Cache for 60 seconds
    response.headers.set('Cache-Control', 'public, max-age=60')
    
    return response
    
  } catch (error) {
    console.error('Quote API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      url: request.url
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quote data'
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        symbol: new URL(request.url).searchParams.get('symbol') || undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}