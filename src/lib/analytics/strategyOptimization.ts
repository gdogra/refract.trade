/**
 * Strategy Optimization Engine
 * 
 * Evaluates and optimizes options strategies across:
 * - Directional strategies (long call/put, synthetic positions)
 * - Defined-risk spreads (vertical, ratio spreads)
 * - Neutral/volatility strategies (iron condor, butterfly, calendar, straddle/strangle)
 * - Multi-leg complex strategies
 * - Strategy combinations and overlays
 */

import { OptionContract } from '@/lib/options/yahooOptions'
import { AdvancedRiskMetrics } from './advancedRiskMetrics'
import { LiquidityProfile } from './liquidityModeling'

export interface StrategyOptimization {
  symbol: string
  underlyingPrice: number
  strategies: OptimizedStrategy[]
  recommendedStrategies: OptimizedStrategy[]
  marketConditions: MarketConditionAssessment
  optimizationCriteria: OptimizationCriteria
}

export interface OptimizedStrategy {
  id: string
  name: string
  type: StrategyType
  legs: StrategyLeg[]
  metrics: StrategyMetrics
  riskProfile: StrategyRiskProfile
  liquidityAssessment: StrategyLiquidityAssessment
  marketFit: MarketFitAnalysis
  optimization: OptimizationResults
  tradeQualityScore: TradeQualityScore
  executionGuidance: ExecutionGuidance
}

export type StrategyType = 
  | 'long_call' | 'long_put' | 'short_call' | 'short_put' | 'synthetic_long' | 'synthetic_short'
  | 'bull_call_spread' | 'bear_put_spread' | 'bull_put_spread' | 'bear_call_spread'
  | 'call_ratio_spread' | 'put_ratio_spread'
  | 'long_straddle' | 'short_straddle' | 'long_strangle' | 'short_strangle'
  | 'iron_condor' | 'iron_butterfly' | 'butterfly_spread'
  | 'calendar_spread' | 'diagonal_spread'
  | 'covered_call' | 'protective_put' | 'collar'

export interface StrategyLeg {
  optionType: 'call' | 'put' | 'stock'
  strike?: number
  expiration?: string
  quantity: number
  side: 'buy' | 'sell'
  price: number
  impliedVolatility?: number
  delta: number
  gamma: number
  theta: number
  vega: number
  liquidityScore: number
}

export interface StrategyMetrics {
  maxProfit: number
  maxLoss: number
  netDebit: number
  netCredit: number
  breakevens: number[]
  profitRange: { lower: number; upper: number } | null
  probabilityOfProfit: number
  expectedValue: number
  returnOnCapital: number
  annualizedReturn: number
  daysToExpiry: number
}

export interface StrategyRiskProfile {
  riskType: 'limited' | 'unlimited'
  maxRiskAmount: number
  riskAsPercentOfAccount: number
  timeDecayRisk: 'low' | 'medium' | 'high'
  volatilityRisk: 'low' | 'medium' | 'high'
  directionalRisk: 'low' | 'medium' | 'high'
  assignmentRisk: 'none' | 'low' | 'medium' | 'high'
  earlyExerciseRisk: 'none' | 'low' | 'medium' | 'high'
}

export interface StrategyLiquidityAssessment {
  entryLiquidity: number // 0-100 score
  exitLiquidity: number // 0-100 score
  scalability: number // Max recommended contracts
  executionComplexity: 'simple' | 'moderate' | 'complex'
  legLiquidity: Array<{
    legIndex: number
    liquidityScore: number
    constrainingFactor: string
  }>
}

export interface MarketFitAnalysis {
  volatilityRegimeFit: number // 0-100 score
  trendFit: number // 0-100 score
  timingScore: number // 0-100 score
  overallFit: number // 0-100 score
  marketConditions: string[]
  contraindications: string[]
}

export interface OptimizationResults {
  originalStrategy: StrategyMetrics
  optimizedStrategy: StrategyMetrics
  optimizations: StrategyOptimizationAction[]
  improvementScore: number // 0-100 scale
}

export interface StrategyOptimizationAction {
  type: 'strike_adjustment' | 'expiration_adjustment' | 'ratio_adjustment' | 'add_leg' | 'remove_leg'
  description: string
  impact: {
    profitImprovement: number
    riskReduction: number
    liquidityImprovement: number
  }
  reasoning: string
}

export interface TradeQualityScore {
  overallScore: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C'
  numericScore: number // 0-100
  components: {
    riskReward: number
    probabilityOfSuccess: number
    liquidity: number
    marketTiming: number
    structuralEdge: number
  }
  reasoning: string
  improvements: string[]
}

