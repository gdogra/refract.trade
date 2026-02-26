/**
 * Risk-Adjusted Ranking Model (RAOS)
 * 
 * Implements the Risk-Adjusted Opportunity Score framework:
 * RAOS = (Expected Return × Probability of Profit × Liquidity Score × Conviction Score)
 *        ÷ (Max Loss × Tail Risk × Volatility Risk × Execution Risk)
 * 
 * Penalizes:
 * - Unlimited risk strategies (unless hedged)
 * - Illiquidity
 * - Event risk without edge
 * - Excessive negative Theta for long premium
 * - Extreme Gamma risk near expiration
 */

import { OptimizedStrategy, StrategyType } from './strategyOptimization'
import { AdvancedRiskMetrics, TailExposureAnalysis } from './advancedRiskMetrics'
import { LiquidityProfile } from './liquidityModeling'
import { VolatilitySurface, IVRankPercentile } from './volatilityIntelligence'

export interface RiskAdjustedOpportunityScore {
  symbol: string
  strategy: OptimizedStrategy
  raos: number // 0-100 final score
  components: RAOSComponents
  penalties: RAOSPenalty[]
  ranking: OpportunityRanking
  actionableInsights: ActionableInsight[]
  institutionalGrade: InstitutionalGrade
}

export interface RAOSComponents {
  expectedReturn: number // 0-100 score
  probabilityOfProfit: number // 0-100 score  
  liquidityScore: number // 0-100 score
  convictionScore: number // 0-100 score
  maxLossScore: number // 0-100 score (higher is better - lower max loss)
  tailRiskScore: number // 0-100 score (higher is better - lower tail risk)
  volatilityRiskScore: number // 0-100 score
  executionRiskScore: number // 0-100 score
  rawNumerator: number
  rawDenominator: number
}

export interface RAOSPenalty {
  type: 'unlimited_risk' | 'illiquidity' | 'event_risk' | 'excessive_theta' | 'extreme_gamma' | 'poor_timing'
  severity: number // 0-100 scale
  impact: number // Percentage reduction in RAOS
  description: string
  mitigation?: string
}

export interface OpportunityRanking {
  tier: 'S' | 'A' | 'B' | 'C' | 'D' // Investment grade tiers
  percentileRank: number // 0-100 percentile vs all opportunities
  categoryRank: number // Rank within strategy type
  overallRank: number // Global rank across all strategies
  confidence: number // 0-100 confidence in ranking
}

export interface ActionableInsight {
  type: 'entry_timing' | 'exit_strategy' | 'risk_management' | 'optimization' | 'alternative'
  priority: 'critical' | 'high' | 'medium' | 'low'
  insight: string
  action: string
  expectedImprovement: number // Percentage improvement in RAOS
}

export interface InstitutionalGrade {
  eligible: boolean
  disqualifyingFactors: string[]
  institutionalScore: number // 0-100
  hedgeFundSuitable: boolean
  familyOfficeSuitable: boolean
  pensionFundSuitable: boolean
  complianceNotes: string[]
}

/**
 * Calculate Risk-Adjusted Opportunity Score
 */
export function calculateRAOS(
  strategy: OptimizedStrategy,
  marketData: {
    underlyingPrice: number
    volatility: number
    ivRankPercentile: IVRankPercentile
    liquidityProfile: LiquidityProfile
    nearTermEvents: Array<{ type: string; daysAway: number; impact: string }>
  },
  riskMetrics: AdvancedRiskMetrics,
  benchmarkData?: {
    avgReturn: number
    avgProbProfit: number
    avgLiquidity: number
  }
): RiskAdjustedOpportunityScore {
  
  // Calculate component scores
  const components = calculateRAOSComponents(strategy, marketData, riskMetrics, benchmarkData)
  
  // Apply penalties
  const penalties = calculatePenalties(strategy, marketData, riskMetrics)
  
  // Calculate raw RAOS
  const rawRAOS = components.rawNumerator / Math.max(components.rawDenominator, 0.01)
  
  // Apply penalty adjustments
  const totalPenalty = penalties.reduce((sum, penalty) => sum + penalty.impact, 0)
  const adjustedRAOS = Math.max(0, rawRAOS * (1 - totalPenalty / 100))
  
  // Normalize to 0-100 scale
  const normalizedRAOS = Math.min(100, adjustedRAOS * 50) // Scaling factor
  
  // Calculate ranking
  const ranking = calculateOpportunityRanking(normalizedRAOS, strategy.type)
  
  // Generate actionable insights
  const actionableInsights = generateActionableInsights(strategy, components, penalties)
  
  // Assess institutional suitability
  const institutionalGrade = assessInstitutionalGrade(strategy, riskMetrics, normalizedRAOS)
  
  return {
    symbol: strategy.legs[0]?.strike ? 'SYMBOL' : marketData.underlyingPrice.toString(),
    strategy,
    raos: normalizedRAOS,
    components,
    penalties,
    ranking,
    actionableInsights,
    institutionalGrade
  }
}

