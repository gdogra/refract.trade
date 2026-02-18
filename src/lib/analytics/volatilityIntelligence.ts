/**
 * Volatility Intelligence System
 * 
 * Implements institutional-grade volatility analysis including:
 * - Implied volatility surface modeling
 * - IV rank and percentile calculations
 * - Term structure analysis
 * - Skew detection
 * - Realized vs implied spread analysis
 * - Event volatility tracking
 */

import { OptionContract } from '@/lib/options/yahooOptions'

export interface VolatilitySurface {
  symbol: string
  timestamp: Date
  surface: VolatilityPoint[]
  atmVolatility: number
  volSmile: VolatilitySmile
  skew: VolatilitySkew
  termStructure: TermStructurePoint[]
}

export interface VolatilityPoint {
  strike: number
  expiration: string
  daysToExpiry: number
  moneyness: number // S/K ratio
  impliedVolatility: number
  volume: number
  openInterest: number
  lastPrice: number
  delta: number
}

export interface VolatilitySmile {
  expiration: string
  points: Array<{
    strike: number
    moneyness: number
    impliedVolatility: number
    delta: number
  }>
  atmVolatility: number
  skewSlope: number
  convexity: number
}

export interface VolatilitySkew {
  putSkew: number // 25-delta put vs ATM
  callSkew: number // 25-delta call vs ATM
  overallSkew: number // put skew - call skew
  skewDirection: 'put_skew' | 'call_skew' | 'neutral'
}

export interface TermStructurePoint {
  expiration: string
  daysToExpiry: number
  atmVolatility: number
  percentile: number
  rank: number
}

export interface IVRankPercentile {
  symbol: string
  currentIV: number
  ivRank: number // 0-100, where 0 is lowest IV in period, 100 is highest
  ivPercentile: number // 0-100, percentage of time IV was below current level
  period: '30d' | '90d' | '252d' // lookback period
  historicalRange: {
    min: number
    max: number
    mean: number
    std: number
  }
  interpretation: 'extremely_low' | 'low' | 'normal' | 'high' | 'extremely_high'
}

export interface RealizedVsImplied {
  symbol: string
  period: string
  realizedVolatility: number
  impliedVolatility: number
  spread: number // IV - RV
  spreadPercentile: number
  interpretation: 'undervalued' | 'fairly_valued' | 'overvalued'
  expectedDirection: 'vol_crush' | 'vol_expansion' | 'neutral'
}

export interface EventVolatility {
  symbol: string
  eventType: 'earnings' | 'dividend' | 'fda_approval' | 'merger' | 'macro_event'
  eventDate: Date
  daysUntilEvent: number
  preEventIV: number
  postEventIVExpected: number
  historicalEventMove: number // average move from similar events
  eventPremium: number // extra premium due to event
  eventRisk: 'low' | 'medium' | 'high' | 'extreme'
}

/**
 * Build volatility surface from options chain data
 */
export function buildVolatilitySurface(
  symbol: string,
  calls: OptionContract[],
  puts: OptionContract[],
  underlyingPrice: number
): VolatilitySurface {
  const allOptions = [...calls, ...puts]
  const timestamp = new Date()
  
  // Create volatility points
  const surface: VolatilityPoint[] = allOptions.map(option => ({
    strike: option.strike,
    expiration: option.expiration,
    daysToExpiry: option.daysToExpiry,
    moneyness: underlyingPrice / option.strike,
    impliedVolatility: option.impliedVolatility,
    volume: option.volume,
    openInterest: option.openInterest,
    lastPrice: option.lastPrice,
    delta: Math.abs(option.delta)
  }))

  // Calculate ATM volatility
  const atmVolatility = getATMVolatility(surface, underlyingPrice)
  
  // Build volatility smile for nearest expiration
  const nearestExpiration = getNearestExpiration(allOptions)
  const volSmile = buildVolatilitySmile(surface, nearestExpiration, underlyingPrice)
  
  // Calculate skew
  const skew = calculateVolatilitySkew(volSmile)
  
  // Build term structure
  const termStructure = buildTermStructure(surface)
  
  return {
    symbol,
    timestamp,
    surface,
    atmVolatility,
    volSmile,
    skew,
    termStructure
  }
}

