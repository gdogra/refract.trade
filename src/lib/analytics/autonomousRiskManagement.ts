/**
 * Autonomous Risk Management Protection System
 * 
 * Not auto-trading. Auto-protection.
 * The single feature most likely to create a unicorn.
 * 
 * Users feel protected, not exploited.
 */

export interface RiskProtectionSettings {
  enableAutoProtection: boolean
  maxPortfolioRisk: number
  maxDrawdown: number
  maxPositionSize: number
  maxSectorConcentration: number
  maxCorrelation: number
  emergencyHedgeThreshold: number
  autoHedgeEnabled: boolean
  notifications: RiskNotificationSettings
}

export interface RiskNotificationSettings {
  riskBreachAlerts: boolean
  hedgeRecommendations: boolean
  positionSizeWarnings: boolean
  correlationAlerts: boolean
  volatilitySpikes: boolean
  liquidityDegradation: boolean
}

export interface ProtectionAction {
  id: string
  type: 'limit_enforcement' | 'emergency_hedge' | 'position_reduction' | 'risk_alert' | 'auto_close'
  trigger: string
  description: string
  cost: number
  riskReduction: number
  urgency: 'critical' | 'high' | 'medium' | 'low'
  autoExecutable: boolean
  userApprovalRequired: boolean
  timeToExecute: string
  expiresAt?: Date
}

export interface RiskBreach {
  type: 'portfolio_risk' | 'position_size' | 'drawdown' | 'correlation' | 'sector_concentration'
  currentValue: number
  limit: number
  severity: 'warning' | 'breach' | 'critical'
  protectionRequired: boolean
  recommendedAction: string
}

/**
 * Autonomous Risk Protection Engine
 */
export class AutonomousRiskProtectionEngine {
  private settings: RiskProtectionSettings
  private protectionHistory: ProtectionAction[] = []
  private activeBreaches: RiskBreach[] = []

  constructor(settings: RiskProtectionSettings) {
    this.settings = settings
  }

  /**
   * Continuous risk monitoring and protection
   */
  async monitorAndProtect(
    portfolioContext: any,
    marketConditions: any
  ): Promise<ProtectionAction[]> {
    
    if (!this.settings.enableAutoProtection) return []

    const protections: ProtectionAction[] = []

    // Check for risk breaches
    const breaches = this.detectRiskBreaches(portfolioContext)
    this.activeBreaches = breaches

    // Generate protection actions for each breach
    for (const breach of breaches) {
      const protection = await this.generateProtectionAction(breach, portfolioContext, marketConditions)
      if (protection) protections.push(protection)
    }

    // Monitor market stress conditions
    const stressProtections = await this.monitorMarketStress(marketConditions, portfolioContext)
    protections.push(...stressProtections)

    // Check portfolio health continuously
    const healthProtections = await this.monitorPortfolioHealth(portfolioContext)
    protections.push(...healthProtections)

    return this.prioritizeProtections(protections)
  }

  /**
   * Detect various types of risk breaches
   */
  private detectRiskBreaches(portfolioContext: any): RiskBreach[] {
    const breaches: RiskBreach[] = []

    // Portfolio risk limit breach
    const portfolioRisk = portfolioContext.totalRisk / portfolioContext.totalCapital
    if (portfolioRisk > this.settings.maxPortfolioRisk) {
      breaches.push({
        type: 'portfolio_risk',
        currentValue: portfolioRisk,
        limit: this.settings.maxPortfolioRisk,
        severity: portfolioRisk > this.settings.maxPortfolioRisk * 1.2 ? 'critical' : 'breach',
        protectionRequired: true,
        recommendedAction: 'Reduce position sizes or add hedge protection'
      })
    }

    // Drawdown limit breach
    const currentDrawdown = Math.abs(portfolioContext.unrealizedPnL) / portfolioContext.totalCapital
    if (currentDrawdown > this.settings.maxDrawdown) {
      breaches.push({
        type: 'drawdown',
        currentValue: currentDrawdown,
        limit: this.settings.maxDrawdown,
        severity: currentDrawdown > this.settings.maxDrawdown * 1.5 ? 'critical' : 'breach',
        protectionRequired: true,
        recommendedAction: 'Close losing positions or add defensive hedges'
      })
    }

    // Sector concentration breach
    const maxSectorExposure = Math.max(...Object.values(portfolioContext.sectorExposures || {}))
    if (maxSectorExposure > this.settings.maxSectorConcentration) {
      breaches.push({
        type: 'sector_concentration',
        currentValue: maxSectorExposure,
        limit: this.settings.maxSectorConcentration,
        severity: maxSectorExposure > this.settings.maxSectorConcentration * 1.3 ? 'critical' : 'breach',
        protectionRequired: true,
        recommendedAction: 'Diversify into other sectors or reduce concentrated positions'
      })
    }

    return breaches
  }

