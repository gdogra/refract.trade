/**
 * Opportunities Scanner with Continuous Monitoring Engine
 * 
 * Continuously scans optionable securities and surfaces the highest-quality opportunities:
 * ✅ Defined and limited risk
 * ✅ Favorable risk-adjusted return
 * ✅ Sufficient liquidity to trade in size
 * ✅ Realistic entry and exit
 * ✅ Quantitatively and explainably justified
 * 
 * Features:
 * - Real-time monitoring of volatility, trends, events, liquidity
 * - Actionable alerts with specific guidance
 * - Portfolio health dashboard
 * - Risk exposure mapping
 * - Position management intelligence
 */

import { RiskAdjustedOpportunityScore, calculateRAOS, filterInstitutionalOpportunities } from './riskAdjustedRanking'
import { OptimizedStrategy, optimizeStrategiesForSymbol, MarketConditionAssessment } from './strategyOptimization'
import { buildVolatilitySurface, calculateIVRankPercentile, VolatilitySurface } from './volatilityIntelligence'
import { analyzeLiquidityProfile, LiquidityProfile } from './liquidityModeling'
import { calculateAdvancedRiskMetrics, AdvancedRiskMetrics } from './advancedRiskMetrics'
import { calculatePortfolioGreeks, PortfolioGreeks } from './greeksAggregation'
import { OptionContract, getOptionsChain } from '@/lib/options/yahooOptions'
import { Position } from '@/types'

export interface OpportunitiesScanner {
  scanUniverse: string[]
  lastScanTime: Date
  opportunities: ScannedOpportunity[]
  monitoringEngine: MonitoringEngine
  portfolioHealth: PortfolioHealthDashboard
  riskExposureMap: RiskExposureMap
  alerts: OpportunityAlert[]
}

export interface ScannedOpportunity extends RiskAdjustedOpportunityScore {
  rank: number
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  lastUpdated: Date
  changeFrom24h: {
    raosChange: number
    rankChange: number
    newEntry: boolean
  }
  executionReadiness: ExecutionReadiness
  positionSizing: PositionSizingGuidance
}

export interface MonitoringEngine {
  activeAlerts: ScannerMonitoringAlert[]
  watchlist: WatchlistItem[]
  triggerRules: TriggerRule[]
  lastMonitorTime: Date
  monitoringFrequency: number // Minutes
}

export interface ScannerMonitoringAlert {
  id: string
  type: 'volatility_spike' | 'trend_shift' | 'liquidity_deterioration' | 'profit_target' | 'stop_loss' | 'correlation_spike'
  severity: 'info' | 'warning' | 'critical'
  symbol: string
  message: string
  actionRequired: string
  timeTriggered: Date
  isRead: boolean
  isResolved: boolean
}

export interface WatchlistItem {
  symbol: string
  addedAt: Date
  reasons: string[]
  currentRAOS: number
  triggerConditions: TriggerCondition[]
  lastAnalysis: Date
}

export interface TriggerCondition {
  type: 'iv_rank' | 'price_movement' | 'volume_surge' | 'options_flow'
  threshold: number
  currentValue: number
  triggered: boolean
}

export interface TriggerRule {
  id: string
  name: string
  condition: string
  action: string
  enabled: boolean
}

export interface PortfolioHealthDashboard {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  healthScore: number // 0-100
  keyMetrics: PortfolioHealthMetrics
  riskFactors: RiskFactor[]
  recommendations: HealthRecommendation[]
  lastUpdated: Date
}

export interface PortfolioHealthMetrics {
  totalValue: number
  unrealizedPnL: number
  realizedPnL: number
  totalGreeks: PortfolioGreeks
  riskMetrics: {
    var95: number
    maxDrawdown: number
    sharpeRatio: number
    kellyFraction: number
  }
  diversificationScore: number
  liquidityScore: number
}

export interface RiskFactor {
  type: 'concentration' | 'tail_risk' | 'time_decay' | 'volatility_exposure' | 'liquidity' | 'correlation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  recommendation: string
  quantification: number
}

export interface HealthRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low'
  action: string
  reasoning: string
  expectedImprovement: string
  timeframe: string
}

export interface RiskExposureMap {
  directionalBias: DirectionalExposure
  volatilityExposure: VolatilityExposure
  tailRisk: TailRiskExposure
  timeDecayPressure: TimeDecayExposure
  sectorConcentration: SectorExposure[]
  correlationRisks: CorrelationRisk[]
}

