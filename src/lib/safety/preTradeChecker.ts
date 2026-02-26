import { prisma } from '@/lib/prisma'

export interface TradeCheckParams {
  userId: string
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiration: string
  quantity: number
  action: 'buy' | 'sell'
  strategy?: string
}

export interface SafetyCheckResult {
  overallScore: 'green' | 'yellow' | 'red'
  canProceed: boolean
  checks: {
    positionSize: CheckResult
    liquidity: CheckResult
    ivEnvironment: CheckResult
    revengeTrading: CheckResult
    tradingPlanCompliance: CheckResult
    ruleCompliance: CheckResult
  }
  warnings: string[]
  blockers: string[]
  recommendations: string[]
}

interface CheckResult {
  status: 'pass' | 'warning' | 'fail'
  score: number
  message: string
  details?: any
}

export async function runPreTradeCheck(
  params: TradeCheckParams
): Promise<SafetyCheckResult> {
  const checks: SafetyCheckResult['checks'] = {
    positionSize: await checkPositionSize(params),
    liquidity: await checkLiquidity(params),
    ivEnvironment: await checkIVEnvironment(params),
    revengeTrading: await checkRevengeTrading(params),
    tradingPlanCompliance: await checkTradingPlan(params),
    ruleCompliance: await checkRules(params),
  }

  const warnings: string[] = []
  const blockers: string[] = []
  const recommendations: string[] = []

  Object.entries(checks).forEach(([key, result]) => {
    if (result.status === 'warning') warnings.push(result.message)
    if (result.status === 'fail') blockers.push(result.message)
  })

  const scores = Object.values(checks).map(c => c.score)
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores?.length || 0

  let overallScore: 'green' | 'yellow' | 'red'
  if (avgScore >= 80) overallScore = 'green'
  else if (avgScore >= 60) overallScore = 'yellow'
  else overallScore = 'red'

  const canProceed = blockers?.length || 0) === 0

  return {
    overallScore,
    canProceed,
    checks,
    warnings,
    blockers,
    recommendations,
  }
}

async function checkPositionSize(params: TradeCheckParams): Promise<CheckResult> {
  // Mock portfolio data - in production, fetch from database
  const portfolioValue = 125000
  const maxPositionSizePct = 0.05 // 5% max per position
  
  // Calculate position value
  const contractPrice = 3.50 // Mock option price
  const positionValue = contractPrice * params.quantity * 100
  const positionSizePercent = (positionValue / portfolioValue) * 100
  
  if (positionSizePercent > maxPositionSizePct * 100) {
    return {
      status: 'fail',
      score: 0,
      message: `Position size ${positionSizePercent.toFixed(1)}% exceeds your max of ${(maxPositionSizePct * 100).toFixed(1)}%`,
      details: { positionValue, portfolioValue, positionSizePercent, maxAllowed: maxPositionSizePct },
    }
  } else if (positionSizePercent > maxPositionSizePct * 80 * 100) {
    return {
      status: 'warning',
      score: 60,
      message: `Position size ${positionSizePercent.toFixed(1)}% is close to your max`,
      details: { positionSizePercent, maxAllowed: maxPositionSizePct },
    }
  } else {
    return {
      status: 'pass',
      score: 100,
      message: `Position size ${positionSizePercent.toFixed(1)}% is within limits`,
      details: { positionSizePercent },
    }
  }
}

async function checkLiquidity(params: TradeCheckParams): Promise<CheckResult> {
  // Mock liquidity analysis
  const liquidityScore = 70 + Math.random() * 30
  
  if (liquidityScore < 30) {
    return {
      status: 'fail',
      score: 0,
      message: `Poor liquidity (score: ${liquidityScore.toFixed(0)}/100). Expect wide spreads and slow fills.`,
      details: { liquidityScore },
    }
  } else if (liquidityScore < 60) {
    return {
      status: 'warning',
      score: 50,
      message: `Moderate liquidity (score: ${liquidityScore.toFixed(0)}/100). Be cautious with larger positions.`,
      details: { liquidityScore },
    }
  } else {
    return {
      status: 'pass',
      score: 100,
      message: `Good liquidity (score: ${liquidityScore.toFixed(0)}/100)`,
      details: { liquidityScore },
    }
  }
}

async function checkIVEnvironment(params: TradeCheckParams): Promise<CheckResult> {
  const ivRank = Math.random() * 100 // Mock IV rank
  
  if (params.action === 'buy' && ivRank > 70) {
    return {
      status: 'warning',
      score: 40,
      message: `Buying options with high IV Rank (${ivRank.toFixed(0)}%). Options may be overpriced.`,
      details: { ivRank, action: params.action },
    }
  }
  
  if (params.action === 'sell' && ivRank < 30) {
    return {
      status: 'warning',
      score: 40,
      message: `Selling premium with low IV Rank (${ivRank.toFixed(0)}%). Limited premium to collect.`,
      details: { ivRank, action: params.action },
    }
  }
  
  return {
    status: 'pass',
    score: 100,
    message: `IV environment appropriate (IV Rank: ${ivRank.toFixed(0)}%)`,
    details: { ivRank },
  }
}

