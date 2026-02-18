/**
 * Portfolio-Aware Trade Recommendations Engine
 * 
 * The core differentiator: recommendations that consider the entire portfolio context,
 * risk budget, correlations, and current exposures rather than standalone trades.
 */

export interface PortfolioContext {
  totalCapital: number
  deployedCapital: number
  availableRiskBudget: number
  maxPortfolioRisk: number
  currentPositions: PortfolioPosition[]
  sectorExposures: Record<string, number>
  greeksExposures: {
    delta: number
    gamma: number
    theta: number
    vega: number
  }
  correlationMatrix: Record<string, Record<string, number>>
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
}

export interface PortfolioPosition {
  symbol: string
  strategy: string
  quantity: number
  marketValue: number
  unrealizedPnL: number
  risk: number
  daysInTrade: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
  }
  sector: string
}

export interface PortfolioAwareRecommendation {
  symbol: string
  strategy: string
  rationale: string
  portfolioContext: string
  sizing: number
  maxRisk: number
  riskBudgetUsed: number
  portfolioFit: number
  entryPrice: number
  profitTarget: number
  stopLoss: number
  timeHorizon: string
  qualityScore: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C'
  correlationImpact: number
  hedgingValue: number
  diversificationBenefit: number
  capitalEfficiency: number
}

export class PortfolioAwareEngine {
  
  /**
   * Generate portfolio-aware trade recommendation
   * This is the killer feature that considers EVERYTHING
   */
  async generatePortfolioAwareRecommendation(
    context: PortfolioContext,
    watchlist: string[]
  ): Promise<PortfolioAwareRecommendation> {
    
    // Analyze current portfolio exposures and gaps
    const exposureAnalysis = this.analyzePortfolioExposures(context)
    const riskGaps = this.identifyRiskGaps(context)
    const correlationRisks = this.assessCorrelationRisks(context)
    
    // Find opportunities that best complement the portfolio
    const candidates = await this.scanPortfolioComplementaryOpportunities(
      watchlist, 
      exposureAnalysis,
      context.availableRiskBudget
    )
    
    // Rank by portfolio fit, not just individual merit
    const rankedCandidates = this.rankByPortfolioFit(candidates, context)
    const bestRecommendation = rankedCandidates[0]
    
    if (!bestRecommendation) {
      return this.generateNoTradeRecommendation(context)
    }
    
    return {
      symbol: bestRecommendation.symbol,
      strategy: bestRecommendation.strategy,
      rationale: this.generatePortfolioAwareRationale(bestRecommendation, context),
      portfolioContext: this.generatePortfolioContext(bestRecommendation, context),
      sizing: this.calculateOptimalSizing(bestRecommendation, context),
      maxRisk: bestRecommendation.maxRisk,
      riskBudgetUsed: bestRecommendation.maxRisk / context.availableRiskBudget,
      portfolioFit: bestRecommendation.portfolioFit,
      entryPrice: bestRecommendation.entryPrice,
      profitTarget: bestRecommendation.profitTarget,
      stopLoss: bestRecommendation.stopLoss,
      timeHorizon: bestRecommendation.timeHorizon,
      qualityScore: bestRecommendation.qualityScore,
      correlationImpact: bestRecommendation.correlationImpact,
      hedgingValue: bestRecommendation.hedgingValue,
      diversificationBenefit: bestRecommendation.diversificationBenefit,
      capitalEfficiency: bestRecommendation.capitalEfficiency
    }
  }

  /**
   * Analyze portfolio exposures to identify concentrations and gaps
   */
  private analyzePortfolioExposures(context: PortfolioContext) {
    const sectorConcentration = this.calculateSectorConcentration(context.sectorExposures)
    const directionalBias = this.calculateDirectionalBias(context.greeksExposures)
    const volatilityExposure = Math.abs(context.greeksExposures.vega) / context.deployedCapital
    const timeDecayPressure = Math.abs(context.greeksExposures.theta) / context.deployedCapital
    
    return {
      sectorConcentration,
      directionalBias,
      volatilityExposure,
      timeDecayPressure,
      isOverConcentrated: sectorConcentration > 0.4,
      isDirectionallyBiased: Math.abs(directionalBias) > 0.3,
      isVegaHeavy: volatilityExposure > 0.02,
      isThetaHeavy: timeDecayPressure > 0.015
    }
  }

