/**
 * Greeks Aggregation System
 * 
 * Strategy-level Greeks calculation and portfolio aggregation:
 * - Net Delta management
 * - Gamma exposure profiling
 * - Theta decay curve modeling
 * - Vega sensitivity analysis
 * - Advanced Greeks (Charm, Vanna) - optional
 */

import { OptionContract } from '@/lib/options/yahooOptions'
import { Position, PositionLeg } from '@/types'

export interface PortfolioGreeks {
  netDelta: number
  totalGamma: number
  totalTheta: number
  totalVega: number
  totalRho: number
  deltaAdjustedGamma: number // Gamma scaled by current delta
  deltaExposureByExpiry: ExpiryExposure[]
  gammaExposureProfile: GammaProfile
  thetaDecayCurve: ThetaDecayPoint[]
  vegaSensitivityMap: VegaSensitivityPoint[]
  riskLimits: GreeksRiskLimits
  hedgingRecommendations: HedgingRecommendation[]
}

export interface ExpiryExposure {
  expiration: string
  daysToExpiry: number
  netDelta: number
  totalGamma: number
  totalTheta: number
  totalVega: number
  notionalExposure: number
  riskContribution: number // Percentage of total portfolio risk
}

export interface GammaProfile {
  totalGamma: number
  gammaByStrike: GammaByStrike[]
  maxGammaStrike: number
  gammaInflectionPoints: number[]
  gammaConcavity: 'positive' | 'negative' | 'mixed'
  pinRisk: PinRiskAnalysis
}

export interface GammaByStrike {
  strike: number
  gamma: number
  notionalGamma: number
  percentageOfTotal: number
}

export interface PinRiskAnalysis {
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  criticalStrikes: number[]
  maxPinRiskStrike: number
  daysToExpiry: number
  probabilityOfPin: number
  hedgingRecommendation: string
}

export interface ThetaDecayPoint {
  daysToExpiry: number
  theta: number
  acceleratedDecay: boolean
  weekendDecay: boolean
  projectedValue: number
}

export interface VegaSensitivityPoint {
  impliedVolatility: number
  portfolioValue: number
  vegaExposure: number
  volRegime: 'low' | 'normal' | 'high' | 'extreme'
}

export interface GreeksRiskLimits {
  deltaLimit: number
  gammaLimit: number
  thetaLimit: number
  vegaLimit: number
  currentUtilization: {
    delta: number // Percentage of limit used
    gamma: number
    theta: number
    vega: number
  }
  breachedLimits: string[]
}

export interface HedgingRecommendation {
  type: 'delta_hedge' | 'gamma_hedge' | 'vega_hedge' | 'theta_protection'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggestedAction: string
  hedgeInstrument: 'stock' | 'options' | 'futures' | 'etf'
  quantity: number
  estimatedCost: number
  effectiveness: number // 0-1 scale
}

// Advanced Greeks (optional)
export interface AdvancedGreeks {
  charm: number // Delta sensitivity to time (dDelta/dTime)
  vanna: number // Delta sensitivity to vol (dDelta/dVol)
  volga: number // Vega sensitivity to vol (dVega/dVol)
  veta: number // Vega sensitivity to time (dVega/dTime)
  speed: number // Gamma sensitivity to price (dGamma/dPrice)
  zomma: number // Gamma sensitivity to vol (dGamma/dVol)
  color: number // Gamma sensitivity to time (dGamma/dTime)
}

/**
 * Calculate comprehensive portfolio Greeks
 */
export function calculatePortfolioGreeks(
  positions: Position[],
  currentPrices: Map<string, number>,
  volatilities: Map<string, number>
): PortfolioGreeks {
  // Aggregate basic Greeks
  const basicGreeks = aggregateBasicGreeks(positions)
  
  // Calculate exposure by expiry
  const deltaExposureByExpiry = calculateExpiryExposure(positions, currentPrices)
  
  // Build gamma exposure profile
  const gammaExposureProfile = buildGammaProfile(positions, currentPrices)
  
  // Generate theta decay curve
  const thetaDecayCurve = generateThetaDecayCurve(positions)
  
  // Create vega sensitivity map
  const vegaSensitivityMap = createVegaSensitivityMap(positions, volatilities)
  
  // Calculate risk limits and utilization
  const riskLimits = calculateRiskLimits(basicGreeks)
  
  // Generate hedging recommendations
  const hedgingRecommendations = generateHedgingRecommendations(basicGreeks, riskLimits)
  
  return {
    netDelta: basicGreeks.netDelta,
    totalGamma: basicGreeks.totalGamma,
    totalTheta: basicGreeks.totalTheta,
    totalVega: basicGreeks.totalVega,
    totalRho: basicGreeks.totalRho,
    deltaAdjustedGamma: basicGreeks.totalGamma * Math.abs(basicGreeks.netDelta),
    deltaExposureByExpiry,
    gammaExposureProfile,
    thetaDecayCurve,
    vegaSensitivityMap,
    riskLimits,
    hedgingRecommendations
  }
}

