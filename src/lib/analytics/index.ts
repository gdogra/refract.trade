/**
 * Analytics Module Index
 * 
 * Exports all hedge-fund-grade analytics components for institutional options trading
 */

// Core Analytics Engines
export * from './volatilityIntelligence'
export * from './advancedRiskMetrics'
export * from './greeksAggregation'
export * from './liquidityModeling'
export * from './strategyOptimization'
export * from './riskAdjustedRanking'
export * from './opportunitiesScanner'
export * from './continuousMonitoring'

// Re-export key types for convenience
export type {
  // Volatility Intelligence
  VolatilitySurface,
  IVRankPercentile,
  RealizedVsImplied,
  EventVolatility,
  VolatilitySkew,
  
  // Advanced Risk Metrics
  AdvancedRiskMetrics,
  CVaRResult,
  VaRResult,
  DistributionAnalysis,
  StressTestResults,
  TailExposureAnalysis,
  KellyFractionResult,
  
  // Greeks Aggregation
  PortfolioGreeks,
  GammaProfile,
  ThetaDecayPoint,
  VegaSensitivityPoint,
  GreeksRiskLimits,
  HedgingRecommendation,
  AdvancedGreeks,
  
  // Liquidity Modeling
  LiquidityProfile,
  OpenInterestAnalysis,
  VolumeProfileAnalysis,
  BidAskAnalysis,
  SlippageEstimates,
  ScalingLimits,
  ExecutionRiskAssessment,
  
  // Strategy Optimization
  StrategyOptimization,
  OptimizedStrategy,
  StrategyType,
  TradeQualityScore,
  ExecutionGuidance,
  MarketConditionAssessment,
  
  // Risk-Adjusted Ranking
  RiskAdjustedOpportunityScore,
  RAOSComponents,
  OpportunityRanking,
  ActionableInsight,
  InstitutionalGrade,
  
  // Opportunities Scanner
  OpportunitiesScanner,
  RankedOpportunity,
  MonitoringEngine,
  PortfolioHealthDashboard,
  RiskExposureMap,
  OpportunityAlert,
  
  // Continuous Monitoring
  ContinuousMonitoringEngine,
  MonitoringAlert,
  ActionableGuidance,
  WorstCaseScenario
} from './volatilityIntelligence'

/**
 * Main Analytics Controller
 * Orchestrates all analytics modules for comprehensive analysis
 */
export class AnalyticsController {
  private monitoringEngine?: any
  private lastUpdateTime: Date = new Date()
  
  constructor(private preferences: AnalyticsPreferences = {}) {}
  
  /**
   * Run comprehensive analysis on a symbol
   */
  async analyzeSymbol(symbol: string): Promise<SymbolAnalysisResult> {
    // This would orchestrate all the analytics modules
    // Import and use the functions from each module
    
    return {
      symbol,
      timestamp: new Date(),
      volatilityIntelligence: {} as any, // Would be populated by volatilityIntelligence module
      riskMetrics: {} as any, // Would be populated by advancedRiskMetrics module
      liquidityProfile: {} as any, // Would be populated by liquidityModeling module
      strategiesOptimized: {} as any, // Would be populated by strategyOptimization module
      raosScoring: {} as any, // Would be populated by riskAdjustedRanking module
      overallRecommendation: this.generateOverallRecommendation(symbol)
    }
  }
  
  /**
   * Initialize continuous monitoring
   */
  async startMonitoring(watchlist: string[], portfolioPositions: any[]): Promise<void> {
    // Initialize the continuous monitoring engine
    // This would set up real-time monitoring of all symbols and portfolio
  }
  
  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    // Clean up monitoring resources
  }
  
  private generateOverallRecommendation(symbol: string): OverallRecommendation {
    return {
      action: 'monitor',
      confidence: 0.75,
      reasoning: 'Analysis in progress',
      timeframe: 'immediate',
      keyFactors: []
    }
  }
}

