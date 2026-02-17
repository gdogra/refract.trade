/**
 * AI-Powered Alert System
 * Intelligent monitoring and notification system for options portfolios
 */

import { calculateGreeks, getTimeToExpiry, type GreeksInput } from './greeks'
import { marketDataService, type MarketDataPoint } from './marketData'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  details?: AlertDetails
  timestamp: Date
  isRead: boolean
  isResolved: boolean
  userId: string
  positionId?: string
  symbol?: string
  actionRequired?: boolean
  expiresAt?: Date
  metadata?: Record<string, any>
}

export enum AlertType {
  POSITION_RISK = 'position_risk',
  PORTFOLIO_RISK = 'portfolio_risk', 
  MARKET_EVENT = 'market_event',
  EXPIRATION_WARNING = 'expiration_warning',
  GREEKS_THRESHOLD = 'greeks_threshold',
  VOLATILITY_SPIKE = 'volatility_spike',
  EARNINGS_ANNOUNCEMENT = 'earnings_announcement',
  ASSIGNMENT_RISK = 'assignment_risk',
  WASH_SALE_WARNING = 'wash_sale_warning',
  MARGIN_CALL = 'margin_call',
  CORRELATION_ALERT = 'correlation_alert',
  LIQUIDITY_WARNING = 'liquidity_warning'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AlertDetails {
  currentValue?: number
  thresholdValue?: number
  changePercent?: number
  timeToExpiry?: number
  recommendedAction?: string
  affectedPositions?: string[]
  riskScore?: number
  confidence?: number
  historicalComparison?: string
}

export interface AlertRule {
  id: string
  name: string
  description: string
  type: AlertType
  enabled: boolean
  conditions: AlertCondition[]
  actions: AlertAction[]
  cooldownPeriod: number // Minutes
  lastTriggered?: Date
}

export interface AlertCondition {
  field: string // 'delta', 'theta', 'price', 'volume', etc.
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between'
  value: number | [number, number]
  timeframe?: number // Minutes
}

export interface AlertAction {
  type: 'email' | 'push' | 'sms' | 'webhook'
  endpoint?: string
  template?: string
  enabled: boolean
}

export interface PortfolioMetrics {
  totalDelta: number
  totalGamma: number
  totalTheta: number
  totalVega: number
  totalValue: number
  maxSinglePositionRisk: number
  correlationRisk: number
  liquidityScore: number
  concentrationRisk: number
}

export interface Position {
  id: string
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: Date
  quantity: number
  entryPrice: number
  currentPrice: number
  spotPrice: number
  impliedVol: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
  }
  unrealizedPnL: number
  volume?: number
  openInterest?: number
}

class AlertSystem {
  private alerts: Alert[] = []
  private rules: AlertRule[] = []
  private subscribers = new Map<string, (alert: Alert) => void>()
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  
  // Default alert rules
  private defaultRules: AlertRule[] = [
    {
      id: 'delta_risk',
      name: 'High Delta Risk',
      description: 'Alert when portfolio delta exposure exceeds safe levels',
      type: AlertType.PORTFOLIO_RISK,
      enabled: true,
      conditions: [
        { field: 'totalDelta', operator: 'gt', value: 5000 }
      ],
      actions: [
        { type: 'push', enabled: true },
        { type: 'email', enabled: false }
      ],
      cooldownPeriod: 60
    },
    {
      id: 'theta_decay',
      name: 'High Theta Decay',
      description: 'Alert when daily theta decay exceeds threshold',
      type: AlertType.PORTFOLIO_RISK,
      enabled: true,
      conditions: [
        { field: 'totalTheta', operator: 'lt', value: -200 }
      ],
      actions: [
        { type: 'push', enabled: true }
      ],
      cooldownPeriod: 120
    },
    {
      id: 'expiration_7_days',
      name: 'Positions Expiring Soon',
      description: 'Alert when positions expire within 7 days',
      type: AlertType.EXPIRATION_WARNING,
      enabled: true,
      conditions: [
        { field: 'timeToExpiry', operator: 'lte', value: 7 }
      ],
      actions: [
        { type: 'push', enabled: true },
        { type: 'email', enabled: true }
      ],
      cooldownPeriod: 1440 // Daily
    },
    {
      id: 'volatility_spike',
      name: 'Volatility Spike',
      description: 'Alert when IV increases significantly',
      type: AlertType.VOLATILITY_SPIKE,
      enabled: true,
      conditions: [
        { field: 'impliedVolChange', operator: 'gt', value: 0.20 }
      ],
      actions: [
        { type: 'push', enabled: true }
      ],
      cooldownPeriod: 30
    },
    {
      id: 'assignment_risk',
      name: 'Assignment Risk',
      description: 'Alert when short options are deep ITM near expiry',
      type: AlertType.ASSIGNMENT_RISK,
      enabled: true,
      conditions: [
        { field: 'moneyness', operator: 'gt', value: 0.05 },
        { field: 'timeToExpiry', operator: 'lte', value: 3 },
        { field: 'quantity', operator: 'lt', value: 0 }
      ],
      actions: [
        { type: 'push', enabled: true },
        { type: 'email', enabled: true }
      ],
      cooldownPeriod: 60
    }
  ]

