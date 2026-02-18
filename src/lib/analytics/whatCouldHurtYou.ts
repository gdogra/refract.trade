/**
 * "What Could Hurt You Most Right Now?" Analysis Engine
 * 
 * The killer feature that simulates adverse scenarios and explains impacts 
 * in plain English. This is what no retail platform does well.
 */

export interface AdverseScenario {
  id: string
  name: string
  description: string
  probability: number
  timeframe: string
  potentialLoss: number
  impactAnalysis: ImpactAnalysis
  affectedPositions: AffectedPosition[]
  mitigation: MitigationStrategy
  urgency: 'critical' | 'high' | 'medium' | 'low'
  plainEnglishExplanation: string
}

export interface ImpactAnalysis {
  portfolioLossPercent: number
  worstCaseDrawdown: number
  liquidityImpact: number
  timeToRecover: string
  cascadingEffects: string[]
  hedgingCost: number
}

export interface AffectedPosition {
  symbol: string
  strategy: string
  currentValue: number
  projectedLoss: number
  lossPercent: number
  contributionToTotalLoss: number
  reason: string
}

export interface MitigationStrategy {
  primary: MitigationAction
  alternative: MitigationAction
  cost: number
  effectiveness: number
  timeToImplement: string
  riskReduction: number
}

export interface MitigationAction {
  action: string
  description: string
  cost: number
  riskReduction: number
}

/**
 * Worst Case Scenario Analysis Engine
 */
export class WorstCaseAnalysisEngine {
  
  /**
   * Analyze all potential threats and return the most dangerous
   */
  async analyzeWorstCaseScenarios(
    portfolioContext: any,
    marketConditions: any
  ): Promise<AdverseScenario[]> {
    
    const scenarios = [
      await this.analyzeMarketCrashScenario(portfolioContext),
      await this.analyzeVolatilitySpike(portfolioContext),
      await this.analyzeEarningsShock(portfolioContext),
      await this.analyzeInterestRateShock(portfolioContext),
      await this.analyzeCorrelationBreakdown(portfolioContext),
      await this.analyzeLiquidityCrisis(portfolioContext),
      await this.analyzeSectorRotation(portfolioContext)
    ]

    return scenarios.sort((a, b) => b.potentialLoss - a.potentialLoss)
  }

  /**
   * Market crash scenario (20% drop in major indices)
   */
  private async analyzeMarketCrashScenario(portfolioContext: any): Promise<AdverseScenario> {
    const marketDrop = -0.20
    const affectedPositions = this.simulateMarketDropImpact(portfolioContext.positions, marketDrop)
    const totalLoss = affectedPositions.reduce((sum, pos) => sum + pos.projectedLoss, 0)
    
    return {
      id: 'market_crash',
      name: 'Market Crash (20% Drop)',
      description: 'Broad market selloff similar to March 2020 or October 1987',
      probability: 0.08,
      timeframe: '1-3 trading days',
      potentialLoss: totalLoss,
      impactAnalysis: {
        portfolioLossPercent: (totalLoss / portfolioContext.totalCapital) * 100,
        worstCaseDrawdown: totalLoss,
        liquidityImpact: 0.6, // Liquidity would dry up
        timeToRecover: '6-18 months',
        cascadingEffects: [
          'IV crush on short vol positions',
          'Correlation spike reduces diversification',
          'Liquidity deterioration increases slippage',
          'Margin calls on leveraged positions'
        ],
        hedgingCost: portfolioContext.totalCapital * 0.02
      },
      affectedPositions,
      mitigation: {
        primary: {
          action: 'Add SPY put hedge',
          description: 'Purchase SPY put spread for downside protection',
          cost: portfolioContext.totalCapital * 0.015,
          riskReduction: 0.65
        },
        alternative: {
          action: 'Reduce position sizes',
          description: 'Cut all position sizes by 40% to reduce exposure',
          cost: 0,
          riskReduction: 0.40
        },
        cost: portfolioContext.totalCapital * 0.015,
        effectiveness: 0.65,
        timeToImplement: '30 minutes',
        riskReduction: 0.65
      },
      urgency: 'high',
      plainEnglishExplanation: `If the market crashes 20% (similar to March 2020), your portfolio could lose $${totalLoss.toLocaleString()}. This would happen because your long positions would drop in value while your short volatility trades would get crushed by the IV spike. Your tech-heavy exposure makes this especially painful since tech sells off hardest in crashes.`
    }
  }

