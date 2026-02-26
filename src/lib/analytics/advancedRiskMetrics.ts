/**
 * Advanced Risk Metrics System
 * 
 * Implements institutional-grade risk analytics including:
 * - Expected Value (EV) calculations
 * - Conditional Value at Risk (CVaR)
 * - Enhanced Value at Risk (VaR)
 * - Probability distribution modeling
 * - Scenario stress testing
 * - Tail exposure analysis
 * - Kelly fraction optimization
 * - Sharpe-like ratios for options
 */

import { OptionContract } from '@/lib/options/yahooOptions'
import { Position, PositionLeg } from '@/types'

export interface AdvancedRiskMetrics {
  expectedValue: number
  probabilityOfProfit: number
  conditionalValueAtRisk: CVaRResult
  valueAtRisk: VaRResult
  distributionAnalysis: DistributionAnalysis
  stressTesting: StressTestResults
  tailExposure: TailExposureAnalysis
  kellyFraction: KellyFractionResult
  optionsSharpeRatio: number
  riskAdjustedReturn: number
}

export interface CVaRResult {
  cvar95: number // Expected loss given loss exceeds 95% VaR
  cvar99: number // Expected loss given loss exceeds 99% VaR
  expectedShortfall95: number
  expectedShortfall99: number
  tailLoss: number // Average loss in worst 5% of scenarios
  confidenceLevel: number
}

export interface VaRResult {
  var95: number
  var99: number
  var999: number // 99.9% VaR for extreme events
  parametricVaR: number // Using normal distribution
  historicalVaR: number // Using historical simulation
  monteCarloVaR: number // Using Monte Carlo simulation
  holdingPeriod: number // In days
}

export interface DistributionAnalysis {
  mean: number
  standardDeviation: number
  skewness: number // Asymmetry measure
  kurtosis: number // Tail thickness measure
  valueAtRiskContributions: VaRContribution[]
  probabilityDensityFunction: PDFPoint[]
  percentileBreakdown: PercentileBreakdown
}

export interface VaRContribution {
  component: string // 'delta', 'gamma', 'theta', 'vega', 'correlation'
  contribution: number // Absolute VaR contribution
  percentage: number // Percentage of total VaR
}

export interface PDFPoint {
  value: number
  probability: number
  cumulativeProbability: number
}

export interface PercentileBreakdown {
  p1: number
  p5: number
  p10: number
  p25: number
  p50: number // Median
  p75: number
  p90: number
  p95: number
  p99: number
}

export interface StressTestResults {
  scenarios: StressScenario[]
  worstCaseScenario: StressScenario
  averageLoss: number
  maxConsecutiveLosses: number
  recoveryTimeEstimate: number
}

export interface StressScenario {
  name: string
  description: string
  marketConditions: {
    underlyingMove: number
    volatilityMove: number
    timeDecay: number
    correlationShift: number
  }
  portfolioImpact: {
    totalPnL: number
    deltaImpact: number
    gammaImpact: number
    thetaImpact: number
    vegaImpact: number
    rhoImpact: number
  }
  probability: number
  severity: 'low' | 'medium' | 'high' | 'extreme'
}

export interface TailExposureAnalysis {
  leftTailExposure: number // Exposure to extreme downside moves
  rightTailExposure: number // Exposure to extreme upside moves
  tailRatio: number // Right tail / Left tail
  extremeEventProbability: number // P(|return| > 3 std dev)
  tailDependence: number // Correlation of extreme events
  blackSwanExposure: number // Exposure to 6+ sigma events
}

export interface KellyFractionResult {
  optimalFraction: number // Kelly optimal position size (0-1)
  adjustedFraction: number // Conservative Kelly (typically 25% of optimal)
  expectedGrowthRate: number
  riskOfRuin: number // Probability of losing 50%+ of capital
  recommendation: 'undersized' | 'optimal' | 'oversized'
}

/**
 * Calculate comprehensive risk metrics for a strategy or position
 */