  /**
   * Identify gaps in risk management and portfolio construction
   */
  private identifyRiskGaps(context: PortfolioContext) {
    const needsHedging = this.assessHedgingNeeds(context)
    const needsDiversification = this.assessDiversificationNeeds(context)
    const hasUnusedCapacity = context.availableRiskBudget > context.totalCapital * 0.05
    
    return {
      needsHedging,
      needsDiversification,
      hasUnusedCapacity,
      recommendedHedgeSize: needsHedging ? this.calculateHedgeSize(context) : 0,
      diversificationTargets: needsDiversification ? this.identifyDiversificationTargets(context) : []
    }
  }

  /**
   * Generate rationale that explains WHY this trade fits the portfolio
   */
  private generatePortfolioAwareRationale(
    recommendation: any, 
    context: PortfolioContext
  ): string {
    const rationales = []
    
    // Market opportunity
    if (recommendation.ivRank > 75) {
      rationales.push(`High IV rank (${recommendation.ivRank}th percentile) suggests premium selling opportunity`)
    }
    
    // Portfolio fit
    if (recommendation.diversificationBenefit > 0.3) {
      rationales.push('Reduces portfolio concentration risk')
    }
    
    if (recommendation.hedgingValue > 0.2) {
      rationales.push('Provides natural hedge against current directional bias')
    }
    
    // Risk management
    if (recommendation.correlationImpact < 0.1) {
      rationales.push('Low correlation with existing positions reduces systemic risk')
    }
    
    // Capital efficiency
    if (recommendation.capitalEfficiency > 0.8) {
      rationales.push('High capital efficiency with limited downside')
    }
    
    return rationales.join('. ') + '.'
  }

  /**
   * Generate portfolio context explanation
   */
  private generatePortfolioContext(
    recommendation: any,
    context: PortfolioContext
  ): string {
    const contexts = []
    
    const sectorExposure = context.sectorExposures[recommendation.sector] || 0
    if (sectorExposure > 0.3) {
      contexts.push('Reduces over-concentration in current sector allocation')
    }
    
    const riskUtilization = (context.deployedCapital * context.maxPortfolioRisk - context.availableRiskBudget) / 
                           (context.totalCapital * context.maxPortfolioRisk)
    
    if (riskUtilization < 0.5) {
      contexts.push('Efficient use of available risk budget')
    }
    
    if (Math.abs(context.greeksExposures.delta) > context.deployedCapital * 0.01) {
      contexts.push('Helps neutralize portfolio directional bias')
    }
    
    return contexts.join('. ') + '.'
  }

  /**
   * Calculate optimal sizing based on portfolio context
   */
  private calculateOptimalSizing(recommendation: any, context: PortfolioContext): number {
    const baseSize = Math.floor(context.availableRiskBudget / recommendation.maxRisk)
    const portfolioAdjustment = this.getPortfolioAdjustmentFactor(recommendation, context)
    const riskAdjustment = this.getRiskAdjustmentFactor(context)
    
    return Math.max(1, Math.floor(baseSize * portfolioAdjustment * riskAdjustment))
  }

  /**
   * Portfolio adjustment factor based on fit and diversification
   */
  private getPortfolioAdjustmentFactor(recommendation: any, context: PortfolioContext): number {
    let factor = 1.0
    
    // Reduce size for concentrated sectors
    const sectorExposure = context.sectorExposures[recommendation.sector] || 0
    if (sectorExposure > 0.4) factor *= 0.7
    if (sectorExposure > 0.6) factor *= 0.5
    
    // Increase size for diversifying trades
    if (recommendation.diversificationBenefit > 0.3) factor *= 1.2
    
    // Increase size for hedging trades
    if (recommendation.hedgingValue > 0.2) factor *= 1.1
    
    return Math.max(0.3, Math.min(1.5, factor))
  }

