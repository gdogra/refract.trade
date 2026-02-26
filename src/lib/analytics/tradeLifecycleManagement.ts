/**
 * Trade Lifecycle Management System
 * 
 * Manages trades from entry to exit with intelligent guidance at every stage.
 * This is where most retail platforms fail - they help you get in, but not get out.
 */

export interface TradeLifecycleStage {
  stage: 'evaluation' | 'entry' | 'monitoring' | 'management' | 'exit'
  daysSinceEntry: number
  nextMilestone: string
  actionRequired: boolean
  guidance: LifecycleGuidance[]
}

export interface LifecycleGuidance {
  type: 'info' | 'warning' | 'action' | 'opportunity'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  message: string
  actionItems: ActionItem[]
  timeframe: string
}

export interface ActionItem {
  action: 'hold' | 'close' | 'roll' | 'hedge' | 'adjust' | 'monitor'
  description: string
  cost: number
  benefit: string
  riskReduction: number
  profitPotential: number
  timeToExecute: string
}

export interface TradeContext {
  symbol: string
  strategy: string
  entryDate: Date
  entryPrice: number
  currentPrice: number
  maxRisk: number
  maxProfit: number
  currentPnL: number
  daysToExpiration: number
  impliedVolatility: number
  deltaExposure: number
  thetaDecay: number
  gammaRisk: number
  vegaSensitivity: number
}

export interface ExitIntelligence {
  recommendation: 'hold' | 'close' | 'roll' | 'hedge'
  confidence: number
  reasoning: string
  optimalExitPrice: number
  timeToOptimalExit: string
  alternativeActions: AlternativeAction[]
  riskOfWaiting: string
}

export interface AlternativeAction {
  action: string
  description: string
  costBenefit: string
  successProbability: number
}

/**
 * Trade Lifecycle Manager
 * Core engine for managing trade progression
 */
export class TradeLifecycleManager {
  
  /**
   * Analyze trade lifecycle stage and generate guidance
   */
  static analyzeTradeLifecycle(
    trade: TradeContext,
    marketConditions: any,
    portfolioContext: any
  ): TradeLifecycleStage {
    
    const stage = this.determineLifecycleStage(trade)
    const guidance = this.generateStageGuidance(trade, stage, marketConditions, portfolioContext)
    const nextMilestone = this.calculateNextMilestone(trade, stage)
    
    return {
      stage,
      daysSinceEntry: this.calculateDaysSinceEntry(trade.entryDate),
      nextMilestone,
      actionRequired: guidance.some(g => g.type === 'action'),
      guidance
    }
  }

  /**
   * Determine current lifecycle stage
   */
  private static determineLifecycleStage(trade: TradeContext): TradeLifecycleStage['stage'] {
    const daysSinceEntry = this.calculateDaysSinceEntry(trade.entryDate)
    const profitPercent = trade.currentPnL / Math.abs(trade.maxRisk)
    const timePercent = daysSinceEntry / (trade.daysToExpiration + daysSinceEntry)
    
    if (daysSinceEntry < 2) return 'entry'
    if (profitPercent > 0.5 || profitPercent < -0.75) return 'exit'
    if (timePercent > 0.7) return 'management'
    return 'monitoring'
  }

  /**
   * Generate guidance for current stage
   */
  private static generateStageGuidance(
    trade: TradeContext,
    stage: TradeLifecycleStage['stage'],
    marketConditions: any,
    portfolioContext: any
  ): LifecycleGuidance[] {
    
    switch (stage) {
      case 'entry':
        return this.generateEntryGuidance(trade, marketConditions)
      case 'monitoring':
        return this.generateMonitoringGuidance(trade, marketConditions)
      case 'management':
        return this.generateManagementGuidance(trade, marketConditions)
      case 'exit':
        return this.generateExitGuidance(trade, marketConditions)
      default:
        return []
    }
  }