export interface AnalyticsPreferences {
  updateFrequency?: number // Minutes
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive'
  focusAreas?: ('volatility' | 'liquidity' | 'risk' | 'opportunities')[]
  alertThresholds?: {
    volatilitySpike?: number
    liquidityDeterioration?: number
    riskLimitBreach?: number
  }
}

export interface SymbolAnalysisResult {
  symbol: string
  timestamp: Date
  volatilityIntelligence: any
  riskMetrics: any
  liquidityProfile: any
  strategiesOptimized: any
  raosScoring: any
  overallRecommendation: OverallRecommendation
}

export interface OverallRecommendation {
  action: 'buy' | 'sell' | 'hold' | 'monitor' | 'avoid'
  confidence: number
  reasoning: string
  timeframe: string
  keyFactors: string[]
}

/**
 * Utility functions for common analytics operations
 */
export const AnalyticsUtils = {
  /**
   * Convert IV rank to color coding
   */
  getIVRankSeverity(ivRank: number): 'low' | 'normal' | 'high' | 'extreme' {
    if (ivRank >= 90 || ivRank <= 10) return 'extreme'
    if (ivRank >= 75 || ivRank <= 25) return 'high'
    if (ivRank >= 60 || ivRank <= 40) return 'normal'
    return 'low'
  },
  
  /**
   * Convert RAOS to letter grade
   */
  getRAOSGrade(raos: number): 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C' {
    if (raos >= 90) return 'AAA'
    if (raos >= 80) return 'AA'
    if (raos >= 70) return 'A'
    if (raos >= 60) return 'BBB'
    if (raos >= 50) return 'BB'
    if (raos >= 40) return 'B'
    return 'C'
  },
  
  /**
   * Format Greeks for display
   */
  formatGreek(value: number, type: 'delta' | 'gamma' | 'theta' | 'vega' | 'rho'): string {
    const precision = type === 'gamma' ? 3 : type === 'delta' ? 2 : 1
    return value.toFixed(precision)
  },
  
  /**
   * Calculate portfolio concentration risk
   */
  calculateConcentrationRisk(exposures: Record<string, number>): number {
    const total = Object.values(exposures).reduce((sum, exp) => sum + Math.abs(exp), 0)
    if (total === 0) return 0
    
    // Herfindahl-Hirschman Index
    const hhi = Object.values(exposures).reduce((sum, exp) => {
      const share = Math.abs(exp) / total
      return sum + share * share
    }, 0)
    
    return hhi
  }
}

/**
 * Default configuration for analytics modules
 */
export const DEFAULT_ANALYTICS_CONFIG = {
  volatilityIntelligence: {
    ivRankPeriod: '252d',
    surfaceInterpolation: true,
    eventDetection: true
  },
  riskMetrics: {
    confidenceLevels: [0.95, 0.99, 0.999],
    monteCarloSimulations: 10000,
    stressTestScenarios: ['crash', 'flash_crash', 'vol_spike', 'rate_shock']
  },
  greeksAggregation: {
    riskLimits: {
      delta: 1000,
      gamma: 500,
      theta: -200,
      vega: 1000
    },
    hedgingThresholds: {
      delta: 0.7,
      gamma: 0.7,
      vega: 0.7
    }
  },
  liquidityModeling: {
    minimumVolume: 50,
    minimumOpenInterest: 100,
    maxSpreadPercent: 0.3,
    slippageModel: 'sqrt_rule'
  },
  strategyOptimization: {
    maxStrategiesPerSymbol: 50,
    liquidityFilter: true,
    riskFilter: true,
    marketFitFilter: true
  },
  riskAdjustedRanking: {
    penaltyWeights: {
      unlimited_risk: 0.4,
      illiquidity: 0.3,
      event_risk: 0.25,
      excessive_theta: 0.2,
      extreme_gamma: 0.3
    }
  },
  opportunitiesScanner: {
    scanFrequency: 300, // 5 minutes
    universeSize: 500,
    minRAOS: 60,
    maxPositionsPerSymbol: 3
  },
  continuousMonitoring: {
    updateFrequency: 60, // 1 minute
    alertPriorities: ['critical', 'high', 'medium'],
    maxActiveAlerts: 50
  }
}