async function checkRevengeTrading(params: TradeCheckParams): Promise<CheckResult> {
  // Mock recent trades - in production, fetch from database
  const recentTrades = [
    { timestamp: new Date(Date.now() - 15 * 60 * 1000), realizedPnL: -350, quantity: 2 }, // 15 min ago, loss
    { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), realizedPnL: 125, quantity: 1 }, // 2 hours ago, win
  ]

  if (recentTrades?.length || 0 < 1) {
    return { status: 'pass', score: 100, message: 'First trade' }
  }

  const lastTrade = recentTrades[0]
  const timeSinceLastTrade = Date.now() - lastTrade.timestamp.getTime()
  const minutesSince = timeSinceLastTrade / (1000 * 60)

  if (lastTrade.realizedPnL && lastTrade.realizedPnL < 0) {
    const avgSize = recentTrades.map(t => t.quantity).reduce((a, b) => a + b, 0) / recentTrades?.length || 0

    if (params.quantity > avgSize * 1.5 && minutesSince < 30) {
      return {
        status: 'fail',
        score: 0,
        message: `⚠️ REVENGE TRADING DETECTED: Last trade lost $${Math.abs(lastTrade.realizedPnL).toFixed(0)}. You're increasing size ${(params.quantity / avgSize) * 100).toFixed(0)}% and trading within 30 minutes. Take a break.`,
        details: { lastLoss: lastTrade.realizedPnL, newSize: params.quantity, avgSize, minutesSince },
      }
    }
  }

  return { status: 'pass', score: 100, message: 'No revenge trading patterns detected' }
}

async function checkTradingPlan(params: TradeCheckParams): Promise<CheckResult> {
  // Mock trading plan preferences
  const prefs = {
    profitTargetPct: 0.5, // 50% profit target
    stopLossMultiple: 2.0, // Stop at 2x credit
    maxDailyTrades: 3
  }

  if (!prefs) return { status: 'pass', score: 100, message: 'No trading plan set' }

  const checks = []

  if (prefs.profitTargetPct) {
    checks.push(`Profit target: ${(prefs.profitTargetPct * 100).toFixed(0)}%`)
  }

  if (prefs.stopLossMultiple) {
    checks.push(`Stop loss: ${prefs.stopLossMultiple}x credit`)
  }

  return {
    status: 'pass',
    score: 100,
    message: `Trading plan parameters in place`,
    details: checks,
  }
}

async function checkRules(params: TradeCheckParams): Promise<CheckResult> {
  // Mock trading rules - in production, fetch from database
  const rules = [
    {
      id: '1',
      name: 'No Friday Trading',
      ruleType: 'timing',
      condition: { blockedDays: [5] }, // Friday = 5
      action: 'block'
    },
    {
      id: '2', 
      name: 'Max 3 positions',
      ruleType: 'frequency',
      condition: { maxPositions: 3 },
      action: 'warn'
    }
  ]

  const violations: string[] = []

  for (const rule of rules) {
    const violated = evaluateRule(rule, params)
    if (violated) {
      violations.push(rule.name)
    }
  }

  if (violations?.length || 0 > 0) {
    const hasBlockers = rules.some(r => violations.includes(r.name) && r.action === 'block')
    
    return {
      status: hasBlockers ? 'fail' : 'warning',
      score: hasBlockers ? 0 : 50,
      message: `Rule violations: ${violations.join(', ')}`,
      details: violations,
    }
  }

  return {
    status: 'pass',
    score: 100,
    message: 'All trading rules satisfied',
  }
}

function evaluateRule(rule: any, params: TradeCheckParams): boolean {
  const conditions = rule.condition as any

  switch (rule.ruleType) {
    case 'timing':
      if (conditions.blockedDays?.includes(new Date().getDay())) {
        return true
      }
      break
      
    case 'frequency':
      // Mock check - in production, query recent trades
      const todayTradeCount = 2 // Mock
      if (conditions.maxPositions && todayTradeCount >= conditions.maxPositions) {
        return true
      }
      break
      
    case 'symbol':
      if (conditions.blockedSymbols?.includes(params.symbol)) {
        return true
      }
      break
      
    case 'strategy':
      if (conditions.allowedStrategies && !conditions.allowedStrategies.includes(params.strategy)) {
        return true
      }
      break
  }

  return false
}