export interface ExecutionGuidance {
  recommendedOrderType: 'market' | 'limit' | 'stop_limit' | 'iceberg'
  suggestedPricing: {
    aggressivePrice: number
    conservativePrice: number
    midpointPrice: number
  }
  executionTiming: {
    optimalTime: string
    avoidTimes: string[]
  }
  legSequencing: 'simultaneous' | 'sequential' | 'contingent'
  estimatedFillTime: string
  slippageBudget: number
}

export interface MarketConditionAssessment {
  volatilityRegime: 'low' | 'normal' | 'high' | 'extreme'
  trendDirection: 'strong_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong_bearish'
  marketRegime: 'trending' | 'range_bound' | 'volatile' | 'crisis'
  nearTermEvents: EventRisk[]
  liquidity: 'abundant' | 'normal' | 'constrained' | 'stressed'
  sentiment: 'euphoric' | 'optimistic' | 'neutral' | 'pessimistic' | 'panic'
}

export interface EventRisk {
  type: 'earnings' | 'dividend' | 'fed_meeting' | 'expiration' | 'economic_data'
  date: Date
  daysAway: number
  expectedImpact: 'low' | 'medium' | 'high' | 'extreme'
  volatilityImpact: number
  description: string
}

export interface OptimizationCriteria {
  primaryObjective: 'max_profit' | 'max_prob_profit' | 'max_sharpe' | 'min_risk' | 'max_income'
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  liquidityRequirement: 'high' | 'medium' | 'low'
  timeHorizon: 'short' | 'medium' | 'long'
  capitalAllocation: number
  maxRiskPerTrade: number
}

/**
 * Generate and optimize strategies for given market conditions
 */
export function optimizeStrategiesForSymbol(
  symbol: string,
  calls: OptionContract[],
  puts: OptionContract[],
  underlyingPrice: number,
  marketConditions: MarketConditionAssessment,
  criteria: OptimizationCriteria,
  liquidityProfile: LiquidityProfile
): StrategyOptimization {
  const allStrategies: OptimizedStrategy[] = []
  
  // Generate directional strategies
  allStrategies.push(...generateDirectionalStrategies(calls, puts, underlyingPrice, marketConditions))
  
  // Generate spread strategies
  allStrategies.push(...generateSpreadStrategies(calls, puts, underlyingPrice, marketConditions))
  
  // Generate volatility strategies
  allStrategies.push(...generateVolatilityStrategies(calls, puts, underlyingPrice, marketConditions))
  
  // Generate income strategies
  allStrategies.push(...generateIncomeStrategies(calls, puts, underlyingPrice, marketConditions))
  
  // Evaluate and optimize each strategy
  for (const strategy of allStrategies) {
    strategy.riskProfile = assessStrategyRisk(strategy)
    strategy.liquidityAssessment = assessStrategyLiquidity(strategy, liquidityProfile)
    strategy.marketFit = assessMarketFit(strategy, marketConditions)
    strategy.optimization = optimizeStrategy(strategy, criteria)
    strategy.tradeQualityScore = calculateTradeQualityScore(strategy, marketConditions, criteria)
    strategy.executionGuidance = generateExecutionGuidance(strategy, liquidityProfile)
  }
  
  // Filter and rank strategies
  const recommendedStrategies = allStrategies
    .filter(s => s.tradeQualityScore.numericScore >= 60)
    .filter(s => s.liquidityAssessment.entryLiquidity >= 50)
    .filter(s => s.marketFit.overallFit >= 50)
    .sort((a, b) => b.tradeQualityScore.numericScore - a.tradeQualityScore.numericScore)
    .slice(0, 10)
  
  return {
    symbol,
    underlyingPrice,
    strategies: allStrategies,
    recommendedStrategies,
    marketConditions,
    optimizationCriteria: criteria
  }
}

/**
 * Generate directional strategies
 */
