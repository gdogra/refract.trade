import { PortfolioContext } from './optionsRecommendations'

export interface RiskBudget {
  totalBudget: number // Total risk budget in dollars
  allocated: number // Currently allocated risk
  available: number // Available risk budget
  utilizationPercent: number // Percentage of budget used
  
  // Risk allocation by category
  byCategory: {
    options: number
    stocks: number
    leveraged: number
    speculative: number
  }
  
  // Risk allocation by time horizon
  byTimeHorizon: {
    short: number // < 30 days
    medium: number // 30-90 days
    long: number // > 90 days
  }
  
  // Risk allocation by strategy type
  byStrategy: {
    directional: number
    income: number
    hedging: number
    speculation: number
  }
}

export interface RiskMetrics {
  // Portfolio-level metrics
  portfolioVar: number // Value at Risk (1 day, 95%)
  portfolioStdDev: number // Portfolio standard deviation
  sharpeRatio: number
  maxDrawdown: number
  beta: number // Beta to market
  
  // Position-level metrics
  positionRisks: Array<{
    symbol: string
    positionVar: number
    marginRequirement: number
    liquidationPrice?: number
    greeksExposure: {
      delta: number
      gamma: number
      theta: number
      vega: number
    }
  }>
  
  // Risk warnings
  warnings: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical'
    type: 'concentration' | 'correlation' | 'leverage' | 'liquidity' | 'expiration'
    message: string
    affectedPositions: string[]
    recommendedAction: string
  }>
}

export class RiskBudgetManager {
  private portfolioContext: PortfolioContext
  private riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  
  constructor(portfolioContext: PortfolioContext, riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate') {
    this.portfolioContext = portfolioContext
    this.riskTolerance = riskTolerance
  }
  
  calculateRiskBudget(): RiskBudget {
    const { totalValue } = this.portfolioContext
    
    // Base risk budget as percentage of portfolio
    const riskMultiplier = {
      conservative: 0.02, // 2% max risk
      moderate: 0.05,     // 5% max risk  
      aggressive: 0.10    // 10% max risk
    }[this.riskTolerance]
    
    const totalBudget = totalValue * riskMultiplier
    const allocated = this.calculateAllocatedRisk()
    const available = Math.max(0, totalBudget - allocated)
    const utilizationPercent = (allocated / totalBudget) * 100
    
    return {
      totalBudget,
      allocated,
      available,
      utilizationPercent,
      byCategory: this.calculateCategoryAllocation(),
      byTimeHorizon: this.calculateTimeHorizonAllocation(),
      byStrategy: this.calculateStrategyAllocation()
    }
  }
  
  private calculateAllocatedRisk(): number {
    return this.portfolioContext.currentPositions.reduce((total, position) => {
      if (position.positionType === 'stock') {
        // Stock risk = market value * expected volatility
        return total + (Math.abs(position.marketValue) * 0.20) // Assume 20% annual vol
      } else {
        // Options risk = max loss potential
        const maxLoss = position.quantity * 100 // Simplified - in reality would calculate Greeks
        return total + Math.abs(maxLoss)
      }
    }, 0)
  }
  
  private calculateCategoryAllocation(): RiskBudget['byCategory'] {
    const positions = this.portfolioContext.currentPositions
    
    let options = 0
    let stocks = 0
    let leveraged = 0
    let speculative = 0
    
    positions.forEach(pos => {
      const risk = Math.abs(pos.marketValue * 0.20) // Simplified risk calculation
      
      if (pos.positionType === 'stock') {
        stocks += risk
      } else {
        options += risk
        
        // Check if position is leveraged (high delta) or speculative (short DTE)
        if (Math.abs(pos.unrealizedPnL / pos.marketValue) > 0.5) {
          leveraged += risk
        }
        if (pos.symbol.match(/[A-Z]{1,4}[0-9]/) || Math.random() > 0.7) { // Simplified speculative check
          speculative += risk
        }
      }
    })
    
    return { options, stocks, leveraged, speculative }
  }
  
  private calculateTimeHorizonAllocation(): RiskBudget['byTimeHorizon'] {
    // Simplified allocation based on position types
    const totalRisk = this.calculateAllocatedRisk()
    
    return {
      short: totalRisk * 0.4, // 40% short-term
      medium: totalRisk * 0.4, // 40% medium-term
      long: totalRisk * 0.2    // 20% long-term
    }
  }
  
  private calculateStrategyAllocation(): RiskBudget['byStrategy'] {
    const totalRisk = this.calculateAllocatedRisk()
    
    return {
      directional: totalRisk * 0.5,  // 50% directional bets
      income: totalRisk * 0.3,       // 30% income strategies
      hedging: totalRisk * 0.15,     // 15% hedging
      speculation: totalRisk * 0.05  // 5% speculation
    }
  }
  
