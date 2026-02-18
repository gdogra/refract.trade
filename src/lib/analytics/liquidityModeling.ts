/**
 * Liquidity Modeling Framework
 * 
 * Institutional-grade liquidity analysis including:
 * - Open interest depth analysis
 * - Volume profile assessment
 * - Bid-ask microstructure analysis
 * - Slippage estimation
 * - Order book impact modeling
 * - Position scaling capability
 */

import { OptionContract } from '@/lib/options/yahooOptions'

export interface LiquidityProfile {
  symbol: string
  timestamp: Date
  overallLiquidityScore: number // 0-100 scale
  liquidityRating: 'excellent' | 'good' | 'fair' | 'poor' | 'illiquid'
  openInterestAnalysis: OpenInterestAnalysis
  volumeProfile: VolumeProfileAnalysis
  bidAskAnalysis: BidAskAnalysis
  slippageEstimates: SlippageEstimates
  scalingLimits: ScalingLimits
  executionRisk: ExecutionRiskAssessment
}

export interface OpenInterestAnalysis {
  totalOpenInterest: number
  openInterestByStrike: OpenInterestByStrike[]
  concentrationRisk: number // 0-1 scale
  topStrikesOI: Array<{ strike: number; openInterest: number; percentage: number }>
  oiTrend: 'increasing' | 'decreasing' | 'stable'
  oiDistribution: 'concentrated' | 'distributed' | 'fragmented'
}

export interface OpenInterestByStrike {
  strike: number
  callOpenInterest: number
  putOpenInterest: number
  totalOpenInterest: number
  moneyness: number
  liquidityTier: 'tier1' | 'tier2' | 'tier3' | 'illiquid'
}

export interface VolumeProfileAnalysis {
  averageDailyVolume: number
  volumeByStrike: VolumeByStrike[]
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  volumeConcentration: number // 0-1 scale
  institutionalFlow: 'buying' | 'selling' | 'neutral'
  retailFlow: 'buying' | 'selling' | 'neutral'
}

export interface VolumeByStrike {
  strike: number
  callVolume: number
  putVolume: number
  totalVolume: number
  volumeToOIRatio: number
  liquidityScore: number
}

export interface BidAskAnalysis {
  averageSpread: number
  spreadByStrike: SpreadByStrike[]
  marketDepth: MarketDepthLevel[]
  microstructureQuality: 'excellent' | 'good' | 'fair' | 'poor'
  tightestMarkets: Array<{ strike: number; spread: number; midpoint: number }>
  widestMarkets: Array<{ strike: number; spread: number; midpoint: number }>
}

export interface SpreadByStrike {
  strike: number
  callSpread: number
  putSpread: number
  callSpreadPercent: number
  putSpreadPercent: number
  effectiveSpread: number // Volume-weighted
}

export interface MarketDepthLevel {
  level: 1 | 2 | 3 | 4 | 5 // Market depth levels
  bidSize: number
  askSize: number
  bidPrice: number
  askPrice: number
  totalSize: number
}

export interface SlippageEstimates {
  smallOrder: SlippageBySize    // 1-5 contracts
  mediumOrder: SlippageBySize   // 5-25 contracts
  largeOrder: SlippageBySize    // 25-100 contracts
  blockOrder: SlippageBySize    // 100+ contracts
  marketImpactFunction: MarketImpactPoint[]
}

export interface SlippageBySize {
  contracts: number
  estimatedSlippage: number // Dollars per contract
  slippagePercent: number
  confidence: number // 0-1 scale
  executionMethod: 'market' | 'limit' | 'iceberg' | 'twap'
}

export interface MarketImpactPoint {
  orderSize: number
  priceImpact: number // Basis points
  temporaryImpact: number
  permanentImpact: number
  recoveryTime: number // Minutes
}

export interface ScalingLimits {
  maxRecommendedSize: number // Contracts
  liquidityConstraints: LiquidityConstraint[]
  scalingStrategy: 'single_fill' | 'split_order' | 'time_weighted' | 'iceberg'
  estimatedExecutionTime: number // Minutes
}

export interface LiquidityConstraint {
  constraintType: 'open_interest' | 'volume' | 'spread' | 'market_depth'
  limitingFactor: string
  maxSize: number
  reasoning: string
}