  /**
   * Volatility spike scenario (VIX doubles)
   */
  private async analyzeVolatilitySpike(portfolioContext: any): Promise<AdverseScenario> {
    const vixSpike = 2.0 // VIX doubles
    const affectedPositions = this.simulateVolatilityImpact(portfolioContext.positions, vixSpike)
    const totalLoss = affectedPositions.reduce((sum, pos) => sum + pos.projectedLoss, 0)
    
    return {
      id: 'volatility_spike',
      name: 'Volatility Explosion (VIX Doubles)',
      description: 'Sudden volatility expansion from fear or uncertainty',
      probability: 0.15,
      timeframe: 'Intraday to 2 days',
      potentialLoss: totalLoss,
      impactAnalysis: {
        portfolioLossPercent: (totalLoss / portfolioContext.totalCapital) * 100,
        worstCaseDrawdown: totalLoss,
        liquidityImpact: 0.4,
        timeToRecover: '2-8 weeks',
        cascadingEffects: [
          'Short vol positions suffer immediate losses',
          'Iron condors/butterflies get blown out',
          'Gamma hedging becomes expensive',
          'Bid-ask spreads widen dramatically'
        ],
        hedgingCost: portfolioContext.totalCapital * 0.01
      },
      affectedPositions,
      mitigation: {
        primary: {
          action: 'Close short vol positions',
          description: 'Exit iron condors and credit spreads immediately',
          cost: totalLoss * 0.3,
          riskReduction: 0.80
        },
        alternative: {
          action: 'Buy VIX calls',
          description: 'Add long volatility hedge via VIX options',
          cost: portfolioContext.totalCapital * 0.008,
          riskReduction: 0.45
        },
        cost: totalLoss * 0.3,
        effectiveness: 0.80,
        timeToImplement: '15 minutes',
        riskReduction: 0.80
      },
      urgency: 'critical',
      plainEnglishExplanation: `If volatility explodes (VIX doubles), you'd lose $${totalLoss.toLocaleString()} primarily from your iron condors and credit spreads getting blown out. When everyone panics, implied volatility skyrockets, making your short vol positions very expensive to close. The faster you act, the less you lose.`
    }
  }

  /**
   * Earnings shock scenario (major holding reports disaster)
   */
  private async analyzeEarningsShock(portfolioContext: any): Promise<AdverseScenario> {
    const majorHoldings = portfolioContext.positions
      .filter((pos: any) => pos.risk > portfolioContext.totalCapital * 0.02)
      .sort((a: any, b: any) => b.risk - a.risk)

    const worstPosition = majorHoldings[0]
    const earningsShock = -0.25 // 25% gap down
    
    const affectedPositions = [{
      symbol: worstPosition.symbol,
      strategy: worstPosition.strategy,
      currentValue: worstPosition.marketValue,
      projectedLoss: worstPosition.risk * 0.8, // Lose 80% of max risk
      lossPercent: 0.8,
      contributionToTotalLoss: 1.0,
      reason: 'Earnings gap down through all strikes'
    }]

    const totalLoss = worstPosition.risk * 0.8

    return {
      id: 'earnings_shock',
      name: `${worstPosition.symbol} Earnings Disaster`,
      description: 'Major holding gaps down 25% on earnings miss',
      probability: 0.12,
      timeframe: 'After market hours',
      potentialLoss: totalLoss,
      impactAnalysis: {
        portfolioLossPercent: (totalLoss / portfolioContext.totalCapital) * 100,
        worstCaseDrawdown: totalLoss,
        liquidityImpact: 0.3,
        timeToRecover: '1-3 months',
        cascadingEffects: [
          'Position becomes worthless overnight',
          'No ability to adjust or roll',
          'Sector contagion possible',
          'Risk budget severely depleted'
        ],
        hedgingCost: worstPosition.risk * 0.05
      },
      affectedPositions,
      mitigation: {
        primary: {
          action: 'Close before earnings',
          description: 'Exit position before earnings announcement',
          cost: worstPosition.risk * 0.1,
          riskReduction: 0.95
        },
        alternative: {
          action: 'Buy protective puts',
          description: 'Purchase puts to limit downside risk',
          cost: worstPosition.risk * 0.04,
          riskReduction: 0.70
        },
        cost: worstPosition.risk * 0.1,
        effectiveness: 0.95,
        timeToImplement: '5 minutes',
        riskReduction: 0.95
      },
      urgency: 'high',
      plainEnglishExplanation: `Your biggest single position is ${worstPosition.symbol}. If they report terrible earnings and gap down 25%, you'd lose $${totalLoss.toLocaleString()}. This happens because options expire worthless when the stock gaps through your strikes. Since you can't adjust after hours, you'd be stuck taking the full loss.`
    }
  }