function generateDirectionalStrategies(
  calls: OptionContract[],
  puts: OptionContract[],
  underlyingPrice: number,
  marketConditions: MarketConditionAssessment
): OptimizedStrategy[] {
  const strategies: OptimizedStrategy[] = []
  
  // Long calls for bullish outlook
  if (marketConditions.trendDirection === 'bullish' || marketConditions.trendDirection === 'strong_bullish') {
    const atmCalls = calls.filter(c => Math.abs(c.strike - underlyingPrice) <= underlyingPrice * 0.05)
    const otmCalls = calls.filter(c => c.strike > underlyingPrice && c.strike <= underlyingPrice * 1.1)
    
    for (const call of [...atmCalls, ...otmCalls]) {
      strategies.push({
        id: `long_call_${call.strike}_${call.expiration}`,
        name: `Long ${call.strike} Call`,
        type: 'long_call',
        legs: [{
          optionType: 'call',
          strike: call.strike,
          expiration: call.expiration,
          quantity: 1,
          side: 'buy',
          price: call.midpoint,
          impliedVolatility: call.impliedVolatility,
          delta: call.delta,
          gamma: call.gamma,
          theta: call.theta,
          vega: call.vega,
          liquidityScore: calculateLegLiquidityScore(call)
        }],
        metrics: calculateStrategyMetrics([{
          optionType: 'call',
          strike: call.strike,
          expiration: call.expiration,
          quantity: 1,
          side: 'buy',
          price: call.midpoint,
          impliedVolatility: call.impliedVolatility,
          delta: call.delta,
          gamma: call.gamma,
          theta: call.theta,
          vega: call.vega,
          liquidityScore: 0
        }], underlyingPrice),
        riskProfile: {} as any, // Will be filled by optimization
        liquidityAssessment: {} as any,
        marketFit: {} as any,
        optimization: {} as any,
        tradeQualityScore: {} as any,
        executionGuidance: {} as any
      })
    }
  }
  
  // Long puts for bearish outlook
  if (marketConditions.trendDirection === 'bearish' || marketConditions.trendDirection === 'strong_bearish') {
    const atmPuts = puts.filter(p => Math.abs(p.strike - underlyingPrice) <= underlyingPrice * 0.05)
    const otmPuts = puts.filter(p => p.strike < underlyingPrice && p.strike >= underlyingPrice * 0.9)
    
    for (const put of [...atmPuts, ...otmPuts]) {
      strategies.push({
        id: `long_put_${put.strike}_${put.expiration}`,
        name: `Long ${put.strike} Put`,
        type: 'long_put',
        legs: [{
          optionType: 'put',
          strike: put.strike,
          expiration: put.expiration,
          quantity: 1,
          side: 'buy',
          price: put.midpoint,
          impliedVolatility: put.impliedVolatility,
          delta: put.delta,
          gamma: put.gamma,
          theta: put.theta,
          vega: put.vega,
          liquidityScore: calculateLegLiquidityScore(put)
        }],
        metrics: calculateStrategyMetrics([{
          optionType: 'put',
          strike: put.strike,
          expiration: put.expiration,
          quantity: 1,
          side: 'buy',
          price: put.midpoint,
          impliedVolatility: put.impliedVolatility,
          delta: put.delta,
          gamma: put.gamma,
          theta: put.theta,
          vega: put.vega,
          liquidityScore: 0
        }], underlyingPrice),
        riskProfile: {} as any,
        liquidityAssessment: {} as any,
        marketFit: {} as any,
        optimization: {} as any,
        tradeQualityScore: {} as any,
        executionGuidance: {} as any
      })
    }
  }
  
  return strategies
}

/**
 * Generate spread strategies
 */
