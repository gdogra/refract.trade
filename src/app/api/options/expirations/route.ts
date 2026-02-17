import { NextRequest, NextResponse } from 'next/server'
import { getExpirationDates } from '@/lib/options/yahooOptions'

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
    
    const expirations = await getExpirationDates(symbol)
    
    const response = NextResponse.json({
      success: true,
      symbol,
      expirations,
      count: expirations.length,
      timestamp: new Date().toISOString()
    })
    
    // Cache for 1 hour (expirations don't change often)
    response.headers.set('Cache-Control', 'public, max-age=3600')
    
    return response
    
  } catch (error) {
    console.error('Expirations API error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      url: request.url
    })
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch expiration dates'
    
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