export interface ExecutionRiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  primaryRisks: ExecutionRisk[]
  mitigationStrategies: string[]
  optimalExecutionTimes: string[]
  avoidTimes: string[]
}

export interface ExecutionRisk {
  type: 'liquidity_gap' | 'wide_spreads' | 'low_volume' | 'expiration_risk' | 'pin_risk'
  severity: number // 0-10 scale
  probability: number // 0-1 scale
  impact: string
  mitigation: string
}

/**
 * Analyze liquidity profile for an options chain
 */
export function analyzeLiquidityProfile(
  symbol: string,
  calls: OptionContract[],
  puts: OptionContract[],
  underlyingPrice: number
): LiquidityProfile {
  const timestamp = new Date()
  const allOptions = [...calls, ...puts]
  
  // Analyze open interest
  const openInterestAnalysis = analyzeOpenInterest(allOptions, underlyingPrice)
  
  // Analyze volume profile
  const volumeProfile = analyzeVolumeProfile(allOptions)
  
  // Analyze bid-ask spreads
  const bidAskAnalysis = analyzeBidAskSpreads(allOptions)
  
  // Calculate slippage estimates
  const slippageEstimates = calculateSlippageEstimates(allOptions)
  
  // Determine scaling limits
  const scalingLimits = calculateScalingLimits(allOptions, openInterestAnalysis, volumeProfile)
  
  // Assess execution risk
  const executionRisk = assessExecutionRisk(allOptions, bidAskAnalysis, volumeProfile)
  
  // Calculate overall liquidity score
  const overallLiquidityScore = calculateOverallLiquidityScore(
    openInterestAnalysis,
    volumeProfile,
    bidAskAnalysis,
    executionRisk
  )
  
  let liquidityRating: LiquidityProfile['liquidityRating']
  if (overallLiquidityScore >= 80) liquidityRating = 'excellent'
  else if (overallLiquidityScore >= 65) liquidityRating = 'good'
  else if (overallLiquidityScore >= 45) liquidityRating = 'fair'
  else if (overallLiquidityScore >= 25) liquidityRating = 'poor'
  else liquidityRating = 'illiquid'
  
  return {
    symbol,
    timestamp,
    overallLiquidityScore,
    liquidityRating,
    openInterestAnalysis,
    volumeProfile,
    bidAskAnalysis,
    slippageEstimates,
    scalingLimits,
    executionRisk
  }
}

/**
 * Analyze open interest patterns
 */
function analyzeOpenInterest(options: OptionContract[], underlyingPrice: number): OpenInterestAnalysis {
  const strikeMap = new Map<number, { callOI: number; putOI: number }>()
  
  for (const option of options) {
    if (!strikeMap.has(option.strike)) {
      strikeMap.set(option.strike, { callOI: 0, putOI: 0 })
    }
    
    const data = strikeMap.get(option.strike)!
    if (option.type === 'call') {
      data.callOI += option.openInterest
    } else {
      data.putOI += option.openInterest
    }
  }
  
  const openInterestByStrike: OpenInterestByStrike[] = Array.from(strikeMap.entries())
    .map(([strike, data]) => {
      const totalOI = data.callOI + data.putOI
      const moneyness = underlyingPrice / strike
      
      let liquidityTier: OpenInterestByStrike['liquidityTier']
      if (totalOI >= 1000) liquidityTier = 'tier1'
      else if (totalOI >= 500) liquidityTier = 'tier2'
      else if (totalOI >= 100) liquidityTier = 'tier3'
      else liquidityTier = 'illiquid'
      
      return {
        strike,
        callOpenInterest: data.callOI,
        putOpenInterest: data.putOI,
        totalOpenInterest: totalOI,
        moneyness,
        liquidityTier
      }
    })
    .sort((a, b) => a.strike - b.strike)
  
  const totalOpenInterest = openInterestByStrike.reduce((sum, point) => sum + point.totalOpenInterest, 0)
  
  // Calculate concentration risk (Herfindahl Index)
  const concentrationRisk = openInterestByStrike.reduce((sum, point) => {
    const share = point.totalOpenInterest / totalOpenInterest
    return sum + share * share
  }, 0)
  
  // Top strikes by OI
  const topStrikesOI = openInterestByStrike
    .sort((a, b) => b.totalOpenInterest - a.totalOpenInterest)
    .slice(0, 5)
    .map(point => ({
      strike: point.strike,
      openInterest: point.totalOpenInterest,
      percentage: (point.totalOpenInterest / totalOpenInterest) * 100
    }))
  
  return {
    totalOpenInterest,
    openInterestByStrike,
    concentrationRisk,
    topStrikesOI,
    oiTrend: 'stable', // Would be calculated from historical data
    oiDistribution: concentrationRisk > 0.3 ? 'concentrated' : concentrationRisk > 0.1 ? 'distributed' : 'fragmented'
  }
}

