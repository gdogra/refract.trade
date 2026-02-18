import { NextRequest, NextResponse } from 'next/server'
import { calculatePortfolioGreeks } from '@/lib/analytics'

export async function GET(request: NextRequest) {
  try {
    // Mock portfolio positions (in production, get from database)
    const mockPositions = [
      {
        id: 'pos1',
        userId: 'user1',
        accountId: 'acc1',
        symbol: 'SPY',
        strategyType: 'Short Put',
        quantity: 10,
        entryDate: new Date('2026-02-13'),
        entryPrice: 2.50,
        unrealizedPnl: 125,
        delta: -0.25,
        gamma: 0.015,
        theta: -0.08,
        vega: 0.12,
        isActive: true,
        legs: [{
          id: 'leg1',
          positionId: 'pos1',
          symbol: 'SPY',
          optionType: 'put' as const,
          strike: 525,
          expiry: new Date('2026-03-21'),
          quantity: 10,
          side: 'sell' as const,
          entryPrice: 2.50,
          delta: -0.25,
          gamma: 0.015,
          theta: -0.08,
          vega: 0.12,
          iv: 0.18
        }]
      },
      {
        id: 'pos2',
        userId: 'user1',
        accountId: 'acc1',
        symbol: 'AAPL',
        strategyType: 'Long Call',
        quantity: 5,
        entryDate: new Date('2026-02-10'),
        entryPrice: 3.80,
        unrealizedPnl: -95,
        delta: 0.45,
        gamma: 0.022,
        theta: -0.12,
        vega: 0.18,
        isActive: true,
        legs: [{
          id: 'leg2',
          positionId: 'pos2',
          symbol: 'AAPL',
          optionType: 'call' as const,
          strike: 190,
          expiry: new Date('2026-03-21'),
          quantity: 5,
          side: 'buy' as const,
          entryPrice: 3.80,
          delta: 0.45,
          gamma: 0.022,
          theta: -0.12,
          vega: 0.18,
          iv: 0.25
        }]
      }
    ]

    // Calculate portfolio Greeks
    const currentPrices = new Map([['SPY', 525], ['AAPL', 190], ['TSLA', 220]])
    const volatilities = new Map([['SPY', 0.18], ['AAPL', 0.25], ['TSLA', 0.40]])
    const portfolioGreeks = calculatePortfolioGreeks(mockPositions, currentPrices, volatilities)
    
    // Calculate additional metrics
    const totalValue = mockPositions.reduce((sum, pos) => sum + (pos.quantity * pos.entryPrice * 100), 0)
    const totalPnL = mockPositions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0)
    const totalRisk = mockPositions.reduce((sum, pos) => sum + Math.abs(pos.delta || 0) * pos.quantity * 100, 0)
    
    const portfolioAnalytics = {
      summary: {
        totalPositions: mockPositions.length,
        totalValue,
        totalPnL,
        totalRisk,
        pnlPercent: (totalPnL / totalValue) * 100,
        riskPercent: (totalRisk / totalValue) * 100
      },
      greeks: portfolioGreeks,
      positions: mockPositions,
      riskMetrics: {
        portfolioBeta: 0.85,
        var95: -1250,
        var99: -2100,
        expectedShortfall: -2800,
        maximumDrawdown: -5.8,
        sharpeRatio: 1.8,
        sortinoRatio: 2.4,
        calmarRatio: 2.1
      },
      exposures: {
        sectorExposures: {
          'Technology': 0.45,
          'Financial': 0.35,
          'Healthcare': 0.10,
          'Consumer': 0.10
        },
        deltaExposure: portfolioGreeks.netDelta,
        gammaExposure: portfolioGreeks.totalGamma,
        thetaExposure: portfolioGreeks.totalTheta,
        vegaExposure: portfolioGreeks.totalVega
      },
      alerts: [
        {
          id: 'theta_high',
          type: 'risk',
          severity: 'medium',
          title: 'High Theta Exposure',
          message: 'Portfolio theta exposure is elevated at $20/day',
          recommendation: 'Consider closing short-term positions or adding long options'
        },
        {
          id: 'concentration_tech',
          type: 'risk', 
          severity: 'low',
          title: 'Tech Sector Concentration',
          message: '45% exposure to technology sector',
          recommendation: 'Monitor for sector-specific risks'
        }
      ]
    }

    return NextResponse.json({
      success: true,
      data: portfolioAnalytics,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Portfolio analytics API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate portfolio analytics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}