  /**
   * Generate protection action for risk breach
   */
  private async generateProtectionAction(
    breach: RiskBreach,
    portfolioContext: any,
    marketConditions: any
  ): Promise<ProtectionAction | null> {
    
    switch (breach.type) {
      case 'portfolio_risk':
        return this.generatePortfolioRiskProtection(breach, portfolioContext)
        
      case 'drawdown':
        return this.generateDrawdownProtection(breach, portfolioContext)
        
      case 'sector_concentration':
        return this.generateDiversificationProtection(breach, portfolioContext)
        
      default:
        return null
    }
  }

  /**
   * Generate portfolio risk protection action
   */
  private generatePortfolioRiskProtection(
    breach: RiskBreach,
    portfolioContext: any
  ): ProtectionAction {
    
    const excessRisk = (breach.currentValue - breach.limit) * portfolioContext.totalCapital
    const reductionNeeded = excessRisk / portfolioContext.totalRisk
    
    return {
      id: `risk-protection-${Date.now()}`,
      type: 'position_reduction',
      trigger: 'Portfolio risk exceeded limit',
      description: `Your portfolio risk (${(breach.currentValue * 100).toFixed(1)}%) exceeded your ${(breach.limit * 100).toFixed(1)}% limit. Recommend reducing position sizes by ${(reductionNeeded * 100).toFixed(0)}% to restore compliance.`,
      cost: excessRisk * 0.1, // Estimated slippage cost
      riskReduction: reductionNeeded,
      urgency: breach.severity === 'critical' ? 'critical' : 'high',
      autoExecutable: this.settings.autoHedgeEnabled && breach.severity !== 'critical',
      userApprovalRequired: breach.severity === 'critical',
      timeToExecute: '10-15 minutes',
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours
    }
  }

  /**
   * Generate drawdown protection action
   */
  private generateDrawdownProtection(
    breach: RiskBreach,
    portfolioContext: any
  ): ProtectionAction {
    
    const hedgeCost = portfolioContext.totalCapital * 0.015 // 1.5% for hedge
    const protectionValue = portfolioContext.totalCapital * 0.10 // 10% protection
    
    return {
      id: `drawdown-protection-${Date.now()}`,
      type: 'emergency_hedge',
      trigger: 'Drawdown limit exceeded',
      description: `Portfolio drawdown (${(breach.currentValue * 100).toFixed(1)}%) exceeded your ${(breach.limit * 100).toFixed(1)}% tolerance. Recommend SPY put hedge costing $${hedgeCost.toLocaleString()} for $${protectionValue.toLocaleString()} downside protection.`,
      cost: hedgeCost,
      riskReduction: 0.6,
      urgency: 'critical',
      autoExecutable: this.settings.autoHedgeEnabled,
      userApprovalRequired: !this.settings.autoHedgeEnabled,
      timeToExecute: '5 minutes'
    }
  }

  /**
   * Generate diversification protection action
   */
  private generateDiversificationProtection(
    breach: RiskBreach,
    portfolioContext: any
  ): ProtectionAction {
    
    const concentratedSector = this.findMostConcentratedSector(portfolioContext.sectorExposures)
    const reductionAmount = (breach.currentValue - breach.limit) * portfolioContext.totalCapital
    
    return {
      id: `diversification-protection-${Date.now()}`,
      type: 'position_reduction',
      trigger: 'Sector concentration exceeded limit',
      description: `${concentratedSector} sector concentration (${(breach.currentValue * 100).toFixed(0)}%) exceeded ${(breach.limit * 100).toFixed(0)}% limit. Recommend reducing ${concentratedSector} exposure by $${reductionAmount.toLocaleString()}.`,
      cost: reductionAmount * 0.05, // 5% trading cost
      riskReduction: 0.3,
      urgency: 'medium',
      autoExecutable: false, // Sector rebalancing requires user approval
      userApprovalRequired: true,
      timeToExecute: '30 minutes'
    }
  }