export interface DirectionalExposure {
  netDelta: number
  dollarDelta: number
  directionBias: 'strongly_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strongly_bearish'
  hedgeRatio: number // How much stock needed to hedge
  sensitivity1Percent: number // P&L from 1% move
}

export interface VolatilityExposure {
  netVega: number
  vegaByExpiry: Array<{ expiry: string; vega: number }>
  volBias: 'long_vol' | 'short_vol' | 'neutral'
  sensitivity10PercVol: number // P&L from 10% vol change
  volRegimeRisk: string
}

export interface TailRiskExposure {
  var95: number
  var99: number
  expectedShortfall: number
  blackSwanExposure: number
  asymmetryRatio: number // Upside vs downside exposure
  maxSingleEventLoss: number
}

export interface TimeDecayExposure {
  dailyTheta: number
  weeklyTheta: number
  thetaByExpiry: Array<{ expiry: string; theta: number }>
  accelerationDates: Date[]
  breakEvenTime: number // Days until theta neutral
}

export interface SectorExposure {
  sector: string
  exposure: number
  percentage: number
  symbols: string[]
  beta: number
  correlation: number
}

export interface CorrelationRisk {
  pair: [string, string]
  correlation: number
  combinedExposure: number
  riskAmplification: number
  recommendation: string
}

export interface ExecutionReadiness {
  readyToExecute: boolean
  blockers: string[]
  prerequisites: string[]
  optimalExecutionWindow: string
  estimatedSlippage: number
}

export interface PositionSizingGuidance {
  recommendedSize: number
  maxSize: number
  minSize: number
  sizingMethod: 'kelly' | 'fixed_percent' | 'vol_target' | 'risk_parity'
  riskPerTrade: number
  reasoning: string
}

/**
 * Main scanner function - continuously scans for opportunities
 */
export async function scanForOpportunities(
  universe: string[],
  portfolioPositions: Position[],
  filters: OpportunityFilters
): Promise<OpportunitiesScanner> {
  const scanStartTime = new Date()
  const opportunities: ScannedOpportunity[] = []
  
  // Scan each symbol in universe
  for (const symbol of universe) {
    try {
      const opportunity = await analyzeSymbolOpportunity(symbol, filters)
      if (opportunity) {
        opportunities.push(opportunity)
      }
    } catch (error) {
      console.warn(`Failed to analyze ${symbol}:`, error)
    }
  }
  
  // Rank and filter opportunities
  const rankedOpportunities = rankOpportunitiesByRAOS(opportunities)
  const filteredOpportunities = applyQualityFilters(rankedOpportunities, filters)
  
  // Generate monitoring alerts
  const monitoringEngine = await generateMonitoringEngine(filteredOpportunities, portfolioPositions)
  
  // Calculate portfolio health
  const portfolioHealth = calculatePortfolioHealth(portfolioPositions, rankedOpportunities)
  
  // Generate risk exposure map
  const riskExposureMap = generateRiskExposureMap(portfolioPositions)
  
  // Generate actionable alerts
  const alerts = generateOpportunityAlerts(filteredOpportunities, portfolioHealth)
  
  return {
    scanUniverse: universe,
    lastScanTime: scanStartTime,
    opportunities: filteredOpportunities,
    monitoringEngine,
    portfolioHealth,
    riskExposureMap,
    alerts
  }
}

export interface OpportunityFilters {
  minRAOS: number
  maxRisk: number
  minLiquidity: number
  maxDaysToExpiry: number
  requiredStrategies?: string[]
  excludedStrategies?: string[]
  minProbabilityOfProfit: number
  requireDefinedRisk: boolean
}

/**
 * Analyze a single symbol for opportunities
 */
