import { NextRequest, NextResponse } from 'next/server'

// Fallback market data for when Yahoo Finance is unavailable
const fallbackData = {
  SPY: { price: 502.45, change: 2.15, changePercent: 0.43, volume: 45200000 },
  QQQ: { price: 418.92, change: -1.23, changePercent: -0.29, volume: 28300000 },
  IWM: { price: 215.87, change: 1.45, changePercent: 0.68, volume: 15100000 },
  VIX: { price: 16.42, change: -0.85, changePercent: -4.93, volume: 12500000 }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')?.toUpperCase()
    
    if (!symbol || !fallbackData[symbol as keyof typeof fallbackData]) {
      return NextResponse.json(
        {
          success: false,
          error: 'Symbol not found in fallback data',
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      )
    }
    
    const data = fallbackData[symbol as keyof typeof fallbackData]
    
    return NextResponse.json({
      success: true,
      data,
      cached: false,
      fallback: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch fallback data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}