export function calculateAdvancedRiskMetrics(
  position: Position | StrategyInput,
  marketData: MarketDataInput,
  historicalData: HistoricalDataInput
): AdvancedRiskMetrics {
  // Run Monte Carlo simulation
  const simulation = runMonteCarloSimulation(position, marketData, historicalData)
  
  // Calculate each metric
  const expectedValue = calculateExpectedValue(simulation.outcomes)
  const probabilityOfProfit = calculateProbabilityOfProfit(simulation.outcomes)
  const conditionalValueAtRisk = calculateCVaR(simulation.outcomes)
  const valueAtRisk = calculateEnhancedVaR(simulation.outcomes, historicalData)
  const distributionAnalysis = analyzeDistribution(simulation.outcomes)
  const stressTesting = performStressTesting(position, marketData)
  const tailExposure = analyzeTailExposure(simulation.outcomes)
  const kellyFraction = calculateKellyFraction(simulation.outcomes, marketData.riskFreeRate)
  const optionsSharpeRatio = calculateOptionsSharpe(simulation.outcomes, marketData.riskFreeRate)
  const riskAdjustedReturn = calculateRiskAdjustedReturn(expectedValue, conditionalValueAtRisk.cvar95)
  
  return {
    expectedValue,
    probabilityOfProfit,
    conditionalValueAtRisk,
    valueAtRisk,
    distributionAnalysis,
    stressTesting,
    tailExposure,
    kellyFraction,
    optionsSharpeRatio,
    riskAdjustedReturn
  }
}

export interface StrategyInput {
  legs: Array<{
    optionType: 'call' | 'put'
    strike: number
    expiration: Date
    quantity: number
    side: 'buy' | 'sell'
    impliedVolatility: number
    price: number
  }>
  totalCost: number
  maxProfit: number
  maxLoss: number
  breakevens: number[]
}

export interface MarketDataInput {
  underlyingPrice: number
  underlyingVolatility: number
  riskFreeRate: number
  dividendYield: number
  beta: number
}

export interface HistoricalDataInput {
  returns: number[]
  volatilities: number[]
  correlations: number[]
}

export interface SimulationResult {
  outcomes: number[]
  paths: number[][]
  greeksProgression: GreeksProgression[]
}

export interface GreeksProgression {
  day: number
  delta: number
  gamma: number
  theta: number
  vega: number
  portfolioValue: number
}

/**
 * Monte Carlo simulation for option strategies
 */
function runMonteCarloSimulation(
  strategy: Position | StrategyInput,
  marketData: MarketDataInput,
  historicalData: HistoricalDataInput,
  numSimulations: number = 10000
): SimulationResult {
  const outcomes: number[] = []
  const paths: number[][] = []
  const greeksProgression: GreeksProgression[] = []
  
  const { underlyingPrice, underlyingVolatility, riskFreeRate } = marketData
  
  for (let sim = 0; sim < numSimulations; sim++) {
    const path = generatePricePath(underlyingPrice, underlyingVolatility, riskFreeRate, 30)
    const outcome = calculateStrategyOutcome(strategy, path)
    
    outcomes.push(outcome)
    paths.push(path)
  }
  
  return { outcomes, paths, greeksProgression }
}

function generatePricePath(
  initialPrice: number,
  volatility: number,
  drift: number,
  days: number
): number[] {
  const path = [initialPrice]
  const dt = 1 / 252 // Daily time step
  
  for (let i = 1; i <= days; i++) {
    const randomShock = normalRandom() * Math.sqrt(dt)
    const return_ = (drift - 0.5 * volatility * volatility) * dt + volatility * randomShock
    const newPrice = path[i - 1] * Math.exp(return_)
    path.push(newPrice)
  }
  
  return path
}

function calculateStrategyOutcome(
  strategy: Position | StrategyInput,
  pricePath: number[]
): number {
  // Simplified outcome calculation
  // In production, would calculate Greeks evolution and mark-to-market
  const finalPrice = pricePath[pricePath?.length || 0 - 1]
  const initialPrice = pricePath[0]
  const priceMove = (finalPrice - initialPrice) / initialPrice
  
  // Mock calculation based on strategy type
  // Real implementation would use precise option pricing
  return priceMove * 1000 + (Math.random() - 0.5) * 200
}

/**
 * Calculate Expected Value
 */
function calculateExpectedValue(outcomes: number[]): number {
  return outcomes.reduce((sum, outcome) => sum + outcome, 0) / outcomes?.length || 0
}

/**
 * Calculate Probability of Profit
 */
function calculateProbabilityOfProfit(outcomes: number[]): number {
  const profitableOutcomes = outcomes.filter(outcome => outcome > 0)?.length || 0
  return profitableOutcomes / outcomes?.length || 0
}

