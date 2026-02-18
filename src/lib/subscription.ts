export type SubscriptionTier = 'free' | 'pro' | 'elite' | 'enterprise'

export interface SubscriptionFeatures {
  // Data Access
  realTimeData: boolean
  delayedData: boolean
  historicalDepth: string // '1M', '1Y', '5Y', 'unlimited'
  
  // Recommendations
  dailyRecommendations: number
  scanLimit: number
  portfolioRecommendations: boolean
  
  // Analytics
  advancedGreeks: boolean
  volatilitySurface: boolean
  riskScenarios: boolean
  probabilityModeling: boolean
  
  // Tools
  strategyBuilder: boolean
  backtesting: boolean
  portfolioOptimization: boolean
  tradeJournaling: boolean
  
  // Alerts & Monitoring
  basicAlerts: boolean
  advancedAlerts: boolean
  riskMonitoring: boolean
  customAlerts: number
  
  // API & Integration
  apiAccess: boolean
  apiCallsPerMonth: number
  brokerIntegrations: string[] // ['td_ameritrade', 'schwab', 'ibkr']
  
  // Social & Community
  communityAccess: boolean
  postCreation: boolean
  followUsers: boolean
  leaderboards: boolean
  
  // Support
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated'
  responseTime: string // '48h', '24h', '4h', '1h'
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    realTimeData: false,
    delayedData: true,
    historicalDepth: '1M',
    dailyRecommendations: 3,
    scanLimit: 5,
    portfolioRecommendations: false,
    advancedGreeks: false,
    volatilitySurface: false,
    riskScenarios: false,
    probabilityModeling: false,
    strategyBuilder: true,
    backtesting: false,
    portfolioOptimization: false,
    tradeJournaling: true,
    basicAlerts: true,
    advancedAlerts: false,
    riskMonitoring: false,
    customAlerts: 3,
    apiAccess: false,
    apiCallsPerMonth: 0,
    brokerIntegrations: [],
    communityAccess: true,
    postCreation: true,
    followUsers: true,
    leaderboards: true,
    supportLevel: 'community',
    responseTime: '48h'
  },
  
  pro: {
    realTimeData: true,
    delayedData: true,
    historicalDepth: '1Y',
    dailyRecommendations: 25,
    scanLimit: -1, // unlimited
    portfolioRecommendations: true,
    advancedGreeks: true,
    volatilitySurface: false,
    riskScenarios: true,
    probabilityModeling: true,
    strategyBuilder: true,
    backtesting: true,
    portfolioOptimization: true,
    tradeJournaling: true,
    basicAlerts: true,
    advancedAlerts: true,
    riskMonitoring: true,
    customAlerts: 25,
    apiAccess: true,
    apiCallsPerMonth: 1000,
    brokerIntegrations: ['td_ameritrade', 'schwab'],
    communityAccess: true,
    postCreation: true,
    followUsers: true,
    leaderboards: true,
    supportLevel: 'email',
    responseTime: '24h'
  },
  
  elite: {
    realTimeData: true,
    delayedData: true,
    historicalDepth: '5Y',
    dailyRecommendations: -1, // unlimited
    scanLimit: -1, // unlimited
    portfolioRecommendations: true,
    advancedGreeks: true,
    volatilitySurface: true,
    riskScenarios: true,
    probabilityModeling: true,
    strategyBuilder: true,
    backtesting: true,
    portfolioOptimization: true,
    tradeJournaling: true,
    basicAlerts: true,
    advancedAlerts: true,
    riskMonitoring: true,
    customAlerts: -1, // unlimited
    apiAccess: true,
    apiCallsPerMonth: 10000,
    brokerIntegrations: ['td_ameritrade', 'schwab', 'ibkr', 'tastyworks'],
    communityAccess: true,
    postCreation: true,
    followUsers: true,
    leaderboards: true,
    supportLevel: 'priority',
    responseTime: '4h'
  },
  
  enterprise: {
    realTimeData: true,
    delayedData: true,
    historicalDepth: 'unlimited',
    dailyRecommendations: -1,
    scanLimit: -1,
    portfolioRecommendations: true,
    advancedGreeks: true,
    volatilitySurface: true,
    riskScenarios: true,
    probabilityModeling: true,
    strategyBuilder: true,
    backtesting: true,
    portfolioOptimization: true,
    tradeJournaling: true,
    basicAlerts: true,
    advancedAlerts: true,
    riskMonitoring: true,
    customAlerts: -1,
    apiAccess: true,
    apiCallsPerMonth: -1, // unlimited
    brokerIntegrations: ['td_ameritrade', 'schwab', 'ibkr', 'tastyworks', 'custom'],
    communityAccess: true,
    postCreation: true,
    followUsers: true,
    leaderboards: true,
    supportLevel: 'dedicated',
    responseTime: '1h'
  }
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: 'USD'
  interval: 'month' | 'year'
  features: SubscriptionFeatures
  popular?: boolean
  description: string
  cta: string
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan[]> = {
  free: [{
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: SUBSCRIPTION_FEATURES.free,
    description: 'Perfect for getting started with options trading',
    cta: 'Get Started'
  }],
  
  pro: [
    {
      id: 'pro-monthly',
      name: 'Pro',
      price: 39,
      currency: 'USD',
      interval: 'month',
      features: SUBSCRIPTION_FEATURES.pro,
      popular: true,
      description: 'Advanced analytics for active traders',
      cta: 'Start Pro Trial'
    },
    {
      id: 'pro-yearly',
      name: 'Pro (Annual)',
      price: 390, // 2 months free
      currency: 'USD', 
      interval: 'year',
      features: SUBSCRIPTION_FEATURES.pro,
      description: 'Save 17% with annual billing',
      cta: 'Save with Annual'
    }
  ],
  
  elite: [
    {
      id: 'elite-monthly',
      name: 'Elite',
      price: 149,
      currency: 'USD',
      interval: 'month',
      features: SUBSCRIPTION_FEATURES.elite,
      description: 'Institutional-grade tools for serious traders',
      cta: 'Go Elite'
    },
    {
      id: 'elite-yearly',
      name: 'Elite (Annual)',
      price: 1490, // 2 months free
      currency: 'USD',
      interval: 'year',
      features: SUBSCRIPTION_FEATURES.elite,
      description: 'Ultimate trading intelligence platform',
      cta: 'Maximize Returns'
    }
  ],
  
  enterprise: [{
    id: 'enterprise',
    name: 'Enterprise',
    price: 0, // Custom pricing
    currency: 'USD',
    interval: 'month',
    features: SUBSCRIPTION_FEATURES.enterprise,
    description: 'Custom solutions for institutions and funds',
    cta: 'Contact Sales'
  }]
}

