/**
 * Continuous Monitoring Engine
 * 
 * Real-time tracking and alerting system that monitors:
 * - Volatility changes and regime shifts
 * - Trend shifts and momentum changes
 * - Event risk and calendar events
 * - Liquidity deterioration
 * - Profit targets and stop conditions
 * - Correlation spikes and portfolio risk
 * 
 * Provides actionable guidance on exactly what to do.
 */

import { Position } from '@/types'
import { RankedOpportunity, OpportunityAlert } from './opportunitiesScanner'
import { PortfolioGreeks } from './greeksAggregation'
import { LiquidityProfile } from './liquidityModeling'

export interface ContinuousMonitoringEngine {
  isActive: boolean
  lastUpdateTime: Date
  monitoringInterval: number // Seconds
  watchedSymbols: WatchedSymbol[]
  activeAlerts: MonitoringAlert[]
  triggerConditions: GlobalTriggerCondition[]
  portfolioMonitor: PortfolioMonitor
  marketRegimeTracker: MarketRegimeTracker
  executionQueue: ExecutionRecommendation[]
}

export interface WatchedSymbol {
  symbol: string
  currentPrice: number
  priceHistory: PricePoint[]
  volatilityHistory: VolatilityPoint[]
  liquidityMetrics: LiquidityMetrics
  eventCalendar: UpcomingEvent[]
  triggers: SymbolTrigger[]
  lastAnalysis: Date
  alertHistory: SymbolAlert[]
}

export interface PricePoint {
  timestamp: Date
  price: number
  volume: number
  change: number
  changePercent: number
}

export interface VolatilityPoint {
  timestamp: Date
  impliedVol: number
  realizedVol: number
  ivRank: number
  ivPercentile: number
  volOfVol: number // Volatility of volatility
}

export interface LiquidityMetrics {
  averageSpread: number
  spreadTrend: 'tightening' | 'widening' | 'stable'
  volumeTrend: 'increasing' | 'decreasing' | 'stable'
  openInterestTrend: 'increasing' | 'decreasing' | 'stable'
  liquidityScore: number
  liquidityTrend: 'improving' | 'deteriorating' | 'stable'
}

export interface UpcomingEvent {
  type: 'earnings' | 'dividend' | 'fed_meeting' | 'expiration' | 'economic_data' | 'split' | 'merger'
  date: Date
  daysAway: number
  expectedImpact: 'low' | 'medium' | 'high' | 'extreme'
  historicalMove: number // Historical average move
  currentImpliedMove: number // Options-implied move
  eventPremium: number // Extra IV premium for event
}

export interface SymbolTrigger {
  id: string
  name: string
  type: 'price' | 'volatility' | 'volume' | 'technical' | 'flow'
  condition: string
  threshold: number
  currentValue: number
  direction: 'above' | 'below' | 'crosses'
  triggered: boolean
  triggeredAt?: Date
  actionRequired: string
}

export interface SymbolAlert {
  timestamp: Date
  type: 'opportunity' | 'warning' | 'critical'
  message: string
  action: string
  resolved: boolean
}

export interface GlobalTriggerCondition {
  id: string
  name: string
  description: string
  condition: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  lastTriggered?: Date
  actionScript: string
}

export interface PortfolioMonitor {
  totalValue: number
  totalPnL: number
  riskMetrics: PortfolioRiskMetrics
  exposureAlerts: ExposureAlert[]
  performanceMetrics: PerformanceMetrics
  rebalancingNeeds: RebalancingRecommendation[]
}

export interface PortfolioRiskMetrics {
  netDelta: number
  totalGamma: number
  totalTheta: number
  totalVega: number
  var95: number
  maxDrawdown: number
  correlationRisk: number
}

export interface ExposureAlert {
  type: 'concentration' | 'directional' | 'volatility' | 'time_decay' | 'correlation'
  severity: 'warning' | 'critical'
  message: string
  currentLevel: number
  threshold: number
  recommendation: string
}