  constructor() {
    this.rules = [...this.defaultRules]
  }

  /**
   * Initialize the alert system
   */
  async initialize(): Promise<void> {
    console.log('Initializing AI Alert System...')
    await this.loadUserRules()
    this.startMonitoring()
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    console.log('Starting alert monitoring...')
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.runMonitoringCycle()
      } catch (error) {
        console.error('Alert monitoring error:', error)
      }
    }, intervalMs)
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
    this.isMonitoring = false
    console.log('Alert monitoring stopped')
  }

  /**
   * Add or update an alert rule
   */
  addRule(rule: AlertRule): void {
    const existingIndex = this.rules.findIndex(r => r.id === rule.id)
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule
    } else {
      this.rules.push(rule)
    }
  }

  /**
   * Enable/disable a rule
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId)
    if (rule) {
      rule.enabled = enabled
    }
  }

  /**
   * Get all alerts for a user
   */
  getAlerts(userId: string, unreadOnly: boolean = false): Alert[] {
    let alerts = this.alerts.filter(alert => alert.userId === userId)
    
    if (unreadOnly) {
      alerts = alerts.filter(alert => !alert.isRead)
    }
    
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Mark alert as read
   */
  markAsRead(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.isRead = true
    }
  }

  /**
   * Mark alert as resolved
   */
  markAsResolved(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.isResolved = true
    }
  }

  /**
   * Subscribe to new alerts
   */
  subscribe(userId: string, callback: (alert: Alert) => void): () => void {
    this.subscribers.set(userId, callback)
    
    return () => {
      this.subscribers.delete(userId)
    }
  }

  /**
   * Analyze portfolio and check for alerts
   */
  async analyzePortfolio(positions: Position[], userId: string): Promise<Alert[]> {
    const newAlerts: Alert[] = []
    const metrics = this.calculatePortfolioMetrics(positions)
    
    // Check each enabled rule
    for (const rule of this.rules.filter(r => r.enabled)) {
      // Check cooldown
      if (rule.lastTriggered) {
        const cooldownMs = rule.cooldownPeriod * 60 * 1000
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime()
        
        if (timeSinceLastTrigger < cooldownMs) {
          continue
        }
      }

      const alert = await this.checkRule(rule, positions, metrics, userId)
      if (alert) {
        newAlerts.push(alert)
        rule.lastTriggered = new Date()
      }
    }

    // Add alerts to the system
    newAlerts.forEach(alert => this.addAlert(alert))
    
    return newAlerts
  }

  /**
   * Create manual alert
   */
  createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    userId: string,
    details?: AlertDetails
  ): Alert {
    const alert: Alert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      severity,
      title,
      message,
      details,
      timestamp: new Date(),
      isRead: false,
      isResolved: false,
      userId
    }
    
    this.addAlert(alert)
    return alert
  }

  // Private methods

  private async runMonitoringCycle(): Promise<void> {
    // In a real implementation, this would:
    // 1. Fetch user portfolios from database
    // 2. Get current market data
    // 3. Run analysis for each user
    // 4. Send notifications
    
    console.log('Running monitoring cycle...')
  }

  private async loadUserRules(): Promise<void> {
    // Load custom user rules from database
    // For now, use defaults
  }

  private async checkRule(
    rule: AlertRule,
    positions: Position[],
    metrics: PortfolioMetrics,
    userId: string
  ): Promise<Alert | null> {
    let ruleTriggered = false
    let details: AlertDetails = {}
    let affectedPositions: string[] = []

    switch (rule.type) {
      case AlertType.PORTFOLIO_RISK:
        ruleTriggered = this.checkPortfolioRiskConditions(rule, metrics, details)
        break
        
      case AlertType.EXPIRATION_WARNING:
        const expiringPositions = positions.filter(pos => {
          const daysToExpiry = getDaysToExpiry(pos.expiry)
          return daysToExpiry <= 7 && daysToExpiry >= 0
        })
        
        if (expiringPositions.length > 0) {
          ruleTriggered = true
          affectedPositions = expiringPositions.map(p => p.id)
          details.affectedPositions = affectedPositions
          details.timeToExpiry = Math.min(...expiringPositions.map(p => getDaysToExpiry(p.expiry)))
        }
        break
        
      case AlertType.ASSIGNMENT_RISK:
        const assignmentRisk = positions.filter(pos => {
          if (pos.quantity >= 0) return false // Only short positions
          
          const daysToExpiry = getDaysToExpiry(pos.expiry)
          if (daysToExpiry > 3) return false
          
          const moneyness = pos.type === 'call' 
            ? (pos.spotPrice - pos.strike) / pos.strike
            : (pos.strike - pos.spotPrice) / pos.strike
          
          return moneyness > 0.05 // 5% ITM
        })
        
        if (assignmentRisk.length > 0) {
          ruleTriggered = true
          affectedPositions = assignmentRisk.map(p => p.id)
          details.affectedPositions = affectedPositions
        }
        break
        
      case AlertType.VOLATILITY_SPIKE:
        // Check for significant IV changes
        const volSpikes = await this.detectVolatilitySpikes(positions)
        if (volSpikes.length > 0) {
          ruleTriggered = true
          affectedPositions = volSpikes
          details.affectedPositions = affectedPositions
        }
        break
    }

    if (!ruleTriggered) return null

    // Generate AI-powered alert message
    const alert = this.generateAlert(rule, details, affectedPositions, userId)
    
    // Add AI confidence score
    alert.details = alert.details || {}
    alert.details.confidence = this.calculateConfidenceScore(rule, positions, metrics)
    
    return alert
  }

  private checkPortfolioRiskConditions(
    rule: AlertRule,
    metrics: PortfolioMetrics,
    details: AlertDetails
  ): boolean {
    return rule.conditions.every(condition => {
      let fieldValue: number
      
      switch (condition.field) {
        case 'totalDelta':
          fieldValue = Math.abs(metrics.totalDelta)
          details.currentValue = metrics.totalDelta
          break
        case 'totalTheta':
          fieldValue = metrics.totalTheta
          details.currentValue = metrics.totalTheta
          break
        case 'totalGamma':
          fieldValue = Math.abs(metrics.totalGamma)
          details.currentValue = metrics.totalGamma
          break
        case 'totalVega':
          fieldValue = Math.abs(metrics.totalVega)
          details.currentValue = metrics.totalVega
          break
        default:
          return false
      }
      
      details.thresholdValue = Array.isArray(condition.value) ? condition.value[0] : condition.value
      
      switch (condition.operator) {
        case 'gt': return fieldValue > condition.value
        case 'gte': return fieldValue >= condition.value
        case 'lt': return fieldValue < condition.value
        case 'lte': return fieldValue <= condition.value
        case 'eq': return fieldValue === condition.value
        case 'between':
          if (Array.isArray(condition.value)) {
            return fieldValue >= condition.value[0] && fieldValue <= condition.value[1]
          }
          return false
        default:
          return false
      }
    })
  }

  private calculatePortfolioMetrics(positions: Position[]): PortfolioMetrics {
    const metrics = positions.reduce((acc, position) => {
      const multiplier = position.quantity * 100
      
      acc.totalDelta += position.greeks.delta * multiplier
      acc.totalGamma += position.greeks.gamma * multiplier
      acc.totalTheta += position.greeks.theta * position.quantity
      acc.totalVega += position.greeks.vega * position.quantity
      acc.totalValue += Math.abs(position.currentPrice * multiplier)
      
      const positionRisk = Math.abs(position.unrealizedPnL)
      if (positionRisk > acc.maxSinglePositionRisk) {
        acc.maxSinglePositionRisk = positionRisk
      }
      
      return acc
    }, {
      totalDelta: 0,
      totalGamma: 0,
      totalTheta: 0,
      totalVega: 0,
      totalValue: 0,
      maxSinglePositionRisk: 0,
      correlationRisk: 0,
      liquidityScore: 0,
      concentrationRisk: 0
    })

    // Calculate additional metrics
    metrics.concentrationRisk = positions.length > 0 ? metrics.maxSinglePositionRisk / metrics.totalValue : 0
    metrics.liquidityScore = this.calculateLiquidityScore(positions)
    metrics.correlationRisk = this.calculateCorrelationRisk(positions)
    
    return metrics
  }

  private calculateLiquidityScore(positions: Position[]): number {
    // Simplified liquidity scoring based on volume and open interest
    const scores = positions.map(pos => {
      const volume = pos.volume || 0
      const openInterest = pos.openInterest || 0
      
      // Score from 0-100 based on volume and OI
      let score = 0
      if (volume > 100) score += 30
      if (volume > 500) score += 20
      if (openInterest > 1000) score += 30
      if (openInterest > 5000) score += 20
      
      return Math.min(score, 100)
    })
    
    return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50
  }

  private calculateCorrelationRisk(positions: Position[]): number {
    // Simplified correlation risk - percentage of positions in same symbol
    const symbols = new Set(positions.map(p => p.symbol))
    const uniqueSymbols = symbols.size
    const totalPositions = positions.length
    
    if (totalPositions === 0) return 0
    
    // Higher concentration = higher correlation risk
    return 1 - (uniqueSymbols / totalPositions)
  }

  private async detectVolatilitySpikes(positions: Position[]): Promise<string[]> {
    const spikes: string[] = []
    
    // In real implementation, would compare current IV to historical
    for (const position of positions) {
      // Mock spike detection
      if (Math.random() < 0.1) { // 10% chance of spike for demo
        spikes.push(position.id)
      }
    }
    
    return spikes
  }

  private generateAlert(
    rule: AlertRule,
    details: AlertDetails,
    affectedPositions: string[],
    userId: string
  ): Alert {
    let title = rule.name
    let message = rule.description
    let severity = AlertSeverity.MEDIUM

    // AI-powered message generation based on rule type
    switch (rule.type) {
      case AlertType.PORTFOLIO_RISK:
        if (details.currentValue && details.thresholdValue) {
          const excess = Math.abs(details.currentValue) - Math.abs(details.thresholdValue)
          severity = excess > Math.abs(details.thresholdValue) * 0.5 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM
          
          message = `Portfolio risk has exceeded safe levels. Current exposure: ${details.currentValue.toFixed(0)}, threshold: ${details.thresholdValue.toFixed(0)}`
          details.recommendedAction = 'Consider reducing position sizes or hedging exposure'
        }
        break
        
      case AlertType.EXPIRATION_WARNING:
        title = `${affectedPositions.length} Position(s) Expiring Soon`
        message = `You have ${affectedPositions.length} position(s) expiring in ${details.timeToExpiry} days. Review for potential assignment risk or profit-taking opportunities.`
        severity = details.timeToExpiry! <= 3 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM
        details.recommendedAction = 'Review positions for assignment risk and consider closing or rolling'
        break
        
      case AlertType.ASSIGNMENT_RISK:
        title = 'High Assignment Risk Detected'
        message = `${affectedPositions.length} short position(s) have high assignment probability. Consider closing or rolling to avoid unwanted assignment.`
        severity = AlertSeverity.HIGH
        details.recommendedAction = 'Close or roll positions to later expiration'
        break
        
      case AlertType.VOLATILITY_SPIKE:
        title = 'Volatility Spike Detected'
        message = `Significant volatility increase detected in ${affectedPositions.length} position(s). This may affect your Greeks and P&L.`
        severity = AlertSeverity.MEDIUM
        details.recommendedAction = 'Review vega exposure and consider vol hedging'
        break
    }

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: rule.type,
      severity,
      title,
      message,
      details,
      timestamp: new Date(),
      isRead: false,
      isResolved: false,
      userId,
      actionRequired: severity === AlertSeverity.HIGH || severity === AlertSeverity.CRITICAL
    }
  }

  private calculateConfidenceScore(
    rule: AlertRule,
    positions: Position[],
    metrics: PortfolioMetrics
  ): number {
    // AI confidence scoring based on data quality and historical accuracy
    let confidence = 0.7 // Base confidence
    
    // Increase confidence based on data quality
    const hasRecentMarketData = positions.every(p => p.currentPrice > 0)
    if (hasRecentMarketData) confidence += 0.1
    
    // Increase confidence for rules with historical accuracy
    if (rule.type === AlertType.EXPIRATION_WARNING) confidence += 0.2
    if (rule.type === AlertType.ASSIGNMENT_RISK) confidence += 0.15
    
    // Decrease confidence for volatile market conditions
    const avgImpliedVol = positions.reduce((sum, p) => sum + p.impliedVol, 0) / positions.length
    if (avgImpliedVol > 0.4) confidence -= 0.1 // High vol = lower confidence
    
    return Math.max(0.1, Math.min(1.0, confidence))
  }

  private addAlert(alert: Alert): void {
    this.alerts.push(alert)
    
    // Notify subscribers
    const callback = this.subscribers.get(alert.userId)
    if (callback) {
      callback(alert)
    }
    
    // Clean up old alerts (keep last 100 per user)
    const userAlerts = this.alerts.filter(a => a.userId === alert.userId)
    if (userAlerts.length > 100) {
      const alertsToRemove = userAlerts
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, userAlerts.length - 100)
      
      alertsToRemove.forEach(alertToRemove => {
        const index = this.alerts.findIndex(a => a.id === alertToRemove.id)
        if (index >= 0) {
          this.alerts.splice(index, 1)
        }
      })
    }
  }
}

// Export singleton instance
export const alertSystem = new AlertSystem()

// Auto-initialize
if (typeof window !== 'undefined') {
  alertSystem.initialize().catch(console.error)
}

// Helper function to get days to expiry
function getDaysToExpiry(expiryDate: Date): number {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}