  /**
   * Interest rate shock scenario
   */
  private async analyzeInterestRateShock(portfolioContext: any): Promise<AdverseScenario> {
    const rateShock = 0.015 // 150 basis points jump
    const affectedPositions = this.simulateRateImpact(portfolioContext.positions, rateShock)
    const totalLoss = affectedPositions.reduce((sum, pos) => sum + pos.projectedLoss, 0)

    return {
      id: 'rate_shock',
      name: 'Interest Rate Shock (+150bp)',
      description: 'Fed surprises with aggressive rate hike',
      probability: 0.06,
      timeframe: 'FOMC announcement',
      potentialLoss: totalLoss,
      impactAnalysis: {
        portfolioLossPercent: (totalLoss / portfolioContext.totalCapital) * 100,
        worstCaseDrawdown: totalLoss,
        liquidityImpact: 0.3,
        timeToRecover: '3-6 months',
        cascadingEffects: [
          'Growth stocks get hammered',
          'Option pricing models affected',
          'Rho sensitivity realized',
          'Sector rotation accelerates'
        ],
        hedgingCost: portfolioContext.totalCapital * 0.012
      },
      affectedPositions,
      mitigation: {
        primary: {
          action: 'Reduce duration exposure',
          description: 'Close long-dated positions, focus on shorter expirations',
          cost: totalLoss * 0.15,
          riskReduction: 0.60
        },
        alternative: {
          action: 'Add rate hedge',
          description: 'Purchase TLT puts or treasury rate futures',
          cost: portfolioContext.totalCapital * 0.01,
          riskReduction: 0.35
        },
        cost: totalLoss * 0.15,
        effectiveness: 0.60,
        timeToImplement: '45 minutes',
        riskReduction: 0.60
      },
      urgency: 'medium',
      plainEnglishExplanation: `If the Fed shocks markets with a huge rate hike, you'd lose $${totalLoss.toLocaleString()}. This hits you because higher rates make growth stocks (your biggest exposure) less attractive, and the rho sensitivity of your longer-dated positions becomes a real problem. Tech gets crushed in rate shock scenarios.`
    }
  }

  /**
   * Correlation breakdown scenario (diversification fails)
   */
  private async analyzeCorrelationBreakdown(portfolioContext: any): Promise<AdverseScenario> {
    const correlationSpike = 0.95 // All positions move together
    const affectedPositions = this.simulateCorrelationBreakdown(portfolioContext.positions)
    const totalLoss = affectedPositions.reduce((sum, pos) => sum + pos.projectedLoss, 0)

    return {
      id: 'correlation_breakdown',
      name: 'Correlation Breakdown (Diversification Fails)',
      description: 'All positions move together in crisis',
      probability: 0.18,
      timeframe: '1-5 trading days',
      potentialLoss: totalLoss,
      impactAnalysis: {
        portfolioLossPercent: (totalLoss / portfolioContext.totalCapital) * 100,
        worstCaseDrawdown: totalLoss,
        liquidityImpact: 0.5,
        timeToRecover: '3-12 months',
        cascadingEffects: [
          'Diversification benefit evaporates',
          'All sectors decline simultaneously',
          'Hedge positions fail to protect',
          'Liquidity premium spikes'
        ],
        hedgingCost: portfolioContext.totalCapital * 0.025
      },
      affectedPositions,
      mitigation: {
        primary: {
          action: 'True diversification',
          description: 'Add uncorrelated assets (bonds, commodities, currency)',
          cost: portfolioContext.totalCapital * 0.02,
          riskReduction: 0.50
        },
        alternative: {
          action: 'VIX hedge',
          description: 'Long volatility position for crisis protection',
          cost: portfolioContext.totalCapital * 0.015,
          riskReduction: 0.35
        },
        cost: portfolioContext.totalCapital * 0.02,
        effectiveness: 0.50,
        timeToImplement: '2 hours',
        riskReduction: 0.50
      },
      urgency: 'high',
      plainEnglishExplanation: `Your biggest risk is that all your positions are actually more correlated than you think. In a real crisis, AAPL, MSFT, and NVDA all drop together - your "diversification" disappears. You'd lose $${totalLoss.toLocaleString()} because what looked like separate bets are really the same bet: "tech keeps going up."`
    }
  }

