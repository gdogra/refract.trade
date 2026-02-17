import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma, safeExecutePrisma } from '@/lib/prisma'
import { calculateGreeks, getTimeToExpiry, type GreeksInput } from '@/lib/greeks'
import { marketDataService } from '@/lib/marketData'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeGreeks = searchParams.get('includeGreeks') === 'true'
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true'

    // Get user's positions from database with safe execution
    const positions = await safeExecutePrisma(
      async (client) => await client.position.findMany({
        where: {
          userId: session.user.id,
          isActive: true
        },
        include: {
          legs: true,
          transactions: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          entryDate: 'desc'
        }
      }),
      [] // Fallback to empty array if Prisma fails
    )

    // Get current market data for all unique symbols
    const symbolSet = new Set(positions.map(p => p.symbol))
    const symbols = Array.from(symbolSet)
    const marketDataPromises = symbols.map(async (symbol) => {
      try {
        const data = await marketDataService.getMarketData(symbol)
        return { symbol, data }
      } catch (error) {
        console.error(`Failed to fetch market data for ${symbol}:`, error)
        return { symbol, data: null }
      }
    })

    const marketDataResults = await Promise.all(marketDataPromises)
    const marketDataMap = new Map(
      marketDataResults.map(result => [result.symbol, result.data])
    )

    // Process positions and calculate Greeks if requested
    const processedPositions = await Promise.all(
      positions.map(async (position) => {
        const marketData = marketDataMap.get(position.symbol)
        const currentPrice = marketData?.price || Number(position.entryPrice)
        
        // Calculate basic P&L
        const entryValue = Number(position.entryPrice) * position.quantity * 100
        const currentValue = currentPrice * position.quantity * 100
        const unrealizedPnl = currentValue - entryValue
        const pnlPercent = entryValue > 0 ? (unrealizedPnl / entryValue) * 100 : 0

        // Calculate days to expiry for strategy
        const daysToExpiry = position.legs.length > 0 
          ? Math.min(...position.legs.map(leg => {
              const expiry = new Date(leg.expiry)
              const now = new Date()
              return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            }))
          : 0

        let greeksData = null
        if (includeGreeks && position.legs.length > 0) {
          try {
            // Calculate Greeks for each leg and aggregate
            const legGreeks = await Promise.all(
              position.legs.map(async (leg) => {
                const timeToExpiry = getTimeToExpiry(leg.expiry)
                
                if (timeToExpiry <= 0) {
                  return {
                    delta: 0,
                    gamma: 0,
                    theta: 0,
                    vega: 0,
                    rho: 0,
                    price: Math.max(0, 
                      leg.optionType === 'call' 
                        ? currentPrice - Number(leg.strike)
                        : Number(leg.strike) - currentPrice
                    )
                  }
                }

                const greeksInput: GreeksInput = {
                  spotPrice: currentPrice,
                  strike: Number(leg.strike),
                  timeToExpiry,
                  riskFreeRate: 0.05, // 5% default risk-free rate
                  volatility: Number(leg.iv) || 0.25, // Use stored IV or default to 25%
                  dividendYield: 0
                }

                const greeks = calculateGreeks(greeksInput, leg.optionType === 'call')
                const multiplier = leg.quantity * (leg.side === 'buy' ? 1 : -1)

                return {
                  delta: greeks.delta * multiplier,
                  gamma: greeks.gamma * multiplier,
                  theta: greeks.theta * multiplier,
                  vega: greeks.vega * multiplier,
                  rho: greeks.rho * multiplier,
                  price: greeks.price * Math.abs(multiplier)
                }
              })
            )

            // Aggregate Greeks across all legs
            greeksData = legGreeks.reduce(
              (total, legGreek) => ({
                delta: total.delta + legGreek.delta,
                gamma: total.gamma + legGreek.gamma,
                theta: total.theta + legGreek.theta,
                vega: total.vega + legGreek.vega,
                rho: total.rho + legGreek.rho,
                theoreticalValue: total.theoreticalValue + legGreek.price
              }),
              { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0, theoreticalValue: 0 }
            )
          } catch (error) {
            console.error(`Failed to calculate Greeks for position ${position.id}:`, error)
          }
        }

        return {
          id: position.id,
          symbol: position.symbol,
          strategy: position.strategyType,
          quantity: position.quantity,
          entryPrice: Number(position.entryPrice),
          entryDate: position.entryDate,
          currentPrice,
          unrealizedPnl,
          realizedPnl: Number(position.realizedPnl) || 0,
          pnlPercent,
          daysToExpiry,
          legs: position.legs.map(leg => ({
            id: leg.id,
            symbol: leg.symbol,
            optionType: leg.optionType,
            strike: Number(leg.strike),
            expiry: leg.expiry,
            quantity: leg.quantity,
            side: leg.side,
            entryPrice: Number(leg.entryPrice),
            exitPrice: leg.exitPrice ? Number(leg.exitPrice) : null,
            iv: Number(leg.iv) || null
          })),
          greeks: greeksData,
          marketData: marketData ? {
            currentPrice: marketData.price,
            change: marketData.change,
            changePercent: marketData.changePercent,
            volume: marketData.volume,
            timestamp: marketData.timestamp
          } : null,
          analytics: includeAnalytics ? {
            // Additional analytics can be added here
            riskMetrics: {
              maxLoss: position.legs.reduce((max, leg) => {
                if (leg.side === 'sell') {
                  return max + (Number(leg.entryPrice) * leg.quantity * 100)
                }
                return max
              }, 0),
              maxProfit: position.legs.reduce((max, leg) => {
                if (leg.side === 'buy') {
                  return max + (Number(leg.entryPrice) * leg.quantity * 100)
                }
                return max
              }, 0)
            }
          } : null
        }
      })
    )

    // Calculate portfolio summary
    const portfolioSummary = {
      totalPositions: processedPositions.length,
      totalValue: processedPositions.reduce((sum, pos) => sum + (pos.currentPrice * pos.quantity * 100), 0),
      totalPnl: processedPositions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0),
      totalPnlPercent: 0, // Will calculate after getting total invested
      activePositions: processedPositions.filter(pos => pos.daysToExpiry > 0).length,
      expiringThisWeek: processedPositions.filter(pos => pos.daysToExpiry <= 7 && pos.daysToExpiry > 0).length
    }

    const totalInvested = processedPositions.reduce((sum, pos) => sum + (pos.entryPrice * pos.quantity * 100), 0)
    portfolioSummary.totalPnlPercent = totalInvested > 0 ? (portfolioSummary.totalPnl / totalInvested) * 100 : 0

    return NextResponse.json({
      success: true,
      data: {
        positions: processedPositions,
        summary: portfolioSummary
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Positions API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch positions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      symbol, 
      strategyType, 
      quantity, 
      entryPrice, 
      legs,
      accountId 
    } = body

    // Validate required fields
    if (!symbol || !strategyType || !quantity || !entryPrice || !legs || !Array.isArray(legs)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create position in database with safe execution
    const position = await safeExecutePrisma(
      async (client) => await client.position.create({
        data: {
          userId: session.user.id,
          accountId: accountId || 'default', // You might want to create a default account
          symbol,
          strategyType,
          quantity,
          entryPrice,
          entryDate: new Date(),
          legs: {
            create: legs.map((leg: any) => ({
              symbol: leg.symbol,
              optionType: leg.optionType,
              strike: leg.strike,
              expiry: new Date(leg.expiry),
              quantity: leg.quantity,
              side: leg.side,
              entryPrice: leg.entryPrice,
              iv: leg.iv || null
            }))
          }
        },
        include: {
          legs: true
        }
      }),
      null // Fallback to null if creation fails
    )

    if (!position) {
      throw new Error('Failed to create position in database')
    }

    return NextResponse.json({
      success: true,
      data: position,
      message: 'Position created successfully'
    })

  } catch (error) {
    console.error('Create position error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create position',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}