/**
 * Analyze volume patterns and flow
 */
function analyzeVolumeProfile(options: OptionContract[]): VolumeProfileAnalysis {
  const strikeVolumeMap = new Map<number, { callVol: number; putVol: number; callOI: number; putOI: number }>()
  
  for (const option of options) {
    if (!strikeVolumeMap.has(option.strike)) {
      strikeVolumeMap.set(option.strike, { callVol: 0, putVol: 0, callOI: 0, putOI: 0 })
    }
    
    const data = strikeVolumeMap.get(option.strike)!
    if (option.type === 'call') {
      data.callVol += option.volume
      data.callOI += option.openInterest
    } else {
      data.putVol += option.volume
      data.putOI += option.openInterest
    }
  }
  
  const volumeByStrike: VolumeByStrike[] = Array.from(strikeVolumeMap.entries())
    .map(([strike, data]) => {
      const totalVolume = data.callVol + data.putVol
      const totalOI = data.callOI + data.putOI
      const volumeToOIRatio = totalOI > 0 ? totalVolume / totalOI : 0
      
      // Liquidity score based on volume and OI
      let liquidityScore = 0
      if (totalVolume >= 100 && totalOI >= 1000) liquidityScore = 100
      else if (totalVolume >= 50 && totalOI >= 500) liquidityScore = 80
      else if (totalVolume >= 20 && totalOI >= 200) liquidityScore = 60
      else if (totalVolume >= 10 && totalOI >= 100) liquidityScore = 40
      else if (totalVolume >= 5 && totalOI >= 50) liquidityScore = 20
      else liquidityScore = 10
      
      return {
        strike,
        callVolume: data.callVol,
        putVolume: data.putVol,
        totalVolume,
        volumeToOIRatio,
        liquidityScore
      }
    })
    .sort((a, b) => a.strike - b.strike)
  
  const averageDailyVolume = volumeByStrike.reduce((sum, point) => sum + point.totalVolume, 0) / volumeByStrike.length
  
  // Calculate volume concentration
  const totalVolume = volumeByStrike.reduce((sum, point) => sum + point.totalVolume, 0)
  const volumeConcentration = volumeByStrike.reduce((sum, point) => {
    const share = point.totalVolume / totalVolume
    return sum + share * share
  }, 0)
  
  return {
    averageDailyVolume,
    volumeByStrike,
    volumeTrend: 'stable', // Would be calculated from historical data
    volumeConcentration,
    institutionalFlow: 'neutral', // Would be inferred from block trades
    retailFlow: 'neutral' // Would be inferred from small lot trades
  }
}

/**
 * Analyze bid-ask spreads and market microstructure
 */
