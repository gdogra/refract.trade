export interface SizingParams {
  userId: string
  symbol: string
  strike: number
  expiration: string
  type: 'call' | 'put'
  optionPrice: number
  strategy?: string
  maxLoss?: number
}

export interface SizingResult {
  recommendedQuantity: number
  maxSafeQuantity: number
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme'
  capitalRequired: number
  maxPotentialLoss: number
  explanation: string
  warnings: string[]
}

export interface Portfolio {
  totalValue: number
  positions: Array<{
    symbol: string
    marketValue: number
    status: string
  }>
}

export interface UserPreferences {
  maxPositionSize?: number
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive'
}

export async function calculatePositionSize(
  params: SizingParams
): Promise<SizingResult> {
  // Mock user data - in production, fetch from database
  const portfolio: Portfolio = {
    totalValue: 125000,
    positions: [
      { symbol: 'AAPL', marketValue: 15000, status: 'open' },
      { symbol: 'NVDA', marketValue: 8000, status: 'open' }
    ]
  }

  const preferences: UserPreferences = {
    maxPositionSize: 0.05, // 5% max per position
    riskTolerance: 'moderate'
  }

  const portfolioValue = portfolio.totalValue
  const maxPositionSize = preferences.maxPositionSize || 0.05
  const maxLossPerTrade = params.maxLoss || portfolioValue * 0.02 // Default 2%

  // Calculate per-contract cost and risk
  const contractCost = params.optionPrice * 100
  const maxLossPerContract = calculateMaxLoss(params)

  // Calculate maximum quantity based on position size limit
  const maxByPositionSize = Math.floor((portfolioValue * maxPositionSize) / contractCost)

  // Calculate maximum quantity based on max loss tolerance
  const maxByLossTolerance = Math.floor(maxLossPerTrade / maxLossPerContract)

  // Take the more conservative of the two
  const maxSafeQuantity = Math.min(maxByPositionSize, maxByLossTolerance)
  
  // Recommended is typically 50-75% of max safe
  const recommendedQuantity = Math.max(1, Math.floor(maxSafeQuantity * 0.6))

  const capitalRequired = recommendedQuantity * contractCost
  const maxPotentialLoss = recommendedQuantity * maxLossPerContract
  const positionSizePct = (capitalRequired / portfolioValue) * 100

  // Determine risk level
  let riskLevel: SizingResult['riskLevel']
  if (positionSizePct < 2) riskLevel = 'low'
  else if (positionSizePct < 5) riskLevel = 'moderate'
  else if (positionSizePct < 10) riskLevel = 'high'
  else riskLevel = 'extreme'

  const warnings: string[] = []

  if (recommendedQuantity === 0) {
    warnings.push('This trade is too large for your account. Skip this trade.')
  }

  if (riskLevel === 'extreme') {
    warnings.push('This position would represent >10% of your portfolio. Highly risky.')
  }

  if (maxPotentialLoss > portfolioValue * 0.05) {
    warnings.push(`Max loss ($${maxPotentialLoss.toFixed(0)}) exceeds 5% of portfolio.`)
  }

  // Check for concentration risk
  const existingPosition = portfolio.positions.find(p => p.symbol === params.symbol)
  if (existingPosition) {
    const totalExposure = existingPosition.marketValue + capitalRequired
    const concentrationPct = (totalExposure / portfolioValue) * 100
    if (concentrationPct > 15) {
      warnings.push(`Total ${params.symbol} exposure would be ${concentrationPct.toFixed(1)}% (high concentration).`)
    }
  }

  const explanation = `Based on your portfolio size ($${portfolioValue.toLocaleString()}) and max loss tolerance ($${maxLossPerTrade.toFixed(0)}), we recommend ${recommendedQuantity} contract${recommendedQuantity !== 1 ? 's' : ''}. This risks ${((maxPotentialLoss / portfolioValue) * 100).toFixed(1)}% of your portfolio.`

  return {
    recommendedQuantity,
    maxSafeQuantity,
    riskLevel,
    capitalRequired,
    maxPotentialLoss,
    explanation,
    warnings,
  }
}