/**
 * Aggregate basic Greeks across all positions
 */
function aggregateBasicGreeks(positions: Position[]): {
  netDelta: number
  totalGamma: number
  totalTheta: number
  totalVega: number
  totalRho: number
} {
  let netDelta = 0
  let totalGamma = 0
  let totalTheta = 0
  let totalVega = 0
  let totalRho = 0
  
  for (const position of positions) {
    if (!position.isActive) continue
    
    for (const leg of position.legs) {
      const multiplier = leg.side === 'buy' ? 1 : -1
      const quantity = leg.quantity * multiplier
      
      netDelta += (leg.delta || 0) * quantity * 100 // Options are per 100 shares
      totalGamma += (leg.gamma || 0) * quantity * 100
      totalTheta += (leg.theta || 0) * quantity * 100
      totalVega += (leg.vega || 0) * quantity * 100
      totalRho += 0 // Would calculate from leg data
    }
  }
  
  return { netDelta, totalGamma, totalTheta, totalVega, totalRho }
}

/**
 * Calculate exposure by expiration date
 */
function calculateExpiryExposure(
  positions: Position[],
  currentPrices: Map<string, number>
): ExpiryExposure[] {
  const expiryMap = new Map<string, {
    netDelta: number
    totalGamma: number
    totalTheta: number
    totalVega: number
    notionalExposure: number
  }>()
  
  for (const position of positions) {
    if (!position.isActive) continue
    
    for (const leg of position.legs) {
      const expiry = leg.expiry.toISOString().split('T')[0]
      const multiplier = leg.side === 'buy' ? 1 : -1
      const quantity = leg.quantity * multiplier
      
      if (!expiryMap.has(expiry)) {
        expiryMap.set(expiry, {
          netDelta: 0,
          totalGamma: 0,
          totalTheta: 0,
          totalVega: 0,
          notionalExposure: 0
        })
      }
      
      const exposure = expiryMap.get(expiry)!
      const currentPrice = currentPrices.get(leg.symbol) || 0
      
      exposure.netDelta += (leg.delta || 0) * quantity * 100
      exposure.totalGamma += (leg.gamma || 0) * quantity * 100
      exposure.totalTheta += (leg.theta || 0) * quantity * 100
      exposure.totalVega += (leg.vega || 0) * quantity * 100
      exposure.notionalExposure += Math.abs(leg.delta || 0) * quantity * currentPrice * 100
    }
  }
  
  // Convert to array and calculate risk contribution
  const totalNotionalExposure = Array.from(expiryMap.values())
    .reduce((sum, exp) => sum + exp.notionalExposure, 0)
  
  return Array.from(expiryMap.entries()).map(([expiry, exposure]) => {
    const expiryDate = new Date(expiry)
    const daysToExpiry = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    
    return {
      expiration: expiry,
      daysToExpiry,
      netDelta: exposure.netDelta,
      totalGamma: exposure.totalGamma,
      totalTheta: exposure.totalTheta,
      totalVega: exposure.totalVega,
      notionalExposure: exposure.notionalExposure,
      riskContribution: exposure.notionalExposure / totalNotionalExposure
    }
  }).sort((a, b) => a.daysToExpiry - b.daysToExpiry)
}

/**
 * Build detailed gamma exposure profile
 */