function generateSpreadStrategies(
  calls: OptionContract[],
  puts: OptionContract[],
  underlyingPrice: number,
  marketConditions: MarketConditionAssessment
): OptimizedStrategy[] {
  const strategies: OptimizedStrategy[] = []
  
  // Bull call spreads
  if (marketConditions.trendDirection === 'bullish') {
    const liquidCalls = calls.filter(c => c.volume >= 10 && c.openInterest >= 100)
    
    for (let i = 0; i < liquidCalls?.length || 0 - 1; i++) {
      const longCall = liquidCalls[i]
      const shortCall = liquidCalls[i + 1]
      
      if (longCall.strike < shortCall.strike && shortCall.strike - longCall.strike <= underlyingPrice * 0.1) {
        const legs: StrategyLeg[] = [
          {
            optionType: 'call',
            strike: longCall.strike,
            expiration: longCall.expiration,
            quantity: 1,
            side: 'buy',
            price: longCall.midpoint,
            impliedVolatility: longCall.impliedVolatility,
            delta: longCall.delta,
            gamma: longCall.gamma,
            theta: longCall.theta,
            vega: longCall.vega,
            liquidityScore: calculateLegLiquidityScore(longCall)
          },
          {
            optionType: 'call',
            strike: shortCall.strike,
            expiration: shortCall.expiration,
            quantity: 1,
            side: 'sell',
            price: shortCall.midpoint,
            impliedVolatility: shortCall.impliedVolatility,
            delta: shortCall.delta,
            gamma: shortCall.gamma,
            theta: shortCall.theta,
            vega: shortCall.vega,
            liquidityScore: calculateLegLiquidityScore(shortCall)
          }
        ]
        
        strategies.push({
          id: `bull_call_spread_${longCall.strike}_${shortCall.strike}_${longCall.expiration}`,
          name: `${longCall.strike}/${shortCall.strike} Bull Call Spread`,
          type: 'bull_call_spread',
          legs,
          metrics: calculateStrategyMetrics(legs, underlyingPrice),
          riskProfile: {} as any,
          liquidityAssessment: {} as any,
          marketFit: {} as any,
          optimization: {} as any,
          tradeQualityScore: {} as any,
          executionGuidance: {} as any
        })
      }
    }
  }
  
  // Iron condors for neutral markets
  if (marketConditions.trendDirection === 'neutral' && marketConditions.volatilityRegime === 'high') {
    const liquidCalls = calls.filter(c => c.volume >= 5 && c.openInterest >= 50)
    const liquidPuts = puts.filter(p => p.volume >= 5 && p.openInterest >= 50)
    
    const otmPuts = liquidPuts.filter(p => p.strike < underlyingPrice * 0.95)
    const otmCalls = liquidCalls.filter(c => c.strike > underlyingPrice * 1.05)
    
    if (otmPuts?.length || 0 >= 2 && otmCalls?.length || 0 >= 2) {
      const shortPut = otmPuts[otmPuts?.length || 0 - 1] // Highest strike OTM put
      const longPut = otmPuts[otmPuts?.length || 0 - 2] // Lower strike for protection
      const shortCall = otmCalls[0] // Lowest strike OTM call
      const longCall = otmCalls[1] // Higher strike for protection
      
      const legs: StrategyLeg[] = [
        {
          optionType: 'put',
          strike: longPut.strike,
          expiration: longPut.expiration,
          quantity: 1,
          side: 'buy',
          price: longPut.midpoint,
          impliedVolatility: longPut.impliedVolatility,
          delta: longPut.delta,
          gamma: longPut.gamma,
          theta: longPut.theta,
          vega: longPut.vega,
          liquidityScore: calculateLegLiquidityScore(longPut)
        },
        {
          optionType: 'put',
          strike: shortPut.strike,
          expiration: shortPut.expiration,
          quantity: 1,
          side: 'sell',
          price: shortPut.midpoint,
          impliedVolatility: shortPut.impliedVolatility,
          delta: shortPut.delta,
          gamma: shortPut.gamma,
          theta: shortPut.theta,
          vega: shortPut.vega,
          liquidityScore: calculateLegLiquidityScore(shortPut)
        },
        {
          optionType: 'call',
          strike: shortCall.strike,
          expiration: shortCall.expiration,
          quantity: 1,
          side: 'sell',
          price: shortCall.midpoint,
          impliedVolatility: shortCall.impliedVolatility,
          delta: shortCall.delta,
          gamma: shortCall.gamma,
          theta: shortCall.theta,
          vega: shortCall.vega,
          liquidityScore: calculateLegLiquidityScore(shortCall)
        },
        {
          optionType: 'call',
          strike: longCall.strike,
          expiration: longCall.expiration,
          quantity: 1,
          side: 'buy',
          price: longCall.midpoint,
          impliedVolatility: longCall.impliedVolatility,
          delta: longCall.delta,
          gamma: longCall.gamma,
          theta: longCall.theta,
          vega: longCall.vega,
          liquidityScore: calculateLegLiquidityScore(longCall)
        }
      ]
      
      strategies.push({
        id: `iron_condor_${longPut.strike}_${shortPut.strike}_${shortCall.strike}_${longCall.strike}_${longPut.expiration}`,
        name: `Iron Condor ${shortPut.strike}/${longPut.strike}/${shortCall.strike}/${longCall.strike}`,
        type: 'iron_condor',
        legs,
        metrics: calculateStrategyMetrics(legs, underlyingPrice),
        riskProfile: {} as any,
        liquidityAssessment: {} as any,
        marketFit: {} as any,
        optimization: {} as any,
        tradeQualityScore: {} as any,
        executionGuidance: {} as any
      })
    }
  }
  
  return strategies
}

/**
 * Generate volatility strategies
 */
function generateVolatilityStrategies(
  calls: OptionContract[],
  puts: OptionContract[],
  underlyingPrice: number,
  marketConditions: MarketConditionAssessment
): OptimizedStrategy[] {
  const strategies: OptimizedStrategy[] = []
  
  // Long straddles for low vol environments expecting expansion
  if (marketConditions.volatilityRegime === 'low' || marketConditions.volatilityRegime === 'normal') {
    const atmCalls = calls.filter(c => Math.abs(c.strike - underlyingPrice) <= underlyingPrice * 0.02)
    const atmPuts = puts.filter(p => Math.abs(p.strike - underlyingPrice) <= underlyingPrice * 0.02)
    
    for (const call of atmCalls) {
      const matchingPut = atmPuts.find(p => p.strike === call.strike && p.expiration === call.expiration)
      if (matchingPut) {
        const legs: StrategyLeg[] = [
          {
            optionType: 'call',
            strike: call.strike,
            expiration: call.expiration,
            quantity: 1,
            side: 'buy',
            price: call.midpoint,
            impliedVolatility: call.impliedVolatility,
            delta: call.delta,
            gamma: call.gamma,
            theta: call.theta,
            vega: call.vega,
            liquidityScore: calculateLegLiquidityScore(call)
          },
          {
            optionType: 'put',
            strike: matchingPut.strike,
            expiration: matchingPut.expiration,
            quantity: 1,
            side: 'buy',
            price: matchingPut.midpoint,
            impliedVolatility: matchingPut.impliedVolatility,
            delta: matchingPut.delta,
            gamma: matchingPut.gamma,
            theta: matchingPut.theta,
            vega: matchingPut.vega,
            liquidityScore: calculateLegLiquidityScore(matchingPut)
          }
        ]
        
        strategies.push({
          id: `long_straddle_${call.strike}_${call.expiration}`,
          name: `Long ${call.strike} Straddle`,
          type: 'long_straddle',
          legs,
          metrics: calculateStrategyMetrics(legs, underlyingPrice),
          riskProfile: {} as any,
          liquidityAssessment: {} as any,
          marketFit: {} as any,
          optimization: {} as any,
          tradeQualityScore: {} as any,
          executionGuidance: {} as any
        })
      }
    }
  }
  
  return strategies
}

