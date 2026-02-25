import { NextRequest, NextResponse } from 'next/server'
import { getLiveQuote, getLiveQuotes, type StockQuote } from '@/lib/liveMarketData'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const symbols = searchParams.get('symbols')
    
    if (symbol) {
      // Single symbol request
      const quote = await getLiveQuote(symbol.toUpperCase())
      
      return NextResponse.json({
        success: true,
        data: quote,
        timestamp: Date.now()
      })
    }
    
    if (symbols) {
      // Multiple symbols request
      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase())
      const quotes = await getLiveQuotes(symbolList)
      
      return NextResponse.json({
        success: true,
        data: quotes,
        timestamp: Date.now()
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Please provide either symbol or symbols parameter'
    }, { status: 400 })
    
  } catch (error) {
    console.error('Live market data API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols } = body
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({
        success: false,
        error: 'Please provide symbols array in request body'
      }, { status: 400 })
    }
    
    const quotes = await getLiveQuotes(symbols.map((s: string) => s.toUpperCase()))
    
    return NextResponse.json({
      success: true,
      data: quotes,
      timestamp: Date.now()
    })
    
  } catch (error) {
    console.error('Live market data batch API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch market data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}