  /**
   * Risk adjustment factor based on current portfolio risk state
   */
  private getRiskAdjustmentFactor(context: PortfolioContext): number {
    const riskUtilization = (context.deployedCapital * context.maxPortfolioRisk - context.availableRiskBudget) / 
                           (context.totalCapital * context.maxPortfolioRisk)
    
    if (riskUtilization > 0.9) return 0.5  // Very conservative when near risk limits
    if (riskUtilization > 0.7) return 0.8  // Somewhat conservative
    if (riskUtilization < 0.3) return 1.2  // More aggressive when risk budget available
    
    return 1.0
  }

  /**
   * Scan for opportunities that complement the current portfolio
   */
  private async scanPortfolioComplementaryOpportunities(
    watchlist: string[],
    exposureAnalysis: any,
    availableRiskBudget: number
  ) {
    // Mock implementation - would integrate with real market data
    const opportunities = [
      {
        symbol: 'MSFT',
        strategy: 'Iron Butterfly',
        maxRisk: 1600,
        entryPrice: 2.40,
        profitTarget: 1.20,
        stopLoss: 3.60,
        timeHorizon: '21 DTE',
        qualityScore: 'AAA' as const,
        portfolioFit: 0.92,
        correlationImpact: 0.08,
        hedgingValue: 0.15,
        diversificationBenefit: 0.35,
        capitalEfficiency: 0.87,
        sector: 'technology',
        ivRank: 85
      },
      {
        symbol: 'XLE',
        strategy: 'Put Credit Spread',
        maxRisk: 1200,
        entryPrice: 1.80,
        profitTarget: 0.90,
        stopLoss: 2.70,
        timeHorizon: '28 DTE',
        qualityScore: 'AA' as const,
        portfolioFit: 0.88,
        correlationImpact: 0.05,
        hedgingValue: 0.42,
        diversificationBenefit: 0.68,
        capitalEfficiency: 0.75,
        sector: 'energy',
        ivRank: 78
      }
    ]
    
    return opportunities.filter(opp => opp.maxRisk <= availableRiskBudget)
  }

  /**
   * Rank candidates by how well they fit the portfolio
   */
  private rankByPortfolioFit(candidates: any[], context: PortfolioContext) {
    return candidates
      .map(candidate => ({
        ...candidate,
        portfolioScore: this.calculatePortfolioScore(candidate, context)
      }))
      .sort((a, b) => b.portfolioScore - a.portfolioScore)
  }

  /**
   * Calculate comprehensive portfolio fit score
   */
  private calculatePortfolioScore(candidate: any, context: PortfolioContext): number {
    const qualityWeight = 0.3
    const diversificationWeight = 0.25
    const hedgingWeight = 0.20
    const correlationWeight = 0.15
    const efficiencyWeight = 0.10
    
    const qualityScore = this.getQualityScore(candidate.qualityScore)
    const diversificationScore = candidate.diversificationBenefit
    const hedgingScore = candidate.hedgingValue
    const correlationScore = 1 - candidate.correlationImpact
    const efficiencyScore = candidate.capitalEfficiency
    
    return (
      qualityScore * qualityWeight +
      diversificationScore * diversificationWeight +
      hedgingScore * hedgingWeight +
      correlationScore * correlationWeight +
      efficiencyScore * efficiencyWeight
    )
  }

  /**
   * Convert quality score letter to number
   */
  private getQualityScore(grade: string): number {
    const scoreMap = {
      'AAA': 1.0,
      'AA': 0.9,
      'A': 0.8,
      'BBB': 0.7,
      'BB': 0.6,
      'B': 0.5,
      'C': 0.4
    }
    return scoreMap[grade as keyof typeof scoreMap] || 0.4
  }