  /**
   * Entry stage guidance
   */
  private static generateEntryGuidance(trade: TradeContext, marketConditions: any): LifecycleGuidance[] {
    const guidance: LifecycleGuidance[] = []

    // Position sizing validation
    guidance.push({
      type: 'info',
      priority: 'medium',
      title: 'Position Sizing Confirmed',
      message: `Trade size optimized for portfolio context. Risk: $${trade.maxRisk.toLocaleString()} (${((trade.maxRisk / 50000) * 100).toFixed(1)}% of portfolio)`,
      actionItems: [],
      timeframe: 'Trade initiated'
    })

    // Entry timing assessment
    if (marketConditions.volatilityRegime === 'high') {
      guidance.push({
        type: 'warning',
        priority: 'medium',
        title: 'High Volatility Environment',
        message: 'Entering during high IV period. Monitor for volatility contraction that could benefit position.',
        actionItems: [{
          action: 'monitor',
          description: 'Watch IV rank for contraction signals',
          cost: 0,
          benefit: 'Early profit taking opportunity',
          riskReduction: 0,
          profitPotential: 0.3,
          timeToExecute: 'Ongoing'
        }],
        timeframe: 'Next 5-10 days'
      })
    }

    return guidance
  }

  /**
   * Monitoring stage guidance
   */
  private static generateMonitoringGuidance(trade: TradeContext, marketConditions: any): LifecycleGuidance[] {
    const guidance: LifecycleGuidance[] = []
    const profitPercent = trade.currentPnL / Math.abs(trade.maxRisk)
    const daysToExpiration = trade.daysToExpiration

    // Profit progression monitoring
    if (profitPercent > 0.3) {
      guidance.push({
        type: 'opportunity',
        priority: 'medium',
        title: 'Profit Target Approaching',
        message: `Position is ${(profitPercent * 100).toFixed(0)}% profitable. Consider profit-taking strategy.`,
        actionItems: [
          {
            action: 'close',
            description: 'Take profits at current levels',
            cost: 0,
            benefit: 'Lock in current gains',
            riskReduction: 1.0,
            profitPotential: 0,
            timeToExecute: '5 minutes'
          },
          {
            action: 'hold',
            description: 'Hold for 50% profit target',
            cost: 0,
            benefit: 'Potential for additional profit',
            riskReduction: 0,
            profitPotential: 0.5,
            timeToExecute: 'Wait'
          }
        ],
        timeframe: 'Before 50% profit target'
      })
    }

    // Time decay monitoring
    if (daysToExpiration < 21 && Math.abs(trade.thetaDecay) > 50) {
      guidance.push({
        type: 'info',
        priority: 'low',
        title: 'Time Decay Acceleration',
        message: `Theta decay accelerating: $${Math.abs(trade.thetaDecay).toFixed(0)}/day. Time working in your favor.`,
        actionItems: [],
        timeframe: 'Ongoing'
      })
    }

    // Volatility change monitoring
    if (marketConditions.ivRankChange > 0.1) {
      guidance.push({
        type: 'warning',
        priority: 'medium',
        title: 'Volatility Environment Shift',
        message: `IV rank increased ${(marketConditions.ivRankChange * 100).toFixed(0)} percentiles. May impact position favorability.`,
        actionItems: [{
          action: 'monitor',
          description: 'Watch for continued volatility expansion',
          cost: 0,
          benefit: 'Early warning of unfavorable conditions',
          riskReduction: 0,
          profitPotential: 0,
          timeToExecute: 'Continuous'
        }],
        timeframe: 'Next few days'
      })
    }

    return guidance
  }

  /**
   * Management stage guidance (later in trade lifecycle)
   */
  private static generateManagementGuidance(trade: TradeContext, marketConditions: any): LifecycleGuidance[] {
    const guidance: LifecycleGuidance[] = []
    const profitPercent = trade.currentPnL / Math.abs(trade.maxRisk)
    const timePercent = this.calculateDaysSinceEntry(trade.entryDate) / (trade.daysToExpiration + this.calculateDaysSinceEntry(trade.entryDate))

    // Rolling considerations
    if (timePercent > 0.7 && profitPercent < 0.3) {
      guidance.push({
        type: 'action',
        priority: 'medium',
        title: 'Rolling Opportunity',
        message: `Position is ${(timePercent * 100).toFixed(0)}% through lifecycle with minimal profit. Consider rolling for additional premium.`,
        actionItems: [
          {
            action: 'roll',
            description: 'Roll to next monthly expiration',
            cost: 100,
            benefit: 'Additional $200-300 premium',
            riskReduction: 0,
            profitPotential: 0.4,
            timeToExecute: '10 minutes'
          },
          {
            action: 'close',
            description: 'Close at small loss and redeploy capital',
            cost: Math.abs(trade.currentPnL),
            benefit: 'Free up capital for better opportunities',
            riskReduction: 1.0,
            profitPotential: 0,
            timeToExecute: '5 minutes'
          }
        ],
        timeframe: 'Before expiration week'
      })
    }

    // Adjustment considerations
    if (Math.abs(trade.deltaExposure) > 50 && Math.abs(trade.gammaRisk) > 100) {
      guidance.push({
        type: 'warning',
        priority: 'high',
        title: 'Delta/Gamma Risk Building',
        message: `Position developing significant directional risk. Delta: ${trade.deltaExposure.toFixed(0)}, Gamma: ${trade.gammaRisk.toFixed(0)}`,
        actionItems: [
          {
            action: 'hedge',
            description: 'Add delta hedge with underlying shares',
            cost: 200,
            benefit: 'Neutralize directional risk',
            riskReduction: 0.7,
            profitPotential: 0,
            timeToExecute: '5 minutes'
          },
          {
            action: 'adjust',
            description: 'Roll challenged leg to reduce exposure',
            cost: 150,
            benefit: 'Reduce gamma risk',
            riskReduction: 0.5,
            profitPotential: 0.2,
            timeToExecute: '10 minutes'
          }
        ],
        timeframe: 'Within 24 hours'
      })
    }

    return guidance
  }

