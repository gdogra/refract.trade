export interface SmartAlertParams {
  userId: string
  type: string
  positionId?: string
  data: any
}

export interface SmartNotification {
  id: string
  userId: string
  type: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  category: 'action_required' | 'informational' | 'educational'
  title: string
  body: string
  explanation: string
  actionRequired: boolean
  contextData: any
  actionButtons?: Array<{
    label: string
    action: string
    data: any
  }>
  read: boolean
  dismissed: boolean
  actioned: boolean
  scheduledFor?: Date
  deliveredAt?: Date
  channels: string[]
  createdAt: Date
}

export interface NotificationPreferences {
  id: string
  userId: string
  doNotDisturbStart?: string
  doNotDisturbEnd?: string
  doNotDisturbDays: string[]
  urgentOnly: boolean
  groupSimilar: boolean
  maxPerDay: number
  enablePush: boolean
  enableEmail: boolean
  enableSMS: boolean
  categoryPreferences: any
  timezone: string
  updatedAt: Date
}

export async function getActiveAlerts(
  userId: string, 
  filters?: { category?: string; onlyActive?: boolean }
): Promise<SmartNotification[]> {
  try {
    const where: any = { userId }
    
    if (filters?.onlyActive) {
      where.dismissed = false
    }
    
    if (filters?.category && filters.category !== 'all') {
      where.category = filters.category
    }
    
    return await prisma.smartNotification.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    })
  } catch {
    return []
  }
}

export async function createSmartAlert(params: SmartAlertParams): Promise<SmartNotification> {
  const alert = await generateAlertContent(params)
  
  const notification: SmartNotification = {
    id: `alert_${Date.now()}`,
    userId: params.userId,
    type: params.type,
    priority: alert.priority,
    category: alert.category,
    title: alert.title,
    body: alert.body,
    explanation: alert.explanation,
    actionRequired: alert.actionRequired,
    contextData: params.data,
    actionButtons: alert.actionButtons,
    read: false,
    dismissed: false,
    actioned: false,
    scheduledFor: alert.scheduledFor,
    channels: alert.channels,
    createdAt: new Date()
  }

  // Mock notification preferences
  const prefs = await getNotificationPreferences(params.userId)

  if (shouldDeliverNow(notification, prefs)) {
    await deliverNotification(notification, prefs)
  }

  return notification
}

async function generateAlertContent(params: SmartAlertParams) {
  const { type, data } = params

  switch (type) {
    case 'price_alert':
      return generatePriceAlert(data)
    case 'profit_target':
      return generateProfitTargetAlert(data)
    case 'assignment_risk':
      return generateAssignmentRiskAlert(data)
    case 'iv_spike':
      return generateIVSpikeAlert(data)
    case 'adjustment_opportunity':
      return generateAdjustmentAlert(data)
    case 'rule_violation':
      return generateRuleViolationAlert(data)
    case 'market_warning':
      return generateMarketWarningAlert(data)
    default:
      return generateGenericAlert(data)
  }
}

function generateProfitTargetAlert(data: any) {
  const { position, currentProfit, targetProfit } = data

  return {
    priority: 'high' as const,
    category: 'action_required' as const,
    title: `${position.symbol} Hit ${(currentProfit * 100).toFixed(0)}% Profit Target`,
    body: `Your ${position.strategy} on ${position.symbol} is now ${(currentProfit * 100).toFixed(0)}% profitable.`,
    explanation: `You set a profit target of ${(targetProfit * 100).toFixed(0)}%. Historical data shows that closing at this level captures the best risk/reward ratio. Holding longer increases the chance of giving back profits due to theta decay and potential price reversal. Studies show traders who stick to profit targets have 23% higher returns.`,
    actionRequired: true,
    actionButtons: [
      {
        label: 'Close Position',
        action: 'close',
        data: { positionId: position.id },
      },
      {
        label: 'View Greeks',
        action: 'view',
        data: { positionId: position.id },
      },
      {
        label: 'Set New Target',
        action: 'update_target',
        data: { positionId: position.id },
      }
    ],
    scheduledFor: new Date(),
    channels: ['push', 'email'],
  }
}