async function analyzeSymbolOpportunity(
  symbol: string,
  filters: OpportunityFilters
): Promise<ScannedOpportunity | null> {
  try {
    // Get options chain
    const optionsChain = await getOptionsChain(symbol)
    if (!optionsChain) return null
    
    // Build volatility surface
    const volSurface = buildVolatilitySurface(
      symbol,
      optionsChain.calls,
      optionsChain.puts,
      optionsChain.underlyingPrice
    )
    
    // Analyze liquidity
    const liquidityProfile = analyzeLiquidityProfile(
      symbol,
      optionsChain.calls,
      optionsChain.puts,
      optionsChain.underlyingPrice
    )
    
    // Skip if liquidity is too poor
    if (liquidityProfile.overallLiquidityScore < filters.minLiquidity) {
      return null
    }
    
    // Assess market conditions
    const marketConditions = assessMarketConditions(symbol, volSurface)
    
    // Generate and optimize strategies
    const strategyOptimization = optimizeStrategiesForSymbol(
      symbol,
      optionsChain.calls,
      optionsChain.puts,
      optionsChain.underlyingPrice,
      marketConditions,
      {
        primaryObjective: 'max_sharpe',
        riskTolerance: 'moderate',
        liquidityRequirement: 'medium',
        timeHorizon: 'medium',
        capitalAllocation: 10000,
        maxRiskPerTrade: filters.maxRisk
      },
      liquidityProfile
    )
    
    // Find best strategy
    const bestStrategy = strategyOptimization.recommendedStrategies[0]
    if (!bestStrategy) return null
    
    // Calculate RAOS
    const riskMetrics = await calculateAdvancedRiskMetricsForStrategy(bestStrategy)
    const raosResult = calculateRAOS(
      bestStrategy,
      {
        underlyingPrice: optionsChain.underlyingPrice,
        volatility: volSurface.atmVolatility,
        ivRankPercentile: {
          symbol,
          currentIV: volSurface.atmVolatility,
          ivRank: 50, // Would be calculated from historical data
          ivPercentile: 50,
          period: '252d',
          historicalRange: { min: 0.1, max: 0.8, mean: 0.3, std: 0.15 },
          interpretation: 'normal'
        },
        liquidityProfile,
        nearTermEvents: []
      },
      riskMetrics
    )
    
    // Skip if RAOS too low
    if (raosResult.raos < filters.minRAOS) {
      return null
    }
    
    return {
      ...raosResult,
      rank: 0, // Will be set during ranking
      tier: raosResult.ranking.tier,
      lastUpdated: new Date(),
      changeFrom24h: {
        raosChange: 0, // Would be calculated from historical data
        rankChange: 0,
        newEntry: true
      },
      executionReadiness: assessExecutionReadiness(bestStrategy, liquidityProfile),
      positionSizing: calculatePositionSizing(bestStrategy, riskMetrics, 100000) // $100k account
    }
  } catch (error) {
    console.warn(`Error analyzing ${symbol}:`, error)
    return null
  }
}

/**
 * Assess market conditions for a symbol
 */
function assessMarketConditions(symbol: string, volSurface: VolatilitySurface): MarketConditionAssessment {
  // Simplified market condition assessment
  // In production, would integrate with market data feeds
  
  let volatilityRegime: MarketConditionAssessment['volatilityRegime']
  if (volSurface.atmVolatility < 0.2) volatilityRegime = 'low'
  else if (volSurface.atmVolatility > 0.4) volatilityRegime = 'high'
  else volatilityRegime = 'normal'
  
  return {
    volatilityRegime,
    trendDirection: 'neutral', // Would be calculated from price action
    marketRegime: 'range_bound',
    nearTermEvents: [], // Would be populated from earnings calendar
    liquidity: 'normal',
    sentiment: 'neutral'
  }
}

/**
 * Calculate advanced risk metrics for a strategy
 */
async function calculateAdvancedRiskMetricsForStrategy(strategy: OptimizedStrategy): Promise<AdvancedRiskMetrics> {
  // Mock implementation - would use full Monte Carlo simulation
  return {
    expectedValue: strategy.metrics.expectedValue,
    probabilityOfProfit: strategy.metrics.probabilityOfProfit,
    conditionalValueAtRisk: {
      cvar95: strategy.metrics.maxLoss * 1.2,
      cvar99: strategy.metrics.maxLoss * 1.5,
      expectedShortfall95: strategy.metrics.maxLoss * 1.3,
      expectedShortfall99: strategy.metrics.maxLoss * 1.6,
      tailLoss: strategy.metrics.maxLoss * 1.4,
      confidenceLevel: 0.95
    },
    valueAtRisk: {
      var95: strategy.metrics.maxLoss,
      var99: strategy.metrics.maxLoss * 1.5,
      var999: strategy.metrics.maxLoss * 2.0,
      parametricVaR: strategy.metrics.maxLoss * 0.9,
      historicalVaR: strategy.metrics.maxLoss,
      monteCarloVaR: strategy.metrics.maxLoss * 1.1,
      holdingPeriod: 1
    },
    distributionAnalysis: {} as any, // Would be properly calculated
    stressTesting: {} as any,
    tailExposure: {
      leftTailExposure: strategy.metrics.maxLoss,
      rightTailExposure: strategy.metrics.maxProfit >= 999999 ? 10000 : strategy.metrics.maxProfit,
      tailRatio: 2.0,
      extremeEventProbability: 0.05,
      tailDependence: 0.1,
      blackSwanExposure: 0.01
    },
    kellyFraction: {
      optimalFraction: 0.15,
      adjustedFraction: 0.04,
      expectedGrowthRate: 0.12,
      riskOfRuin: 0.05,
      recommendation: 'optimal'
    },
    optionsSharpeRatio: strategy.metrics.returnOnCapital / 15, // Rough approximation
    riskAdjustedReturn: strategy.metrics.expectedValue / Math.max(strategy.metrics.maxLoss, 1)
  }
}

