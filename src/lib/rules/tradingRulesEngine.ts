import { prisma } from '@/lib/prisma'

export interface TradingRule {
  id: string
  userId: string
  name: string
  ruleType: string
  condition: any
  action: 'block' | 'warn' | 'require_reason'
  isActive: boolean
  priority: number
}

export interface RuleEvaluationContext {
  userId: string
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiration: string
  quantity: number
  action: 'buy' | 'sell'
  strategy?: string
  currentTime?: Date
}

export interface RuleViolation {
  ruleId: string
  ruleName: string
  severity: 'block' | 'warn'
  message: string
  details?: any
}

export interface RuleEngineResult {
  canProceed: boolean
  violations: RuleViolation[]
  blockers: RuleViolation[]
  warnings: RuleViolation[]
}

export class TradingRulesEngine {
  static async evaluateAllRules(
    context: RuleEvaluationContext
  ): Promise<RuleEngineResult> {
    const rules = await this.getUserRules(context.userId)
    const violations: RuleViolation[] = []

    for (const rule of rules) {
      if (!rule.isActive) continue

      const violation = await this.evaluateRule(rule, context)
      if (violation) {
        violations.push(violation)
      }
    }

    const blockers = violations.filter(v => v.severity === 'block')
    const warnings = violations.filter(v => v.severity === 'warn')

    return {
      canProceed: blockers?.length || 0) === 0,
      violations,
      blockers,
      warnings
    }
  }

  static async getUserRules(userId: string): Promise<TradingRule[]> {
    try {
      if (!prisma) return []
      const rules = await prisma.tradingRule.findMany({
        where: { userId, isActive: true },
        orderBy: { priority: 'desc' }
      })
      return rules.map(rule => ({
        ...rule,
        action: rule.action as 'block' | 'warn' | 'require_reason'
      }))
    } catch {
      return []
    }
  }

  static async evaluateRule(
    rule: TradingRule,
    context: RuleEvaluationContext
  ): Promise<RuleViolation | null> {
    const violated = await this.checkRuleCondition(rule, context)
    
    if (!violated) return null

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.action === 'block' ? 'block' : 'warn',
      message: this.generateViolationMessage(rule, context),
      details: { rule: rule.condition, context }
    }
  }

  static async checkRuleCondition(
    rule: TradingRule,
    context: RuleEvaluationContext
  ): Promise<boolean> {
    const condition = rule.condition

    switch (rule.ruleType) {
      case 'position_size':
        return this.checkPositionSizeRule(condition, context)
      
      case 'timing':
        return this.checkTimingRule(condition, context)
      
      case 'frequency':
        return await this.checkFrequencyRule(condition, context)
      
      case 'symbol':
        return this.checkSymbolRule(condition, context)
      
      case 'strategy':
        return this.checkStrategyRule(condition, context)
      
      case 'dte':
        return this.checkDTERule(condition, context)
      
      case 'iv_environment':
        return await this.checkIVEnvironmentRule(condition, context)
      
      case 'profit_loss':
        return await this.checkProfitLossRule(condition, context)
      
      default:
        return false
    }
  }

  static checkPositionSizeRule(condition: any, context: RuleEvaluationContext): boolean {
    const portfolioValue = 125000 // Mock - in production, fetch from user data
    const contractValue = 3.5 * context.quantity * 100 // Mock option price
    const positionSizePercent = (contractValue / portfolioValue) * 100

    if (condition.maxPositionSizePercent && positionSizePercent > condition.maxPositionSizePercent) {
      return true
    }

    if (condition.maxQuantity && context.quantity > condition.maxQuantity) {
      return true
    }

    return false
  }

  static checkTimingRule(condition: any, context: RuleEvaluationContext): boolean {
    const now = context.currentTime || new Date()
    
    if (condition.blockedDays && condition.blockedDays.includes(now.getDay())) {
      return true
    }

    if (condition.blockedHours) {
      const hour = now.getHours()
      if (condition.blockedHours.includes(hour)) {
        return true
      }
    }

    if (condition.marketHoursOnly) {
      const hour = now.getHours()
      const isMarketHours = hour >= 9 && hour < 16
      if (!isMarketHours) {
        return true
      }
    }

    return false
  }

  static async checkFrequencyRule(condition: any, context: RuleEvaluationContext): Promise<boolean> {
    if (condition.maxTradesPerDay) {
      const todayTradeCount = await this.getTodayTradeCount(context.userId)
      if (todayTradeCount >= condition.maxTradesPerDay) {
        return true
      }
    }

    if (condition.maxTradesPerSymbol) {
      const symbolTradeCount = await this.getTodaySymbolTradeCount(context.userId, context.symbol)
      if (symbolTradeCount >= condition.maxTradesPerSymbol) {
        return true
      }
    }

    if (condition.cooldownMinutes) {
      const lastTradeTime = await this.getLastTradeTime(context.userId, context.symbol)
      if (lastTradeTime) {
        const minutesSince = (Date.now() - lastTradeTime.getTime()) / (1000 * 60)
        if (minutesSince < condition.cooldownMinutes) {
          return true
        }
      }
    }

    return false
  }

  static checkSymbolRule(condition: any, context: RuleEvaluationContext): boolean {
    if (condition.blockedSymbols && condition.blockedSymbols.includes(context.symbol)) {
      return true
    }

    if (condition.allowedSymbols && !condition.allowedSymbols.includes(context.symbol)) {
      return true
    }

    return false
  }

  static checkStrategyRule(condition: any, context: RuleEvaluationContext): boolean {
    if (!context.strategy) return false

    if (condition.blockedStrategies && condition.blockedStrategies.includes(context.strategy)) {
      return true
    }

    if (condition.allowedStrategies && !condition.allowedStrategies.includes(context.strategy)) {
      return true
    }

    return false
  }

  static checkDTERule(condition: any, context: RuleEvaluationContext): boolean {
    const expDate = new Date(context.expiration)
    const now = context.currentTime || new Date()
    const dte = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (condition.minDTE && dte < condition.minDTE) {
      return true
    }

    if (condition.maxDTE && dte > condition.maxDTE) {
      return true
    }

    return false
  }

  static async checkIVEnvironmentRule(condition: any, context: RuleEvaluationContext): Promise<boolean> {
    const ivRank = Math.random() * 100 // Mock - in production, fetch real IV data

    if (condition.minIVRank && ivRank < condition.minIVRank && context.action === 'sell') {
      return true
    }

    if (condition.maxIVRank && ivRank > condition.maxIVRank && context.action === 'buy') {
      return true
    }

    return false
  }

  static async checkProfitLossRule(condition: any, context: RuleEvaluationContext): Promise<boolean> {
    const dailyPnL = await this.getDailyPnL(context.userId)

    if (condition.maxDailyLoss && dailyPnL < -Math.abs(condition.maxDailyLoss)) {
      return true
    }

    if (condition.stopAfterProfit && dailyPnL > condition.stopAfterProfit) {
      return true
    }

    return false
  }

  static generateViolationMessage(rule: TradingRule, context: RuleEvaluationContext): string {
    const condition = rule.condition

    switch (rule.ruleType) {
      case 'position_size':
        return `Position size exceeds limit: ${context.quantity} contracts`
      
      case 'timing':
        if (condition.blockedDays) {
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
          return `Trading blocked on ${dayName}`
        }
        if (condition.blockedHours) {
          return `Trading blocked during hour ${new Date().getHours()}`
        }
        return `Trading outside market hours`
      
      case 'frequency':
        if (condition.maxTradesPerDay) {
          return `Daily trade limit reached (${condition.maxTradesPerDay})`
        }
        if (condition.cooldownMinutes) {
          return `Must wait ${condition.cooldownMinutes} minutes between trades on ${context.symbol}`
        }
        return `Frequency limit exceeded`
      
      case 'symbol':
        return `${context.symbol} is blocked or not in allowed list`
      
      case 'strategy':
        return `Strategy "${context.strategy}" is not allowed`
      
      case 'dte':
        const expDate = new Date(context.expiration)
        const dte = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return `DTE ${dte} violates rule limits`
      
      case 'iv_environment':
        return `IV environment not suitable for ${context.action} orders`
      
      case 'profit_loss':
        return `Daily P&L limits reached`
      
      default:
        return `Rule "${rule.name}" violated`
    }
  }

  static async getTodayTradeCount(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    try {
      if (!prisma) return 0
      return await prisma.position.count({
        where: {
          userId,
          entryDate: { gte: today }
        }
      })
    } catch {
      return 0
    }
  }

  static async getTodaySymbolTradeCount(userId: string, symbol: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    try {
      if (!prisma) return 0
      return await prisma.position.count({
        where: {
          userId,
          symbol,
          entryDate: { gte: today }
        }
      })
    } catch {
      return 0
    }
  }

  static async getLastTradeTime(userId: string, symbol: string): Promise<Date | null> {
    try {
      if (!prisma) return null
      const lastTrade = await prisma.position.findFirst({
        where: { userId, symbol },
        orderBy: { entryDate: 'desc' },
        select: { entryDate: true }
      })
      return lastTrade?.entryDate || null
    } catch {
      return null
    }
  }

  static async getDailyPnL(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    try {
      if (!prisma) return 0
      const positions = await prisma.position.findMany({
        where: {
          userId,
          exitDate: { gte: today }
        },
        select: { realizedPnl: true }
      })
      
      return positions.reduce((sum: number, position: any) => sum + (position.realizedPnl || 0), 0)
    } catch {
      return 0
    }
  }

  static async createRule(
    userId: string,
    name: string,
    ruleType: string,
    condition: any,
    action: 'block' | 'warn' | 'require_reason',
    priority: number = 0
  ): Promise<TradingRule> {
    if (!prisma) throw new Error('Database not available')
    const rule = await prisma.tradingRule.create({
      data: {
        userId,
        name,
        ruleType,
        condition,
        action,
        priority,
        isActive: true
      }
    })
    
    return {
      ...rule,
      action: rule.action as 'block' | 'warn' | 'require_reason'
    }
  }

  static async updateRule(
    ruleId: string,
    updates: Partial<Pick<TradingRule, 'name' | 'condition' | 'action' | 'isActive' | 'priority'>>
  ): Promise<TradingRule> {
    if (!prisma) throw new Error('Database not available')
    const rule = await prisma.tradingRule.update({
      where: { id: ruleId },
      data: updates
    })
    return {
      ...rule,
      action: rule.action as 'block' | 'warn' | 'require_reason'
    }
  }

  static async deleteRule(ruleId: string): Promise<void> {
    if (!prisma) throw new Error('Database not available')
    await prisma.tradingRule.delete({
      where: { id: ruleId }
    })
  }

  static async logViolation(
    ruleId: string,
    userId: string,
    violationType: 'override' | 'blocked' | 'warning_ignored',
    overrideReason?: string,
    positionId?: string
  ): Promise<void> {
    if (!prisma) return
    await prisma.ruleViolation.create({
      data: {
        ruleId,
        userId,
        violationType,
        overrideReason,
        positionId,
        overridePassword: false
      }
    })
  }

  static getPresetRules(): Array<{
    name: string
    ruleType: string
    condition: any
    action: 'block' | 'warn'
    description: string
  }> {
    return [
      {
        name: 'No Friday Expiry Trading',
        ruleType: 'timing',
        condition: { blockedDays: [5] },
        action: 'warn',
        description: 'Warns against trading options that expire on Fridays'
      },
      {
        name: 'Max 5% Position Size',
        ruleType: 'position_size',
        condition: { maxPositionSizePercent: 5 },
        action: 'block',
        description: 'Blocks trades that would exceed 5% of portfolio'
      },
      {
        name: 'Revenge Trading Prevention',
        ruleType: 'frequency',
        condition: { cooldownMinutes: 30 },
        action: 'warn',
        description: 'Enforces 30-minute cooldown between trades on same symbol'
      },
      {
        name: 'Daily Trade Limit',
        ruleType: 'frequency',
        condition: { maxTradesPerDay: 5 },
        action: 'warn',
        description: 'Warns when approaching daily trade limit'
      },
      {
        name: 'Minimum DTE',
        ruleType: 'dte',
        condition: { minDTE: 7 },
        action: 'warn',
        description: 'Warns against trading options with less than 7 DTE'
      },
      {
        name: 'High IV Buy Warning',
        ruleType: 'iv_environment',
        condition: { maxIVRank: 70 },
        action: 'warn',
        description: 'Warns when buying options in high IV environment'
      },
      {
        name: 'Daily Loss Limit',
        ruleType: 'profit_loss',
        condition: { maxDailyLoss: 1000 },
        action: 'block',
        description: 'Blocks new trades after $1000 daily loss'
      },
      {
        name: 'Meme Stock Block',
        ruleType: 'symbol',
        condition: { blockedSymbols: ['GME', 'AMC', 'BBBY', 'SPCE'] },
        action: 'warn',
        description: 'Warns against trading highly volatile meme stocks'
      }
    ]
  }
}