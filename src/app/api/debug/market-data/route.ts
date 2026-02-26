import { NextRequest, NextResponse } from 'next/server'
import { marketDataService } from '@/lib/marketData'

export async function GET(request: NextRequest) {
  try {
    // This endpoint helps debug market data service in production
    console.log('🔧 Debug endpoint called')
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_ENABLE_REAL_DATA: process.env.NEXT_PUBLIC_ENABLE_REAL_DATA,
        NEXT_PUBLIC_MARKET_DATA_PROVIDER: process.env.NEXT_PUBLIC_MARKET_DATA_PROVIDER,
        hasAlphaVantageKey: !!process.env.ALPHA_VANTAGE_API_KEY,
        alphaVantageKeyLength: process.env.ALPHA_VANTAGE_API_KEY??.length || 0 || 0,
      },
      serviceInfo: marketDataService.getServiceInfo(),
      providerStatus: marketDataService.getProviderStatus(),
    }

    // Test a simple market data call
    let testQuote = null
    try {
      console.log('Testing market data fetch for AAPL...')
      testQuote = await marketDataService.getMarketData('AAPL')
      console.log('Market data test successful:', testQuote)
    } catch (error) {
      console.error('Market data test failed:', error)
      debugInfo.testError = error instanceof Error ? error.message : 'Unknown error'
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      testQuote,
      message: 'Debug information collected successfully'
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Debug endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}