export interface PerformanceMetrics {
  dailyPnL: number
  weeklyPnL: number
  monthlyPnL: number
  winRate: number
  avgWin: number
  avgLoss: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
  currentDrawdown: number
}

export interface RebalancingRecommendation {
  type: 'hedge_delta' | 'reduce_concentration' | 'take_profits' | 'cut_losses' | 'roll_positions'
  priority: 'immediate' | 'today' | 'this_week' | 'when_convenient'
  description: string
  specificActions: RebalancingAction[]
  expectedImprovement: string
}

export interface RebalancingAction {
  action: 'buy' | 'sell' | 'close' | 'roll'
  symbol: string
  quantity: number
  reasoning: string
  urgency: 'immediate' | 'urgent' | 'normal' | 'low'
}

export interface MarketRegimeTracker {
  currentRegime: MarketRegime
  regimeConfidence: number
  regimeHistory: RegimeChange[]
  indicators: RegimeIndicators
  nextReviewTime: Date
}

export interface MarketRegime {
  volatilityRegime: 'low_vol' | 'normal_vol' | 'high_vol' | 'extreme_vol'
  trendRegime: 'strong_trend' | 'weak_trend' | 'range_bound' | 'volatile'
  liquidityRegime: 'abundant' | 'normal' | 'constrained' | 'stressed'
  sentimentRegime: 'euphoric' | 'optimistic' | 'neutral' | 'pessimistic' | 'panic'
  overallRegime: 'risk_on' | 'risk_off' | 'transition' | 'crisis'
}

export interface RegimeChange {
  timestamp: Date
  fromRegime: MarketRegime
  toRegime: MarketRegime
  trigger: string
  confidence: number
}

export interface RegimeIndicators {
  vixLevel: number
  vixTrend: 'rising' | 'falling' | 'stable'
  correlations: number
  dispersion: number
  momentum: number
  breadth: number
}

export interface ExecutionRecommendation {
  id: string
  type: 'enter_position' | 'exit_position' | 'adjust_position' | 'hedge_risk'
  priority: 'immediate' | 'urgent' | 'normal' | 'low'
  symbol: string
  strategy: string
  action: string
  reasoning: string
  timeWindow: string
  riskLevel: 'low' | 'medium' | 'high'
  expectedOutcome: string
  createdAt: Date
  expiresAt: Date
}

/**
 * Initialize continuous monitoring engine
 */
export function initializeMonitoringEngine(
  watchedSymbols: string[],
  positions: Position[],
  preferences: MonitoringPreferences
): ContinuousMonitoringEngine {
  
  const watchedSymbolsData: WatchedSymbol[] = watchedSymbols.map(symbol => ({
    symbol,
    currentPrice: 0, // Will be updated by monitoring loop
    priceHistory: [],
    volatilityHistory: [],
    liquidityMetrics: {
      averageSpread: 0,
      spreadTrend: 'stable',
      volumeTrend: 'stable',
      openInterestTrend: 'stable',
      liquidityScore: 0,
      liquidityTrend: 'stable'
    },
    eventCalendar: [],
    triggers: generateDefaultTriggers(symbol),
    lastAnalysis: new Date(),
    alertHistory: []
  }))
  
  const globalTriggers = generateGlobalTriggers(preferences)
  
  return {
    isActive: true,
    lastUpdateTime: new Date(),
    monitoringInterval: preferences.updateFrequency || 60, // Default 1 minute
    watchedSymbols: watchedSymbolsData,
    activeAlerts: [],
    triggerConditions: globalTriggers,
    portfolioMonitor: initializePortfolioMonitor(positions),
    marketRegimeTracker: initializeMarketRegimeTracker(),
    executionQueue: []
  }
}

export interface MonitoringPreferences {
  updateFrequency: number // Seconds
  alertThresholds: {
    volSpikeThreshold: number
    priceChangeThreshold: number
    liquidityThreshold: number
  }
  notificationMethods: ('email' | 'push' | 'sms')[]
  tradingHours: {
    start: string // "09:30"
    end: string   // "16:00"
    timezone: string
  }
}