  /**
   * Exit stage guidance
   */
  private static generateExitGuidance(trade: TradeContext, marketConditions: any): LifecycleGuidance[] {
    const guidance: LifecycleGuidance[] = []
    const profitPercent = trade.currentPnL / Math.abs(trade.maxRisk)

    if (profitPercent > 0.5) {
      // Profit taking guidance
      guidance.push({
        type: 'action',
        priority: 'high',
        title: '🎯 Profit Target Reached',
        message: `Position achieved ${(profitPercent * 100).toFixed(0)}% of max profit. Strong recommendation to close and lock in gains.`,
        actionItems: [
          {
            action: 'close',
            description: 'Close entire position at current market',
            cost: 0,
            benefit: `Lock in $${trade.currentPnL.toLocaleString()} profit`,
            riskReduction: 1.0,
            profitPotential: 0,
            timeToExecute: 'Immediate'
          }
        ],
        timeframe: 'Close by EOD'
      })
    }

    if (profitPercent < -0.75) {
      // Loss cutting guidance
      guidance.push({
        type: 'action',
        priority: 'critical',
        title: '🚨 Stop Loss Triggered',
        message: `Position reached ${Math.abs(profitPercent * 100).toFixed(0)}% of max loss. Cut losses to preserve capital.`,
        actionItems: [
          {
            action: 'close',
            description: 'Close position immediately to limit further losses',
            cost: Math.abs(trade.currentPnL),
            benefit: 'Prevent further deterioration',
            riskReduction: 1.0,
            profitPotential: 0,
            timeToExecute: 'Immediate'
          }
        ],
        timeframe: 'Immediate'
      })
    }

    return guidance
  }

  /**
   * Calculate days since entry
   */
  private static calculateDaysSinceEntry(entryDate: Date): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - entryDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate next milestone
   */
  private static calculateNextMilestone(trade: TradeContext, stage: TradeLifecycleStage['stage']): string {
    const profitPercent = trade.currentPnL / Math.abs(trade.maxRisk)
    const daysToExpiration = trade.daysToExpiration

    if (stage === 'entry') return 'Initial position establishment complete'
    if (stage === 'monitoring') {
      if (profitPercent < 0.25) return `25% profit target (need $${((0.25 * Math.abs(trade.maxRisk)) - trade.currentPnL).toFixed(0)} more)`
      return '50% profit target'
    }
    if (stage === 'management') return `${daysToExpiration} days to expiration`
    if (stage === 'exit') return 'Position closure pending'
    
    return 'Continue monitoring'
  }
}

/**
 * Exit Intelligence Engine
 * Provides sophisticated exit timing and strategy guidance
 */
export class ExitIntelligenceEngine {
  
  /**
   * Generate comprehensive exit analysis
   */
  static generateExitIntelligence(
    trade: TradeContext,
    marketConditions: any,
    portfolioContext: any
  ): ExitIntelligence {
    
    const profitAnalysis = this.analyzeProfitPotential(trade, marketConditions)
    const riskAnalysis = this.analyzeRiskProgression(trade, marketConditions)
    const timingAnalysis = this.analyzeExitTiming(trade, marketConditions)
    
    const recommendation = this.synthesizeExitRecommendation(profitAnalysis, riskAnalysis, timingAnalysis)
    
    return {
      recommendation: recommendation.action,
      confidence: recommendation.confidence,
      reasoning: recommendation.reasoning,
      optimalExitPrice: recommendation.targetPrice,
      timeToOptimalExit: recommendation.timeframe,
      alternativeActions: this.generateAlternativeActions(trade, marketConditions),
      riskOfWaiting: this.assessWaitingRisk(trade, marketConditions)
    }
  }