export class SubscriptionManager {
  static canAccess(userTier: SubscriptionTier, feature: keyof SubscriptionFeatures): boolean {
    return Boolean(SUBSCRIPTION_FEATURES[userTier][feature])
  }
  
  static getUsageLimit(userTier: SubscriptionTier, limit: keyof SubscriptionFeatures): number {
    const value = SUBSCRIPTION_FEATURES[userTier][limit]
    if (typeof value === 'number') {
      return value === -1 ? Infinity : value
    }
    return 0
  }
  
  static shouldUpgrade(userTier: SubscriptionTier, requestedFeature: keyof SubscriptionFeatures): SubscriptionTier | null {
    if (this.canAccess(userTier, requestedFeature)) {
      return null // No upgrade needed
    }
    
    // Find minimum tier that has this feature
    for (const tier of ['pro', 'elite', 'enterprise'] as SubscriptionTier[]) {
      if (this.canAccess(tier, requestedFeature)) {
        return tier
      }
    }
    
    return null
  }
  
  static formatPrice(plan: SubscriptionPlan): string {
    if (plan.price === 0) return 'Free'
    
    const monthlyPrice = plan.interval === 'year' ? plan.price / 12 : plan.price
    return `$${Math.round(monthlyPrice)}/mo`
  }
  
  static getRecommendedTier(monthlyTradeVolume: number, portfolioValue: number): SubscriptionTier {
    if (portfolioValue > 500000 || monthlyTradeVolume > 100) {
      return 'elite'
    }
    if (portfolioValue > 50000 || monthlyTradeVolume > 20) {
      return 'pro'
    }
    return 'free'
  }
}

// Usage tracking for subscription limits
export interface UsageMetrics {
  userId: string
  tier: SubscriptionTier
  period: string // YYYY-MM-DD
  scansUsed: number
  recommendationsUsed: number
  apiCallsUsed: number
  alertsCreated: number
}

export class UsageTracker {
  static async checkLimit(
    userId: string, 
    tier: SubscriptionTier, 
    resource: keyof SubscriptionFeatures
  ): Promise<{ allowed: boolean; remaining: number; upgradeRequired?: SubscriptionTier }> {
    const limit = SubscriptionManager.getUsageLimit(tier, resource)
    
    if (limit === Infinity) {
      return { allowed: true, remaining: Infinity }
    }
    
    // In production, check actual usage from database
    const currentUsage = 0 // TODO: Fetch from DB
    const remaining = Math.max(0, limit - currentUsage)
    
    if (remaining > 0) {
      return { allowed: true, remaining }
    }
    
    const upgradeRequired = SubscriptionManager.shouldUpgrade(tier, resource)
    return { 
      allowed: false, 
      remaining: 0, 
      upgradeRequired: upgradeRequired || undefined 
    }
  }
  
  static async incrementUsage(
    userId: string, 
    resource: keyof SubscriptionFeatures, 
    amount: number = 1
  ): Promise<void> {
    // TODO: Implement usage tracking in database
    console.log(`User ${userId} used ${amount} ${resource}`)
  }
}