/**
 * Generate income strategies
 */
function generateIncomeStrategies(
  calls: OptionContract[],
  puts: OptionContract[],
  underlyingPrice: number,
  marketConditions: MarketConditionAssessment
): OptimizedStrategy[] {
  const strategies: OptimizedStrategy[] = []
  
  // Covered calls for neutral to slightly bullish outlook
  if (marketConditions.trendDirection === 'neutral' || marketConditions.trendDirection === 'bullish') {
    const otmCalls = calls.filter(c => c.strike > underlyingPrice && c.strike <= underlyingPrice * 1.15)
    
    for (const call of otmCalls) {
      const legs: StrategyLeg[] = [
        {
          optionType: 'stock',
          quantity: 100,
          side: 'buy',
          price: underlyingPrice,
          delta: 1,
          gamma: 0,
          theta: 0,
          vega: 0,
          liquidityScore: 95 // Stock is typically very liquid
        },
        {
          optionType: 'call',
          strike: call.strike,
          expiration: call.expiration,
          quantity: 1,
          side: 'sell',
          price: call.midpoint,
          impliedVolatility: call.impliedVolatility,
          delta: call.delta,
          gamma: call.gamma,
          theta: call.theta,
          vega: call.vega,
          liquidityScore: calculateLegLiquidityScore(call)
        }
      ]
      
      strategies.push({
        id: `covered_call_${call.strike}_${call.expiration}`,
        name: `Covered Call ${call.strike}`,
        type: 'covered_call',
        legs,
        metrics: calculateStrategyMetrics(legs, underlyingPrice),
        riskProfile: {} as any,
        liquidityAssessment: {} as any,
        marketFit: {} as any,
        optimization: {} as any,
        tradeQualityScore: {} as any,
        executionGuidance: {} as any
      })
    }
  }
  
  return strategies
}

/**
 * Calculate strategy metrics
 */
function calculateStrategyMetrics(legs: StrategyLeg[], underlyingPrice: number): StrategyMetrics {
  let maxProfit = 0
  let maxLoss = 0
  let netDebit = 0
  let netCredit = 0
  const breakevens: number[] = []
  
  // Calculate net cost
  for (const leg of legs) {
    const cost = leg.price * leg.quantity * (leg.side === 'buy' ? 1 : -1)
    if (cost > 0) netDebit += cost
    else netCredit += Math.abs(cost)
  }
  
  // Simplified P&L calculation - would be more sophisticated in production
  const netCost = legs.reduce((sum, leg) => {
    return sum + leg.price * leg.quantity * (leg.side === 'buy' ? 1 : -1)
  }, 0)
  
  // For long strategies
  if (netCost > 0) {
    maxLoss = netCost
    maxProfit = Infinity // Unlimited for long calls/puts
  } else {
    maxProfit = Math.abs(netCost)
    maxLoss = Infinity // Unlimited for short naked options
  }
  
  // Calculate breakevens (simplified)
  if (legs?.length || 0) === 1) {
    const leg = legs[0]
    if (leg.optionType === 'call') {
      breakevens.push(leg.strike! + netCost)
    } else if (leg.optionType === 'put') {
      breakevens.push(leg.strike! - netCost)
    }
  }
  
  const probabilityOfProfit = legs.reduce((sum, leg) => sum + leg.delta, 0) / legs?.length || 0
  const expectedValue = netCost * -1 // Simplified
  const returnOnCapital = maxLoss > 0 ? (expectedValue / maxLoss) * 100 : 0
  const daysToExpiry = Math.min(...legs.filter(leg => leg.expiration).map(leg => {
    const exp = new Date(leg.expiration!)
    return Math.max(1, Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  }))
  const annualizedReturn = returnOnCapital * (365 / daysToExpiry)
  
  return {
    maxProfit: maxProfit === Infinity ? 999999 : maxProfit,
    maxLoss: maxLoss === Infinity ? 999999 : maxLoss,
    netDebit,
    netCredit,
    breakevens,
    profitRange: breakevens?.length || 0) === 2 ? { lower: breakevens[0], upper: breakevens[1] } : null,
    probabilityOfProfit: Math.max(0, Math.min(1, probabilityOfProfit)),
    expectedValue,
    returnOnCapital,
    annualizedReturn,
    daysToExpiry
  }
}