  /**
   * Generate no-trade recommendation when no good opportunities exist
   */
  private generateNoTradeRecommendation(context: PortfolioContext): PortfolioAwareRecommendation {
    return {
      symbol: 'NONE',
      strategy: 'Hold Cash',
      rationale: 'No high-quality opportunities that improve portfolio risk-return profile at current market conditions.',
      portfolioContext: 'Current portfolio is well-balanced with adequate diversification. Maintaining risk discipline.',
      sizing: 0,
      maxRisk: 0,
      riskBudgetUsed: 0,
      portfolioFit: 0,
      entryPrice: 0,
      profitTarget: 0,
      stopLoss: 0,
      timeHorizon: 'N/A',
      qualityScore: 'AAA',
      correlationImpact: 0,
      hedgingValue: 0,
      diversificationBenefit: 0,
      capitalEfficiency: 0
    }
  }

  /**
   * Calculate sector concentration using Herfindahl-Hirschman Index
   */
  private calculateSectorConcentration(sectorExposures: Record<string, number>): number {
    const total = Object.values(sectorExposures).reduce((sum, exp) => sum + Math.abs(exp), 0)
    if (total === 0) return 0
    
    return Object.values(sectorExposures).reduce((sum, exp) => {
      const share = Math.abs(exp) / total
      return sum + share * share
    }, 0)
  }

  /**
   * Calculate portfolio directional bias
   */
  private calculateDirectionalBias(greeksExposures: any): number {
    return greeksExposures.delta / 10000 // Normalize delta exposure
  }

  /**
   * Assess if portfolio needs hedging
   */
  private assessHedgingNeeds(context: PortfolioContext): boolean {
    const directionalRisk = Math.abs(context.greeksExposures.delta) / context.deployedCapital
    const volatilityRisk = Math.abs(context.greeksExposures.vega) / context.deployedCapital
    const sectorConcentration = this.calculateSectorConcentration(context.sectorExposures)
    
    return directionalRisk > 0.02 || volatilityRisk > 0.025 || sectorConcentration > 0.5
  }

  /**
   * Assess if portfolio needs diversification
   */
  private assessDiversificationNeeds(context: PortfolioContext): boolean {
    const sectorCount = Object.keys(context.sectorExposures).length
    const maxSectorExposure = Math.max(...Object.values(context.sectorExposures))
    
    return sectorCount < 3 || maxSectorExposure > 0.6
  }

  /**
   * Calculate recommended hedge size
   */
  private calculateHedgeSize(context: PortfolioContext): number {
    const directionalRisk = Math.abs(context.greeksExposures.delta)
    return Math.ceil(directionalRisk / 100) // Approximate hedge size
  }

  /**
   * Identify sectors for diversification
   */
  private identifyDiversificationTargets(context: PortfolioContext): string[] {
    const currentSectors = Object.keys(context.sectorExposures)
    const allSectors = ['technology', 'financials', 'healthcare', 'energy', 'industrials', 'consumer', 'utilities']
    
    return allSectors.filter(sector => !currentSectors.includes(sector))
  }

  /**
   * Assess correlation risks in current portfolio
   */
  private assessCorrelationRisks(context: PortfolioContext) {
    const correlationMatrix = context.correlationMatrix
    const symbols = context.currentPositions.map(p => p.symbol)
    
    let maxCorrelation = 0
    let correlatedPairs: string[] = []
    
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const correlation = correlationMatrix[symbols[i]]?.[symbols[j]] || 0
        if (Math.abs(correlation) > 0.7) {
          maxCorrelation = Math.max(maxCorrelation, Math.abs(correlation))
          correlatedPairs.push(`${symbols[i]}-${symbols[j]}`)
        }
      }
    }
    
    return {
      maxCorrelation,
      correlatedPairs,
      riskLevel: maxCorrelation > 0.8 ? 'high' : maxCorrelation > 0.6 ? 'medium' : 'low'
    }
  }
}