/**
 * Main monitoring loop - processes all watched symbols and portfolio
 */
export async function processMonitoringCycle(
  engine: ContinuousMonitoringEngine,
  currentPositions: Position[]
): Promise<{
  newAlerts: MonitoringAlert[]
  portfolioUpdates: PortfolioUpdate[]
  executionRecommendations: ExecutionRecommendation[]
  marketRegimeChanges: RegimeChange[]
}> {
  
  const newAlerts: MonitoringAlert[] = []
  const portfolioUpdates: PortfolioUpdate[] = []
  const executionRecommendations: ExecutionRecommendation[] = []
  const marketRegimeChanges: RegimeChange[] = []
  
  // Update market regime
  const regimeUpdate = await updateMarketRegime(engine.marketRegimeTracker)
  if (regimeUpdate.changed) {
    marketRegimeChanges.push(regimeUpdate.change!)
    newAlerts.push({
      id: `regime_${Date.now()}`,
      type: 'regime_change',
      severity: 'warning',
      symbol: 'MARKET',
      message: `Market regime changed to ${regimeUpdate.newRegime?.overallRegime}`,
      actionRequired: 'Review portfolio positioning for new regime',
      timeTriggered: new Date(),
      isRead: false,
      isResolved: false
    })
  }
  
  // Monitor each symbol
  for (const watchedSymbol of engine.watchedSymbols) {
    const symbolUpdates = await monitorSymbol(watchedSymbol, engine.marketRegimeTracker.currentRegime)
    newAlerts.push(...symbolUpdates.alerts)
    executionRecommendations.push(...symbolUpdates.recommendations)
  }
  
  // Monitor portfolio
  const portfolioMonitorResults = await monitorPortfolio(currentPositions, engine.portfolioMonitor)
  newAlerts.push(...portfolioMonitorResults.alerts)
  portfolioUpdates.push(...portfolioMonitorResults.updates)
  executionRecommendations.push(...portfolioMonitorResults.recommendations)
  
  // Update engine state
  engine.lastUpdateTime = new Date()
  engine.activeAlerts.push(...newAlerts)
  
  return {
    newAlerts,
    portfolioUpdates,
    executionRecommendations,
    marketRegimeChanges
  }
}

export interface PortfolioUpdate {
  type: 'pnl_change' | 'risk_change' | 'exposure_change' | 'performance_update'
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  magnitude: number
  recommendation?: string
}

/**
 * Monitor individual symbol for triggers and changes
 */