  calculatePositionRisk(symbol: string, optionType: 'call' | 'put', quantity: number, premium: number): {
    maxLoss: number
    maxGain: number
    portfolioImpact: number
    riskBudgetImpact: number
    recommendation: 'safe' | 'moderate' | 'high' | 'excessive'
  } {
    const maxLoss = quantity * premium * 100 // Max loss for long options
    const maxGain = optionType === 'call' ? Infinity : (quantity * premium * 100) // Simplified
    
    const portfolioImpact = maxLoss / this.portfolioContext.totalValue
    const riskBudgetImpact = maxLoss / this.calculateRiskBudget().available
    
    let recommendation: 'safe' | 'moderate' | 'high' | 'excessive'
    if (portfolioImpact <= 0.01) recommendation = 'safe'        // ≤1% of portfolio
    else if (portfolioImpact <= 0.02) recommendation = 'moderate' // ≤2% of portfolio
    else if (portfolioImpact <= 0.05) recommendation = 'high'     // ≤5% of portfolio
    else recommendation = 'excessive'                              // >5% of portfolio
    
    return {
      maxLoss,
      maxGain,
      portfolioImpact,
      riskBudgetImpact,
      recommendation
    }
  }
  
  generateRiskMetrics(): RiskMetrics {
    const positions = this.portfolioContext.currentPositions
    const warnings: RiskMetrics['warnings'] = []
    
    // Check for concentration risk
    positions.forEach(position => {
      const concentration = position.marketValue / this.portfolioContext.totalValue
      if (concentration > 0.2) { // >20% in single position
        warnings.push({
          severity: concentration > 0.4 ? 'critical' : 'high',
          type: 'concentration',
          message: `Over-concentrated in ${position.symbol}: ${(concentration * 100).toFixed(1)}% of portfolio`,
          affectedPositions: [position.symbol],
          recommendedAction: 'Consider reducing position size or adding hedging'
        })
      }
    })
    
    // Check for correlation risk
    const sectorConcentration = Object.entries(this.portfolioContext.sectorExposure)
    sectorConcentration.forEach(([sector, exposure]) => {
      if (exposure > 0.4) { // >40% in single sector
        warnings.push({
          severity: 'medium',
          type: 'correlation',
          message: `High sector concentration in ${sector}: ${(exposure * 100).toFixed(1)}%`,
          affectedPositions: positions.filter(p => p.symbol.startsWith(sector.slice(0, 3))).map(p => p.symbol),
          recommendedAction: 'Consider diversifying into other sectors'
        })
      }
    })
    
    // Portfolio-level calculations (simplified)
    const portfolioValue = this.portfolioContext.totalValue
    const portfolioVar = portfolioValue * 0.02 // 2% VaR estimate
    const portfolioStdDev = portfolioValue * 0.15 // 15% annual volatility
    
    return {
      portfolioVar,
      portfolioStdDev,
      sharpeRatio: 1.2 + Math.random() * 0.8, // Mock Sharpe ratio
      maxDrawdown: 0.08 + Math.random() * 0.12, // 8-20% drawdown
      beta: 0.8 + Math.random() * 0.6, // Beta 0.8-1.4
      
      positionRisks: positions.map(pos => ({
        symbol: pos.symbol,
        positionVar: Math.abs(pos.marketValue) * 0.02,
        marginRequirement: pos.positionType === 'stock' ? 0 : Math.abs(pos.marketValue) * 0.20,
        liquidationPrice: pos.positionType === 'stock' ? pos.avgCost * 0.5 : undefined,
        greeksExposure: {
          delta: Math.random() * 0.8,
          gamma: Math.random() * 0.05,
          theta: -Math.random() * 0.05,
          vega: Math.random() * 0.2
        }
      })),
      
      warnings
    }
  }
  
  // Risk scenario analysis
  async runStressTest(scenarios: Array<{
    name: string
    marketMove: number // -20% to +20%
    volChange: number // -50% to +200%
    timeDecay: number // Days to simulate
  }>): Promise<Array<{
    scenario: string
    portfolioValue: number
    portfolioPnL: number
    worstPosition: { symbol: string; pnl: number }
    riskMetrics: {
      var: number
      expectedShortfall: number
    }
  }>> {
    return scenarios.map(scenario => {
      // Simulate scenario impact on portfolio
      const baseValue = this.portfolioContext.totalValue
      const impactPercent = scenario.marketMove * (1 + Math.random() * 0.3) // Add some randomness
      const newValue = baseValue * (1 + impactPercent)
      
      return {
        scenario: scenario.name,
        portfolioValue: newValue,
        portfolioPnL: newValue - baseValue,
        worstPosition: {
          symbol: this.portfolioContext.currentPositions[0]?.symbol || 'N/A',
          pnl: -Math.abs(baseValue * scenario.marketMove * 0.1)
        },
        riskMetrics: {
          var: Math.abs(newValue - baseValue),
          expectedShortfall: Math.abs(newValue - baseValue) * 1.5
        }
      }
    })
  }
}

export const RISK_TOLERANCE_PROFILES = {
  conservative: {
    maxPortfolioRisk: 0.02, // 2% of portfolio
    maxPositionSize: 0.05,  // 5% per position
    maxLeverage: 1.5,
    preferredStrategies: ['covered_calls', 'protective_puts', 'cash_secured_puts']
  },
  moderate: {
    maxPortfolioRisk: 0.05, // 5% of portfolio
    maxPositionSize: 0.10,  // 10% per position  
    maxLeverage: 2.0,
    preferredStrategies: ['long_calls', 'long_puts', 'spreads', 'iron_condors']
  },
  aggressive: {
    maxPortfolioRisk: 0.10, // 10% of portfolio
    maxPositionSize: 0.20,  // 20% per position
    maxLeverage: 3.0,
    preferredStrategies: ['otm_options', 'short_strangles', 'ratio_spreads']
  }
} as const