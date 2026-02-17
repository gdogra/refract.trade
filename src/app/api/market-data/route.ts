import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/marketData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const symbols = searchParams.get('symbols')
    const type = searchParams.get('type') || 'quote'

    // Input validation
    if (!symbol && !symbols) {
      return NextResponse.json(
        { error: 'Symbol or symbols parameter is required' },
        { status: 400 }
      )
    }

    // Handle batch request
    if (symbols) {
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase())
      
      if (symbolList.length > 10) {
        return NextResponse.json(
          { error: 'Maximum 10 symbols allowed in batch request' },
          { status: 400 }
        )
      }

      const batchData = await marketDataService.getBatchMarketData(symbolList)
      
      return NextResponse.json({
        success: true,
        data: batchData,
        timestamp: new Date().toISOString()
      })
    }

    // Handle single symbol request
    const symbolUpper = symbol!.toUpperCase()

    switch (type) {
      case 'quote':
        const marketData = await marketDataService.getMarketData(symbolUpper)
        return NextResponse.json({
          success: true,
          data: marketData,
          timestamp: new Date().toISOString()
        })

      case 'options':
        const expiry = searchParams.get('expiry')
        const optionChain = await marketDataService.getOptionChain(symbolUpper, expiry || undefined)
        return NextResponse.json({
          success: true,
          data: optionChain,
          timestamp: new Date().toISOString()
        })

      case 'history':
        const timespan = searchParams.get('timespan') as 'minute' | 'hour' | 'day' | 'week' | 'month' || 'day'
        const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const to = searchParams.get('to') || new Date().toISOString().split('T')[0]
        const limit = parseInt(searchParams.get('limit') || '120')

        const historicalData = await marketDataService.getHistoricalData(
          symbolUpper,
          timespan,
          from,
          to,
          limit
        )

        return NextResponse.json({
          success: true,
          data: historicalData,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: quote, options, or history' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Market data API error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to fetch market data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle CORS for WebSocket upgrades and preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}