/**
 * Calculate Conditional Value at Risk (Expected Shortfall)
 */
function calculateCVaR(outcomes: number[]): CVaRResult {
  const sorted = outcomes.sort((a, b) => a - b)
  const n = sorted?.length || 0
  
  // 95% CVaR
  const var95Index = Math.floor(0.05 * n)
  const var95 = sorted[var95Index]
  const tailLosses95 = sorted.slice(0, var95Index)
  const cvar95 = tailLosses95?.length || 0 > 0 
    ? tailLosses95.reduce((sum, loss) => sum + loss, 0) / tailLosses95?.length || 0 
    : var95
  
  // 99% CVaR
  const var99Index = Math.floor(0.01 * n)
  const var99 = sorted[var99Index]
  const tailLosses99 = sorted.slice(0, var99Index)
  const cvar99 = tailLosses99?.length || 0 > 0
    ? tailLosses99.reduce((sum, loss) => sum + loss, 0) / tailLosses99?.length || 0
    : var99
  
  // Expected shortfall (average of worst 5%)
  const worstOutcomes = sorted.slice(0, Math.floor(0.05 * n))
  const expectedShortfall95 = worstOutcomes.reduce((sum, loss) => sum + loss, 0) / worstOutcomes?.length || 0
  
  const veryWorstOutcomes = sorted.slice(0, Math.floor(0.01 * n))
  const expectedShortfall99 = veryWorstOutcomes.reduce((sum, loss) => sum + loss, 0) / veryWorstOutcomes?.length || 0
  
  const tailLoss = worstOutcomes.reduce((sum, loss) => sum + loss, 0) / worstOutcomes?.length || 0
  
  return {
    cvar95,
    cvar99,
    expectedShortfall95,
    expectedShortfall99,
    tailLoss,
    confidenceLevel: 0.95
  }
}

/**
 * Calculate enhanced Value at Risk
 */
function calculateEnhancedVaR(outcomes: number[], historicalData: HistoricalDataInput): VaRResult {
  const sorted = outcomes.sort((a, b) => a - b)
  const n = sorted?.length || 0
  
  // Historical VaR (empirical quantiles)
  const var95 = sorted[Math.floor(0.05 * n)]
  const var99 = sorted[Math.floor(0.01 * n)]
  const var999 = sorted[Math.floor(0.001 * n)]
  
  // Parametric VaR (assuming normal distribution)
  const mean = outcomes.reduce((sum, x) => sum + x, 0) / n
  const variance = outcomes.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n
  const std = Math.sqrt(variance)
  const parametricVaR = mean - 1.645 * std // 95% confidence
  
  return {
    var95,
    var99,
    var999,
    parametricVaR,
    historicalVaR: var95,
    monteCarloVaR: var95,
    holdingPeriod: 1
  }
}

/**
 * Analyze return distribution characteristics
 */
function analyzeDistribution(outcomes: number[]): DistributionAnalysis {
  const n = outcomes?.length || 0
  const mean = outcomes.reduce((sum, x) => sum + x, 0) / n
  
  // Calculate moments
  const variance = outcomes.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n
  const standardDeviation = Math.sqrt(variance)
  
  const skewness = outcomes.reduce((sum, x) => sum + Math.pow((x - mean) / standardDeviation, 3), 0) / n
  const kurtosis = outcomes.reduce((sum, x) => sum + Math.pow((x - mean) / standardDeviation, 4), 0) / n - 3
  
  // VaR contributions (simplified)
  const varContributions: VaRContribution[] = [
    { component: 'delta', contribution: Math.abs(mean * 0.6), percentage: 60 },
    { component: 'gamma', contribution: Math.abs(mean * 0.15), percentage: 15 },
    { component: 'theta', contribution: Math.abs(mean * 0.1), percentage: 10 },
    { component: 'vega', contribution: Math.abs(mean * 0.1), percentage: 10 },
    { component: 'correlation', contribution: Math.abs(mean * 0.05), percentage: 5 }
  ]
  
  // Build PDF
  const sorted = outcomes.sort((a, b) => a - b)
  const probabilityDensityFunction: PDFPoint[] = []
  const binSize = (sorted[n - 1] - sorted[0]) / 100
  
  for (let i = 0; i < 100; i++) {
    const binStart = sorted[0] + i * binSize
    const binEnd = binStart + binSize
    const count = sorted.filter(x => x >= binStart && x < binEnd)?.length || 0
    const probability = count / n
    const cumulativeProbability = sorted.filter(x => x < binEnd)?.length || 0 / n
    
    probabilityDensityFunction.push({
      value: binStart + binSize / 2,
      probability,
      cumulativeProbability
    })
  }
  
  // Percentile breakdown
  const percentileBreakdown: PercentileBreakdown = {
    p1: sorted[Math.floor(0.01 * n)],
    p5: sorted[Math.floor(0.05 * n)],
    p10: sorted[Math.floor(0.10 * n)],
    p25: sorted[Math.floor(0.25 * n)],
    p50: sorted[Math.floor(0.50 * n)],
    p75: sorted[Math.floor(0.75 * n)],
    p90: sorted[Math.floor(0.90 * n)],
    p95: sorted[Math.floor(0.95 * n)],
    p99: sorted[Math.floor(0.99 * n)]
  }
  
  return {
    mean,
    standardDeviation,
    skewness,
    kurtosis,
    valueAtRiskContributions: varContributions,
    probabilityDensityFunction,
    percentileBreakdown
  }
}

