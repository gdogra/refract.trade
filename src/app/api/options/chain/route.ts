import { NextRequest, NextResponse } from 'next/server'
import { getOptionsChain } from '@/lib/options/yahooOptions'
import { getStockData } from '@/lib/realMarketData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')?.toUpperCase()
    const expiration = searchParams.get('expiration')
    
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
    
    // Validate symbol format (1-5 uppercase letters)
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
    
    // Validate expiration format if provided (YYYY-MM-DD)
    if (expiration && !/^\d{4}-\d{2}-\d{2}$/.test(expiration)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Expiration must be in YYYY-MM-DD format',
          symbol,
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      )
    }
    
    const startTime = Date.now()
    let optionsChain
    
    try {
      // Get options chain from Yahoo Finance
      optionsChain = await getOptionsChain(symbol, expiration || undefined)
      
      // Override the underlying price with real-time Alpha Vantage data
      try {
        const realTimeData = await getStockData(symbol)
        const yahooPrice = optionsChain.underlyingPrice
        optionsChain.underlyingPrice = realTimeData.price
        console.log(`✅ Updated ${symbol} price from Yahoo Finance $${yahooPrice} to real-time Alpha Vantage price: $${realTimeData.price}`)
      } catch (priceError) {
        console.warn(`Failed to get real-time price for ${symbol}, using Yahoo Finance price:`, priceError)
        // Keep the Yahoo Finance price as fallback
      }
      
    } catch (error) {
      console.error(`Failed to get real options data for ${symbol}:`, error)
      
      return NextResponse.json(
        {
          success: false,
          error: `Unable to fetch real options data for ${symbol}. Real data only - no mock fallbacks.`,
          symbol,
          expiration,
          timestamp: new Date().toISOString(),
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 503 } // Service Unavailable
      )
    }
    
    const responseTime = Date.now() - startTime
    
    const response = NextResponse.json({
      success: true,
      data: optionsChain,
      cached: responseTime < 50, // Assume cached if very fast response
      cacheAge: 0, // Would need to implement cache age tracking
      responseTime,
      timestamp: new Date().toISOString()
    })
    
    // Set cache headers (60 seconds)
    response.headers.set('Cache-Control', 'public, max-age=60')
    
    return response
    
  } catch (error) {
    console.error('Options chain API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      url: request.url
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch options chain'
    
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

// Handle CORS
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