async function monitorSymbol(
  watchedSymbol: WatchedSymbol,
  marketRegime: MarketRegime
): Promise<{
  alerts: MonitoringAlert[]
  recommendations: ExecutionRecommendation[]
}> {
  const alerts: MonitoringAlert[] = []
  const recommendations: ExecutionRecommendation[] = []
  
  // Mock price update (in production, would fetch real data)
  const newPrice = watchedSymbol.currentPrice * (1 + (Math.random() - 0.5) * 0.02)
  const priceChange = (newPrice - watchedSymbol.currentPrice) / watchedSymbol.currentPrice
  
  // Update price history
  watchedSymbol.priceHistory.push({
    timestamp: new Date(),
    price: newPrice,
    volume: 100000,
    change: newPrice - watchedSymbol.currentPrice,
    changePercent: priceChange * 100
  })
  
  // Check price triggers
  for (const trigger of watchedSymbol.triggers) {
    if (trigger.type === 'price' && !trigger.triggered) {
      const shouldTrigger = trigger.direction === 'above' 
        ? newPrice > trigger.threshold
        : newPrice < trigger.threshold
      
      if (shouldTrigger) {
        trigger.triggered = true
        trigger.triggeredAt = new Date()
        
        alerts.push({
          id: `trigger_${trigger.id}_${Date.now()}`,
          type: 'price_trigger',
          severity: 'warning',
          symbol: watchedSymbol.symbol,
          message: `Price trigger activated: ${trigger.name}`,
          actionRequired: trigger.actionRequired,
          timeTriggered: new Date(),
          isRead: false,
          isResolved: false
        })
      }
    }
  }
  
  // Check for significant moves
  if (Math.abs(priceChange) > 0.05) { // 5% move
    alerts.push({
      id: `big_move_${watchedSymbol.symbol}_${Date.now()}`,
      type: 'significant_move',
      severity: 'warning',
      symbol: watchedSymbol.symbol,
      message: `Significant ${priceChange > 0 ? 'up' : 'down'} move: ${(priceChange * 100).toFixed(1)}%`,
      actionRequired: 'Review positions and consider adjustments',
      timeTriggered: new Date(),
      isRead: false,
      isResolved: false
    })
    
    // Generate execution recommendation
    recommendations.push({
      id: `vol_opp_${watchedSymbol.symbol}_${Date.now()}`,
      type: 'enter_position',
      priority: 'urgent',
      symbol: watchedSymbol.symbol,
      strategy: 'volatility_capture',
      action: 'Consider volatility strategies after large move',
      reasoning: `${(Math.abs(priceChange) * 100).toFixed(1)}% move may create volatility opportunities`,
      timeWindow: 'Next 2 hours',
      riskLevel: 'medium',
      expectedOutcome: 'Capture elevated volatility premium',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    })
  }
  
  watchedSymbol.currentPrice = newPrice
  watchedSymbol.lastAnalysis = new Date()
  
  return { alerts, recommendations }
}

export interface MonitoringAlert {
  id: string
  type: 'volatility_spike' | 'trend_shift' | 'liquidity_deterioration' | 'profit_target' | 'stop_loss' | 
        'correlation_spike' | 'price_trigger' | 'significant_move' | 'regime_change' | 'event_risk'
  severity: 'info' | 'warning' | 'critical'
  symbol: string
  message: string
  actionRequired: string
  timeTriggered: Date
  isRead: boolean
  isResolved: boolean
}

/**
 * Monitor portfolio for changes and risks
 */