function buildGammaProfile(
  positions: Position[],
  currentPrices: Map<string, number>
): GammaProfile {
  const strikeGammaMap = new Map<number, number>()
  let totalGamma = 0
  
  for (const position of positions) {
    if (!position.isActive) continue
    
    for (const leg of position.legs) {
      const multiplier = leg.side === 'buy' ? 1 : -1
      const quantity = leg.quantity * multiplier
      const gamma = (leg.gamma || 0) * quantity * 100
      
      totalGamma += gamma
      
      const existingGamma = strikeGammaMap.get(leg.strike) || 0
      strikeGammaMap.set(leg.strike, existingGamma + gamma)
    }
  }
  
  // Convert to array and sort
  const gammaByStrike: GammaByStrike[] = Array.from(strikeGammaMap.entries())
    .map(([strike, gamma]) => ({
      strike,
      gamma,
      notionalGamma: gamma * strike,
      percentageOfTotal: Math.abs(gamma) / Math.abs(totalGamma) * 100
    }))
    .sort((a, b) => a.strike - b.strike)
  
  // Find max gamma strike
  const maxGammaStrike = gammaByStrike.reduce((max, point) => 
    Math.abs(point.gamma) > Math.abs(max.gamma) ? point : max
  ).strike
  
  // Detect inflection points (simplified)
  const gammaInflectionPoints = gammaByStrike
    .filter(point => Math.abs(point.gamma) > Math.abs(totalGamma) * 0.1)
    .map(point => point.strike)
  
  // Determine concavity
  const positiveGamma = gammaByStrike.filter(p => p.gamma > 0)?.length || 0
  const negativeGamma = gammaByStrike.filter(p => p.gamma < 0)?.length || 0
  let gammaConcavity: GammaProfile['gammaConcavity']
  if (positiveGamma > negativeGamma * 2) gammaConcavity = 'positive'
  else if (negativeGamma > positiveGamma * 2) gammaConcavity = 'negative'
  else gammaConcavity = 'mixed'
  
  // Analyze pin risk
  const pinRisk = analyzePinRisk(gammaByStrike, currentPrices)
  
  return {
    totalGamma,
    gammaByStrike,
    maxGammaStrike,
    gammaInflectionPoints,
    gammaConcavity,
    pinRisk
  }
}

/**
 * Analyze pin risk for expiring options
 */
function analyzePinRisk(
  gammaByStrike: GammaByStrike[],
  currentPrices: Map<string, number>
): PinRiskAnalysis {
  // Find strikes with high gamma near current price
  const currentPrice = Array.from(currentPrices.values())[0] || 0 // Simplified
  const nearbyStrikes = gammaByStrike.filter(point => 
    Math.abs(point.strike - currentPrice) <= currentPrice * 0.05
  )
  
  const maxGammaPoint = nearbyStrikes.reduce((max, point) => 
    Math.abs(point.gamma) > Math.abs(max.gamma || 0) ? point : max
  , { strike: 0, gamma: 0 })
  
  const totalNearbyGamma = nearbyStrikes.reduce((sum, point) => sum + Math.abs(point.gamma), 0)
  
  let riskLevel: PinRiskAnalysis['riskLevel']
  if (totalNearbyGamma > 1000) riskLevel = 'extreme'
  else if (totalNearbyGamma > 500) riskLevel = 'high'
  else if (totalNearbyGamma > 200) riskLevel = 'medium'
  else riskLevel = 'low'
  
  const criticalStrikes = nearbyStrikes
    .filter(point => Math.abs(point.gamma) > 100)
    .map(point => point.strike)
  
  const probabilityOfPin = Math.min(totalNearbyGamma / 1000, 0.4) // Simplified calculation
  
  return {
    riskLevel,
    criticalStrikes,
    maxPinRiskStrike: maxGammaPoint.strike,
    daysToExpiry: 0, // Would be calculated from position data
    probabilityOfPin,
    hedgingRecommendation: riskLevel === 'extreme' || riskLevel === 'high' 
      ? 'Consider delta hedging or closing positions before expiration'
      : 'Monitor pin risk as expiration approaches'
  }
}

/**
 * Generate theta decay curve projection
 */