/**
 * Calculate leg liquidity score
 */
function calculateLegLiquidityScore(option: OptionContract): number {
  let score = 0
  
  // Volume component (40%)
  if (option.volume >= 100) score += 40
  else if (option.volume >= 50) score += 32
  else if (option.volume >= 20) score += 24
  else if (option.volume >= 10) score += 16
  else if (option.volume >= 5) score += 8
  else score += 2
  
  // Open interest component (35%)
  if (option.openInterest >= 1000) score += 35
  else if (option.openInterest >= 500) score += 28
  else if (option.openInterest >= 200) score += 21
  else if (option.openInterest >= 100) score += 14
  else if (option.openInterest >= 50) score += 7
  else score += 2
  
  // Spread component (25%)
  const spread = option.ask - option.bid
  const spreadPercent = spread / option.midpoint
  if (spreadPercent <= 0.05) score += 25
  else if (spreadPercent <= 0.10) score += 20
  else if (spreadPercent <= 0.20) score += 15
  else if (spreadPercent <= 0.35) score += 10
  else score += 5
  
  return Math.min(100, score)
}

/**
 * Assess strategy risk profile
 */
function assessStrategyRisk(strategy: OptimizedStrategy): StrategyRiskProfile {
  const hasUnlimitedRisk = strategy.metrics.maxLoss >= 999999
  const totalTheta = strategy.legs.reduce((sum, leg) => sum + leg.theta * leg.quantity * (leg.side === 'buy' ? 1 : -1), 0)
  const totalVega = strategy.legs.reduce((sum, leg) => sum + leg.vega * leg.quantity * (leg.side === 'buy' ? 1 : -1), 0)
  const totalDelta = strategy.legs.reduce((sum, leg) => sum + leg.delta * leg.quantity * (leg.side === 'buy' ? 1 : -1), 0)
  
  const shortLegs = strategy.legs.filter(leg => leg.side === 'sell')
  
  return {
    riskType: hasUnlimitedRisk ? 'unlimited' : 'limited',
    maxRiskAmount: strategy.metrics.maxLoss,
    riskAsPercentOfAccount: 0, // Would be calculated based on account size
    timeDecayRisk: Math.abs(totalTheta) > 50 ? 'high' : Math.abs(totalTheta) > 20 ? 'medium' : 'low',
    volatilityRisk: Math.abs(totalVega) > 100 ? 'high' : Math.abs(totalVega) > 50 ? 'medium' : 'low',
    directionalRisk: Math.abs(totalDelta) > 0.5 ? 'high' : Math.abs(totalDelta) > 0.25 ? 'medium' : 'low',
    assignmentRisk: shortLegs.some(leg => leg.optionType === 'call' || leg.optionType === 'put') ? 'medium' : 'none',
    earlyExerciseRisk: shortLegs?.length || 0 > 0 ? 'medium' : 'low'
  } as any
}

/**
 * Assess strategy liquidity
 */
function assessStrategyLiquidity(strategy: OptimizedStrategy, liquidityProfile: LiquidityProfile): StrategyLiquidityAssessment {
  const legLiquidity = strategy.legs.map((leg, index) => ({
    legIndex: index,
    liquidityScore: leg.liquidityScore,
    constrainingFactor: leg.liquidityScore < 50 ? 'Low volume/OI' : 'Good liquidity'
  }))
  
  const avgLiquidityScore = legLiquidity.reduce((sum, leg) => sum + leg.liquidityScore, 0) / legLiquidity?.length || 0
  const minLiquidityScore = Math.min(...legLiquidity.map(leg => leg.liquidityScore))
  
  let executionComplexity: StrategyLiquidityAssessment['executionComplexity']
  if (strategy.legs?.length || 0) === 1) executionComplexity = 'simple'
  else if (strategy.legs?.length || 0 <= 2) executionComplexity = 'moderate'
  else executionComplexity = 'complex'
  
  return {
    entryLiquidity: avgLiquidityScore,
    exitLiquidity: minLiquidityScore, // Limited by worst leg
    scalability: Math.min(...strategy.legs.map(leg => leg.liquidityScore >= 70 ? 50 : leg.liquidityScore >= 50 ? 20 : 10)),
    executionComplexity,
    legLiquidity
  }
}