  /**
   * Analyze remaining profit potential
   */
  private static analyzeProfitPotential(trade: TradeContext, marketConditions: any) {
    const currentProfitPercent = trade.currentPnL / Math.abs(trade.maxRisk)
    const remainingProfit = (Math.abs(trade.maxRisk) - trade.currentPnL) / Math.abs(trade.maxRisk)
    const timeDecayRate = Math.abs(trade.thetaDecay) / Math.abs(trade.maxRisk)
    
    return {
      currentProfitPercent,
      remainingProfit,
      timeDecayRate,
      daysToMaxProfit: remainingProfit / timeDecayRate,
      probabilityOfMaxProfit: this.calculateProbabilityOfMaxProfit(trade, marketConditions)
    }
  }

  /**
   * Analyze risk progression
   */
  private static analyzeRiskProgression(trade: TradeContext, marketConditions: any) {
    const daysSinceEntry = this.calculateDaysSinceEntry(trade.entryDate)
    const riskDecay = Math.max(0, 1 - (daysSinceEntry / trade.daysToExpiration))
    
    return {
      currentRiskLevel: Math.abs(trade.maxRisk) * riskDecay,
      riskDecayRate: riskDecay,
      gammaExpansion: this.assessGammaExpansion(trade),
      vegaRisk: this.assessVegaRisk(trade, marketConditions)
    }
  }

  /**
   * Analyze optimal exit timing
   */
  private static analyzeExitTiming(trade: TradeContext, marketConditions: any) {
    const profitVelocity = trade.currentPnL / this.calculateDaysSinceEntry(trade.entryDate)
    const timeDecayVelocity = Math.abs(trade.thetaDecay)
    
    return {
      profitVelocity,
      timeDecayVelocity,
      optimalHoldPeriod: this.calculateOptimalHoldPeriod(trade),
      marketTimingFactor: this.assessMarketTiming(marketConditions)
    }
  }

  /**
   * Synthesize exit recommendation
   */
  private static synthesizeExitRecommendation(
    profitAnalysis: any,
    riskAnalysis: any,
    timingAnalysis: any
  ) {
    // Profit taking logic
    if (profitAnalysis.currentProfitPercent > 0.5) {
      return {
        action: 'close' as const,
        confidence: 0.9,
        reasoning: 'Position reached 50% profit target. High confidence in taking profits.',
        targetPrice: 0,
        timeframe: 'Immediate'
      }
    }

    // Stop loss logic
    if (profitAnalysis.currentProfitPercent < -0.75) {
      return {
        action: 'close' as const,
        confidence: 0.95,
        reasoning: 'Position approaching max loss. Cut losses to preserve capital.',
        targetPrice: 0,
        timeframe: 'Immediate'
      }
    }

    // Rolling logic
    if (timingAnalysis.optimalHoldPeriod < 7 && profitAnalysis.currentProfitPercent < 0.2) {
      return {
        action: 'roll' as const,
        confidence: 0.7,
        reasoning: 'Minimal profit with limited time remaining. Rolling may capture additional premium.',
        targetPrice: 0,
        timeframe: 'Before expiration week'
      }
    }

    // Hold logic
    return {
      action: 'hold' as const,
      confidence: 0.6,
      reasoning: 'Position performing as expected. Continue monitoring for profit opportunities.',
      targetPrice: 0,
      timeframe: 'Continue monitoring'
    }
  }

  /**
   * Generate alternative actions
   */
  private static generateAlternativeActions(trade: TradeContext, marketConditions: any): AlternativeAction[] {
    const actions: AlternativeAction[] = []

    // Always include basic alternatives
    actions.push(
      {
        action: 'Hold until expiration',
        description: 'Let time decay work in your favor',
        costBenefit: 'Free, but risks assignment',
        successProbability: 0.6
      },
      {
        action: 'Close at 25% profit',
        description: 'Take smaller profit for lower risk',
        costBenefit: 'Lower profit but higher certainty',
        successProbability: 0.85
      },
      {
        action: 'Roll to next expiration',
        description: 'Extend trade for additional premium',
        costBenefit: 'Additional premium vs extended risk',
        successProbability: 0.7
      }
    )

    // Add conditional alternatives
    if (Math.abs(trade.deltaExposure) > 30) {
      actions.push({
        action: 'Delta hedge with shares',
        description: 'Neutralize directional risk',
        costBenefit: '$200 cost for $500 risk reduction',
        successProbability: 0.8
      })
    }

    return actions
  }