function generateThetaDecayCurve(positions: Position[]): ThetaDecayPoint[] {
  const curve: ThetaDecayPoint[] = []
  const currentDate = new Date()
  
  // Project theta decay for next 30 days
  for (let day = 0; day <= 30; day++) {
    const projectionDate = new Date(currentDate)
    projectionDate.setDate(currentDate.getDate() + day)
    
    let totalTheta = 0
    let acceleratedDecay = false
    let weekendDecay = false
    
    // Check if weekend
    const dayOfWeek = projectionDate.getDay()
    weekendDecay = dayOfWeek === 0 || dayOfWeek === 6
    
    for (const position of positions) {
      if (!position.isActive) continue
      
      for (const leg of position.legs) {
        const daysToExpiry = Math.max(0, Math.ceil((leg.expiry.getTime() - projectionDate.getTime()) / (1000 * 60 * 60 * 24)))
        
        // Accelerated decay in final week
        acceleratedDecay = acceleratedDecay || daysToExpiry <= 7
        
        if (daysToExpiry > 0) {
          const multiplier = leg.side === 'buy' ? 1 : -1
          const timeDecayFactor = daysToExpiry <= 7 ? 1.5 : 1.0 // Accelerated decay
          totalTheta += (leg.theta || 0) * leg.quantity * multiplier * timeDecayFactor * 100
        }
      }
    }
    
    // Weekend adjustment
    if (weekendDecay) {
      totalTheta *= 3 // 3 days of decay over weekend
    }
    
    const projectedValue = day === 0 ? 0 : curve[day - 1].projectedValue + totalTheta
    
    curve.push({
      daysToExpiry: 30 - day,
      theta: totalTheta,
      acceleratedDecay,
      weekendDecay,
      projectedValue
    })
  }
  
  return curve
}

/**
 * Create vega sensitivity analysis
 */
function createVegaSensitivityMap(
  positions: Position[],
  volatilities: Map<string, number>
): VegaSensitivityPoint[] {
  const sensitivityMap: VegaSensitivityPoint[] = []
  
  // Test portfolio value across different IV levels
  const baseVolatility = Array.from(volatilities.values())[0] || 0.3
  const volLevels = [
    baseVolatility * 0.5,  // Extreme low vol
    baseVolatility * 0.75, // Low vol
    baseVolatility,        // Current vol
    baseVolatility * 1.25, // High vol
    baseVolatility * 1.5,  // Extreme high vol
    baseVolatility * 2.0   // Crisis vol
  ]
  
  for (const volLevel of volLevels) {
    let portfolioValue = 0
    let vegaExposure = 0
    
    for (const position of positions) {
      if (!position.isActive) continue
      
      for (const leg of position.legs) {
        const multiplier = leg.side === 'buy' ? 1 : -1
        const quantity = leg.quantity * multiplier
        
        // Simplified: assume linear vega relationship
        const volChange = volLevel - baseVolatility
        const legValue = volChange * (leg.vega || 0) * quantity * 100
        portfolioValue += legValue
        vegaExposure += (leg.vega || 0) * quantity * 100
      }
    }
    
    let volRegime: VegaSensitivityPoint['volRegime']
    if (volLevel < baseVolatility * 0.8) volRegime = 'low'
    else if (volLevel > baseVolatility * 1.3) volRegime = 'high'
    else if (volLevel > baseVolatility * 1.8) volRegime = 'extreme'
    else volRegime = 'normal'
    
    sensitivityMap.push({
      impliedVolatility: volLevel,
      portfolioValue,
      vegaExposure,
      volRegime
    })
  }
  
  return sensitivityMap
}

/**
 * Calculate risk limits and current utilization
 */
function calculateRiskLimits(greeks: {
  netDelta: number
  totalGamma: number
  totalTheta: number
  totalVega: number
}): GreeksRiskLimits {
  // Conservative institutional limits
  const limits = {
    deltaLimit: 1000,   // ±1000 delta exposure
    gammaLimit: 500,    // ±500 gamma exposure
    thetaLimit: -200,   // Max $200/day theta decay
    vegaLimit: 1000     // ±1000 vega exposure
  }
  
  const utilization = {
    delta: Math.abs(greeks.netDelta) / limits.deltaLimit,
    gamma: Math.abs(greeks.totalGamma) / limits.gammaLimit,
    theta: Math.abs(greeks.totalTheta) / Math.abs(limits.thetaLimit),
    vega: Math.abs(greeks.totalVega) / limits.vegaLimit
  }
  
  const breachedLimits: string[] = []
  if (utilization.delta > 0.8) breachedLimits.push('delta')
  if (utilization.gamma > 0.8) breachedLimits.push('gamma')
  if (utilization.theta > 0.8) breachedLimits.push('theta')
  if (utilization.vega > 0.8) breachedLimits.push('vega')
  
  return {
    deltaLimit: limits.deltaLimit,
    gammaLimit: limits.gammaLimit,
    thetaLimit: limits.thetaLimit,
    vegaLimit: limits.vegaLimit,
    currentUtilization: utilization,
    breachedLimits
  }
}