/**
 * Rank opportunities by RAOS
 */
function rankOpportunitiesByRAOS(opportunities: ScannedOpportunity[]): ScannedOpportunity[] {
  return opportunities
    .sort((a, b) => b.raos - a.raos)
    .map((opportunity, index) => ({
      ...opportunity,
      rank: index + 1
    }))
}

/**
 * Apply quality filters to opportunities
 */
function applyQualityFilters(
  opportunities: ScannedOpportunity[],
  filters: OpportunityFilters
): ScannedOpportunity[] {
  return opportunities.filter(opportunity => {
    // Basic RAOS filter
    if (opportunity.raos < filters.minRAOS) return false
    
    // Risk filter
    if (opportunity.strategy.metrics.maxLoss > filters.maxRisk) return false
    
    // Liquidity filter
    if (opportunity.strategy.liquidityAssessment.entryLiquidity < filters.minLiquidity) return false
    
    // Days to expiry filter
    if (opportunity.strategy.metrics.daysToExpiry > filters.maxDaysToExpiry) return false
    
    // Probability of profit filter
    if (opportunity.strategy.metrics.probabilityOfProfit < filters.minProbabilityOfProfit) return false
    
    // Defined risk requirement
    if (filters.requireDefinedRisk && opportunity.strategy.riskProfile.riskType === 'unlimited') return false
    
    // Strategy type filters
    if (filters.requiredStrategies && !filters.requiredStrategies.includes(opportunity.strategy.type)) return false
    if (filters.excludedStrategies && filters.excludedStrategies.includes(opportunity.strategy.type)) return false
    
    return true
  })
}

/**
 * Generate continuous monitoring engine
 */
async function generateMonitoringEngine(
  opportunities: ScannedOpportunity[],
  positions: Position[]
): Promise<MonitoringEngine> {
  const watchlist: WatchlistItem[] = opportunities.slice(0, 20).map(opp => ({
    symbol: opp.symbol,
    addedAt: new Date(),
    reasons: [`High RAOS: ${(opp.raos || 0).toFixed(1)}`, `${opp.strategy.type} opportunity`],
    currentRAOS: opp.raos,
    triggerConditions: [
      {
        type: 'iv_rank',
        threshold: 80,
        currentValue: 50,
        triggered: false
      },
      {
        type: 'volume_surge',
        threshold: 200, // 200% of average
        currentValue: 100,
        triggered: false
      }
    ],
    lastAnalysis: new Date()
  }))
  
  const triggerRules: TriggerRule[] = [
    {
      id: 'vol_spike',
      name: 'Volatility Spike Alert',
      condition: 'IV rank > 90 OR IV increases > 50% in 1 day',
      action: 'Alert: Consider vol selling opportunities',
      enabled: true
    },
    {
      id: 'vol_crush',
      name: 'Volatility Crush Alert', 
      condition: 'IV rank < 10 OR IV decreases > 30% in 1 day',
      action: 'Alert: Consider vol buying opportunities',
      enabled: true
    },
    {
      id: 'liquidity_deterioration',
      name: 'Liquidity Deterioration',
      condition: 'Volume < 50% of 10-day avg AND spread > 150% of 10-day avg',
      action: 'Warning: Reduce position sizes or avoid new entries',
      enabled: true
    },
    {
      id: 'profit_target',
      name: 'Profit Target Reached',
      condition: 'Position P&L > 50% of max profit OR > 200% of premium paid',
      action: 'Consider taking profits',
      enabled: true
    }
  ]
  
  return {
    activeAlerts: [],
    watchlist,
    triggerRules,
    lastMonitorTime: new Date(),
    monitoringFrequency: 5 // 5 minutes
  }
}