/**
 * Calculate IV rank and percentile
 */
export function calculateIVRankPercentile(
  currentIV: number,
  historicalIVs: number[],
  period: '30d' | '90d' | '252d' = '252d'
): IVRankPercentile {
  const sorted = historicalIVs.sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const mean = sorted.reduce((sum, iv) => sum + iv, 0) / sorted.length
  const variance = sorted.reduce((sum, iv) => sum + Math.pow(iv - mean, 2), 0) / sorted.length
  const std = Math.sqrt(variance)
  
  // IV Rank: (current - min) / (max - min) * 100
  const ivRank = ((currentIV - min) / (max - min)) * 100
  
  // IV Percentile: percentage of observations below current IV
  const belowCurrent = sorted.filter(iv => iv < currentIV).length
  const ivPercentile = (belowCurrent / sorted.length) * 100
  
  // Interpretation
  let interpretation: IVRankPercentile['interpretation']
  if (ivPercentile < 10) interpretation = 'extremely_low'
  else if (ivPercentile < 25) interpretation = 'low'
  else if (ivPercentile < 75) interpretation = 'normal'
  else if (ivPercentile < 90) interpretation = 'high'
  else interpretation = 'extremely_high'
  
  return {
    symbol: '', // Will be set by caller
    currentIV,
    ivRank,
    ivPercentile,
    period,
    historicalRange: { min, max, mean, std },
    interpretation
  }
}

/**
 * Compare realized vs implied volatility
 */
export function calculateRealizedVsImplied(
  historicalPrices: number[],
  currentImpliedVol: number,
  period: string = '30d'
): RealizedVsImplied {
  // Calculate realized volatility from price returns
  const returns = []
  for (let i = 1; i < historicalPrices.length; i++) {
    returns.push(Math.log(historicalPrices[i] / historicalPrices[i - 1]))
  }
  
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length
  const realizedVolatility = Math.sqrt(variance * 252) // Annualized
  
  const spread = currentImpliedVol - realizedVolatility
  
  // Estimate spread percentile (would use historical data in production)
  const spreadPercentile = spread > 0 ? 75 : 25 // Simplified
  
  // Interpretation
  let interpretation: RealizedVsImplied['interpretation']
  let expectedDirection: RealizedVsImplied['expectedDirection']
  
  if (spread > 0.05) {
    interpretation = 'overvalued'
    expectedDirection = 'vol_crush'
  } else if (spread < -0.05) {
    interpretation = 'undervalued'
    expectedDirection = 'vol_expansion'
  } else {
    interpretation = 'fairly_valued'
    expectedDirection = 'neutral'
  }
  
  return {
    symbol: '', // Will be set by caller
    period,
    realizedVolatility,
    impliedVolatility: currentImpliedVol,
    spread,
    spreadPercentile,
    interpretation,
    expectedDirection
  }
}

/**
 * Detect upcoming events and calculate event volatility
 */