/**
 * Calculate RAOS component scores
 */
function calculateRAOSComponents(
  strategy: OptimizedStrategy,
  marketData: any,
  riskMetrics: AdvancedRiskMetrics,
  benchmarkData?: any
): RAOSComponents {
  
  // Expected Return Score (0-100)
  const expectedReturnScore = Math.min(100, Math.max(0, 
    50 + (strategy.metrics.expectedValue / Math.max(strategy.metrics.maxLoss, 100)) * 100
  ))
  
  // Probability of Profit Score (direct conversion)
  const probabilityOfProfitScore = strategy.metrics.probabilityOfProfit * 100
  
  // Liquidity Score (from strategy assessment)
  const liquidityScore = strategy.liquidityAssessment.entryLiquidity
  
  // Conviction Score (based on multiple factors)
  const convictionScore = calculateConvictionScore(strategy, marketData, riskMetrics)
  
  // Risk component scores (inverted - higher score means lower risk)
  const maxLossScore = Math.min(100, Math.max(0, 100 - (strategy.metrics.maxLoss / 10000) * 100))
  
  const tailRiskScore = Math.min(100, Math.max(0, 
    100 - (riskMetrics.tailExposure.blackSwanExposure * 1000)
  ))
  
  const volatilityRiskScore = Math.min(100, Math.max(0,
    100 - Math.abs(strategy.legs.reduce((sum, leg) => sum + leg.vega * (leg.side === 'buy' ? 1 : -1), 0)) / 10
  ))
  
  const executionRiskScore = strategy.liquidityAssessment.entryLiquidity
  
  // Calculate raw numerator and denominator
  const rawNumerator = expectedReturnScore * probabilityOfProfitScore * liquidityScore * convictionScore
  const rawDenominator = (101 - maxLossScore) * (101 - tailRiskScore) * (101 - volatilityRiskScore) * (101 - executionRiskScore)
  
  return {
    expectedReturn: expectedReturnScore,
    probabilityOfProfit: probabilityOfProfitScore,
    liquidityScore,
    convictionScore,
    maxLossScore,
    tailRiskScore,
    volatilityRiskScore,
    executionRiskScore,
    rawNumerator,
    rawDenominator
  }
}

/**
 * Calculate conviction score based on multiple edge indicators
 */
function calculateConvictionScore(
  strategy: OptimizedStrategy,
  marketData: any,
  riskMetrics: AdvancedRiskMetrics
): number {
  let conviction = 50 // Base score
  
  // Volatility edge
  if (marketData.ivRankPercentile.interpretation === 'extremely_high' && 
      strategy.type.includes('condor')) {
    conviction += 25 // High conviction vol selling when IV is extreme
  } else if (marketData.ivRankPercentile.interpretation === 'extremely_low' && 
             strategy.type.includes('straddle')) {
    conviction += 25 // High conviction vol buying when IV is extremely low
  }
  
  // Time decay edge
  const totalTheta = strategy.legs.reduce((sum, leg) => 
    sum + leg.theta * leg.quantity * (leg.side === 'sell' ? 1 : -1), 0)
  if (totalTheta > 0 && strategy.metrics.daysToExpiry <= 45) {
    conviction += 15 // Positive theta with appropriate time frame
  }
  
  // Structural edge (spreads vs single legs)
  if (strategy.legs?.length || 0 > 1 && strategy.riskProfile.riskType === 'limited') {
    conviction += 10 // Defined risk structures
  }
  
  // Market timing edge
  if (strategy.marketFit.overallFit > 80) {
    conviction += 15 // Strong market fit
  }
  
  // Penalty for risky conditions
  if (marketData.nearTermEvents.some((e: any) => e.daysAway <= 7 && e.impact === 'high')) {
    conviction -= 20 // Event risk without specific edge
  }
  
  return Math.max(0, Math.min(100, conviction))
}

/**
 * Calculate penalties that reduce RAOS
 */