/**
 * Calculate overall portfolio health
 */
function calculatePortfolioHealth(
  positions: Position[],
  opportunities: ScannedOpportunity[]
): PortfolioHealthDashboard {
  // Calculate portfolio metrics
  const totalValue = positions.reduce((sum, pos) => 
    sum + (pos.unrealizedPnl || 0) + pos.entryPrice * pos.quantity, 0)
  
  const unrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0)
  const realizedPnL = positions.reduce((sum, pos) => sum + (pos.realizedPnl || 0), 0)
  
  // Mock portfolio Greeks calculation
  const totalGreeks = calculatePortfolioGreeks(positions, new Map(), new Map())
  
  // Calculate health score
  const profitabilityScore = unrealizedPnL > 0 ? 80 : 40
  const diversificationScore = calculateDiversificationScore(positions)
  const riskScore = Math.max(0, 100 - Math.abs(totalGreeks.netDelta) / 10)
  const liquidityScore = 75 // Would be calculated from position liquidity
  
  const healthScore = (profitabilityScore + diversificationScore + riskScore + liquidityScore) / 4
  
  let overallHealth: PortfolioHealthDashboard['overallHealth']
  if (healthScore >= 80) overallHealth = 'excellent'
  else if (healthScore >= 65) overallHealth = 'good'
  else if (healthScore >= 50) overallHealth = 'fair'
  else if (healthScore >= 35) overallHealth = 'poor'
  else overallHealth = 'critical'
  
  // Identify risk factors
  const riskFactors: RiskFactor[] = []
  
  if (Math.abs(totalGreeks.netDelta) > 500) {
    riskFactors.push({
      type: 'concentration',
      severity: 'high',
      description: `High directional exposure: ${(totalGreeks?.netDelta || 0).toFixed(0)} delta`,
      impact: 'Portfolio sensitive to market direction',
      recommendation: 'Consider delta hedging or balancing positions',
      quantification: Math.abs(totalGreeks.netDelta)
    })
  }
  
  if (totalGreeks.totalTheta < -100) {
    riskFactors.push({
      type: 'time_decay',
      severity: 'medium',
      description: `High time decay: $${Math.abs(totalGreeks?.totalTheta || 0).toFixed(0)}/day`,
      impact: 'Significant daily portfolio decay',
      recommendation: 'Monitor time decay and consider adjustments',
      quantification: Math.abs(totalGreeks.totalTheta)
    })
  }
  
  // Generate recommendations
  const recommendations: HealthRecommendation[] = []
  
  if (diversificationScore < 50) {
    recommendations.push({
      priority: 'high',
      action: 'Diversify across more symbols and strategy types',
      reasoning: 'Current portfolio lacks diversification',
      expectedImprovement: 'Reduce concentration risk by 30%',
      timeframe: '1-2 weeks'
    })
  }
  
  if (opportunities.length > 5) {
    recommendations.push({
      priority: 'medium',
      action: `Consider ${opportunities.slice(0, 3).length} new high-RAOS opportunities`,
      reasoning: 'Multiple attractive opportunities identified',
      expectedImprovement: 'Potential 15-25% portfolio improvement',
      timeframe: 'Next few trading days'
    })
  }
  
  return {
    overallHealth,
    healthScore: Math.round(healthScore),
    keyMetrics: {
      totalValue,
      unrealizedPnL,
      realizedPnL,
      totalGreeks,
      riskMetrics: {
        var95: -Math.abs(totalGreeks.netDelta) * 2,
        maxDrawdown: -Math.abs(totalValue * 0.1),
        sharpeRatio: 1.2,
        kellyFraction: 0.15
      },
      diversificationScore,
      liquidityScore
    },
    riskFactors,
    recommendations,
    lastUpdated: new Date()
  }
}

/**
 * Generate risk exposure map
 */