  /**
   * Liquidity crisis scenario
   */
  private async analyzeLiquidityCrisis(portfolioContext: any): Promise<AdverseScenario> {
    const affectedPositions = this.simulateLiquidityCrisis(portfolioContext.positions)
    const totalLoss = affectedPositions.reduce((sum, pos) => sum + pos.projectedLoss, 0)

    return {
      id: 'liquidity_crisis',
      name: 'Liquidity Crisis (Can\'t Exit)',
      description: 'Bid-ask spreads explode, unable to close positions at fair prices',
      probability: 0.10,
      timeframe: 'During market stress',
      potentialLoss: totalLoss,
      impactAnalysis: {
        portfolioLossPercent: (totalLoss / portfolioContext.totalCapital) * 100,
        worstCaseDrawdown: totalLoss,
        liquidityImpact: 0.8,
        timeToRecover: '1-4 weeks',
        cascadingEffects: [
          'Trapped in losing positions',
          'Forced to accept terrible prices',
          'Slippage costs multiply',
          'Risk management becomes impossible'
        ],
        hedgingCost: 0 // Can't hedge liquidity risk with more trades
      },
      affectedPositions,
      mitigation: {
        primary: {
          action: 'Stick to liquid names only',
          description: 'Only trade SPY, QQQ, and mega-cap stocks',
          cost: 0,
          riskReduction: 0.70
        },
        alternative: {
          action: 'Reduce position sizes',
          description: 'Smaller positions easier to exit in crisis',
          cost: 0,
          riskReduction: 0.40
        },
        cost: 0,
        effectiveness: 0.70,
        timeToImplement: 'For future trades',
        riskReduction: 0.70
      },
      urgency: 'medium',
      plainEnglishExplanation: `Your worst nightmare: the market panics and nobody wants to buy your options. Bid-ask spreads explode from $0.10 to $2.00. You watch your positions lose $${totalLoss.toLocaleString()} not because you're wrong, but because you literally can't get out at reasonable prices. It's like being trapped in a burning building.`
    }
  }

  /**
   * Sector rotation scenario
   */
  private async analyzeSectorRotation(portfolioContext: any): Promise<AdverseScenario> {
    const techExposure = portfolioContext.sectorExposures['technology'] || 0
    const affectedPositions = this.simulateSectorRotation(portfolioContext.positions, 'technology')
    const totalLoss = affectedPositions.reduce((sum, pos) => sum + pos.projectedLoss, 0)

    return {
      id: 'sector_rotation',
      name: 'Tech Sector Rotation Out',
      description: 'Money flows out of tech into value/cyclicals',
      probability: 0.25,
      timeframe: '1-4 weeks',
      potentialLoss: totalLoss,
      impactAnalysis: {
        portfolioLossPercent: (totalLoss / portfolioContext.totalCapital) * 100,
        worstCaseDrawdown: totalLoss,
        liquidityImpact: 0.2,
        timeToRecover: '2-6 months',
        cascadingEffects: [
          'Tech multiples compress',
          'Momentum strategies fail',
          'IV rank drops reduce premium',
          'Performance chasing into other sectors'
        ],
        hedgingCost: portfolioContext.totalCapital * 0.008
      },
      affectedPositions,
      mitigation: {
        primary: {
          action: 'Diversify across sectors',
          description: 'Add positions in energy, financials, industrials',
          cost: portfolioContext.totalCapital * 0.02,
          riskReduction: 0.60
        },
        alternative: {
          action: 'Reduce tech exposure',
          description: 'Close 50% of tech positions',
          cost: totalLoss * 0.1,
          riskReduction: 0.50
        },
        cost: portfolioContext.totalCapital * 0.02,
        effectiveness: 0.60,
        timeToImplement: '1-2 days',
        riskReduction: 0.60
      },
      urgency: 'medium',
      plainEnglishExplanation: `You're heavily concentrated in tech (${(techExposure * 100).toFixed(0)}% of portfolio). If money rotates out of tech into value stocks, you'd lose $${totalLoss.toLocaleString()}. This isn't about individual companies - it's about the whole sector falling out of favor. Your AAPL, MSFT, and NVDA positions would all decline together.`
    }
  }