function analyzeBidAskSpreads(options: OptionContract[]): BidAskAnalysis {
  const spreadByStrike: SpreadByStrike[] = options.reduce((acc, option) => {
    const existingStrike = acc.find(s => s.strike === option.strike)
    const spread = Math.abs(option.ask - option.bid)
    const spreadPercent = option.midpoint > 0 ? (spread / option.midpoint) * 100 : 0
    
    if (existingStrike) {
      if (option.type === 'call') {
        existingStrike.callSpread = spread
        existingStrike.callSpreadPercent = spreadPercent
      } else {
        existingStrike.putSpread = spread
        existingStrike.putSpreadPercent = spreadPercent
      }
      // Update effective spread (volume-weighted)
      existingStrike.effectiveSpread = (existingStrike.callSpread + existingStrike.putSpread) / 2
    } else {
      acc.push({
        strike: option.strike,
        callSpread: option.type === 'call' ? spread : 0,
        putSpread: option.type === 'put' ? spread : 0,
        callSpreadPercent: option.type === 'call' ? spreadPercent : 0,
        putSpreadPercent: option.type === 'put' ? spreadPercent : 0,
        effectiveSpread: spread
      })
    }
    
    return acc
  }, [] as SpreadByStrike[])
  
  const averageSpread = spreadByStrike.reduce((sum, point) => sum + point.effectiveSpread, 0) / spreadByStrike.length
  
  // Market depth (simplified - would require Level II data)
  const marketDepth: MarketDepthLevel[] = [
    { level: 1, bidSize: 10, askSize: 10, bidPrice: 0, askPrice: 0, totalSize: 20 },
    { level: 2, bidSize: 8, askSize: 8, bidPrice: 0, askPrice: 0, totalSize: 16 },
    { level: 3, bidSize: 5, askSize: 5, bidPrice: 0, askPrice: 0, totalSize: 10 },
    { level: 4, bidSize: 3, askSize: 3, bidPrice: 0, askPrice: 0, totalSize: 6 },
    { level: 5, bidSize: 2, askSize: 2, bidPrice: 0, askPrice: 0, totalSize: 4 }
  ]
  
  // Microstructure quality assessment
  let microstructureQuality: BidAskAnalysis['microstructureQuality']
  if (averageSpread < 0.05) microstructureQuality = 'excellent'
  else if (averageSpread < 0.15) microstructureQuality = 'good'
  else if (averageSpread < 0.30) microstructureQuality = 'fair'
  else microstructureQuality = 'poor'
  
  // Find tightest and widest markets
  const sortedBySpreads = [...spreadByStrike].sort((a, b) => a.effectiveSpread - b.effectiveSpread)
  const tightestMarkets = sortedBySpreads.slice(0, 3).map(s => ({
    strike: s.strike,
    spread: s.effectiveSpread,
    midpoint: 0 // Would be calculated from bid/ask
  }))
  const widestMarkets = sortedBySpreads.slice(-3).map(s => ({
    strike: s.strike,
    spread: s.effectiveSpread,
    midpoint: 0
  }))
  
  return {
    averageSpread,
    spreadByStrike,
    marketDepth,
    microstructureQuality,
    tightestMarkets,
    widestMarkets
  }
}

/**
 * Calculate market impact and slippage estimates
 */
function calculateSlippageEstimates(options: OptionContract[]): SlippageEstimates {
  // Market impact function based on square root rule
  const marketImpactFunction: MarketImpactPoint[] = []
  
  for (let size = 1; size <= 100; size += 5) {
    const sqrtImpact = Math.sqrt(size) * 0.01 // Simplified model
    const temporaryImpact = sqrtImpact * 0.7
    const permanentImpact = sqrtImpact * 0.3
    const recoveryTime = Math.sqrt(size) * 2 // Minutes
    
    marketImpactFunction.push({
      orderSize: size,
      priceImpact: sqrtImpact * 100, // Basis points
      temporaryImpact,
      permanentImpact,
      recoveryTime
    })
  }
  
  // Calculate slippage by order size
  const averageSpread = options.reduce((sum, opt) => sum + (opt.ask - opt.bid), 0) / options.length
  const averagePrice = options.reduce((sum, opt) => sum + opt.midpoint, 0) / options.length
  
  const smallOrder: SlippageBySize = {
    contracts: 5,
    estimatedSlippage: averageSpread * 0.5,
    slippagePercent: (averageSpread * 0.5) / averagePrice * 100,
    confidence: 0.9,
    executionMethod: 'limit'
  }
  
  const mediumOrder: SlippageBySize = {
    contracts: 15,
    estimatedSlippage: averageSpread * 0.75,
    slippagePercent: (averageSpread * 0.75) / averagePrice * 100,
    confidence: 0.8,
    executionMethod: 'limit'
  }
  
  const largeOrder: SlippageBySize = {
    contracts: 50,
    estimatedSlippage: averageSpread * 1.2,
    slippagePercent: (averageSpread * 1.2) / averagePrice * 100,
    confidence: 0.7,
    executionMethod: 'iceberg'
  }
  
  const blockOrder: SlippageBySize = {
    contracts: 100,
    estimatedSlippage: averageSpread * 2.0,
    slippagePercent: (averageSpread * 2.0) / averagePrice * 100,
    confidence: 0.6,
    executionMethod: 'twap'
  }
  
  return {
    smallOrder,
    mediumOrder,
    largeOrder,
    blockOrder,
    marketImpactFunction
  }
}