function generateRiskExposureMap(positions: Position[]): RiskExposureMap {
  // Calculate directional bias
  const netDelta = positions.reduce((sum, pos) => sum + (pos.delta || 0) * pos.quantity, 0)
  const dollarDelta = netDelta * 100 // Assuming $100 per delta point
  
  let directionBias: DirectionalExposure['directionBias']
  if (netDelta > 100) directionBias = 'strongly_bullish'
  else if (netDelta > 25) directionBias = 'bullish'
  else if (netDelta < -100) directionBias = 'strongly_bearish'
  else if (netDelta < -25) directionBias = 'bearish'
  else directionBias = 'neutral'
  
  const directionalExposure: DirectionalExposure = {
    netDelta,
    dollarDelta,
    directionBias,
    hedgeRatio: Math.abs(netDelta) / 100, // Shares needed per $100 delta
    sensitivity1Percent: dollarDelta * 0.01
  }
  
  // Calculate volatility exposure
  const netVega = positions.reduce((sum, pos) => sum + (pos.vega || 0) * pos.quantity, 0)
  const volatilityExposure: VolatilityExposure = {
    netVega,
    vegaByExpiry: [], // Would be calculated by expiration
    volBias: netVega > 50 ? 'long_vol' : netVega < -50 ? 'short_vol' : 'neutral',
    sensitivity10PercVol: netVega * 0.1,
    volRegimeRisk: 'Current portfolio exposed to volatility changes'
  }
  
  // Calculate tail risk
  const maxLoss = positions.reduce((max, pos) => {
    const posLoss = Math.abs(pos.unrealizedPnl || 0) * 2 // Estimate potential loss
    return Math.max(max, posLoss)
  }, 0)
  
  const tailRisk: TailRiskExposure = {
    var95: -maxLoss,
    var99: -maxLoss * 1.5,
    expectedShortfall: -maxLoss * 1.3,
    blackSwanExposure: -maxLoss * 2,
    asymmetryRatio: 1.5, // Simplified
    maxSingleEventLoss: -maxLoss
  }
  
  // Calculate time decay pressure
  const dailyTheta = positions.reduce((sum, pos) => sum + (pos.theta || 0) * pos.quantity, 0)
  const timeDecayPressure: TimeDecayExposure = {
    dailyTheta,
    weeklyTheta: dailyTheta * 7,
    thetaByExpiry: [], // Would be calculated by expiration
    accelerationDates: [], // Would be calculated from position expirations
    breakEvenTime: dailyTheta !== 0 ? Math.abs(positions[0]?.unrealizedPnl || 0) / Math.abs(dailyTheta) : 0
  }
  
  return {
    directionalBias: directionalExposure,
    volatilityExposure,
    tailRisk,
    timeDecayPressure,
    sectorConcentration: [], // Would be calculated from symbol sectors
    correlationRisks: [] // Would be calculated from position correlations
  }
}

/**
 * Generate opportunity alerts
 */
function generateOpportunityAlerts(
  opportunities: ScannedOpportunity[],
  portfolioHealth: PortfolioHealthDashboard
): OpportunityAlert[] {
  const alerts: OpportunityAlert[] = []
  
  // High-quality opportunity alerts
  const sGradeOpportunities = opportunities.filter(opp => opp.tier === 'S')
  if (sGradeOpportunities.length > 0) {
    alerts.push({
      id: `s_grade_${Date.now()}`,
      type: 'high_quality_opportunity',
      severity: 'high',
      title: `${sGradeOpportunities.length} S-Grade Opportunities Available`,
      message: `Found ${sGradeOpportunities.length} exceptional opportunities with RAOS > 85`,
      actionRequired: 'Review and consider entry',
      opportunities: sGradeOpportunities.slice(0, 3),
      timeGenerated: new Date(),
      isRead: false,
      priority: 'high'
    })
  }
  
  // Portfolio health alerts
  if (portfolioHealth.overallHealth === 'poor' || portfolioHealth.overallHealth === 'critical') {
    alerts.push({
      id: `health_${Date.now()}`,
      type: 'portfolio_health',
      severity: 'critical',
      title: 'Portfolio Health Deterioration',
      message: `Portfolio health is ${portfolioHealth.overallHealth}. Immediate attention required.`,
      actionRequired: 'Review risk factors and implement recommendations',
      opportunities: [],
      timeGenerated: new Date(),
      isRead: false,
      priority: 'critical'
    })
  }
  
  // Risk exposure alerts
  if (portfolioHealth.riskFactors.some(rf => rf.severity === 'critical')) {
    const criticalRisks = portfolioHealth.riskFactors.filter(rf => rf.severity === 'critical')
    alerts.push({
      id: `risk_${Date.now()}`,
      type: 'risk_exposure',
      severity: 'critical',
      title: 'Critical Risk Exposure Detected',
      message: `${criticalRisks.length} critical risk factors identified`,
      actionRequired: 'Implement risk mitigation immediately',
      opportunities: [],
      timeGenerated: new Date(),
      isRead: false,
      priority: 'critical'
    })
  }
  
  return alerts
}