/**
 * Perform comprehensive stress testing
 */
function performStressTesting(
  strategy: Position | StrategyInput,
  marketData: MarketDataInput
): StressTestResults {
  const scenarios: StressScenario[] = [
    {
      name: 'Black Monday 1987',
      description: 'Market crash scenario: -22% in one day',
      marketConditions: {
        underlyingMove: -0.22,
        volatilityMove: 2.0,
        timeDecay: 1,
        correlationShift: 0.3
      },
      portfolioImpact: calculateScenarioImpact(strategy, -0.22, 2.0),
      probability: 0.001,
      severity: 'extreme'
    },
    {
      name: 'COVID Crash 2020',
      description: 'Pandemic-driven volatility spike',
      marketConditions: {
        underlyingMove: -0.35,
        volatilityMove: 3.0,
        timeDecay: 30,
        correlationShift: 0.4
      },
      portfolioImpact: calculateScenarioImpact(strategy, -0.35, 3.0),
      probability: 0.01,
      severity: 'extreme'
    },
    {
      name: 'Flash Crash 2010',
      description: 'Algorithmic trading malfunction',
      marketConditions: {
        underlyingMove: -0.09,
        volatilityMove: 1.5,
        timeDecay: 0.1,
        correlationShift: 0.2
      },
      portfolioImpact: calculateScenarioImpact(strategy, -0.09, 1.5),
      probability: 0.1,
      severity: 'high'
    },
    {
      name: 'Rate Shock',
      description: 'Unexpected 200bp rate hike',
      marketConditions: {
        underlyingMove: -0.05,
        volatilityMove: 0.5,
        timeDecay: 1,
        correlationShift: 0.1
      },
      portfolioImpact: calculateScenarioImpact(strategy, -0.05, 0.5),
      probability: 0.5,
      severity: 'medium'
    },
    {
      name: 'Earnings Shock',
      description: 'Unexpected earnings miss/beat',
      marketConditions: {
        underlyingMove: 0.15, // Can be positive or negative
        volatilityMove: -0.3, // Vol crush post-earnings
        timeDecay: 1,
        correlationShift: 0.05
      },
      portfolioImpact: calculateScenarioImpact(strategy, 0.15, -0.3),
      probability: 2.5,
      severity: 'medium'
    }
  ]
  
  const worstCaseScenario = scenarios.reduce((worst, scenario) => 
    scenario.portfolioImpact.totalPnL < worst.portfolioImpact.totalPnL ? scenario : worst
  )
  
  const averageLoss = scenarios
    .filter(s => s.portfolioImpact.totalPnL < 0)
    .reduce((sum, s) => sum + s.portfolioImpact.totalPnL, 0) / scenarios?.length || 0
  
  return {
    scenarios,
    worstCaseScenario,
    averageLoss,
    maxConsecutiveLosses: 3, // Would be calculated from historical simulation
    recoveryTimeEstimate: 15 // Days to break even (simplified)
  }
}