  /**
   * Monitor market stress conditions for automatic protection
   */
  private async monitorMarketStress(
    marketConditions: any,
    portfolioContext: any
  ): Promise<ProtectionAction[]> {
    
    const protections: ProtectionAction[] = []

    // VIX spike protection
    if (marketConditions.vixChange > 0.20) {
      protections.push({
        id: `vix-protection-${Date.now()}`,
        type: 'emergency_hedge',
        trigger: 'VIX spike detected',
        description: `VIX spiked ${(marketConditions.vixChange * 100).toFixed(0)}% today. Your short vol positions are at risk. Recommend closing iron condors and credit spreads or adding VIX call hedge.`,
        cost: portfolioContext.shortVolRisk * 0.15,
        riskReduction: 0.8,
        urgency: 'critical',
        autoExecutable: this.settings.autoHedgeEnabled,
        userApprovalRequired: false,
        timeToExecute: 'Immediate'
      })
    }

    // Market crash protection
    if (marketConditions.spyChange < -0.03) {
      protections.push({
        id: `crash-protection-${Date.now()}`,
        type: 'emergency_hedge',
        trigger: 'Market selloff detected',
        description: `Market dropped ${(Math.abs(marketConditions.spyChange) * 100).toFixed(1)}% today. Consider adding SPY put protection before further decline.`,
        cost: portfolioContext.totalCapital * 0.02,
        riskReduction: 0.6,
        urgency: 'high',
        autoExecutable: this.settings.autoHedgeEnabled,
        userApprovalRequired: false,
        timeToExecute: '15 minutes'
      })
    }

    return protections
  }

  /**
   * Monitor portfolio health for automatic interventions
   */
  private async monitorPortfolioHealth(portfolioContext: any): Promise<ProtectionAction[]> {
    const protections: ProtectionAction[] = []

    // Delta exposure protection
    const deltaExposure = Math.abs(portfolioContext.greeksExposures.delta) / portfolioContext.deployedCapital
    if (deltaExposure > 0.02) {
      protections.push({
        id: `delta-protection-${Date.now()}`,
        type: 'emergency_hedge',
        trigger: 'Excessive directional exposure',
        description: `Portfolio delta exposure (${(deltaExposure * 100).toFixed(1)}%) is creating significant directional risk. Recommend delta hedge with ${portfolioContext.greeksExposures.delta > 0 ? 'SPY puts' : 'SPY calls'}.`,
        cost: 300,
        riskReduction: 0.7,
        urgency: 'high',
        autoExecutable: this.settings.autoHedgeEnabled,
        userApprovalRequired: false,
        timeToExecute: '10 minutes'
      })
    }

    // Gamma explosion protection
    const gammaRisk = Math.abs(portfolioContext.greeksExposures.gamma)
    if (gammaRisk > 500 && portfolioContext.daysToNearestExpiration < 7) {
      protections.push({
        id: `gamma-protection-${Date.now()}`,
        type: 'position_reduction',
        trigger: 'Gamma explosion risk',
        description: `High gamma exposure (${gammaRisk.toFixed(0)}) with ${portfolioContext.daysToNearestExpiration} days to expiration. Risk of gamma explosion. Consider closing short gamma positions.`,
        cost: 400,
        riskReduction: 0.8,
        urgency: 'critical',
        autoExecutable: false, // Gamma risk requires human judgment
        userApprovalRequired: true,
        timeToExecute: '30 minutes'
      })
    }

    // Liquidity degradation protection
    if (portfolioContext.avgLiquidityScore < 0.6) {
      protections.push({
        id: `liquidity-protection-${Date.now()}`,
        type: 'risk_alert',
        trigger: 'Liquidity deterioration',
        description: `Portfolio liquidity score dropped to ${(portfolioContext.avgLiquidityScore * 100).toFixed(0)}%. Positions may be difficult to exit in stress conditions. Consider reducing position sizes in illiquid names.`,
        cost: 0,
        riskReduction: 0.3,
        urgency: 'medium',
        autoExecutable: false,
        userApprovalRequired: false,
        timeToExecute: 'Next trading session'
      })
    }

    return protections
  }

  /**
   * Execute protection action based on settings and urgency
   */
  async executeProtection(action: ProtectionAction): Promise<ProtectionExecutionResult> {
    
    // Safety checks
    const safetyCheck = this.performProtectionSafetyChecks(action)
    if (!safetyCheck.safe) {
      return {
        success: false,
        message: safetyCheck.reason!,
        actionTaken: 'none'
      }
    }

    // Auto-execution for eligible actions
    if (action.autoExecutable && this.settings.enableAutoProtection) {
      return await this.autonomousProtectionExecution(action)
    }

    // Queue for user approval
    return {
      success: true,
      message: `Protection action queued for user approval: ${action.description}`,
      actionTaken: 'queued_for_approval'
    }
  }