/**
 * Risk Budget Manager
 * Intelligently allocates risk across trades
 */
export class RiskBudgetManager {
  
  /**
   * Calculate available risk budget for new trades
   */
  static calculateAvailableRiskBudget(context: PortfolioContext): number {
    const maxAllowedRisk = context.totalCapital * context.maxPortfolioRisk
    const currentRisk = context.currentPositions.reduce((sum, pos) => sum + pos.risk, 0)
    
    return Math.max(0, maxAllowedRisk - currentRisk)
  }

  /**
   * Allocate risk budget across multiple potential trades
   */
  static allocateRiskBudget(
    recommendations: PortfolioAwareRecommendation[],
    availableBudget: number
  ): PortfolioAwareRecommendation[] {
    
    // Sort by portfolio fit and quality
    const sorted = recommendations.sort((a, b) => {
      const scoreA = (a.portfolioFit * 0.6) + (this.getQualityNumeric(a.qualityScore) * 0.4)
      const scoreB = (b.portfolioFit * 0.6) + (this.getQualityNumeric(b.qualityScore) * 0.4)
      return scoreB - scoreA
    })
    
    const allocated: PortfolioAwareRecommendation[] = []
    let remainingBudget = availableBudget
    
    for (const rec of sorted) {
      if (rec.maxRisk <= remainingBudget) {
        allocated.push({
          ...rec,
          riskBudgetUsed: rec.maxRisk / availableBudget
        })
        remainingBudget -= rec.maxRisk
      }
    }
    
    return allocated
  }

  private static getQualityNumeric(grade: string): number {
    const map = { 'AAA': 1.0, 'AA': 0.9, 'A': 0.8, 'BBB': 0.7, 'BB': 0.6, 'B': 0.5, 'C': 0.4 }
    return map[grade as keyof typeof map] || 0.4
  }
}

/**
 * Position Lifecycle Manager
 * Manages trades from entry to exit
 */
export class PositionLifecycleManager {
  
  /**
   * Generate management signals for existing positions
   */
  static generateManagementSignals(
    positions: PortfolioPosition[],
    marketConditions: any
  ): PositionManagementSignal[] {
    return positions.map(position => {
      const signal = this.analyzePosition(position, marketConditions)
      return {
        positionId: position.symbol,
        action: signal.action,
        reasoning: signal.reasoning,
        urgency: signal.urgency,
        targetPrice: signal.targetPrice,
        timeframe: signal.timeframe
      }
    })
  }

  private static analyzePosition(position: PortfolioPosition, marketConditions: any) {
    // Profit taking logic
    const profitPercent = position.unrealizedPnL / Math.abs(position.risk)
    if (profitPercent > 0.5) {
      return {
        action: 'close',
        reasoning: 'Position reached 50% max profit target',
        urgency: 'high',
        targetPrice: null,
        timeframe: 'immediate'
      }
    }
    
    // Stop loss logic
    if (profitPercent < -0.75) {
      return {
        action: 'close',
        reasoning: 'Position approaching max loss, cut losses',
        urgency: 'critical',
        targetPrice: null,
        timeframe: 'immediate'
      }
    }
    
    // Time decay management
    if (position.daysInTrade > 21 && profitPercent < 0.1) {
      return {
        action: 'roll',
        reasoning: 'Consider rolling to capture additional premium',
        urgency: 'medium',
        targetPrice: null,
        timeframe: '2-3 days'
      }
    }
    
    return {
      action: 'hold',
      reasoning: 'Position performing as expected',
      urgency: 'low',
      targetPrice: null,
      timeframe: 'continue monitoring'
    }
  }
}

interface PositionManagementSignal {
  positionId: string
  action: 'hold' | 'close' | 'roll' | 'hedge' | 'adjust'
  reasoning: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
  targetPrice: number | null
  timeframe: string
}