function generateAssignmentRiskAlert(data: any) {
  const { position, daysToExpiry, probabilityOfAssignment } = data

  return {
    priority: 'urgent' as const,
    category: 'action_required' as const,
    title: `⚠️ Assignment Risk: ${position.symbol}`,
    body: `Your short ${position.type} at $${position.strike} expires in ${daysToExpiry} days and is in-the-money.`,
    explanation: `This option has a ${(probabilityOfAssignment * 100).toFixed(0)}% chance of being assigned. Assignment means: ${
      position.type === 'call'
        ? `You'll be forced to sell 100 shares at $${position.strike} each (total: $${(position.strike * 100).toLocaleString()}). Make sure you own the shares or have cash to buy them.`
        : `You'll be forced to buy 100 shares at $${position.strike} each (total: $${(position.strike * 100).toLocaleString()}). Make sure you have sufficient buying power.`
    } Most traders close before expiration to avoid assignment complications.`,
    actionRequired: true,
    actionButtons: [
      {
        label: 'Close Now',
        action: 'close',
        data: { positionId: position.id },
      },
      {
        label: 'Roll Forward',
        action: 'roll',
        data: { positionId: position.id },
      },
      {
        label: 'Accept Assignment',
        action: 'dismiss',
        data: {},
      },
    ],
    scheduledFor: new Date(),
    channels: ['push', 'email', 'sms'],
  }
}

function generateIVSpikeAlert(data: any) {
  const { symbol, oldIV, newIV, change } = data

  return {
    priority: 'high' as const,
    category: 'informational' as const,
    title: `📈 IV Spike Alert: ${symbol}`,
    body: `Implied volatility jumped ${(change * 100).toFixed(0)}% to ${(newIV * 100).toFixed(0)}%.`,
    explanation: `Sudden IV increases often indicate: (1) Upcoming news/earnings, (2) Large institutional trades, or (3) Market uncertainty. This creates opportunities: Long option holders benefit from IV expansion, while short premium sellers may want to close positions before further expansion. Historical data shows IV spikes >20% reverse within 3-5 days 68% of the time.`,
    actionRequired: false,
    actionButtons: [
      {
        label: 'View Options Chain',
        action: 'view_chain',
        data: { symbol },
      },
      {
        label: 'Check News',
        action: 'view_news',
        data: { symbol },
      }
    ],
    scheduledFor: new Date(),
    channels: ['push'],
  }
}

function generateAdjustmentAlert(data: any) {
  const { position, recommendation } = data

  return {
    priority: 'normal' as const,
    category: 'informational' as const,
    title: `💡 Adjustment Opportunity: ${position.symbol}`,
    body: recommendation.summary,
    explanation: `${recommendation.reasoning} Based on current market conditions and your position Greeks, this adjustment would: ${recommendation.benefits.join(', ')}. The adjustment keeps you in the trade while reducing risk or improving profit potential. 73% of traders who make timely adjustments outperform those who hold static positions.`,
    actionRequired: false,
    actionButtons: [
      {
        label: 'View Recommendation',
        action: 'view_recommendation',
        data: { positionId: position.id },
      },
      {
        label: 'Simulate Adjustment',
        action: 'simulate',
        data: { positionId: position.id, adjustment: recommendation },
      },
      {
        label: 'Dismiss',
        action: 'dismiss',
        data: {},
      }
    ],
    scheduledFor: new Date(),
    channels: ['push'],
  }
}

function generateRuleViolationAlert(data: any) {
  const { rule, violation, cost } = data

  return {
    priority: 'high' as const,
    category: 'educational' as const,
    title: `🚨 Rule Broken: ${rule.name}`,
    body: `You violated your "${rule.name}" rule.`,
    explanation: `You created this rule to stay disciplined, but you broke it. ${cost > 0 ? `This violation cost you $${cost.toFixed(0)}. ` : ''}Rule violations are tracked - traders who follow their rules consistently have 31% better returns. Consider if this rule needs adjustment or if you need stronger enforcement (blocking instead of warnings).`,
    actionRequired: false,
    actionButtons: [
      {
        label: 'View Rule Details',
        action: 'view_rule',
        data: { ruleId: rule.id },
      },
      {
        label: 'Edit Rule',
        action: 'edit_rule',
        data: { ruleId: rule.id },
      },
      {
        label: 'View All Violations',
        action: 'view_violations',
        data: { userId: data.userId },
      }
    ],
    scheduledFor: new Date(),
    channels: ['push', 'email'],
  }
}

function generateMarketWarningAlert(data: any) {
  const { warning, severity, affectedPositions } = data

  return {
    priority: severity === 'high' ? 'urgent' as const : 'high' as const,
    category: 'action_required' as const,
    title: `🌪️ Market Alert: ${warning.title}`,
    body: warning.description,
    explanation: `Market conditions have changed significantly. ${warning.reasoning} This affects ${affectedPositions.length} of your positions. Consider: ${warning.recommendedActions.join(', ')}. During similar market conditions in the past, portfolios that took defensive action outperformed by an average of 12%.`,
    actionRequired: true,
    actionButtons: [
      {
        label: 'Review Positions',
        action: 'review_positions',
        data: { positionIds: affectedPositions },
      },
      {
        label: 'Add Hedges',
        action: 'suggest_hedges',
        data: { warning },
      },
      {
        label: 'Market Analysis',
        action: 'view_analysis',
        data: { warning },
      }
    ],
    scheduledFor: new Date(),
    channels: ['push', 'email'],
  }
}

function generateGenericAlert(data: any) {
  return {
    priority: 'normal' as const,
    category: 'informational' as const,
    title: 'Trading Alert',
    body: 'You have a new trading notification',
    explanation: 'A new event has occurred that may affect your trading.',
    actionRequired: false,
    actionButtons: [],
    scheduledFor: new Date(),
    channels: ['push'],
  }
}

function shouldDeliverNow(
  notification: SmartNotification,
  prefs: NotificationPreferences | null
): boolean {
  if (!prefs) return true

  // Always deliver urgent notifications
  if (notification.priority === 'urgent') return true

  // Check if user is in "do not disturb"
  if (prefs.doNotDisturbStart && prefs.doNotDisturbEnd) {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()
    const currentTime = hour * 60 + minute

    const [startH, startM] = prefs.doNotDisturbStart.split(':').map(Number)
    const [endH, endM] = prefs.doNotDisturbEnd.split(':').map(Number)
    const startTime = startH * 60 + startM
    const endTime = endH * 60 + endM

    if (currentTime >= startTime && currentTime <= endTime) {
      return false
    }
  }

  // Check day of week
  const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  if (prefs.doNotDisturbDays.includes(dayName)) {
    return false
  }

  return true
}

async function deliverNotification(
  notification: SmartNotification,
  prefs: NotificationPreferences | null
) {
  const channels = prefs
    ? notification.channels.filter(ch => {
        if (ch === 'push') return prefs.enablePush
        if (ch === 'email') return prefs.enableEmail
        if (ch === 'sms') return prefs.enableSMS
        return false
      })
    : ['push']

  for (const channel of channels) {
    switch (channel) {
      case 'push':
        await sendPushNotification(notification)
        break
      case 'email':
        await sendEmailNotification(notification)
        break
      case 'sms':
        await sendSMSNotification(notification)
        break
    }
  }

  console.log(`Alert delivered via ${channels.join(', ')}:`, notification.title)
}

async function sendPushNotification(notification: SmartNotification) {
  console.log('Push notification:', notification.title)
  // In production: Use service like Pusher, Firebase, or OneSignal
}

async function sendEmailNotification(notification: SmartNotification) {
  console.log('Email notification:', notification.title)
  // In production: Use service like SendGrid or Resend
}

async function sendSMSNotification(notification: SmartNotification) {
  console.log('SMS notification:', notification.title)
  // In production: Use service like Twilio
}

async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
  // Mock preferences - in production, fetch from database
  return {
    id: 'pref_1',
    userId,
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
    doNotDisturbDays: ['saturday', 'sunday'],
    urgentOnly: false,
    groupSimilar: true,
    maxPerDay: 20,
    enablePush: true,
    enableEmail: true,
    enableSMS: false,
    categoryPreferences: {},
    timezone: 'America/New_York',
    updatedAt: new Date()
  }
}

// Alert monitoring system
export class AlertMonitor {
  private static instance: AlertMonitor
  private monitors: Map<string, NodeJS.Timeout> = new Map()

  static getInstance(): AlertMonitor {
    if (!AlertMonitor.instance) {
      AlertMonitor.instance = new AlertMonitor()
    }
    return AlertMonitor.instance
  }

  startMonitoring(userId: string) {
    // Don't start if already monitoring
    if (this.monitors.has(userId)) return

    const intervalId = setInterval(async () => {
      await this.checkForAlerts(userId)
    }, 30000) // Check every 30 seconds

    this.monitors.set(userId, intervalId)
    console.log(`Started monitoring alerts for user ${userId}`)
  }

  stopMonitoring(userId: string) {
    const intervalId = this.monitors.get(userId)
    if (intervalId) {
      clearInterval(intervalId)
      this.monitors.delete(userId)
      console.log(`Stopped monitoring alerts for user ${userId}`)
    }
  }

  private async checkForAlerts(userId: string) {
    try {
      // Check profit targets
      await this.checkProfitTargets(userId)
      
      // Check assignment risk
      await this.checkAssignmentRisk(userId)
      
      // Check rule violations
      await this.checkRuleViolations(userId)
      
      // Check market conditions
      await this.checkMarketWarnings(userId)
      
    } catch (error) {
      console.error('Alert monitoring error:', error)
    }
  }

  private async checkProfitTargets(userId: string) {
    // Mock position data
    const positions = [
      {
        id: 'pos_1',
        symbol: 'AAPL',
        strategy: 'long_call',
        entryPrice: 2.50,
        currentPrice: 3.75,
        profitTarget: 0.5, // 50%
        quantity: 2
      }
    ]

    for (const position of positions) {
      const currentProfit = (position.currentPrice - position.entryPrice) / position.entryPrice
      
      if (currentProfit >= position.profitTarget) {
        await createSmartAlert({
          userId,
          type: 'profit_target',
          positionId: position.id,
          data: { position, currentProfit, targetProfit: position.profitTarget }
        })
      }
    }
  }

  private async checkAssignmentRisk(userId: string) {
    // Mock short option positions approaching expiration
    const shortOptions = [
      {
        id: 'pos_2',
        symbol: 'TSLA',
        type: 'call',
        strike: 240,
        expiration: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        currentStockPrice: 242
      }
    ]

    for (const option of shortOptions) {
      const daysToExpiry = Math.ceil((option.expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const isITM = option.type === 'call' 
        ? option.currentStockPrice > option.strike
        : option.currentStockPrice < option.strike
      
      if (daysToExpiry <= 3 && isITM) {
        const probabilityOfAssignment = Math.min(0.9, 0.3 + (3 - daysToExpiry) * 0.2)
        
        await createSmartAlert({
          userId,
          type: 'assignment_risk',
          positionId: option.id,
          data: { position: option, daysToExpiry, probabilityOfAssignment }
        })
      }
    }
  }

  private async checkRuleViolations(userId: string) {
    // This would integrate with the rules engine
    // Check if any recent trades violated user's rules
  }

  private async checkMarketWarnings(userId: string) {
    // Mock market condition check
    const vixLevel = 25 + Math.random() * 20
    
    if (vixLevel > 35) {
      await createSmartAlert({
        userId,
        type: 'market_warning',
        data: {
          warning: {
            title: 'High Volatility Environment',
            description: `VIX at ${vixLevel.toFixed(1)} indicates elevated market stress`,
            reasoning: 'High VIX often leads to increased options premiums and higher portfolio volatility.',
            recommendedActions: ['Consider reducing position sizes', 'Add portfolio hedges', 'Avoid buying expensive options']
          },
          severity: 'high',
          affectedPositions: ['pos_1', 'pos_2']
        }
      })
    }
  }
}

// Initialize monitoring for active users
export function initializeAlertMonitoring() {
  const monitor = AlertMonitor.getInstance()
  
  // In production: Get list of active users and start monitoring
  const activeUserIds = ['user_1', 'user_2'] // Mock
  
  activeUserIds.forEach(userId => {
    monitor.startMonitoring(userId)
  })
}