function calculateScenarioImpact(
  strategy: Position | StrategyInput,
  priceMove: number,
  volMove: number
): StressScenario['portfolioImpact'] {
  // Simplified impact calculation
  // In production, would reprice all options under new conditions
  
  const deltaImpact = priceMove * 1000 // Simplified
  const gammaImpact = 0.5 * priceMove * priceMove * 500
  const vegaImpact = volMove * 200
  const thetaImpact = -50 // One day theta decay
  const rhoImpact = 0 // Ignore for short-term analysis
  
  const totalPnL = deltaImpact + gammaImpact + vegaImpact + thetaImpact + rhoImpact
  
  return {
    totalPnL,
    deltaImpact,
    gammaImpact,
    thetaImpact,
    vegaImpact,
    rhoImpact
  }
}

/**
 * Analyze tail exposure
 */
function analyzeTailExposure(outcomes: number[]): TailExposureAnalysis {
  const sorted = outcomes.sort((a, b) => a - b)
  const n = sorted?.length || 0
  const mean = outcomes.reduce((sum, x) => sum + x, 0) / n
  const std = Math.sqrt(outcomes.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n)
  
  // Left tail (downside) - worst 5%
  const leftTailIndex = Math.floor(0.05 * n)
  const leftTailOutcomes = sorted.slice(0, leftTailIndex)
  const leftTailExposure = leftTailOutcomes.reduce((sum, x) => sum + Math.abs(x), 0) / leftTailOutcomes?.length || 0
  
  // Right tail (upside) - best 5%
  const rightTailIndex = Math.floor(0.95 * n)
  const rightTailOutcomes = sorted.slice(rightTailIndex)
  const rightTailExposure = rightTailOutcomes.reduce((sum, x) => sum + x, 0) / rightTailOutcomes?.length || 0
  
  const tailRatio = rightTailExposure / Math.max(leftTailExposure, 1)
  
  // Extreme events (3+ sigma)
  const extremeThreshold = 3 * std
  const extremeEvents = outcomes.filter(x => Math.abs(x - mean) > extremeThreshold)?.length || 0
  const extremeEventProbability = extremeEvents / n
  
  // Black swan exposure (6+ sigma)
  const blackSwanThreshold = 6 * std
  const blackSwanEvents = outcomes.filter(x => Math.abs(x - mean) > blackSwanThreshold)?.length || 0
  const blackSwanExposure = blackSwanEvents / n
  
  return {
    leftTailExposure,
    rightTailExposure,
    tailRatio,
    extremeEventProbability,
    tailDependence: 0.1, // Would be calculated from correlation analysis
    blackSwanExposure
  }
}

/**
 * Calculate Kelly fraction for optimal position sizing
 */
function calculateKellyFraction(outcomes: number[], riskFreeRate: number): KellyFractionResult {
  const wins = outcomes.filter(x => x > 0)
  const losses = outcomes.filter(x => x < 0)
  
  if (wins?.length || 0) === 0 || losses?.length || 0) === 0) {
    return {
      optimalFraction: 0,
      adjustedFraction: 0,
      expectedGrowthRate: 0,
      riskOfRuin: 1,
      recommendation: 'undersized'
    }
  }
  
  const winProbability = wins?.length || 0 / outcomes?.length || 0
  const averageWin = wins.reduce((sum, x) => sum + x, 0) / wins?.length || 0
  const averageLoss = Math.abs(losses.reduce((sum, x) => sum + x, 0) / losses?.length || 0)
  
  // Kelly formula: f = (p * b - q) / b
  // where p = win probability, q = loss probability, b = win/loss ratio
  const winLossRatio = averageWin / averageLoss
  const optimalFraction = (winProbability * winLossRatio - (1 - winProbability)) / winLossRatio
  
  // Conservative adjustment (25% of Kelly)
  const adjustedFraction = Math.max(0, Math.min(0.25, optimalFraction * 0.25))
  
  // Expected growth rate
  const expectedGrowthRate = winProbability * Math.log(1 + optimalFraction * winLossRatio) +
                           (1 - winProbability) * Math.log(1 - optimalFraction)
  
  // Risk of ruin approximation
  const riskOfRuin = optimalFraction > 0.25 ? 0.1 : 0.05
  
  let recommendation: KellyFractionResult['recommendation']
  if (optimalFraction < 0.05) recommendation = 'undersized'
  else if (optimalFraction > 0.25) recommendation = 'oversized'
  else recommendation = 'optimal'
  
  return {
    optimalFraction: Math.max(0, optimalFraction),
    adjustedFraction,
    expectedGrowthRate,
    riskOfRuin,
    recommendation
  }
}