function calculatePenalties(
  strategy: OptimizedStrategy,
  marketData: any,
  riskMetrics: AdvancedRiskMetrics
): RAOSPenalty[] {
  const penalties: RAOSPenalty[] = []
  
  // Unlimited risk penalty
  if (strategy.riskProfile.riskType === 'unlimited' && !hasHedge(strategy)) {
    penalties.push({
      type: 'unlimited_risk',
      severity: 90,
      impact: 40,
      description: 'Strategy has unlimited risk exposure without hedge',
      mitigation: 'Add protective hedge or use defined-risk alternative'
    })
  }
  
  // Illiquidity penalty
  if (strategy.liquidityAssessment.entryLiquidity < 40) {
    const severity = 100 - strategy.liquidityAssessment.entryLiquidity
    penalties.push({
      type: 'illiquidity',
      severity,
      impact: severity * 0.3,
      description: 'Poor liquidity will impact execution quality',
      mitigation: 'Use limit orders or consider more liquid strikes'
    })
  }
  
  // Event risk penalty (without edge)
  const hasEventRisk = marketData.nearTermEvents.some((e: any) => e.daysAway <= 7)
  if (hasEventRisk && strategy.marketFit.overallFit < 70) {
    penalties.push({
      type: 'event_risk',
      severity: 70,
      impact: 25,
      description: 'Exposed to event risk without clear edge',
      mitigation: 'Delay entry until after event or hedge event risk'
    })
  }
  
  // Excessive theta penalty for long premium
  const totalTheta = strategy.legs.reduce((sum, leg) => 
    sum + leg.theta * leg.quantity * (leg.side === 'buy' ? 1 : -1), 0)
  if (totalTheta < -100 && strategy.metrics.daysToExpiry > 45) {
    penalties.push({
      type: 'excessive_theta',
      severity: Math.min(100, Math.abs(totalTheta) / 2),
      impact: 20,
      description: 'High time decay for long-dated position',
      mitigation: 'Consider shorter expiration or theta-positive adjustments'
    })
  }
  
  // Extreme gamma penalty near expiration
  const totalGamma = Math.abs(strategy.legs.reduce((sum, leg) => 
    sum + leg.gamma * leg.quantity, 0))
  if (totalGamma > 0.5 && strategy.metrics.daysToExpiry <= 7) {
    penalties.push({
      type: 'extreme_gamma',
      severity: 85,
      impact: 30,
      description: 'Extreme gamma risk near expiration',
      mitigation: 'Close position early or hedge gamma exposure'
    })
  }
  
  // Poor timing penalty
  if (strategy.marketFit.timingScore < 30) {
    penalties.push({
      type: 'poor_timing',
      severity: 70,
      impact: 15,
      description: 'Suboptimal market timing for this strategy',
      mitigation: 'Wait for better market conditions or adjust structure'
    })
  }
  
  return penalties
}

/**
 * Calculate opportunity ranking tier
 */
function calculateOpportunityRanking(raos: number, strategyType: StrategyType): OpportunityRanking {
  let tier: OpportunityRanking['tier']
  if (raos >= 85) tier = 'S'
  else if (raos >= 75) tier = 'A'
  else if (raos >= 60) tier = 'B'
  else if (raos >= 45) tier = 'C'
  else tier = 'D'
  
  // Percentile ranking (simplified - would use actual distribution in production)
  const percentileRank = Math.min(99, raos)
  
  // Category and overall ranking would be calculated against other strategies
  const categoryRank = 1 // Placeholder
  const overallRank = 1 // Placeholder
  
  // Confidence based on data quality and market conditions
  let confidence = 75 // Base confidence
  if (raos > 80) confidence += 15 // High-scoring opportunities are more reliable
  if (raos < 40) confidence -= 25 // Low-scoring opportunities are less reliable
  
  return {
    tier,
    percentileRank,
    categoryRank,
    overallRank,
    confidence: Math.max(0, Math.min(100, confidence))
  }
}

/**
 * Generate actionable insights for improving opportunities
 */