/**
 * Calculate position scaling limits
 */
function calculateScalingLimits(
  options: OptionContract[],
  oiAnalysis: OpenInterestAnalysis,
  volumeProfile: VolumeProfileAnalysis
): ScalingLimits {
  const constraints: LiquidityConstraint[] = []
  
  // Open interest constraint (don't trade more than 10% of OI)
  const avgOpenInterest = oiAnalysis.openInterestByStrike.reduce((sum, s) => sum + s.totalOpenInterest, 0) / oiAnalysis.openInterestByStrike.length
  const oiConstraint = Math.floor(avgOpenInterest * 0.1)
  constraints.push({
    constraintType: 'open_interest',
    limitingFactor: 'Average open interest across strikes',
    maxSize: oiConstraint,
    reasoning: 'Limit to 10% of average open interest to avoid market impact'
  })
  
  // Volume constraint (don't trade more than 20% of average daily volume)
  const volumeConstraint = Math.floor(volumeProfile.averageDailyVolume * 0.2)
  constraints.push({
    constraintType: 'volume',
    limitingFactor: 'Average daily volume',
    maxSize: volumeConstraint,
    reasoning: 'Limit to 20% of average daily volume to maintain execution quality'
  })
  
  // Spread constraint
  const tightSpreads = options.filter(opt => (opt.ask - opt.bid) / opt.midpoint < 0.1).length
  const spreadConstraint = tightSpreads * 2 // Can trade 2 contracts per tight spread
  constraints.push({
    constraintType: 'spread',
    limitingFactor: 'Number of tight spreads',
    maxSize: spreadConstraint,
    reasoning: 'Based on availability of tight bid-ask spreads'
  })
  
  // Market depth constraint
  const depthConstraint = 25 // Conservative estimate without Level II data
  constraints.push({
    constraintType: 'market_depth',
    limitingFactor: 'Estimated market depth',
    maxSize: depthConstraint,
    reasoning: 'Conservative estimate based on typical market maker inventory'
  })
  
  const maxRecommendedSize = Math.min(...constraints.map(c => c.maxSize))
  
  let scalingStrategy: ScalingLimits['scalingStrategy']
  if (maxRecommendedSize <= 10) scalingStrategy = 'single_fill'
  else if (maxRecommendedSize <= 50) scalingStrategy = 'split_order'
  else if (maxRecommendedSize <= 100) scalingStrategy = 'time_weighted'
  else scalingStrategy = 'iceberg'
  
  const estimatedExecutionTime = maxRecommendedSize <= 10 ? 1 : maxRecommendedSize <= 50 ? 5 : 15
  
  return {
    maxRecommendedSize,
    liquidityConstraints: constraints,
    scalingStrategy,
    estimatedExecutionTime
  }
}

/**
 * Assess execution risk factors
 */