  /**
   * Autonomous protection execution with safety rails
   */
  private async autonomousProtectionExecution(action: ProtectionAction): Promise<ProtectionExecutionResult> {
    
    try {
      // Log protection action
      this.protectionHistory.push({
        ...action,
        id: `executed-${action.id}`,
        timeToExecute: new Date().toISOString()
      })

      switch (action.type) {
        case 'emergency_hedge':
          return await this.executeEmergencyHedge(action)
          
        case 'position_reduction':
          return await this.executePositionReduction(action)
          
        case 'auto_close':
          return await this.executeAutoClose(action)
          
        default:
          return {
            success: true,
            message: `Risk alert triggered: ${action.description}`,
            actionTaken: 'alert_sent'
          }
      }
      
    } catch (error) {
      return {
        success: false,
        message: `Protection execution failed: ${(error as Error).message}`,
        actionTaken: 'failed'
      }
    }
  }

  /**
   * Execute emergency hedge protection
   */
  private async executeEmergencyHedge(action: ProtectionAction): Promise<ProtectionExecutionResult> {
    // Mock hedge execution - would integrate with broker API
    const hedgeDetails = {
      symbol: 'SPY',
      strategy: 'Put Spread',
      cost: action.cost,
      protection: action.cost * 5, // 5:1 protection ratio
      expiration: '30 DTE'
    }

    // Simulate execution
    await this.simulateOrder(hedgeDetails)

    return {
      success: true,
      message: `🛡️ AUTO-PROTECTION: Added ${hedgeDetails.strategy} hedge on ${hedgeDetails.symbol} for $${hedgeDetails.cost.toLocaleString()}. Portfolio now protected against $${hedgeDetails.protection.toLocaleString()} downside.`,
      actionTaken: 'hedge_executed',
      details: hedgeDetails
    }
  }

  /**
   * Execute position reduction protection
   */
  private async executePositionReduction(action: ProtectionAction): Promise<ProtectionExecutionResult> {
    // Mock position reduction - would integrate with broker API
    const reductionDetails = {
      positionsReduced: 2,
      totalRiskReduction: action.riskReduction * 10000,
      slippageCost: action.cost
    }

    // Simulate execution
    await this.simulatePositionReduction(reductionDetails)

    return {
      success: true,
      message: `🛡️ AUTO-PROTECTION: Reduced position sizes to comply with risk limits. Risk reduced by $${reductionDetails.totalRiskReduction.toLocaleString()}.`,
      actionTaken: 'positions_reduced',
      details: reductionDetails
    }
  }

  /**
   * Execute automatic position closure
   */
  private async executeAutoClose(action: ProtectionAction): Promise<ProtectionExecutionResult> {
    // Mock auto-close execution
    const closeDetails = {
      positionsClosed: 1,
      realizedPnL: -1200, // Example loss
      riskFreed: 2500
    }

    await this.simulateClose(closeDetails)

    return {
      success: true,
      message: `🛡️ AUTO-PROTECTION: Closed position to prevent further losses. Realized ${closeDetails.realizedPnL < 0 ? 'loss' : 'profit'}: $${Math.abs(closeDetails.realizedPnL).toLocaleString()}. Risk freed: $${closeDetails.riskFreed.toLocaleString()}.`,
      actionTaken: 'position_closed',
      details: closeDetails
    }
  }

  /**
   * Safety checks for protection execution
   */
  private performProtectionSafetyChecks(action: ProtectionAction): { safe: boolean; reason?: string } {
    
    // Check if protection action is too expensive
    const costThreshold = 0.05 // 5% of portfolio
    if (action.cost > costThreshold * 50000) { // Mock portfolio size
      return {
        safe: false,
        reason: `Protection cost ($${action.cost.toLocaleString()}) exceeds safety threshold`
      }
    }

    // Check for conflicting actions
    const recentActions = this.protectionHistory.filter(
      h => Date.now() - new Date(h.timeToExecute).getTime() < 60 * 60 * 1000 // Last hour
    )
    
    if (recentActions.some(h => h.type === action.type)) {
      return {
        safe: false,
        reason: 'Similar protection action executed recently - avoid over-hedging'
      }
    }

    // Check market hours (no execution outside market hours)
    const marketHours = this.isMarketHours()
    if (!marketHours && action.type !== 'risk_alert') {
      return {
        safe: false,
        reason: 'Cannot execute protection outside market hours'
      }
    }

    return { safe: true }
  }