  /**
   * Assess risk of waiting
   */
  private static assessWaitingRisk(trade: TradeContext, marketConditions: any): string {
    const risks = []

    if (trade.daysToExpiration < 14) {
      risks.push('Gamma risk accelerating as expiration approaches')
    }

    if (marketConditions.volatilityTrend === 'increasing') {
      risks.push('Rising volatility may hurt short vol position')
    }

    if (trade.currentPnL > 0) {
      risks.push('Unrealized profits at risk of erosion')
    }

    if (marketConditions.eventRisk === 'high') {
      risks.push('Upcoming events could cause sudden moves')
    }

    return risks?.length || 0 > 0 ? risks.join('. ') + '.' : 'Minimal risks to holding current position.'
  }

  /**
   * Helper methods
   */
  private static calculateDaysSinceEntry(entryDate: Date): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - entryDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  private static calculateProbabilityOfMaxProfit(trade: TradeContext, marketConditions: any): number {
    // Simplified probability model
    const timePercent = this.calculateDaysSinceEntry(trade.entryDate) / (trade.daysToExpiration + this.calculateDaysSinceEntry(trade.entryDate))
    const volatilityFactor = marketConditions.ivRank > 50 ? 0.8 : 1.2
    
    return Math.max(0.1, Math.min(0.9, (1 - timePercent) * volatilityFactor * 0.7))
  }

  private static calculateOptimalHoldPeriod(trade: TradeContext): number {
    // Rule of thumb: optimal exit around 21-25 DTE for most strategies
    return Math.max(0, trade.daysToExpiration - 25)
  }

  private static assessMarketTiming(marketConditions: any): number {
    // Simple market timing assessment
    if (marketConditions.trend === 'strong_bullish') return 1.2
    if (marketConditions.trend === 'strong_bearish') return 0.8
    return 1.0
  }

  private static assessGammaExpansion(trade: TradeContext): number {
    return Math.abs(trade.gammaRisk) * (45 - trade.daysToExpiration) / 45
  }

  private static assessVegaRisk(trade: TradeContext, marketConditions: any): number {
    return Math.abs(trade.vegaSensitivity) * (marketConditions.vixLevel / 20)
  }
}

/**
 * Trade Quality Scoring Engine
 * Rates trades like credit ratings: AAA to C
 */
export class TradeQualityEngine {
  
  /**
   * Calculate comprehensive trade quality score
   */
  static calculateTradeQuality(
    trade: TradeContext,
    marketConditions: any,
    portfolioContext: any
  ): LifecycleTradeQualityScore {
    
    const qualityFactors = {
      liquidityScore: this.assessLiquidity(trade),
      volatilityScore: this.assessVolatilityEnvironment(trade, marketConditions),
      riskRewardScore: this.assessRiskReward(trade),
      portfolioFitScore: this.assessPortfolioFit(trade, portfolioContext),
      timingScore: this.assessTiming(trade, marketConditions),
      executionScore: this.assessExecution(trade)
    }

    const overallScore = this.calculateWeightedScore(qualityFactors)
    const letterGrade = this.convertToLetterGrade(overallScore)

    return {
      overallScore,
      letterGrade,
      factors: qualityFactors,
      strengths: this.identifyStrengths(qualityFactors),
      weaknesses: this.identifyWeaknesses(qualityFactors),
      recommendation: this.generateQualityRecommendation(letterGrade, qualityFactors)
    }
  }

  private static calculateWeightedScore(factors: any): number {
    const weights = {
      liquidityScore: 0.25,
      volatilityScore: 0.20,
      riskRewardScore: 0.20,
      portfolioFitScore: 0.15,
      timingScore: 0.12,
      executionScore: 0.08
    }

    return Object.entries(weights).reduce((score, [factor, weight]) => {
      return score + (factors[factor] * weight)
    }, 0)
  }