async function monitorPortfolio(
  positions: Position[],
  portfolioMonitor: PortfolioMonitor
): Promise<{
  alerts: MonitoringAlert[]
  updates: PortfolioUpdate[]
  recommendations: ExecutionRecommendation[]
}> {
  const alerts: MonitoringAlert[] = []
  const updates: PortfolioUpdate[] = []
  const recommendations: ExecutionRecommendation[] = []
  
  // Calculate current portfolio metrics
  const currentValue = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0)
  const valueChange = currentValue - portfolioMonitor.totalValue
  
  // Check for significant P&L changes
  if (Math.abs(valueChange) > 1000) {
    alerts.push({
      id: `pnl_change_${Date.now()}`,
      type: 'profit_target',
      severity: valueChange > 0 ? 'info' : 'warning',
      symbol: 'PORTFOLIO',
      message: `Portfolio ${valueChange > 0 ? 'gained' : 'lost'} $${Math.abs(valueChange).toFixed(0)}`,
      actionRequired: valueChange > 2000 ? 'Consider taking profits' : valueChange < -2000 ? 'Review stop-loss levels' : 'Monitor closely',
      timeTriggered: new Date(),
      isRead: false,
      isResolved: false
    })
  }
  
  // Check for excessive risk concentration
  const symbolExposure = new Map<string, number>()
  for (const position of positions) {
    const currentExposure = symbolExposure.get(position.symbol) || 0
    symbolExposure.set(position.symbol, currentExposure + Math.abs(position.delta || 0) * position.quantity)
  }
  
  const totalExposure = Array.from(symbolExposure.values()).reduce((sum, exp) => sum + exp, 0)
  for (const [symbol, exposure] of symbolExposure) {
    const concentrationPercent = exposure / totalExposure
    if (concentrationPercent > 0.4) { // 40% concentration threshold
      alerts.push({
        id: `concentration_${symbol}_${Date.now()}`,
        type: 'correlation_spike',
        severity: 'warning',
        symbol,
        message: `High concentration in ${symbol}: ${(concentrationPercent * 100).toFixed(1)}%`,
        actionRequired: 'Consider diversifying exposure',
        timeTriggered: new Date(),
        isRead: false,
        isResolved: false
      })
    }
  }
  
  // Check profit targets for individual positions
  for (const position of positions) {
    const unrealizedPercent = (position.unrealizedPnl || 0) / (position.entryPrice * position.quantity)
    
    // Profit target alerts
    if (unrealizedPercent > 0.5) { // 50% profit
      recommendations.push({
        id: `profit_target_${position.id}_${Date.now()}`,
        type: 'exit_position',
        priority: 'normal',
        symbol: position.symbol,
        strategy: position.strategyType,
        action: 'Consider taking profits',
        reasoning: `Position up ${(unrealizedPercent * 100).toFixed(1)}% - consider taking profits`,
        timeWindow: 'Today',
        riskLevel: 'low',
        expectedOutcome: 'Lock in gains before potential reversal',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      })
    }
    
    // Stop loss alerts
    if (unrealizedPercent < -0.3) { // 30% loss
      recommendations.push({
        id: `stop_loss_${position.id}_${Date.now()}`,
        type: 'exit_position',
        priority: 'urgent',
        symbol: position.symbol,
        strategy: position.strategyType,
        action: 'Consider cutting losses',
        reasoning: `Position down ${(Math.abs(unrealizedPercent) * 100).toFixed(1)}% - consider stop loss`,
        timeWindow: 'Immediately',
        riskLevel: 'high',
        expectedOutcome: 'Limit further losses',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
      })
    }
  }
  
  // Update portfolio monitor
  portfolioMonitor.totalValue = currentValue
  portfolioMonitor.totalPnL = positions.reduce((sum, pos) => sum + (pos.realizedPnl || 0) + (pos.unrealizedPnl || 0), 0)
  
  return { alerts, updates, recommendations }
}

/**
 * Generate default triggers for a symbol
 */
function generateDefaultTriggers(symbol: string): SymbolTrigger[] {
  return [
    {
      id: `${symbol}_vol_spike`,
      name: 'Volatility Spike',
      type: 'volatility',
      condition: 'IV Rank > 90',
      threshold: 90,
      currentValue: 50,
      direction: 'above',
      triggered: false,
      actionRequired: 'Consider premium selling opportunities'
    },
    {
      id: `${symbol}_vol_crush`,
      name: 'Volatility Crush',
      type: 'volatility',
      condition: 'IV Rank < 10',
      threshold: 10,
      currentValue: 50,
      direction: 'below',
      triggered: false,
      actionRequired: 'Consider premium buying opportunities'
    },
    {
      id: `${symbol}_volume_surge`,
      name: 'Volume Surge',
      type: 'volume',
      condition: 'Volume > 300% of 20-day average',
      threshold: 300,
      currentValue: 100,
      direction: 'above',
      triggered: false,
      actionRequired: 'Investigate unusual activity'
    },
    {
      id: `${symbol}_technical_break`,
      name: 'Technical Breakout',
      type: 'technical',
      condition: 'Price breaks key resistance/support',
      threshold: 0, // Would be calculated dynamically
      currentValue: 0,
      direction: 'crosses',
      triggered: false,
      actionRequired: 'Consider directional strategies'
    }
  ]
}

/**
 * Generate global monitoring triggers
 */
function generateGlobalTriggers(preferences: MonitoringPreferences): GlobalTriggerCondition[] {
  return [
    {
      id: 'market_vol_spike',
      name: 'Market Volatility Spike',
      description: 'VIX spikes above 30',
      condition: 'VIX > 30',
      priority: 'high',
      enabled: true,
      actionScript: 'Alert all users about elevated market volatility'
    },
    {
      id: 'liquidity_crisis',
      name: 'Liquidity Crisis',
      description: 'Widespread bid-ask spread widening',
      condition: 'Average spread > 200% of normal',
      priority: 'critical',
      enabled: true,
      actionScript: 'Issue liquidity warning and suggest position size reductions'
    },
    {
      id: 'correlation_breakdown',
      name: 'Correlation Breakdown',
      description: 'Sudden correlation spike during stress',
      condition: 'Cross-asset correlation > 0.8',
      priority: 'high',
      enabled: true,
      actionScript: 'Alert about diversification failure and suggest hedging'
    }
  ]
}

