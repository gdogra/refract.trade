export type SubscriptionTier = 'trial' | 'premium'

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
  trial: {
    realTimeData: true,
    delayedData: true,
    historicalDepth: '1Y',
    dailyRecommendations: -1, // unlimited during trial
    scanLimit: -1, // unlimited during trial
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
    apiCallsPerMonth: 1000,
    brokerIntegrations: ['td_ameritrade', 'schwab', 'ibkr', 'tastyworks'],
    communityAccess: true,
    postCreation: true,
    followUsers: true,
    leaderboards: true,
    supportLevel: 'email',
    responseTime: '24h'
  },
  
  premium: {
    realTimeData: true,
    delayedData: true,
    historicalDepth: 'unlimited',
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
    apiCallsPerMonth: -1, // unlimited
    brokerIntegrations: ['td_ameritrade', 'schwab', 'ibkr', 'tastyworks', 'custom'],
    communityAccess: true,
    postCreation: true,
    followUsers: true,
    leaderboards: true,
    supportLevel: 'priority',
    responseTime: '4h'
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
  trial: [{
    id: 'trial',
    name: '30-Day Free Trial',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: SUBSCRIPTION_FEATURES.trial,
    description: 'Full access to all premium features for 30 days',
    cta: 'Start Free Trial'
  }],
  
  premium: [{
    id: 'premium',
    name: 'Premium',
    price: 39.99,
    currency: 'USD',
    interval: 'month',
    features: SUBSCRIPTION_FEATURES.premium,
    popular: true,
    description: 'Professional options trading platform with unlimited features',
    cta: 'Upgrade to Premium'
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
    
    // Only upgrade path is from trial to premium
    if (userTier === 'trial') {
      return 'premium'
    }
    
    return null
  }
  
  static formatPrice(plan: SubscriptionPlan): string {
    if (plan.price === 0) return 'Free'
    
    const monthlyPrice = plan.interval === 'year' ? plan.price / 12 : plan.price
    return `$${Math.round(monthlyPrice)}/mo`
  }
  
  static getRecommendedTier(monthlyTradeVolume: number, portfolioValue: number): SubscriptionTier {
    // Everyone starts with trial, then upgrades to premium
    return 'trial'
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

// Trial and subscription management
export interface TrialInfo {
  userId: string
  startDate: Date
  endDate: Date
  isActive: boolean
  extendedByReferral: boolean
}

export interface ReferralInfo {
  userId: string
  referralCode: string
  referredUsers: string[]
  totalRewards: number // months of free service
  isActive: boolean
}

export interface SubscriptionInfo {
  userId: string
  tier: SubscriptionTier
  status: 'trial' | 'active' | 'expired' | 'cancelled'
  trialStartDate?: Date
  trialEndDate?: Date
  subscriptionStartDate?: Date
  nextBillingDate?: Date
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  referralCode?: string
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

export class TrialManager {
  static TRIAL_DURATION_DAYS = 30
  
  static async startTrial(userId: string): Promise<TrialInfo> {
    const startDate = new Date()
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + this.TRIAL_DURATION_DAYS)
    
    const trialInfo: TrialInfo = {
      userId,
      startDate,
      endDate,
      isActive: true,
      extendedByReferral: false
    }
    
    // TODO: Save to database
    console.log(`Started trial for user ${userId} until ${endDate.toISOString()}`)
    
    return trialInfo
  }
  
  static async extendTrialByReferral(userId: string, days: number = 30): Promise<void> {
    // TODO: Extend trial in database
    console.log(`Extended trial for user ${userId} by ${days} days`)
  }
  
  static async isTrialActive(userId: string): Promise<boolean> {
    // TODO: Check database
    return true // Placeholder
  }
  
  static async getTrialInfo(userId: string): Promise<TrialInfo | null> {
    // TODO: Fetch from database
    return null // Placeholder
  }
  
  static getDaysRemaining(trialInfo: TrialInfo): number {
    const now = new Date()
    const diffTime = trialInfo.endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }
}

export class ReferralManager {
  static async generateReferralCode(userId: string): Promise<string> {
    // Generate a unique referral code
    const code = `REF${userId.substring(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    
    const referralInfo: ReferralInfo = {
      userId,
      referralCode: code,
      referredUsers: [],
      totalRewards: 0,
      isActive: true
    }
    
    // TODO: Save to database
    console.log(`Generated referral code ${code} for user ${userId}`)
    
    return code
  }
  
  static async processReferral(referralCode: string, newUserId: string): Promise<boolean> {
    // TODO: Validate referral code and apply rewards
    const referrerId = await this.getUserByReferralCode(referralCode)
    
    if (!referrerId) {
      return false
    }
    
    // Extend referrer's subscription by 1 month
    await this.addReferralReward(referrerId, 30) // 30 days
    
    // Extend new user's trial by 1 month
    await TrialManager.extendTrialByReferral(newUserId, 30)
    
    console.log(`Processed referral: ${referrerId} referred ${newUserId}`)
    
    return true
  }
  
  static async getUserByReferralCode(code: string): Promise<string | null> {
    // TODO: Query database
    return null // Placeholder
  }
  
  static async addReferralReward(userId: string, days: number): Promise<void> {
    // TODO: Add reward to database
    console.log(`Added ${days} days reward to user ${userId}`)
  }
  
  static async getReferralStats(userId: string): Promise<{ totalReferrals: number; totalRewards: number }> {
    // TODO: Query database
    return { totalReferrals: 0, totalRewards: 0 }
  }
}