  /**
   * Simulate market drop impact on positions
   */
  private simulateMarketDropImpact(positions: any[], dropPercent: number): AffectedPosition[] {
    return positions.map(position => {
      // Different strategies react differently to market drops
      let lossMultiplier = 0.5 // Default assumption
      
      if (position.strategy.includes('Call')) lossMultiplier = 1.2
      if (position.strategy.includes('Put Credit')) lossMultiplier = 0.8
      if (position.strategy.includes('Iron Condor')) lossMultiplier = 0.6
      
      const projectedLoss = Math.abs(position.risk * Math.abs(dropPercent) * lossMultiplier)
      
      return {
        symbol: position.symbol,
        strategy: position.strategy,
        currentValue: position.marketValue,
        projectedLoss,
        lossPercent: (projectedLoss / Math.abs(position.risk)),
        contributionToTotalLoss: projectedLoss,
        reason: `${Math.abs(dropPercent * 100)}% market drop impacts ${position.strategy}`
      }
    })
  }

  /**
   * Simulate volatility spike impact
   */
  private simulateVolatilityImpact(positions: any[], volMultiplier: number): AffectedPosition[] {
    return positions.map(position => {
      // Short vol strategies get crushed
      let lossMultiplier = 0.3
      
      if (position.strategy.includes('Iron')) lossMultiplier = 0.8
      if (position.strategy.includes('Credit')) lossMultiplier = 0.7
      if (position.strategy.includes('Butterfly')) lossMultiplier = 0.9
      if (position.strategy.includes('Covered Call')) lossMultiplier = 0.2
      
      const projectedLoss = Math.abs(position.risk * (volMultiplier - 1) * lossMultiplier)
      
      return {
        symbol: position.symbol,
        strategy: position.strategy,
        currentValue: position.marketValue,
        projectedLoss,
        lossPercent: (projectedLoss / Math.abs(position.risk)),
        contributionToTotalLoss: projectedLoss,
        reason: `${((volMultiplier - 1) * 100).toFixed(0)}% vol spike impacts short vol strategy`
      }
    })
  }

  /**
   * Simulate correlation breakdown
   */
  private simulateCorrelationBreakdown(positions: any[]): AffectedPosition[] {
    return positions.map(position => {
      const projectedLoss = Math.abs(position.risk * 0.4) // Assume 40% loss when diversification fails
      
      return {
        symbol: position.symbol,
        strategy: position.strategy,
        currentValue: position.marketValue,
        projectedLoss,
        lossPercent: 0.4,
        contributionToTotalLoss: projectedLoss,
        reason: 'Diversification benefit disappears in crisis'
      }
    })
  }

  /**
   * Simulate liquidity crisis impact
   */
  private simulateLiquidityCrisis(positions: any[]): AffectedPosition[] {
    return positions.map(position => {
      // Slippage costs during liquidity crisis
      const slippageCost = Math.abs(position.risk * 0.15) // 15% slippage cost
      
      return {
        symbol: position.symbol,
        strategy: position.strategy,
        currentValue: position.marketValue,
        projectedLoss: slippageCost,
        lossPercent: 0.15,
        contributionToTotalLoss: slippageCost,
        reason: 'Extreme slippage costs when liquidity disappears'
      }
    })
  }

  /**
   * Simulate sector rotation impact
   */
  private simulateSectorRotation(positions: any[], sector: string): AffectedPosition[] {
    return positions
      .filter(position => position.sector === sector)
      .map(position => {
        const projectedLoss = Math.abs(position.risk * 0.35) // 35% loss in sector rotation
        
        return {
          symbol: position.symbol,
          strategy: position.strategy,
          currentValue: position.marketValue,
          projectedLoss,
          lossPercent: 0.35,
          contributionToTotalLoss: projectedLoss,
          reason: 'Sector rotation out of technology'
        }
      })
  }
}

/**
 * Scenario Impact Visualizer
 * Converts complex scenario analysis into digestible insights
 */
export class ScenarioImpactVisualizer {
  