/**
 * Initialize portfolio monitor
 */
function initializePortfolioMonitor(positions: Position[]): PortfolioMonitor {
  const totalValue = positions.reduce((sum, pos) => sum + pos.entryPrice * pos.quantity, 0)
  const totalPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0) + (pos.realizedPnl || 0), 0)
  
  // Calculate basic portfolio Greeks
  const netDelta = positions.reduce((sum, pos) => sum + (pos.delta || 0) * pos.quantity, 0)
  const totalGamma = positions.reduce((sum, pos) => sum + (pos.gamma || 0) * pos.quantity, 0)
  const totalTheta = positions.reduce((sum, pos) => sum + (pos.theta || 0) * pos.quantity, 0)
  const totalVega = positions.reduce((sum, pos) => sum + (pos.vega || 0) * pos.quantity, 0)
  
  return {
    totalValue,
    totalPnL,
    riskMetrics: {
      netDelta,
      totalGamma,
      totalTheta,
      totalVega,
      var95: -Math.abs(netDelta) * 2, // Simplified VaR
      maxDrawdown: -totalValue * 0.15,
      correlationRisk: 0.3
    },
    exposureAlerts: [],
    performanceMetrics: {
      dailyPnL: 0,
      weeklyPnL: totalPnL,
      monthlyPnL: totalPnL,
      winRate: 0.6,
      avgWin: 500,
      avgLoss: -300,
      profitFactor: 1.67,
      sharpeRatio: 1.2,
      maxDrawdown: -totalValue * 0.15,
      currentDrawdown: Math.min(0, totalPnL)
    },
    rebalancingNeeds: []
  }
}

/**
 * Initialize market regime tracker
 */
function initializeMarketRegimeTracker(): MarketRegimeTracker {
  return {
    currentRegime: {
      volatilityRegime: 'normal_vol',
      trendRegime: 'range_bound',
      liquidityRegime: 'normal',
      sentimentRegime: 'neutral',
      overallRegime: 'risk_on'
    },
    regimeConfidence: 0.7,
    regimeHistory: [],
    indicators: {
      vixLevel: 20,
      vixTrend: 'stable',
      correlations: 0.3,
      dispersion: 0.15,
      momentum: 0,
      breadth: 0.5
    },
    nextReviewTime: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  }
}

/**
 * Update market regime based on indicators
 */
async function updateMarketRegime(tracker: MarketRegimeTracker): Promise<{
  changed: boolean
  newRegime?: MarketRegime
  change?: RegimeChange
}> {
  // Mock regime change detection
  // In production, would analyze multiple market indicators
  
  const shouldChange = Math.random() < 0.05 // 5% chance of regime change
  
  if (!shouldChange) {
    return { changed: false }
  }
  
  const oldRegime = tracker.currentRegime
  const newRegime: MarketRegime = {
    ...oldRegime,
    volatilityRegime: Math.random() > 0.5 ? 'high_vol' : 'normal_vol'
  }
  
  const regimeChange: RegimeChange = {
    timestamp: new Date(),
    fromRegime: oldRegime,
    toRegime: newRegime,
    trigger: 'Volatility regime shift detected',
    confidence: 0.8
  }
  
  tracker.currentRegime = newRegime
  tracker.regimeHistory.push(regimeChange)
  
  return {
    changed: true,
    newRegime,
    change: regimeChange
  }
}

/**
 * Process alerts and generate actionable guidance
 */