/**
 * Generate hedging recommendations based on Greeks exposure
 */
function generateHedgingRecommendations(
  greeks: { netDelta: number; totalGamma: number; totalTheta: number; totalVega: number },
  riskLimits: GreeksRiskLimits
): HedgingRecommendation[] {
  const recommendations: HedgingRecommendation[] = []
  
  // Delta hedging
  if (Math.abs(greeks.netDelta) > riskLimits.deltaLimit * 0.7) {
    const severity = Math.abs(greeks.netDelta) > riskLimits.deltaLimit ? 'critical' : 'high'
    const hedgeQuantity = Math.round(Math.abs(greeks.netDelta) / 100) // Convert to shares
    
    recommendations.push({
      type: 'delta_hedge',
      severity,
      description: `Portfolio has excessive delta exposure: ${greeks.netDelta.toFixed(0)}`,
      suggestedAction: greeks.netDelta > 0 ? 'Sell shares to hedge long delta' : 'Buy shares to hedge short delta',
      hedgeInstrument: 'stock',
      quantity: hedgeQuantity,
      estimatedCost: hedgeQuantity * 100, // Rough estimate
      effectiveness: 0.95
    })
  }
  
  // Gamma hedging
  if (Math.abs(greeks.totalGamma) > riskLimits.gammaLimit * 0.7) {
    const severity = Math.abs(greeks.totalGamma) > riskLimits.gammaLimit ? 'critical' : 'high'
    
    recommendations.push({
      type: 'gamma_hedge',
      severity,
      description: `High gamma exposure: ${greeks.totalGamma.toFixed(0)}`,
      suggestedAction: 'Consider opposite gamma positions or reduce existing gamma exposure',
      hedgeInstrument: 'options',
      quantity: Math.round(Math.abs(greeks.totalGamma) / 10),
      estimatedCost: 500,
      effectiveness: 0.8
    })
  }
  
  // Vega hedging
  if (Math.abs(greeks.totalVega) > riskLimits.vegaLimit * 0.7) {
    const severity = Math.abs(greeks.totalVega) > riskLimits.vegaLimit ? 'critical' : 'high'
    
    recommendations.push({
      type: 'vega_hedge',
      severity,
      description: `High vega exposure: ${greeks.totalVega.toFixed(0)}`,
      suggestedAction: greeks.totalVega > 0 ? 'Sell volatility to hedge long vega' : 'Buy volatility to hedge short vega',
      hedgeInstrument: 'options',
      quantity: Math.round(Math.abs(greeks.totalVega) / 50),
      estimatedCost: 300,
      effectiveness: 0.85
    })
  }
  
  // Theta protection
  if (greeks.totalTheta < -100) {
    recommendations.push({
      type: 'theta_protection',
      severity: 'medium',
      description: `Significant time decay: $${Math.abs(greeks.totalTheta).toFixed(0)}/day`,
      suggestedAction: 'Consider theta-positive positions or shorter duration trades',
      hedgeInstrument: 'options',
      quantity: 5,
      estimatedCost: 200,
      effectiveness: 0.7
    })
  }
  
  return recommendations
}

/**
 * Calculate advanced Greeks (Charm, Vanna, etc.)
 */