  /**
   * Generate plain English explanation of scenario impact
   */
  static generatePlainEnglishImpact(scenario: AdverseScenario): string {
    const lossPercent = (scenario.potentialLoss / scenario.impactAnalysis.portfolioLossPercent * 100).toFixed(0)
    const timeframe = scenario.timeframe
    const recovery = scenario.impactAnalysis.timeToRecover
    
    let explanation = `Here's what would happen: `
    
    // Loss impact
    explanation += `You'd lose $${scenario.potentialLoss.toLocaleString()} (${lossPercent}% of your portfolio) `
    
    // Timeframe
    explanation += `over ${timeframe}. `
    
    // Why it hurts
    explanation += `The pain comes from ${scenario.affectedPositions.length > 1 ? 'multiple positions getting hit simultaneously' : 'your biggest position taking a major hit'}. `
    
    // Recovery timeline
    explanation += `Recovery would likely take ${recovery}. `
    
    // Prevention
    explanation += `Prevention: ${scenario.mitigation.primary.description} for $${scenario.mitigation.cost.toLocaleString()}.`
    
    return explanation
  }

  /**
   * Generate scenario summary for dashboard
   */
  static generateScenarioSummary(scenarios: AdverseScenario[]): ScenarioSummary {
    const mostLikely = scenarios.reduce((prev, current) => 
      current.probability > prev.probability ? current : prev
    )
    
    const mostDangerous = scenarios.reduce((prev, current) => 
      current.potentialLoss > prev.potentialLoss ? current : prev
    )
    
    const totalPotentialLoss = scenarios.reduce((sum, s) => sum + s.potentialLoss * s.probability, 0)
    
    return {
      mostLikelyScenario: mostLikely.name,
      mostLikelyProbability: mostLikely.probability,
      mostDangerousScenario: mostDangerous.name,
      maxPotentialLoss: mostDangerous.potentialLoss,
      expectedLoss: totalPotentialLoss,
      recommendedHedgeCost: Math.min(...scenarios.map(s => s.mitigation.cost)),
      urgentActions: scenarios.filter(s => s.urgency === 'critical' || s.urgency === 'high').length
    }
  }
}

export interface ScenarioSummary {
  mostLikelyScenario: string
  mostLikelyProbability: number
  mostDangerousScenario: string
  maxPotentialLoss: number
  expectedLoss: number
  recommendedHedgeCost: number
  urgentActions: number
}

/**
 * Real-time scenario monitoring
 * Continuously watches for scenario triggers
 */
export class ScenarioMonitor {
  private activeScenarios: Set<string> = new Set()
  private thresholds = {
    vixSpike: 0.20, // 20% VIX increase
    marketDrop: -0.05, // 5% market drop
    volumeSpike: 2.0, // 2x normal volume
    correlationSpike: 0.8 // 80% correlation threshold
  }

  /**
   * Monitor market conditions for scenario triggers
   */
  monitorScenarioTriggers(marketData: any): TriggeredScenario[] {
    const triggered: TriggeredScenario[] = []

    // VIX spike detection
    if (marketData.vixChangePercent > this.thresholds.vixSpike) {
      triggered.push({
        scenarioId: 'volatility_spike',
        triggerType: 'vix_spike',
        severity: this.calculateSeverity(marketData.vixChangePercent, this.thresholds.vixSpike),
        message: `VIX spiked ${(marketData.vixChangePercent * 100).toFixed(0)}% - volatility expansion scenario activated`,
        immediateAction: 'Review short vol positions for closure'
      })
    }

    // Market drop detection
    if (marketData.spyChangePercent < this.thresholds.marketDrop) {
      triggered.push({
        scenarioId: 'market_crash',
        triggerType: 'market_drop',
        severity: this.calculateSeverity(Math.abs(marketData.spyChangePercent), Math.abs(this.thresholds.marketDrop)),
        message: `Market dropped ${(Math.abs(marketData.spyChangePercent) * 100).toFixed(0)}% - crash scenario risk elevated`,
        immediateAction: 'Consider defensive positioning'
      })
    }

    return triggered
  }

  private calculateSeverity(actual: number, threshold: number): 'low' | 'medium' | 'high' | 'extreme' {
    const ratio = actual / threshold
    if (ratio > 3) return 'extreme'
    if (ratio > 2) return 'high'
    if (ratio > 1.5) return 'medium'
    return 'low'
  }
}

export interface TriggeredScenario {
  scenarioId: string
  triggerType: string
  severity: 'low' | 'medium' | 'high' | 'extreme'
  message: string
  immediateAction: string
}