export function processAlertsForActionableGuidance(alerts: MonitoringAlert[]): ActionableGuidance[] {
  return alerts.map(alert => {
    let guidance: ActionableGuidance
    
    switch (alert.type) {
      case 'volatility_spike':
        guidance = {
          situation: alert.message,
          immediateAction: 'SELL PREMIUM: Consider iron condors, credit spreads, or short straddles',
          reasoning: 'High IV creates premium selling opportunities',
          timeframe: 'Enter within 2 hours before IV normalizes',
          riskLevel: 'Medium',
          expectedOutcome: 'Capture elevated time premium as volatility reverts',
          alternativeActions: ['Wait for higher IV', 'Sell calls against long stock positions']
        }
        break
        
      case 'liquidity_deterioration':
        guidance = {
          situation: alert.message,
          immediateAction: 'REDUCE SIZE: Cut new position sizes by 50%',
          reasoning: 'Poor liquidity increases execution risk and slippage',
          timeframe: 'Implement immediately',
          riskLevel: 'High',
          expectedOutcome: 'Maintain execution quality despite market stress',
          alternativeActions: ['Use limit orders only', 'Delay non-urgent trades', 'Switch to more liquid symbols']
        }
        break
        
      case 'profit_target':
        guidance = {
          situation: alert.message,
          immediateAction: 'TAKE PROFITS: Close 50-75% of winning position',
          reasoning: 'Lock in gains before potential reversal',
          timeframe: 'Today',
          riskLevel: 'Low',
          expectedOutcome: 'Secure profits while maintaining some upside',
          alternativeActions: ['Set trailing stop', 'Roll to later expiration', 'Take full profits']
        }
        break
        
      case 'stop_loss':
        guidance = {
          situation: alert.message,
          immediateAction: 'CUT LOSSES: Close losing position immediately',
          reasoning: 'Prevent further deterioration of capital',
          timeframe: 'Within 1 hour',
          riskLevel: 'High',
          expectedOutcome: 'Preserve capital for better opportunities',
          alternativeActions: ['Roll to later expiration if still bullish', 'Hedge with opposite position']
        }
        break
        
      default:
        guidance = {
          situation: alert.message,
          immediateAction: 'MONITOR: Review position and market conditions',
          reasoning: 'Alert requires assessment',
          timeframe: 'Within 4 hours',
          riskLevel: 'Medium',
          expectedOutcome: 'Maintain awareness of changing conditions',
          alternativeActions: ['No action if within risk tolerance']
        }
    }
    
    return guidance
  })
}

export interface ActionableGuidance {
  situation: string
  immediateAction: string
  reasoning: string
  timeframe: string
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  expectedOutcome: string
  alternativeActions: string[]
}

/**
 * What Could Hurt You Most Right Now - Scenario Analysis
 */
