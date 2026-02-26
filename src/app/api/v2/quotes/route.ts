/**
 * Unified Quotes API v2
 * Serverless endpoint using new data layer architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDataService } from '@/lib/data-layer/data-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')?.toUpperCase()
    const symbols = searchParams.get('symbols')?.toUpperCase().split(',')
    const useCache = searchParams.get('cache') !== 'false'

    if (!symbol && !symbols) {
      return NextResponse.json({
        success: false,
        error: 'Either symbol or symbols parameter is required'
      }, { status: 400 })
    }

    const dataService = getDataService()

    if (symbols) {
      // Batch request
      const quotes = await dataService.batchQuotes(symbols, useCache)
      
      return NextResponse.json({
        success: true,
        data: quotes,
        cached: quotes.some(q => q.cached),
        timestamp: new Date().toISOString(),
        count: quotes.length
      })
    } else {
      // Single quote request
      const quote = await dataService.getQuote(symbol!, useCache)
      
      return NextResponse.json({
        success: true,
        data: quote,
        cached: quote.cached,
        timestamp: new Date().toISOString()
      })
    }
    
  } catch (error) {
    console.error('Quotes API v2 error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch quotes',
      timestamp: new Date().toISOString()
    }, { status: 500 })
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