  /**
   * Prioritize protection actions by urgency and impact
   */
  private prioritizeProtections(protections: ProtectionAction[]): ProtectionAction[] {
    const urgencyOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 }
    
    return protections.sort((a, b) => {
      // First sort by urgency
      const urgencyDiff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
      if (urgencyDiff !== 0) return urgencyDiff
      
      // Then by risk reduction potential
      return b.riskReduction - a.riskReduction
    })
  }

  /**
   * Generate user-friendly protection summary
   */
  generateProtectionSummary(protections: ProtectionAction[]): ProtectionSummary {
    const critical = protections.filter(p => p.urgency === 'critical')
    const autoExecuted = protections.filter(p => p.autoExecutable)
    const totalProtectionCost = protections.reduce((sum, p) => sum + p.cost, 0)
    const totalRiskReduction = protections.reduce((sum, p) => sum + p.riskReduction, 0)

    return {
      activeProtections: protections.length,
      criticalActions: critical.length,
      autoExecutedActions: autoExecuted.length,
      totalProtectionCost,
      totalRiskReduction,
      nextAction: protections[0]?.description || 'No immediate protection required',
      healthStatus: this.calculateHealthStatus(protections)
    }
  }

  /**
   * Calculate overall portfolio health status
   */
  private calculateHealthStatus(protections: ProtectionAction[]): 'excellent' | 'good' | 'caution' | 'critical' {
    const criticalCount = protections.filter(p => p.urgency === 'critical').length
    const highCount = protections.filter(p => p.urgency === 'high').length
    
    if (criticalCount > 0) return 'critical'
    if (highCount > 2) return 'caution'
    if (highCount > 0) return 'good'
    return 'excellent'
  }

  /**
   * Helper methods
   */
  private findMostConcentratedSector(sectorExposures: Record<string, number>): string {
    return Object.entries(sectorExposures).reduce((max, [sector, exposure]) => 
      exposure > (sectorExposures[max] || 0) ? sector : max
    , Object.keys(sectorExposures)[0])
  }

  private isMarketHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    
    // Simple market hours check (9:30 AM - 4:00 PM ET, Mon-Fri)
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 16
  }

  private async simulateOrder(orderDetails: any): Promise<void> {
    // Mock order execution
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  private async simulatePositionReduction(details: any): Promise<void> {
    // Mock position reduction
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  private async simulateClose(details: any): Promise<void> {
    // Mock position closure
    await new Promise(resolve => setTimeout(resolve, 800))
  }
}

export interface ProtectionExecutionResult {
  success: boolean
  message: string
  actionTaken: 'hedge_executed' | 'positions_reduced' | 'position_closed' | 'alert_sent' | 'queued_for_approval' | 'none' | 'failed'
  details?: any
}

export interface ProtectionSummary {
  activeProtections: number
  criticalActions: number
  autoExecutedActions: number
  totalProtectionCost: number
  totalRiskReduction: number
  nextAction: string
  healthStatus: 'excellent' | 'good' | 'caution' | 'critical'
}

/**
 * Smart Risk Limit Engine
 * Dynamically adjusts risk limits based on market conditions
 */
export class SmartRiskLimitEngine {
  
  /**
   * Dynamically adjust risk limits based on market volatility
   */
  static adjustRiskLimitsForMarketConditions(
    baseSettings: RiskProtectionSettings,
    marketConditions: any
  ): RiskProtectionSettings {
    
    const adjustedSettings = { ...baseSettings }
    
    // Tighten limits during high volatility
    if (marketConditions.vixLevel > 25) {
      adjustedSettings.maxPortfolioRisk *= 0.8
      adjustedSettings.maxPositionSize *= 0.7
      adjustedSettings.emergencyHedgeThreshold *= 0.5
    }
    
    // Tighten limits during market stress
    if (marketConditions.marketStress === 'high') {
      adjustedSettings.maxDrawdown *= 0.7
      adjustedSettings.maxCorrelation *= 0.8
    }
    
    // Relax limits during calm markets
    if (marketConditions.vixLevel < 15 && marketConditions.marketStress === 'low') {
      adjustedSettings.maxPortfolioRisk *= 1.1
      adjustedSettings.maxPositionSize *= 1.2
    }
    
    return adjustedSettings
  }

  /**
   * Calculate dynamic position size based on market conditions
   */
  static calculateDynamicPositionSize(
    baseSize: number,
    marketConditions: any,
    portfolioContext: any
  ): DynamicSizingResult {
    
    let adjustmentFactor = 1.0
    const reasons: string[] = []

    // Volatility adjustment
    if (marketConditions.ivRank > 80) {
      adjustmentFactor *= 1.2
      reasons.push('High IV environment favors premium selling')
    } else if (marketConditions.ivRank < 20) {
      adjustmentFactor *= 0.8
      reasons.push('Low IV environment - reduce short vol exposure')
    }

    // Market stress adjustment
    if (marketConditions.marketStress === 'high') {
      adjustmentFactor *= 0.6
      reasons.push('Market stress requires smaller position sizes')
    }

    // Portfolio concentration adjustment
    const concentrationRisk = this.assessConcentrationRisk(portfolioContext)
    if (concentrationRisk > 0.5) {
      adjustmentFactor *= 0.7
      reasons.push('Portfolio concentration requires size reduction')
    }

    // Correlation adjustment
    const correlationRisk = this.assessCorrelationRisk(portfolioContext)
    if (correlationRisk > 0.7) {
      adjustmentFactor *= 0.8
      reasons.push('High correlation reduces effective diversification')
    }

    const adjustedSize = Math.max(1, Math.round(baseSize * adjustmentFactor))

    return {
      originalSize: baseSize,
      adjustedSize,
      adjustmentFactor,
      reasons,
      riskAdjustment: (adjustedSize - baseSize) / baseSize
    }
  }

  private static assessConcentrationRisk(portfolioContext: any): number {
    const sectorExposures = portfolioContext.sectorExposures || {}
    return Math.max(...Object.values(sectorExposures))
  }

  private static assessCorrelationRisk(portfolioContext: any): number {
    // Mock correlation assessment
    return 0.6 // Would calculate from actual correlation matrix
  }
}

export interface DynamicSizingResult {
  originalSize: number
  adjustedSize: number
  adjustmentFactor: number
  reasons: string[]
  riskAdjustment: number
}

/**
 * Protection Notification System
 * Communicates protection actions to users clearly
 */
export class ProtectionNotificationSystem {
  
  /**
   * Generate user-friendly protection message
   */
  static generateProtectionMessage(action: ProtectionAction): ProtectionMessage {
    
    const severity = this.getSeverityEmoji(action.urgency)
    const actionIcon = this.getActionIcon(action.type)
    
    return {
      title: `${severity} ${actionIcon} Auto-Protection Triggered`,
      message: action.description,
      plainEnglish: this.convertToPlainEnglish(action),
      actionRequired: action.userApprovalRequired,
      timeframe: action.timeToExecute,
      cost: action.cost,
      benefit: `${(action.riskReduction * 100).toFixed(0)}% risk reduction`
    }
  }

  private static convertToPlainEnglish(action: ProtectionAction): string {
    switch (action.type) {
      case 'emergency_hedge':
        return `We detected dangerous market conditions that could hurt your portfolio. We're recommending a protective trade that costs $${action.cost.toLocaleString()} but protects you from much larger losses. Think of it like insurance.`
        
      case 'position_reduction':
        return `Your positions have grown too risky for your settings. We want to make them smaller to keep you safe. This might cost some profit opportunity, but prevents you from losing more than you're comfortable with.`
        
      case 'auto_close':
        return `One of your trades is going badly and approaching your loss limit. We're closing it to prevent further damage to your account. Better to take a small loss than a big one.`
        
      case 'risk_alert':
        return `We noticed something that could become a problem if ignored. No immediate action needed, but worth paying attention to before it gets worse.`
        
      default:
        return action.description
    }
  }

  private static getSeverityEmoji(urgency: string): string {
    switch (urgency) {
      case 'critical': return '🚨'
      case 'high': return '⚠️'
      case 'medium': return '⚡'
      default: return 'ℹ️'
    }
  }

  private static getActionIcon(type: string): string {
    switch (type) {
      case 'emergency_hedge': return '🛡️'
      case 'position_reduction': return '📉'
      case 'auto_close': return '❌'
      case 'risk_alert': return '📊'
      default: return '🔧'
    }
  }
}

export interface ProtectionMessage {
  title: string
  message: string
  plainEnglish: string
  actionRequired: boolean
  timeframe: string
  cost: number
  benefit: string
}