export function generateWorstCaseScenarios(
  positions: Position[],
  portfolioGreeks: PortfolioGreeks
): WorstCaseScenario[] {
  const scenarios: WorstCaseScenario[] = []
  
  // Market drop scenario
  scenarios.push({
    name: 'Market Drop',
    description: 'S&P 500 drops 5% in one day',
    probability: 0.02, // 2% chance
    marketConditions: {
      spxMove: -5,
      vixMove: 50,
      correlationSpike: 0.8
    },
    portfolioImpact: {
      estimatedLoss: portfolioGreeks.netDelta * -5 * 0.01, // Delta impact
      worstCase: portfolioGreeks.netDelta * -7 * 0.01, // With gamma
      timeToRecover: '2-4 weeks',
      affectedPositions: positions.filter(pos => (pos.delta || 0) > 0.3).map(pos => pos.symbol)
    },
    plainEnglishExplanation: `If the market drops 5%, your long delta exposure of ${portfolioGreeks.netDelta.toFixed(0)} would lose approximately $${Math.abs(portfolioGreeks.netDelta * -5 * 0.01).toFixed(0)}. This is because you have net bullish exposure that loses when markets fall.`,
    mitigationActions: [
      'Hedge with SPY puts',
      'Reduce long delta exposure',
      'Add market-neutral strategies'
    ]
  })
  
  // Volatility spike scenario
  scenarios.push({
    name: 'Volatility Spike', 
    description: 'VIX jumps from 20 to 40 (doubles)',
    probability: 0.05, // 5% chance
    marketConditions: {
      spxMove: -2,
      vixMove: 100,
      correlationSpike: 0.7
    },
    portfolioImpact: {
      estimatedLoss: portfolioGreeks.totalVega * 0.2, // 20% vol increase
      worstCase: portfolioGreeks.totalVega * 0.3,
      timeToRecover: '1-2 weeks',
      affectedPositions: positions.filter(pos => (pos.vega || 0) < -50).map(pos => pos.symbol)
    },
    plainEnglishExplanation: `A volatility spike would ${portfolioGreeks.totalVega > 0 ? 'help' : 'hurt'} your portfolio because you have ${portfolioGreeks.totalVega > 0 ? 'positive' : 'negative'} vega exposure of ${portfolioGreeks.totalVega.toFixed(0)}. This means you ${portfolioGreeks.totalVega > 0 ? 'benefit' : 'lose'} when options become more expensive due to higher volatility.`,
    mitigationActions: portfolioGreeks.totalVega < 0 ? [
      'Close short volatility positions',
      'Buy protective volatility',
      'Reduce vega exposure'
    ] : [
      'Consider taking profits on long vol',
      'Hedge with short vol strategies'
    ]
  })
  
  // Earnings shock scenario
  if (hasEarningsExposure(positions)) {
    scenarios.push({
      name: 'Earnings Shock',
      description: 'Stock moves 15% on earnings (either direction)',
      probability: 0.1, // 10% chance
      marketConditions: {
        spxMove: 0,
        vixMove: -20, // Vol crush post-earnings
        correlationSpike: 0.1
      },
      portfolioImpact: {
        estimatedLoss: calculateEarningsImpact(positions, 15),
        worstCase: calculateEarningsImpact(positions, 20),
        timeToRecover: '1 week',
        affectedPositions: getEarningsExposedPositions(positions)
      },
      plainEnglishExplanation: `Earnings can cause sudden large moves. Your positions would be impacted by both the price move and the volatility crush that typically follows earnings announcements.`,
      mitigationActions: [
        'Close positions before earnings',
        'Use earnings straddles/strangles',
        'Reduce position sizes'
      ]
    })
  }
  
  return scenarios.sort((a, b) => a.probability - b.probability) // Most likely first
}

export interface WorstCaseScenario {
  name: string
  description: string
  probability: number
  marketConditions: {
    spxMove: number // Percentage
    vixMove: number // Percentage
    correlationSpike: number
  }
  portfolioImpact: {
    estimatedLoss: number
    worstCase: number
    timeToRecover: string
    affectedPositions: string[]
  }
  plainEnglishExplanation: string
  mitigationActions: string[]
}

// Helper functions
function hasEarningsExposure(positions: Position[]): boolean {
  return positions.some(pos => {
    const daysToExpiry = pos.legs.some(leg => {
      const days = Math.ceil((leg.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return days <= 14 // Within 2 weeks, likely earnings exposure
    })
    return daysToExpiry
  })
}

function calculateEarningsImpact(positions: Position[], movePercent: number): number {
  return positions.reduce((sum, pos) => {
    const deltaImpact = (pos.delta || 0) * pos.quantity * movePercent * 0.01
    const gammaImpact = (pos.gamma || 0) * pos.quantity * Math.pow(movePercent * 0.01, 2) * 0.5
    const vegaImpact = (pos.vega || 0) * pos.quantity * -0.2 // Vol crush
    return sum + deltaImpact + gammaImpact + vegaImpact
  }, 0)
}

function getEarningsExposedPositions(positions: Position[]): string[] {
  return positions
    .filter(pos => pos.legs.some(leg => {
      const days = Math.ceil((leg.expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return days <= 14
    }))
    .map(pos => pos.symbol)
}