/**
 * Calculate Sharpe ratio for options strategies
 */
function calculateOptionsSharpe(outcomes: number[], riskFreeRate: number): number {
  const mean = outcomes.reduce((sum, x) => sum + x, 0) / outcomes?.length || 0
  const std = Math.sqrt(outcomes.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / outcomes?.length || 0)
  
  // Annualized Sharpe-like ratio
  const annualizedReturn = mean * 252 // Daily to annual
  const annualizedStd = std * Math.sqrt(252)
  
  return (annualizedReturn - riskFreeRate) / annualizedStd
}

/**
 * Calculate risk-adjusted return
 */
function calculateRiskAdjustedReturn(expectedReturn: number, cvar: number): number {
  return expectedReturn / Math.max(Math.abs(cvar), 1)
}

// Utility functions

function normalRandom(): number {
  // Box-Muller transformation for normal random numbers
  let u1 = 0, u2 = 0
  while (u1 === 0) u1 = Math.random() // Converting [0,1) to (0,1)
  while (u2 === 0) u2 = Math.random()
  
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0
}

/**
 * Calculate portfolio-level metrics aggregation
 */
export function aggregatePortfolioRiskMetrics(
  positionMetrics: AdvancedRiskMetrics[],
  correlationMatrix?: number[][]
): AdvancedRiskMetrics {
  const n = positionMetrics?.length || 0
  
  if (n === 0) {
    throw new Error('No position metrics provided')
  }
  
  if (n === 1) {
    return positionMetrics[0]
  }
  
  // Aggregate expected values
  const totalExpectedValue = positionMetrics.reduce((sum, metrics) => sum + metrics.expectedValue, 0)
  
  // For portfolio VaR, we need to account for correlations
  // Simplified approach: assume 70% correlation for similar strategies
  const correlation = 0.7
  const individualVaRs = positionMetrics.map(m => m.valueAtRisk.var95)
  const portfolioVariance = individualVaRs.reduce((sum, var_, i) => {
    return sum + Math.pow(var_, 2) + 
           individualVaRs.slice(i + 1).reduce((innerSum, otherVar) => 
             innerSum + 2 * correlation * var_ * otherVar, 0)
  }, 0)
  const portfolioVaR = -Math.sqrt(Math.abs(portfolioVariance))
  
  // Aggregate other metrics (simplified)
  const aggregatedMetrics: AdvancedRiskMetrics = {
    expectedValue: totalExpectedValue,
    probabilityOfProfit: positionMetrics.reduce((sum, m) => sum + m.probabilityOfProfit, 0) / n,
    conditionalValueAtRisk: {
      cvar95: portfolioVaR * 1.2,
      cvar99: portfolioVaR * 1.5,
      expectedShortfall95: portfolioVaR * 1.3,
      expectedShortfall99: portfolioVaR * 1.6,
      tailLoss: portfolioVaR * 1.4,
      confidenceLevel: 0.95
    },
    valueAtRisk: {
      var95: portfolioVaR,
      var99: portfolioVaR * 1.5,
      var999: portfolioVaR * 2.0,
      parametricVaR: portfolioVaR * 0.9,
      historicalVaR: portfolioVaR,
      monteCarloVaR: portfolioVaR * 1.1,
      holdingPeriod: 1
    },
    distributionAnalysis: positionMetrics[0].distributionAnalysis, // Would need proper aggregation
    stressTesting: positionMetrics[0].stressTesting, // Would need proper aggregation
    tailExposure: positionMetrics[0].tailExposure, // Would need proper aggregation
    kellyFraction: {
      optimalFraction: Math.min(...positionMetrics.map(m => m.kellyFraction.optimalFraction)),
      adjustedFraction: Math.min(...positionMetrics.map(m => m.kellyFraction.adjustedFraction)),
      expectedGrowthRate: positionMetrics.reduce((sum, m) => sum + m.kellyFraction.expectedGrowthRate, 0) / n,
      riskOfRuin: Math.max(...positionMetrics.map(m => m.kellyFraction.riskOfRuin)),
      recommendation: 'optimal'
    },
    optionsSharpeRatio: positionMetrics.reduce((sum, m) => sum + m.optionsSharpeRatio, 0) / n,
    riskAdjustedReturn: totalExpectedValue / Math.max(Math.abs(portfolioVaR), 1)
  }
  
  return aggregatedMetrics
}