function generateActionableInsights(
  strategy: OptimizedStrategy,
  components: RAOSComponents,
  penalties: RAOSPenalty[]
): ActionableInsight[] {
  const insights: ActionableInsight[] = []
  
  // Entry timing insights
  if (components.convictionScore < 60) {
    insights.push({
      type: 'entry_timing',
      priority: 'high',
      insight: 'Market conditions not optimal for this strategy',
      action: 'Wait for better setup or consider alternative approach',
      expectedImprovement: 20
    })
  }
  
  // Exit strategy insights
  if (strategy.metrics.daysToExpiry <= 21 && strategy.metrics.probabilityOfProfit > 0.7) {
    insights.push({
      type: 'exit_strategy',
      priority: 'medium',
      insight: 'High probability of profit with limited time remaining',
      action: 'Consider taking profits early to reduce time decay risk',
      expectedImprovement: 15
    })
  }
  
  // Risk management insights
  const criticalPenalties = penalties.filter(p => p.severity > 70)
  for (const penalty of criticalPenalties) {
    if (penalty.mitigation) {
      insights.push({
        type: 'risk_management',
        priority: 'critical',
        insight: penalty.description,
        action: penalty.mitigation,
        expectedImprovement: penalty.impact * 0.8
      })
    }
  }
  
  // Optimization insights
  if (components.liquidityScore < 60) {
    insights.push({
      type: 'optimization',
      priority: 'medium',
      insight: 'Liquidity constraints detected',
      action: 'Consider nearby strikes with higher volume/open interest',
      expectedImprovement: 10
    })
  }
  
  // Alternative strategy insights
  if (strategy.tradeQualityScore.numericScore < 60) {
    insights.push({
      type: 'alternative',
      priority: 'high',
      insight: 'Current strategy shows poor risk/reward characteristics',
      action: 'Explore alternative strategies or wait for better conditions',
      expectedImprovement: 25
    })
  }
  
  return insights.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

/**
 * Assess institutional investment grade
 */
function assessInstitutionalGrade(
  strategy: OptimizedStrategy,
  riskMetrics: AdvancedRiskMetrics,
  raos: number
): InstitutionalGrade {
  const disqualifyingFactors: string[] = []
  let institutionalScore = raos
  
  // Risk-based disqualifications
  if (strategy.riskProfile.riskType === 'unlimited') {
    disqualifyingFactors.push('Unlimited risk exposure')
    institutionalScore -= 30
  }
  
  if (strategy.liquidityAssessment.entryLiquidity < 50) {
    disqualifyingFactors.push('Insufficient liquidity for institutional size')
    institutionalScore -= 20
  }
  
  if (riskMetrics.kellyFraction.riskOfRuin > 0.1) {
    disqualifyingFactors.push('Excessive risk of ruin')
    institutionalScore -= 25
  }
  
  if (strategy.metrics.daysToExpiry <= 7) {
    disqualifyingFactors.push('Too short time to expiration')
    institutionalScore -= 15
  }
  
  // Concentration risk
  if (strategy.legs??.length || 0) === 1) {
    disqualifyingFactors.push('Single-leg strategy lacks diversification')
    institutionalScore -= 10
  }
  
  const eligible = disqualifyingFactors??.length || 0) === 0 && institutionalScore >= 60
  
  return {
    eligible,
    disqualifyingFactors,
    institutionalScore: Math.max(0, Math.min(100, institutionalScore)),
    hedgeFundSuitable: eligible && raos >= 75,
    familyOfficeSuitable: eligible && strategy.riskProfile.riskType === 'limited',
    pensionFundSuitable: eligible && strategy.riskProfile.riskType === 'limited' && riskMetrics.kellyFraction.riskOfRuin < 0.05,
    complianceNotes: [
      'Strategy meets basic institutional risk guidelines',
      'Liquidity sufficient for institutional execution',
      'Risk metrics within acceptable parameters'
    ].filter(() => eligible)
  }
}

/**
 * Batch process multiple opportunities for ranking
 */
export function rankOpportunities(
  opportunities: RiskAdjustedOpportunityScore[]
): RankedOpportunity[] {
  // Sort by RAOS descending
  const sorted = [...opportunities].sort((a, b) => b.raos - a.raos)
  
  return sorted.map((opportunity, index) => ({
    ...opportunity,
    ranking: {
      ...opportunity.ranking,
      overallRank: index + 1,
      percentileRank: Math.round(((sorted?.length || 0 - index) / sorted?.length || 0) * 100)
    }
  }))
}

export type RankedOpportunity = RiskAdjustedOpportunityScore & {
  ranking: OpportunityRanking & {
    overallRank: number
    percentileRank: number
  }
}

/**
 * Filter opportunities by institutional criteria
 */