/**
 * Assess market fit
 */
function assessMarketFit(strategy: OptimizedStrategy, marketConditions: MarketConditionAssessment): MarketFitAnalysis {
  let volatilityRegimeFit = 50
  let trendFit = 50
  let timingScore = 50
  const conditions: string[] = []
  const contraindications: string[] = []
  
  // Volatility regime fit
  if (strategy.type.includes('straddle') || strategy.type.includes('strangle')) {
    if (marketConditions.volatilityRegime === 'low') {
      volatilityRegimeFit = 85
      conditions.push('Low volatility favors vol buying strategies')
    } else if (marketConditions.volatilityRegime === 'high') {
      volatilityRegimeFit = 25
      contraindications.push('High volatility unfavorable for vol buying')
    }
  }
  
  if (strategy.type.includes('condor') || strategy.type.includes('butterfly')) {
    if (marketConditions.volatilityRegime === 'high') {
      volatilityRegimeFit = 85
      conditions.push('High volatility favors vol selling strategies')
    } else if (marketConditions.volatilityRegime === 'low') {
      volatilityRegimeFit = 25
      contraindications.push('Low volatility unfavorable for vol selling')
    }
  }
  
  // Trend fit
  if (strategy.type.includes('bull')) {
    if (marketConditions.trendDirection === 'bullish' || marketConditions.trendDirection === 'strong_bullish') {
      trendFit = 90
      conditions.push('Bullish trend supports bullish strategies')
    } else if (marketConditions.trendDirection === 'bearish') {
      trendFit = 20
      contraindications.push('Bearish trend opposes bullish strategy')
    }
  }
  
  if (strategy.type.includes('bear')) {
    if (marketConditions.trendDirection === 'bearish' || marketConditions.trendDirection === 'strong_bearish') {
      trendFit = 90
      conditions.push('Bearish trend supports bearish strategies')
    } else if (marketConditions.trendDirection === 'bullish') {
      trendFit = 20
      contraindications.push('Bullish trend opposes bearish strategy')
    }
  }
  
  // Timing score based on days to expiry and events
  if (strategy.metrics.daysToExpiry <= 7) {
    timingScore = 30 // Generally avoid short-dated options unless specific edge
    contraindications.push('Very short time to expiration')
  } else if (strategy.metrics.daysToExpiry <= 21) {
    timingScore = 60
  } else if (strategy.metrics.daysToExpiry <= 45) {
    timingScore = 85
    conditions.push('Optimal time decay window')
  }
  
  const overallFit = (volatilityRegimeFit + trendFit + timingScore) / 3
  
  return {
    volatilityRegimeFit,
    trendFit,
    timingScore,
    overallFit,
    marketConditions: conditions,
    contraindications
  }
}

/**
 * Optimize strategy parameters
 */
function optimizeStrategy(strategy: OptimizedStrategy, criteria: OptimizationCriteria): OptimizationResults {
  const originalMetrics = strategy.metrics
  const optimizations: StrategyOptimizationAction[] = []
  
  // Example optimization: strike selection
  if (criteria.primaryObjective === 'max_prob_profit' && strategy.metrics.probabilityOfProfit < 0.6) {
    optimizations.push({
      type: 'strike_adjustment',
      description: 'Move strikes closer to the money to increase probability',
      impact: {
        profitImprovement: 10,
        riskReduction: 5,
        liquidityImprovement: 15
      },
      reasoning: 'ATM options typically have better probability and liquidity'
    })
  }
  
  // Risk-based optimizations
  if (criteria.riskTolerance === 'conservative' && strategy.metrics.maxLoss > criteria.maxRiskPerTrade) {
    optimizations.push({
      type: 'ratio_adjustment',
      description: 'Reduce position size to meet risk tolerance',
      impact: {
        profitImprovement: -20,
        riskReduction: 40,
        liquidityImprovement: 10
      },
      reasoning: 'Position size exceeds maximum risk tolerance'
    })
  }
  
  const improvementScore = optimizations.reduce((sum, opt) => {
    return sum + opt.impact.profitImprovement + opt.impact.riskReduction + opt.impact.liquidityImprovement
  }, 0) / 3
  
  return {
    originalStrategy: originalMetrics,
    optimizedStrategy: originalMetrics, // Would be recalculated after optimizations
    optimizations,
    improvementScore: Math.max(0, Math.min(100, 50 + improvementScore))
  }
}

/**
 * Calculate trade quality score
 */