  private static convertToLetterGrade(score: number): 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' {
    if (score >= 0.95) return 'AAA'
    if (score >= 0.85) return 'AA'
    if (score >= 0.75) return 'A'
    if (score >= 0.65) return 'BBB'
    if (score >= 0.55) return 'BB'
    if (score >= 0.45) return 'B'
    return 'C'
  }

  private static assessLiquidity(trade: TradeContext): number {
    // Mock liquidity assessment - would use real volume/OI data
    const liquidityFactors = {
      volume: 0.8,
      openInterest: 0.9,
      bidAskSpread: 0.7,
      marketCap: 0.9
    }
    
    return Object.values(liquidityFactors).reduce((sum, factor) => sum + factor, 0) / 4
  }

  private static assessVolatilityEnvironment(trade: TradeContext, marketConditions: any): number {
    const ivRank = marketConditions.ivRank || 50
    const strategy = trade.strategy.toLowerCase()
    
    // Different strategies prefer different IV environments
    if (strategy.includes('credit') || strategy.includes('iron') || strategy.includes('condor')) {
      return ivRank > 70 ? 0.9 : ivRank > 50 ? 0.7 : 0.5
    }
    
    if (strategy.includes('debit') || strategy.includes('long')) {
      return ivRank < 30 ? 0.9 : ivRank < 50 ? 0.7 : 0.5
    }
    
    return 0.7 // Neutral
  }

  private static assessRiskReward(trade: TradeContext): number {
    const riskRewardRatio = Math.abs(trade.maxProfit) / Math.abs(trade.maxRisk)
    const winProbability = 0.7 // Would calculate from delta
    
    const expectedValue = (winProbability * trade.maxProfit) + ((1 - winProbability) * trade.maxRisk)
    return expectedValue > 0 ? Math.min(1.0, expectedValue / Math.abs(trade.maxRisk) + 0.5) : 0.3
  }

  private static assessPortfolioFit(trade: TradeContext, portfolioContext: any): number {
    // Mock portfolio fit assessment
    const diversificationBenefit = 0.8
    const correlationPenalty = 0.1
    const sectorConcentrationPenalty = 0.05
    
    return Math.max(0, diversificationBenefit - correlationPenalty - sectorConcentrationPenalty)
  }

  private static assessTiming(trade: TradeContext, marketConditions: any): number {
    // Mock timing assessment based on market conditions
    const marketTiming = marketConditions.trend === 'favorable' ? 0.8 : 0.6
    const volatilityTiming = marketConditions.ivRank > 70 ? 0.9 : 0.6
    const eventTiming = marketConditions.nextEarnings > 21 ? 0.8 : 0.4
    
    return (marketTiming + volatilityTiming + eventTiming) / 3
  }

  private static assessExecution(trade: TradeContext): number {
    // Mock execution quality assessment
    return 0.8 // Assume good execution
  }

  private static identifyStrengths(factors: any): string[] {
    const strengths = []
    if (factors.liquidityScore > 0.8) strengths.push('Excellent liquidity')
    if (factors.volatilityScore > 0.8) strengths.push('Favorable volatility environment')
    if (factors.riskRewardScore > 0.8) strengths.push('Strong risk-reward profile')
    if (factors.portfolioFitScore > 0.8) strengths.push('Great portfolio fit')
    return strengths
  }

  private static identifyWeaknesses(factors: any): string[] {
    const weaknesses = []
    if (factors.liquidityScore < 0.6) weaknesses.push('Limited liquidity')
    if (factors.volatilityScore < 0.6) weaknesses.push('Unfavorable volatility environment')
    if (factors.riskRewardScore < 0.6) weaknesses.push('Poor risk-reward ratio')
    if (factors.portfolioFitScore < 0.6) weaknesses.push('Doesn\'t fit portfolio well')
    return weaknesses
  }

  private static generateQualityRecommendation(grade: string, factors: any): string {
    if (['AAA', 'AA'].includes(grade)) return 'Exceptional trade quality. Execute with confidence.'
    if (['A', 'BBB'].includes(grade)) return 'Good trade quality. Suitable for most risk tolerances.'
    if (['BB', 'B'].includes(grade)) return 'Speculative quality. Consider smaller position size.'
    return 'Poor quality. Recommend avoiding this trade.'
  }

  private static calculateDaysSinceEntry(entryDate: Date): number {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - entryDate.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
}

export interface LifecycleTradeQualityScore {
  overallScore: number
  letterGrade: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C'
  factors: Record<string, number>
  strengths: string[]
  weaknesses: string[]
  recommendation: string
}