export function filterInstitutionalOpportunities(
  rankedOpportunities: RankedOpportunity[],
  filters: {
    minRAOS?: number
    requireDefinedRisk?: boolean
    minLiquidity?: number
    maxDaysToExpiry?: number
    minProbabilityOfProfit?: number
  } = {}
): RankedOpportunity[] {
  
  const {
    minRAOS = 60,
    requireDefinedRisk = true,
    minLiquidity = 70,
    maxDaysToExpiry = 60,
    minProbabilityOfProfit = 0.5
  } = filters
  
  return rankedOpportunities.filter(opportunity => {
    if (opportunity.raos < minRAOS) return false
    if (requireDefinedRisk && opportunity.strategy.riskProfile.riskType === 'unlimited') return false
    if (opportunity.strategy.liquidityAssessment.entryLiquidity < minLiquidity) return false
    if (opportunity.strategy.metrics.daysToExpiry > maxDaysToExpiry) return false
    if (opportunity.strategy.metrics.probabilityOfProfit < minProbabilityOfProfit) return false
    
    return true
  })
}

/**
 * Generate executive summary for top opportunities
 */
export function generateOpportunitySummary(
  rankedOpportunities: RankedOpportunity[],
  count: number = 5
): OpportunitySummary {
  const topOpportunities = rankedOpportunities.slice(0, count)
  
  const avgRAOS = topOpportunities.reduce((sum, opp) => sum + opp.raos, 0) / topOpportunities?.length || 0
  const totalExpectedValue = topOpportunities.reduce((sum, opp) => sum + opp.strategy.metrics.expectedValue, 0)
  const avgProbabilityOfProfit = topOpportunities.reduce((sum, opp) => sum + opp.strategy.metrics.probabilityOfProfit, 0) / topOpportunities?.length || 0
  
  const strategyTypeDistribution = topOpportunities.reduce((acc, opp) => {
    acc[opp.strategy.type] = (acc[opp.strategy.type] || 0) + 1
    return acc
  }, {} as Record<StrategyType, number>)
  
  const institutionalEligible = topOpportunities.filter(opp => opp.institutionalGrade.eligible)?.length || 0
  
  return {
    totalOpportunities: rankedOpportunities?.length || 0,
    topOpportunities: topOpportunities?.length || 0,
    averageRAOS: avgRAOS,
    totalExpectedValue,
    averageProbabilityOfProfit: avgProbabilityOfProfit,
    strategyTypeDistribution,
    institutionalEligibleCount: institutionalEligible,
    marketConditionsSummary: 'Current market conditions analyzed for optimal strategy selection',
    keyInsights: generateKeyInsights(topOpportunities)
  }
}

export interface OpportunitySummary {
  totalOpportunities: number
  topOpportunities: number
  averageRAOS: number
  totalExpectedValue: number
  averageProbabilityOfProfit: number
  strategyTypeDistribution: Record<StrategyType, number>
  institutionalEligibleCount: number
  marketConditionsSummary: string
  keyInsights: string[]
}

function generateKeyInsights(opportunities: RankedOpportunity[]): string[] {
  const insights: string[] = []
  
  if (opportunities??.length || 0) === 0) {
    return ['No high-quality opportunities identified under current market conditions']
  }
  
  const avgScore = opportunities.reduce((sum, opp) => sum + opp.raos, 0) / opportunities?.length || 0
  insights.push(`Average RAOS of top opportunities: ${avgScore.toFixed(1)}`)
  
  const mostCommonStrategy = Object.entries(
    opportunities.reduce((acc, opp) => {
      acc[opp.strategy.type] = (acc[opp.strategy.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])[0]
  
  if (mostCommonStrategy) {
    insights.push(`Most favorable strategy type: ${mostCommonStrategy[0].replace(/_/g, ' ')}`)
  }
  
  const highProbStrategies = opportunities.filter(opp => opp.strategy.metrics.probabilityOfProfit > 0.7)?.length || 0
  if (highProbStrategies > 0) {
    insights.push(`${highProbStrategies} high-probability opportunities (>70% PoP)`)
  }
  
  const institutionalGrade = opportunities.filter(opp => opp.institutionalGrade.eligible)?.length || 0
  if (institutionalGrade > 0) {
    insights.push(`${institutionalGrade} opportunities meet institutional standards`)
  }
  
  return insights
}

// Helper functions

function hasHedge(strategy: OptimizedStrategy): boolean {
  // Check if strategy has protective elements
  const hasLongAndShort = strategy.legs.some(leg => leg.side === 'buy') && 
                          strategy.legs.some(leg => leg.side === 'sell')
  
  // Check for stock hedge
  const hasStockHedge = strategy.legs.some(leg => leg.optionType === 'stock')
  
  return hasLongAndShort || hasStockHedge || strategy.riskProfile.riskType === 'limited'
}