export function detectEventVolatility(
  symbol: string,
  nextEarningsDate?: Date,
  nextDividendDate?: Date
): EventVolatility | null {
  const now = new Date()
  
  // Check for earnings
  if (nextEarningsDate) {
    const daysUntilEvent = Math.ceil((nextEarningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilEvent >= 0 && daysUntilEvent <= 30) {
      return {
        symbol,
        eventType: 'earnings',
        eventDate: nextEarningsDate,
        daysUntilEvent,
        preEventIV: 0, // Would be calculated from options
        postEventIVExpected: 0, // Would be calculated from historical data
        historicalEventMove: 0, // Would come from earnings history
        eventPremium: 0, // Would be calculated from pre/post event vol
        eventRisk: 'medium' // Would be determined by historical volatility
      }
    }
  }
  
  return null
}

// Helper functions

function getATMVolatility(surface: VolatilityPoint[], underlyingPrice: number): number {
  // Find the strike closest to current price
  let closestPoint = surface[0]
  let minDifference = Math.abs(surface[0].strike - underlyingPrice)
  
  for (const point of surface) {
    const difference = Math.abs(point.strike - underlyingPrice)
    if (difference < minDifference) {
      minDifference = difference
      closestPoint = point
    }
  }
  
  return closestPoint?.impliedVolatility || 0.3
}

function getNearestExpiration(options: OptionContract[]): string {
  if (options.length === 0) return ''
  
  const now = new Date()
  let nearest = options[0]
  let minDays = options[0].daysToExpiry
  
  for (const option of options) {
    if (option.daysToExpiry < minDays && option.daysToExpiry > 0) {
      minDays = option.daysToExpiry
      nearest = option
    }
  }
  
  return nearest.expiration
}

function buildVolatilitySmile(
  surface: VolatilityPoint[],
  expiration: string,
  underlyingPrice: number
): VolatilitySmile {
  const expirationPoints = surface.filter(p => p.expiration === expiration)
  
  // Sort by strike
  const points = expirationPoints
    .sort((a, b) => a.strike - b.strike)
    .map(p => ({
      strike: p.strike,
      moneyness: p.moneyness,
      impliedVolatility: p.impliedVolatility,
      delta: p.delta
    }))
  
  const atmVolatility = getATMVolatility(expirationPoints, underlyingPrice)
  
  // Calculate skew slope (simplified)
  const lowStrike = points.find(p => p.moneyness < 0.9)
  const highStrike = points.find(p => p.moneyness > 1.1)
  const skewSlope = lowStrike && highStrike 
    ? (highStrike.impliedVolatility - lowStrike.impliedVolatility) / (highStrike.strike - lowStrike.strike)
    : 0
  
  // Calculate convexity (simplified)
  const convexity = points.length > 2 ? 0.01 : 0 // Would require polynomial fitting
  
  return {
    expiration,
    points,
    atmVolatility,
    skewSlope,
    convexity
  }
}

function calculateVolatilitySkew(volSmile: VolatilitySmile): VolatilitySkew {
  const { points, atmVolatility } = volSmile
  
  // Find 25-delta equivalent strikes (approximate)
  const put25Delta = points.find(p => p.delta >= 0.2 && p.delta <= 0.3 && p.moneyness < 1)
  const call25Delta = points.find(p => p.delta >= 0.2 && p.delta <= 0.3 && p.moneyness > 1)
  
  const putSkew = put25Delta ? put25Delta.impliedVolatility - atmVolatility : 0
  const callSkew = call25Delta ? call25Delta.impliedVolatility - atmVolatility : 0
  const overallSkew = putSkew - callSkew
  
  let skewDirection: VolatilitySkew['skewDirection']
  if (overallSkew > 0.02) skewDirection = 'put_skew'
  else if (overallSkew < -0.02) skewDirection = 'call_skew'
  else skewDirection = 'neutral'
  
  return {
    putSkew,
    callSkew,
    overallSkew,
    skewDirection
  }
}

function buildTermStructure(surface: VolatilityPoint[]): TermStructurePoint[] {
  // Group by expiration
  const expirationMap = new Map<string, VolatilityPoint[]>()
  
  for (const point of surface) {
    if (!expirationMap.has(point.expiration)) {
      expirationMap.set(point.expiration, [])
    }
    expirationMap.get(point.expiration)!.push(point)
  }
  
  // Calculate ATM vol for each expiration
  const termStructure: TermStructurePoint[] = []
  
  for (const [expiration, points] of expirationMap) {
    const atmVol = points.reduce((sum, p) => sum + p.impliedVolatility, 0) / points.length
    const daysToExpiry = points[0]?.daysToExpiry || 0
    
    termStructure.push({
      expiration,
      daysToExpiry,
      atmVolatility: atmVol,
      percentile: 0, // Would be calculated from historical data
      rank: 0 // Would be calculated from historical data
    })
  }
  
  return termStructure.sort((a, b) => a.daysToExpiry - b.daysToExpiry)
}

/**
 * Analyze volatility regime
 */
export function analyzeVolatilityRegime(ivRankPercentile: IVRankPercentile): {
  regime: 'low_vol' | 'normal_vol' | 'high_vol' | 'extreme_vol'
  recommendation: 'sell_premium' | 'buy_premium' | 'neutral'
  confidence: number
} {
  const { ivPercentile, interpretation } = ivRankPercentile
  
  let regime: 'low_vol' | 'normal_vol' | 'high_vol' | 'extreme_vol'
  let recommendation: 'sell_premium' | 'buy_premium' | 'neutral'
  let confidence: number
  
  if (interpretation === 'extremely_low' || interpretation === 'low') {
    regime = 'low_vol'
    recommendation = 'buy_premium'
    confidence = interpretation === 'extremely_low' ? 0.9 : 0.7
  } else if (interpretation === 'extremely_high' || interpretation === 'high') {
    regime = 'high_vol'
    recommendation = 'sell_premium'
    confidence = interpretation === 'extremely_high' ? 0.9 : 0.7
  } else {
    regime = 'normal_vol'
    recommendation = 'neutral'
    confidence = 0.5
  }
  
  return { regime, recommendation, confidence }
}

/**
 * Calculate volatility surface interpolation
 */
export function interpolateVolatilitySurface(
  surface: VolatilitySurface,
  targetStrike: number,
  targetDaysToExpiry: number
): number {
  const { surface: points } = surface
  
  // Find surrounding points
  const nearbyPoints = points
    .filter(p => Math.abs(p.daysToExpiry - targetDaysToExpiry) <= 30)
    .filter(p => Math.abs(p.strike - targetStrike) <= targetStrike * 0.2)
    .sort((a, b) => {
      const aDistance = Math.abs(a.strike - targetStrike) + Math.abs(a.daysToExpiry - targetDaysToExpiry)
      const bDistance = Math.abs(b.strike - targetStrike) + Math.abs(b.daysToExpiry - targetDaysToExpiry)
      return aDistance - bDistance
    })
  
  if (nearbyPoints.length === 0) {
    return surface.atmVolatility // Fallback to ATM vol
  }
  
  if (nearbyPoints.length === 1) {
    return nearbyPoints[0].impliedVolatility
  }
  
  // Weighted average based on distance
  let weightedSum = 0
  let totalWeight = 0
  
  for (const point of nearbyPoints.slice(0, 4)) { // Use 4 closest points
    const strikeDistance = Math.abs(point.strike - targetStrike)
    const timeDistance = Math.abs(point.daysToExpiry - targetDaysToExpiry)
    const weight = 1 / (1 + strikeDistance + timeDistance)
    
    weightedSum += point.impliedVolatility * weight
    totalWeight += weight
  }
  
  return weightedSum / totalWeight
}

/**
 * Detect volatility anomalies
 */
export function detectVolatilityAnomalies(surface: VolatilitySurface): Array<{
  type: 'extreme_skew' | 'vol_spike' | 'vol_gap' | 'liquidity_gap'
  severity: 'low' | 'medium' | 'high'
  description: string
  affectedStrikes: number[]
  recommendation: string
}> {
  const anomalies = []
  
  // Extreme skew detection
  if (Math.abs(surface.skew.overallSkew) > 0.1) {
    anomalies.push({
      type: 'extreme_skew' as const,
      severity: 'high' as const,
      description: `Extreme ${surface.skew.skewDirection.replace('_', ' ')} detected`,
      affectedStrikes: surface.volSmile.points.map(p => p.strike),
      recommendation: 'Consider skew-aware strategies or arbitrage opportunities'
    })
  }
  
  // Vol spike detection
  if (surface.atmVolatility > 0.5) {
    anomalies.push({
      type: 'vol_spike' as const,
      severity: 'medium' as const,
      description: 'Elevated implied volatility detected',
      affectedStrikes: surface.surface.map(p => p.strike),
      recommendation: 'Consider premium selling strategies'
    })
  }
  
  // Liquidity gaps
  const lowLiquidityPoints = surface.surface.filter(p => p.volume < 10 && p.openInterest < 100)
  if (lowLiquidityPoints.length > surface.surface.length * 0.3) {
    anomalies.push({
      type: 'liquidity_gap' as const,
      severity: 'medium' as const,
      description: 'Low liquidity detected across multiple strikes',
      affectedStrikes: lowLiquidityPoints.map(p => p.strike),
      recommendation: 'Focus on liquid strikes or consider smaller position sizes'
    })
  }
  
  return anomalies
}