function assessExecutionRisk(
  options: OptionContract[],
  bidAskAnalysis: BidAskAnalysis,
  volumeProfile: VolumeProfileAnalysis
): ExecutionRiskAssessment {
  const risks: ExecutionRisk[] = []
  
  // Wide spreads risk
  if (bidAskAnalysis.averageSpread > 0.2) {
    risks.push({
      type: 'wide_spreads',
      severity: bidAskAnalysis.averageSpread > 0.5 ? 8 : 6,
      probability: 0.8,
      impact: 'Higher execution costs and slippage',
      mitigation: 'Use limit orders with patience or smaller position sizes'
    })
  }
  
  // Low volume risk
  if (volumeProfile.averageDailyVolume < 50) {
    risks.push({
      type: 'low_volume',
      severity: volumeProfile.averageDailyVolume < 20 ? 9 : 7,
      probability: 0.9,
      impact: 'Difficulty finding counterparties, increased slippage',
      mitigation: 'Trade smaller sizes or consider more liquid alternatives'
    })
  }
  
  // Expiration risk for options expiring within 7 days
  const nearExpiration = options.some(opt => opt.daysToExpiry <= 7)
  if (nearExpiration) {
    risks.push({
      type: 'expiration_risk',
      severity: 7,
      probability: 0.6,
      impact: 'Accelerated time decay and potential assignment risk',
      mitigation: 'Monitor positions closely and consider early closure'
    })
  }
  
  // Liquidity gap risk
  const illiquidStrikes = options.filter(opt => opt.volume < 10 && opt.openInterest < 100).length
  if (illiquidStrikes > options.length * 0.5) {
    risks.push({
      type: 'liquidity_gap',
      severity: 8,
      probability: 0.7,
      impact: 'Significant portions of option chain are illiquid',
      mitigation: 'Focus on most liquid strikes near the money'
    })
  }
  
  // Determine overall risk level
  const maxSeverity = Math.max(...risks.map(r => r.severity), 0)
  let riskLevel: ExecutionRiskAssessment['riskLevel']
  if (maxSeverity >= 8) riskLevel = 'extreme'
  else if (maxSeverity >= 6) riskLevel = 'high'
  else if (maxSeverity >= 4) riskLevel = 'medium'
  else riskLevel = 'low'
  
  const mitigationStrategies = [
    ...Array.from(new Set(risks.map(r => r.mitigation)))
  ]
  
  return {
    riskLevel,
    primaryRisks: risks,
    mitigationStrategies,
    optimalExecutionTimes: ['9:30-10:30 AM EST', '3:00-4:00 PM EST'], // Market open/close
    avoidTimes: ['11:30-1:30 PM EST', 'Last 30 minutes on Friday'] // Low volume periods
  }
}

/**
 * Calculate overall liquidity score
 */
function calculateOverallLiquidityScore(
  oiAnalysis: OpenInterestAnalysis,
  volumeProfile: VolumeProfileAnalysis,
  bidAskAnalysis: BidAskAnalysis,
  executionRisk: ExecutionRiskAssessment
): number {
  // Weight factors
  const weights = {
    openInterest: 0.3,
    volume: 0.25,
    spreads: 0.25,
    executionRisk: 0.2
  }
  
  // Open interest score
  const oiScore = Math.min(100, (oiAnalysis.totalOpenInterest / 10000) * 100)
  
  // Volume score
  const volumeScore = Math.min(100, (volumeProfile.averageDailyVolume / 1000) * 100)
  
  // Spread score (inverse relationship)
  const spreadScore = Math.max(0, 100 - (bidAskAnalysis.averageSpread * 100))
  
  // Execution risk score (inverse relationship)
  const riskScoreMap = { low: 100, medium: 70, high: 40, extreme: 10 }
  const executionScore = riskScoreMap[executionRisk.riskLevel]
  
  const overallScore = 
    oiScore * weights.openInterest +
    volumeScore * weights.volume +
    spreadScore * weights.spreads +
    executionScore * weights.executionRisk
  
  return Math.round(overallScore)
}

/**
 * Real-time liquidity monitoring
 */