export function calculateAdvancedGreeks(
  optionContract: OptionContract,
  underlyingPrice: number,
  timeToExpiry: number,
  riskFreeRate: number = 0.05
): AdvancedGreeks {
  const { strike, impliedVolatility } = optionContract
  const vol = impliedVolatility
  const T = timeToExpiry / 365
  
  // Calculate d1 and d2 from Black-Scholes
  const d1 = (Math.log(underlyingPrice / strike) + (riskFreeRate + 0.5 * vol * vol) * T) / (vol * Math.sqrt(T))
  const d2 = d1 - vol * Math.sqrt(T)
  
  // Standard normal PDF and CDF
  const phi = (x: number) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)
  const Phi = (x: number) => 0.5 * (1 + erf(x / Math.sqrt(2)))
  
  // Charm (dDelta/dTime)
  const charm = optionContract.type === 'call'
    ? -phi(d1) * (2 * riskFreeRate * T - d2 * vol * Math.sqrt(T)) / (2 * T * vol * Math.sqrt(T))
    : -phi(d1) * (2 * riskFreeRate * T - d2 * vol * Math.sqrt(T)) / (2 * T * vol * Math.sqrt(T)) - riskFreeRate * Math.exp(-riskFreeRate * T) * Phi(-d2)
  
  // Vanna (dDelta/dVol = dVega/dPrice)
  const vanna = -phi(d1) * d2 / vol
  
  // Volga (dVega/dVol)
  const volga = underlyingPrice * phi(d1) * Math.sqrt(T) * d1 * d2 / vol
  
  // Veta (dVega/dTime)
  const veta = -underlyingPrice * phi(d1) * Math.sqrt(T) * 
    (riskFreeRate * d1 / (vol * Math.sqrt(T)) - (1 + d1 * d2) / (2 * T))
  
  // Speed (dGamma/dPrice)
  const speed = -phi(d1) * (d1 / (vol * Math.sqrt(T)) + 1) / (underlyingPrice * underlyingPrice * vol * Math.sqrt(T))
  
  // Zomma (dGamma/dVol)
  const zomma = phi(d1) * (d1 * d2 - 1) / (underlyingPrice * vol * vol * Math.sqrt(T))
  
  // Color (dGamma/dTime)
  const color = -phi(d1) / (2 * underlyingPrice * T * vol * Math.sqrt(T)) * 
    (2 * riskFreeRate * T + 1 + d1 * (2 * riskFreeRate * T - d2 * vol * Math.sqrt(T)) / (vol * Math.sqrt(T)))
  
  return {
    charm: charm / 365, // Convert to daily
    vanna: vanna / 100, // Per 1% vol change
    volga: volga / 100,
    veta: veta / 365, // Convert to daily
    speed,
    zomma: zomma / 100,
    color: color / 365 // Convert to daily
  }
}

/**
 * Portfolio-level advanced Greeks aggregation
 */
export function aggregateAdvancedGreeks(
  positions: Position[],
  marketData: Map<string, { price: number; volatility: number }>
): AdvancedGreeks {
  let totalCharm = 0
  let totalVanna = 0
  let totalVolga = 0
  let totalVeta = 0
  let totalSpeed = 0
  let totalZomma = 0
  let totalColor = 0
  
  for (const position of positions) {
    if (!position.isActive) continue
    
    for (const leg of position.legs) {
      const marketInfo = marketData.get(leg.symbol)
      if (!marketInfo) continue
      
      const multiplier = leg.side === 'buy' ? 1 : -1
      const quantity = leg.quantity * multiplier
      
      const daysToExpiry = Math.max(1, Math.ceil((leg.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      
      // Create mock option contract for calculation
      const optionContract: OptionContract = {
        contractSymbol: leg.symbol,
        type: leg.optionType,
        strike: leg.strike,
        expiration: leg.expiry.toISOString().split('T')[0],
        bid: 0,
        ask: 0,
        lastPrice: leg.entryPrice,
        midpoint: leg.entryPrice,
        volume: 0,
        openInterest: 0,
        impliedVolatility: leg.iv || marketInfo.volatility,
        inTheMoney: false,
        intrinsicValue: 0,
        extrinsicValue: 0,
        delta: leg.delta || 0,
        gamma: leg.gamma || 0,
        theta: leg.theta || 0,
        vega: leg.vega || 0,
        rho: 0,
        daysToExpiry,
        probabilityOfProfit: 0.5
      }
      
      const advancedGreeks = calculateAdvancedGreeks(
        optionContract,
        marketInfo.price,
        daysToExpiry
      )
      
      totalCharm += advancedGreeks.charm * quantity * 100
      totalVanna += advancedGreeks.vanna * quantity * 100
      totalVolga += advancedGreeks.volga * quantity * 100
      totalVeta += advancedGreeks.veta * quantity * 100
      totalSpeed += advancedGreeks.speed * quantity * 100
      totalZomma += advancedGreeks.zomma * quantity * 100
      totalColor += advancedGreeks.color * quantity * 100
    }
  }
  
  return {
    charm: totalCharm,
    vanna: totalVanna,
    volga: totalVolga,
    veta: totalVeta,
    speed: totalSpeed,
    zomma: totalZomma,
    color: totalColor
  }
}

// Error function for normal distribution calculations
function erf(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  
  const sign = x >= 0 ? 1 : -1
  x = Math.abs(x)
  
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  
  return sign * y
}