function calculateMaxLoss(params: SizingParams): number {
  // Strategy-specific max loss calculations
  if (params.strategy === 'covered_call') {
    // Max loss is if stock goes to zero minus premium received
    return params.strike * 100 - params.optionPrice * 100
  } else if (params.strategy === 'cash_secured_put') {
    // Max loss is strike price minus premium
    return params.strike * 100 - params.optionPrice * 100
  } else if (params.strategy?.includes('spread')) {
    // For spreads, max loss is the width minus credit (simplified)
    return Math.abs(params.optionPrice * 100) // Simplified
  } else {
    // For long options, max loss is the premium paid
    return params.optionPrice * 100
  }
}

export class KellyCriterionCalculator {
  static calculateOptimalSize(
    winProbability: number,
    avgWin: number,
    avgLoss: number,
    bankroll: number
  ): {
    kellyPercent: number
    recommendedQuantity: number
    fractionalKelly: number
  } {
    // Kelly Criterion: f = (bp - q) / b
    // where:
    // f = fraction of bankroll to wager
    // b = odds received (avgWin / avgLoss)
    // p = probability of winning
    // q = probability of losing (1 - p)
    
    const b = avgWin / avgLoss
    const p = winProbability
    const q = 1 - p
    
    const kellyPercent = (b * p - q) / b
    
    // Use fractional Kelly (25% of full Kelly) to reduce risk
    const fractionalKelly = Math.max(0, kellyPercent * 0.25)
    
    const recommendedCapital = bankroll * fractionalKelly
    const recommendedQuantity = Math.floor(recommendedCapital / avgLoss)
    
    return {
      kellyPercent,
      recommendedQuantity: Math.max(1, recommendedQuantity),
      fractionalKelly
    }
  }
}

export async function getOptimalPositionSize(
  symbol: string,
  strategy: string,
  userBankroll: number
): Promise<{
  kellySize: number
  conservativeSize: number
  aggressiveSize: number
  recommendation: string
}> {
  // Get historical performance for this strategy/symbol combination
  const historicalData = await getStrategyPerformance(symbol, strategy)
  
  if (!historicalData || historicalData.trades?.length || 0 < 10) {
    // Not enough data - use conservative sizing
    return {
      kellySize: 1,
      conservativeSize: 1,
      aggressiveSize: 2,
      recommendation: 'Limited historical data. Starting with 1 contract recommended.'
    }
  }
  
  const winRate = historicalData.winRate
  const avgWin = historicalData.avgWin
  const avgLoss = historicalData.avgLoss
  
  const kelly = KellyCriterionCalculator.calculateOptimalSize(
    winRate,
    avgWin,
    Math.abs(avgLoss),
    userBankroll
  )
  
  return {
    kellySize: kelly.recommendedQuantity,
    conservativeSize: Math.max(1, Math.floor(kelly.recommendedQuantity * 0.5)),
    aggressiveSize: Math.min(kelly.recommendedQuantity * 2, Math.floor(userBankroll * 0.1 / Math.abs(avgLoss))),
    recommendation: `Based on ${historicalData.trades?.length || 0} historical trades: ${(winRate * 100).toFixed(0)}% win rate, Kelly suggests ${kelly.recommendedQuantity} contracts.`
  }
}

async function getStrategyPerformance(symbol: string, strategy: string) {
  // Mock historical data - in production, query database
  const mockTrades = Array.from({ length: 25 }, (_, i) => ({
    profit: Math.random() > 0.6 ? 100 + Math.random() * 300 : -(50 + Math.random() * 200),
    duration: 7 + Math.random() * 30
  }))
  
  const wins = mockTrades.filter(t => t.profit > 0)
  const losses = mockTrades.filter(t => t.profit < 0)
  
  return {
    trades: mockTrades,
    winRate: wins?.length || 0 / mockTrades?.length || 0,
    avgWin: wins.reduce((sum, w) => sum + w.profit, 0) / wins?.length || 0 || 0,
    avgLoss: losses.reduce((sum, l) => sum + l.profit, 0) / losses?.length || 0 || 0,
    avgDuration: mockTrades.reduce((sum, t) => sum + t.duration, 0) / mockTrades?.length || 0
  }
}