export function monitorLiquidityChanges(
  currentProfile: LiquidityProfile,
  previousProfile: LiquidityProfile
): {
  changes: LiquidityChange[]
  deteriorationAlert: boolean
  impactLevel: 'minimal' | 'moderate' | 'significant' | 'severe'
} {
  const changes: LiquidityChange[] = []
  
  // Check score change
  const scoreChange = currentProfile.overallLiquidityScore - previousProfile.overallLiquidityScore
  if (Math.abs(scoreChange) >= 10) {
    changes.push({
      type: 'liquidity_score',
      direction: scoreChange > 0 ? 'improved' : 'deteriorated',
      magnitude: Math.abs(scoreChange),
      description: `Overall liquidity score ${scoreChange > 0 ? 'improved' : 'deteriorated'} by ${Math.abs(scoreChange)} points`
    })
  }
  
  // Check spread changes
  const spreadChange = currentProfile.bidAskAnalysis.averageSpread - previousProfile.bidAskAnalysis.averageSpread
  if (Math.abs(spreadChange) >= 0.05) {
    changes.push({
      type: 'spread_change',
      direction: spreadChange > 0 ? 'widened' : 'tightened',
      magnitude: Math.abs(spreadChange),
      description: `Average spreads ${spreadChange > 0 ? 'widened' : 'tightened'} by $${Math.abs(spreadChange).toFixed(2)}`
    })
  }
  
  // Check volume changes
  const volumeChange = (currentProfile.volumeProfile.averageDailyVolume - previousProfile.volumeProfile.averageDailyVolume) / 
                      previousProfile.volumeProfile.averageDailyVolume
  if (Math.abs(volumeChange) >= 0.25) {
    changes.push({
      type: 'volume_change',
      direction: volumeChange > 0 ? 'increased' : 'decreased',
      magnitude: Math.abs(volumeChange) * 100,
      description: `Volume ${volumeChange > 0 ? 'increased' : 'decreased'} by ${(Math.abs(volumeChange) * 100).toFixed(1)}%`
    })
  }
  
  const deteriorationAlert = changes.some(c => c.direction === 'deteriorated' || c.direction === 'widened' || c.direction === 'decreased')
  
  let impactLevel: 'minimal' | 'moderate' | 'significant' | 'severe'
  const maxMagnitude = Math.max(...changes.map(c => c.magnitude), 0)
  if (maxMagnitude >= 50) impactLevel = 'severe'
  else if (maxMagnitude >= 30) impactLevel = 'significant'
  else if (maxMagnitude >= 15) impactLevel = 'moderate'
  else impactLevel = 'minimal'
  
  return {
    changes,
    deteriorationAlert,
    impactLevel
  }
}

export interface LiquidityChange {
  type: 'liquidity_score' | 'spread_change' | 'volume_change' | 'open_interest_change'
  direction: 'improved' | 'deteriorated' | 'increased' | 'decreased' | 'widened' | 'tightened'
  magnitude: number
  description: string
}

/**
 * Generate liquidity-based trading recommendations
 */
export function generateLiquidityRecommendations(profile: LiquidityProfile): Array<{
  type: 'execution_strategy' | 'position_sizing' | 'timing' | 'alternative_strikes'
  recommendation: string
  reasoning: string
  priority: 'high' | 'medium' | 'low'
}> {
  const recommendations = []
  
  // Execution strategy recommendations
  if (profile.liquidityRating === 'poor' || profile.liquidityRating === 'illiquid') {
    recommendations.push({
      type: 'execution_strategy' as const,
      recommendation: 'Use limit orders with patience, avoid market orders',
      reasoning: 'Poor liquidity requires careful execution to minimize slippage',
      priority: 'high' as const
    })
  }
  
  // Position sizing recommendations
  if (profile.scalingLimits.maxRecommendedSize < 20) {
    recommendations.push({
      type: 'position_sizing' as const,
      recommendation: `Limit position size to ${profile.scalingLimits.maxRecommendedSize} contracts`,
      reasoning: 'Liquidity constraints limit maximum position size',
      priority: 'high' as const
    })
  }
  
  // Timing recommendations
  if (profile.executionRisk.riskLevel === 'high' || profile.executionRisk.riskLevel === 'extreme') {
    recommendations.push({
      type: 'timing' as const,
      recommendation: 'Execute during market open or close for better liquidity',
      reasoning: 'High execution risk requires optimal timing',
      priority: 'medium' as const
    })
  }
  
  // Alternative strikes
  const liquidStrikes = profile.openInterestAnalysis.openInterestByStrike
    .filter(s => s.liquidityTier === 'tier1' || s.liquidityTier === 'tier2')
    .length
    
  if (liquidStrikes < 5) {
    recommendations.push({
      type: 'alternative_strikes' as const,
      recommendation: 'Consider nearby liquid strikes or different expirations',
      reasoning: 'Limited number of liquid strikes available',
      priority: 'medium' as const
    })
  }
  
  return recommendations
}