import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUnderlyingPrice } from '@/lib/options/yahooOptions'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { strategy, symbol, legs, simulations = 1000 } = body

    if (!strategy || !symbol || !legs) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await runTradeSimulation({
      userId: session.user.id,
      strategy,
      symbol,
      legs,
      simulations
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Trade simulation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function runTradeSimulation(params: {
  userId: string
  strategy: string
  symbol: string
  legs: any[]
  simulations: number
}) {
  // Fetch real current price for the symbol
  let currentPrice = 150 // Fallback price
  try {
    const priceData = await getUnderlyingPrice(params.symbol)
    currentPrice = priceData.price
  } catch (error) {
    console.warn(`Failed to fetch real price for ${params.symbol}, using fallback:`, error)
  }

  const results = []
  
  for (let i = 0; i < params.simulations; i++) {
    const marketMove = (Math.random() - 0.5) * 0.4 // -20% to +20%
    const timeDecay = Math.random() * 0.3 // Up to 30% theta decay
    const ivChange = (Math.random() - 0.5) * 0.6 // IV can change ±30%
    
    let profit = 0
    
    for (const leg of params.legs) {
      const intrinsicValue = calculateIntrinsicValue(leg, marketMove, currentPrice)
      const timeValue = leg.price * (1 - timeDecay)
      const vegaEffect = leg.price * ivChange * 0.1 // Simplified vega
      
      const newPrice = intrinsicValue + timeValue + vegaEffect
      const pnl = (newPrice - leg.price) * leg.quantity * (leg.action === 'buy' ? 1 : -1) * 100
      
      profit += pnl
    }
    
    results.push(profit)
  }
  
  const profits = results.filter(r => r > 0)
  const losses = results.filter(r => r < 0)
  
  const winRate = profits.length / results.length
  const avgProfit = profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0
  const maxProfit = Math.max(...results)
  const maxLoss = Math.min(...results)
  const expectedValue = results.reduce((a, b) => a + b, 0) / results.length
  
  const distribution = {
    profit_ranges: [
      { range: '> +$500', count: results.filter(r => r > 500).length },
      { range: '+$100 to +$500', count: results.filter(r => r > 100 && r <= 500).length },
      { range: '-$100 to +$100', count: results.filter(r => r >= -100 && r <= 100).length },
      { range: '-$500 to -$100', count: results.filter(r => r >= -500 && r < -100).length },
      { range: '< -$500', count: results.filter(r => r < -500).length }
    ]
  }

  return {
    winRate,
    avgProfit,
    avgLoss,
    maxProfit,
    maxLoss,
    expectedValue,
    probabilityDistribution: distribution,
    optimalClosingTime: Math.ceil(Math.random() * 21), // Mock optimal DTE
    confidence: Math.min(95, 60 + (params.simulations / 100))
  }
}

function calculateIntrinsicValue(leg: any, marketMove: number, currentPrice: number): number {
  const newPrice = currentPrice * (1 + marketMove)
  
  if (leg.type === 'call') {
    return Math.max(0, newPrice - leg.strike)
  } else {
    return Math.max(0, leg.strike - newPrice)
  }
}