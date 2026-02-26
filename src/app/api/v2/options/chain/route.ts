/**
 * Enhanced Options Chain API v2
 * Serverless endpoint with calculated Greeks and risk metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDataService } from '@/lib/data-layer/data-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')?.toUpperCase()
    const expiration = searchParams.get('expiration')
    const strikes = searchParams.get('strikes') // comma-separated strike prices
    const useCache = searchParams.get('cache') !== 'false'

    if (!symbol) {
      return NextResponse.json({
        success: false,
        error: 'Symbol parameter is required'
      }, { status: 400 })
    }

    // Validate symbol format
    if (!/^[A-Z]{1,5}$/.test(symbol)) {
      return NextResponse.json({
        success: false,
        error: 'Symbol must be 1-5 uppercase letters'
      }, { status: 400 })
    }

    // Validate expiration format if provided
    if (expiration && !/^\d{4}-\d{2}-\d{2}$/.test(expiration)) {
      return NextResponse.json({
        success: false,
        error: 'Expiration must be in YYYY-MM-DD format'
      }, { status: 400 })
    }

    const startTime = Date.now()
    const dataService = getDataService()

    try {
      const optionsChain = await dataService.getOptionsChain(symbol, expiration || undefined, useCache)
      
      // Filter by strikes if provided
      if (strikes) {
        const requestedStrikes = strikes.split(',').map(s => parseFloat(s))
        optionsChain.calls = optionsChain.calls.filter(c => requestedStrikes.includes(c.strike))
        optionsChain.puts = optionsChain.puts.filter(p => requestedStrikes.includes(p.strike))
      }

      const responseTime = Date.now() - startTime

      // Calculate aggregate metrics
      const aggregateMetrics = calculateAggregateMetrics(optionsChain)

      return NextResponse.json({
        success: true,
        data: {
          ...optionsChain,
          aggregateMetrics
        },
        cached: false, // TODO: Implement cache detection
        responseTime,
        timestamp: new Date().toISOString(),
        metadata: {
          totalCalls: optionsChain.calls?.length || 0,
          totalPuts: optionsChain.puts?.length || 0,
          dataSource: optionsChain.source,
          riskFreeRate: optionsChain.greeksMetadata.riskFreeRate
        }
      })

    } catch (error) {
      console.error(`Options chain error for ${symbol}:`, error)
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch options chain',
        symbol,
        expiration,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Options chain API v2 error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

function calculateAggregateMetrics(chain: any) {
  const allContracts = [...chain.calls, ...chain.puts]
  
  if (allContracts??.length || 0) === 0) {
    return {
      totalVolume: 0,
      totalOpenInterest: 0,
      avgImpliedVolatility: 0,
      putCallRatio: 0,
      netGamma: 0,
      netVega: 0,
      netTheta: 0,
      maxPain: chain.underlyingPrice
    }
  }

  const totalVolume = allContracts.reduce((sum: number, c: any) => sum + c.volume, 0)
  const totalOpenInterest = allContracts.reduce((sum: number, c: any) => sum + c.openInterest, 0)
  const avgImpliedVolatility = allContracts.reduce((sum, c) => sum + c.impliedVolatility, 0) / allContracts?.length || 0

  // Calculate put/call metrics
  const putVolume = chain.puts.reduce((sum: number, p: any) => sum + p.volume, 0)
  const callVolume = chain.calls.reduce((sum: number, c: any) => sum + c.volume, 0)
  const putCallRatio = callVolume > 0 ? putVolume / callVolume : 0

  // Calculate net Greeks (simplified)
  const netGamma = allContracts.reduce((sum, c) => sum + c.greeks.gamma, 0)
  const netVega = allContracts.reduce((sum, c) => sum + c.greeks.vega, 0)
  const netTheta = allContracts.reduce((sum, c) => sum + c.greeks.theta, 0)

  // Calculate max pain (strike with highest open interest)
  const strikeOI = new Map<number, number>()
  allContracts.forEach(c => {
    strikeOI.set(c.strike, (strikeOI.get(c.strike) || 0) + c.openInterest)
  })
  
  let maxPain = chain.underlyingPrice
  let maxOI = 0
  for (const [strike, oi] of Array.from(strikeOI.entries())) {
    if (oi > maxOI) {
      maxOI = oi
      maxPain = strike
    }
  }

  return {
    totalVolume,
    totalOpenInterest,
    avgImpliedVolatility: Number(avgImpliedVolatility.toFixed(4)),
    putCallRatio: Number(putCallRatio.toFixed(2)),
    netGamma: Number(netGamma.toFixed(4)),
    netVega: Number(netVega.toFixed(2)),
    netTheta: Number(netTheta.toFixed(2)),
    maxPain
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