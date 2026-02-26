import { NextRequest, NextResponse } from 'next/server'
import { buildVolatilitySurface, calculateIVRankPercentile, analyzeVolatilityRegime } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')?.toUpperCase() || 'SPY'

    // Calculate comprehensive volatility intelligence
    const mockOptions = [
      {
        contractSymbol: `${symbol}260321P00520000`,
        type: 'put' as const,
        strike: 520,
        expiration: '2026-03-21',
        bid: 2.40,
        ask: 2.60,
        lastPrice: 2.50,
        midpoint: 2.50,
        volume: 5000,
        openInterest: 12000,
        impliedVolatility: 0.18,
        inTheMoney: false,
        intrinsicValue: 0,
        extrinsicValue: 2.50,
        delta: -0.25,
        gamma: 0.015,
        theta: -0.08,
        vega: 0.12,
        rho: -0.05,
        daysToExpiry: 31,
        probabilityOfProfit: 0.65
      },
      {
        contractSymbol: `${symbol}260321P00525000`,
        type: 'put' as const,
        strike: 525,
        expiration: '2026-03-21',
        bid: 2.70,
        ask: 2.90,
        lastPrice: 2.80,
        midpoint: 2.80,
        volume: 8000,
        openInterest: 25000,
        impliedVolatility: 0.175,
        inTheMoney: false,
        intrinsicValue: 0,
        extrinsicValue: 2.80,
        delta: -0.30,
        gamma: 0.018,
        theta: -0.09,
        vega: 0.14,
        rho: -0.06,
        daysToExpiry: 31,
        probabilityOfProfit: 0.62
      }
    ]
    
    const volatilitySurface = buildVolatilitySurface(symbol, [], mockOptions, 525)
    const ivRankData = calculateIVRankPercentile(0.185, [0.12, 0.15, 0.18, 0.22, 0.28, 0.35, 0.45], '252d')
    const regimeAnalysis = analyzeVolatilityRegime(ivRankData)

    // Mock enhanced volatility data
    const enhancedData = {
      volatilitySurface,
      ivRankData,
      regimeAnalysis,
      currentMetrics: {
        impliedVolatility: 0.185 + Math.random() * 0.05,
        realizedVolatility: 0.158 + Math.random() * 0.04,
        ivRank: 45.2,
        ivPercentile: 52.8,
        volatilityRiskPremium: 0.027,
        volOfVol: 0.68,
        skewMetrics: {
          putCallSkew: 1.15,
          termStructureSlope: 0.023,
          stickyness: 0.78
        },
        regimeAnalysis: {
          currentRegime: 'Low Volatility',
          regimeStability: 0.82,
          expectedDuration: '3-5 weeks',
          transitionProbability: 0.15
        }
      },
      forecasting: {
        next5Days: {
          direction: 'sideways_to_up',
          confidence: 0.73,
          expectedMove: 0.025,
          keyDrivers: ['Fed policy', 'Earnings season', 'Technical levels']
        },
        volatilityForecast: {
          expectedIV: 0.195,
          expectedRV: 0.165,
          meanReversionProbability: 0.68,
          eventRisk: 'low'
        }
      },
      tradingInsights: {
        preferredStrategies: [
          {
            name: 'Iron Condor',
            suitability: 0.85,
            reasoning: 'Low volatility environment favors credit strategies'
          },
          {
            name: 'Short Strangle',
            suitability: 0.78,
            reasoning: 'High probability of profit in current regime'
          },
          {
            name: 'Covered Call',
            suitability: 0.72,
            reasoning: 'Generate income while maintaining upside'
          }
        ],
        riskConsiderations: [
          'Monitor for volatility regime change',
          'Event risk relatively low',
          'Consider vol expansion protection'
        ]
      }
    }

    return NextResponse.json({
      success: true,
      data: enhancedData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Volatility analytics API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate volatility analytics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbols, analysisType } = body

    // Batch volatility analysis for multiple symbols
    const results = []
    
    for (const symbol of symbols) {
      const mockOptionsData = [
        {
          contractSymbol: `${symbol}260321P00520000`,
          type: 'put' as const,
          strike: 520,
          expiration: '2026-03-21',
          bid: 2.40,
          ask: 2.60,
          lastPrice: 2.50,
          midpoint: 2.50,
          volume: 5000,
          openInterest: 12000,
          impliedVolatility: 0.18 + Math.random() * 0.1,
          inTheMoney: false,
          intrinsicValue: 0,
          extrinsicValue: 2.50,
          delta: -0.25,
          gamma: 0.015,
          theta: -0.08,
          vega: 0.12,
          rho: -0.05,
          daysToExpiry: 31,
          probabilityOfProfit: 0.65
        }
      ]
      
      const volatilityData = {
        surface: buildVolatilitySurface(symbol, [], mockOptionsData, 520),
        ivRank: calculateIVRankPercentile(0.18 + Math.random() * 0.1, [0.12, 0.15, 0.18, 0.22, 0.28, 0.35], '252d')
      }
      
      results.push({
        symbol,
        ivRank: Math.random() * 100,
        impliedVol: 0.15 + Math.random() * 0.25,
        realizedVol: 0.12 + Math.random() * 0.20,
        volatilityData
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        analysisType,
        batchSize: symbols?.length || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Batch volatility analysis error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform batch volatility analysis',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}