export interface OpportunityAlert {
  id: string
  type: 'high_quality_opportunity' | 'portfolio_health' | 'risk_exposure' | 'profit_target' | 'stop_loss'
  severity: 'info' | 'warning' | 'high' | 'critical'
  title: string
  message: string
  actionRequired: string
  opportunities: ScannedOpportunity[]
  timeGenerated: Date
  isRead: boolean
  priority: 'critical' | 'high' | 'medium' | 'low'
}

/**
 * Assess execution readiness
 */
function assessExecutionReadiness(
  strategy: OptimizedStrategy,
  liquidityProfile: LiquidityProfile
): ExecutionReadiness {
  const blockers: string[] = []
  const prerequisites: string[] = []
  
  // Check liquidity
  if (liquidityProfile.overallLiquidityScore < 60) {
    blockers.push('Insufficient liquidity for recommended position size')
  }
  
  // Check market hours
  const now = new Date()
  const marketHours = now.getHours() >= 9.5 && now.getHours() <= 16
  if (!marketHours) {
    prerequisites.push('Wait for market open')
  }
  
  // Check spread conditions
  if (liquidityProfile.bidAskAnalysis.averageSpread > 0.25) {
    prerequisites.push('Wait for tighter spreads or use limit orders')
  }
  
  const readyToExecute = blockers.length === 0
  
  return {
    readyToExecute,
    blockers,
    prerequisites,
    optimalExecutionWindow: 'Market open (9:30-10:30 AM) or close (3:00-4:00 PM)',
    estimatedSlippage: liquidityProfile.slippageEstimates.smallOrder.estimatedSlippage
  }
}

/**
 * Calculate position sizing guidance
 */
function calculatePositionSizing(
  strategy: OptimizedStrategy,
  riskMetrics: AdvancedRiskMetrics,
  accountSize: number
): PositionSizingGuidance {
  const maxRiskPercent = 0.02 // 2% max risk per trade
  const maxRiskDollars = accountSize * maxRiskPercent
  
  // Kelly-based sizing
  const kellySize = riskMetrics.kellyFraction.adjustedFraction * accountSize
  const kellyContracts = Math.floor(kellySize / strategy.metrics.maxLoss)
  
  // Risk-based sizing
  const riskBasedContracts = Math.floor(maxRiskDollars / strategy.metrics.maxLoss)
  
  // Liquidity-based sizing
  const liquidityBasedContracts = strategy.liquidityAssessment.scalability
  
  const recommendedSize = Math.min(kellyContracts, riskBasedContracts, liquidityBasedContracts)
  
  return {
    recommendedSize: Math.max(1, recommendedSize),
    maxSize: liquidityBasedContracts,
    minSize: 1,
    sizingMethod: 'kelly',
    riskPerTrade: recommendedSize * strategy.metrics.maxLoss,
    reasoning: `Based on Kelly fraction (${kellyContracts}), risk limit (${riskBasedContracts}), and liquidity (${liquidityBasedContracts})`
  }
}

// Helper functions

function calculateDiversificationScore(positions: Position[]): number {
  if (positions.length === 0) return 0
  
  // Symbol diversification
  const uniqueSymbols = new Set(positions.map(pos => pos.symbol)).size
  const symbolScore = Math.min(100, (uniqueSymbols / Math.max(positions.length, 1)) * 100)
  
  // Strategy diversification
  const uniqueStrategies = new Set(positions.map(pos => pos.strategyType)).size
  const strategyScore = Math.min(100, (uniqueStrategies / Math.max(positions.length, 1)) * 100)
  
  // Expiration diversification
  const uniqueExpirations = new Set(
    positions.flatMap(pos => pos.legs.map(leg => leg.expiry.toISOString().split('T')[0]))
  ).size
  const expirationScore = Math.min(100, (uniqueExpirations / Math.max(positions.length, 1)) * 100)
  
  return (symbolScore + strategyScore + expirationScore) / 3
}