function calculateTradeQualityScore(
  strategy: OptimizedStrategy,
  marketConditions: MarketConditionAssessment,
  criteria: OptimizationCriteria
): TradeQualityScore {
  const components = {
    riskReward: calculateRiskRewardScore(strategy),
    probabilityOfSuccess: strategy.metrics.probabilityOfProfit * 100,
    liquidity: strategy.liquidityAssessment.entryLiquidity || 50,
    marketTiming: strategy.marketFit.timingScore || 50,
    structuralEdge: calculateStructuralEdge(strategy, marketConditions)
  }
  
  const numericScore = Object.values(components).reduce((sum, score) => sum + score, 0) / 5
  
  let overallScore: TradeQualityScore['overallScore']
  if (numericScore >= 90) overallScore = 'AAA'
  else if (numericScore >= 80) overallScore = 'AA'
  else if (numericScore >= 70) overallScore = 'A'
  else if (numericScore >= 60) overallScore = 'BBB'
  else if (numericScore >= 50) overallScore = 'BB'
  else if (numericScore >= 40) overallScore = 'B'
  else overallScore = 'C'
  
  const improvements: string[] = []
  if (components.liquidity < 60) improvements.push('Improve liquidity by choosing more active strikes')
  if (components.probabilityOfSuccess < 60) improvements.push('Adjust strikes to improve probability of profit')
  if (components.riskReward < 60) improvements.push('Optimize risk/reward ratio through better strike selection')
  
  return {
    overallScore,
    numericScore: Math.round(numericScore),
    components,
    reasoning: `Score based on ${Object.entries(components).map(([key, value]) => `${key}: ${(value || 0).toFixed(0)}`).join(', ')}`,
    improvements
  }
}

function calculateRiskRewardScore(strategy: OptimizedStrategy): number {
  const { maxProfit, maxLoss } = strategy.metrics
  if (maxLoss <= 0) return 0
  if (maxProfit >= 999999) return 100 // Unlimited profit potential
  
  const ratio = maxProfit / maxLoss
  if (ratio >= 3) return 100
  if (ratio >= 2) return 80
  if (ratio >= 1.5) return 60
  if (ratio >= 1) return 40
  return 20
}

function calculateStructuralEdge(strategy: OptimizedStrategy, marketConditions: MarketConditionAssessment): number {
  let edge = 50 // Base score
  
  // Volatility edge
  if (strategy.type.includes('straddle') && marketConditions.volatilityRegime === 'low') {
    edge += 20 // Buying vol when it's cheap
  }
  if (strategy.type.includes('condor') && marketConditions.volatilityRegime === 'high') {
    edge += 20 // Selling vol when it's expensive
  }
  
  // Time decay edge
  const totalTheta = strategy.legs.reduce((sum, leg) => sum + leg.theta * (leg.side === 'sell' ? 1 : -1), 0)
  if (totalTheta > 0) edge += 15 // Positive theta is generally good
  
  // Liquidity edge
  const avgLiquidityScore = strategy.legs.reduce((sum, leg) => sum + leg.liquidityScore, 0) / strategy.legs?.length || 0
  if (avgLiquidityScore > 80) edge += 10
  
  return Math.max(0, Math.min(100, edge))
}

/**
 * Generate execution guidance
 */
function generateExecutionGuidance(strategy: OptimizedStrategy, liquidityProfile: LiquidityProfile): ExecutionGuidance {
  const avgLiquidityScore = strategy.legs.reduce((sum, leg) => sum + leg.liquidityScore, 0) / strategy.legs?.length || 0
  
  let recommendedOrderType: ExecutionGuidance['recommendedOrderType']
  if (avgLiquidityScore >= 80) recommendedOrderType = 'limit'
  else if (avgLiquidityScore >= 60) recommendedOrderType = 'limit'
  else recommendedOrderType = 'iceberg'
  
  const netPrice = strategy.legs.reduce((sum, leg) => 
    sum + leg.price * (leg.side === 'buy' ? 1 : -1), 0)
  
  const suggestedPricing = {
    aggressivePrice: netPrice * 1.05,
    conservativePrice: netPrice * 0.95,
    midpointPrice: netPrice
  }
  
  let legSequencing: ExecutionGuidance['legSequencing']
  if (strategy.legs?.length || 0) === 1) legSequencing = 'simultaneous'
  else if (strategy.legs?.length || 0) === 2) legSequencing = 'simultaneous'
  else legSequencing = 'sequential'
  
  const estimatedFillTime = avgLiquidityScore >= 80 ? '< 1 minute' : 
                           avgLiquidityScore >= 60 ? '1-5 minutes' : '5-15 minutes'
  
  return {
    recommendedOrderType,
    suggestedPricing,
    executionTiming: {
      optimalTime: 'Market open (9:30-10:30 AM) or close (3:00-4:00 PM)',
      avoidTimes: ['Lunch hour (11:30-1:30 PM)', 'Last 30 minutes on expiration Friday']
    },
    legSequencing,
    estimatedFillTime,
    slippageBudget: netPrice * 0.02 // 2% slippage budget
  }
}