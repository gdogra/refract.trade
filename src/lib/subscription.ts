import { prisma } from '@/lib/prisma'

export type SubscriptionTier = 'free' | 'trial' | 'basic' | 'pro' | 'elite'

export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: 'active' | 'cancelled' | 'expired'
  startDate: Date
  endDate?: Date
  features: string[]
  limits: {
    monthlyRecommendations: number
    dailyAPIRequests: number
    portfolioPositions: number
    riskAnalytics: boolean
    advancedCharts: boolean
    aiInsights: boolean
  }
}

export interface UsageStats {
  monthlyRecommendations: number
  dailyAPIRequests: number
  portfolioPositions: number
  lastReset: Date
}

export class SubscriptionManager {
  static async getUserSubscription(userId: string): Promise<SubscriptionInfo | null> {
    try {
      if (!prisma) {
        console.error('Prisma client not initialized')
        return null
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) return null

      const tier = (user.subscriptionTier || 'free') as SubscriptionTier
      
      return {
        tier,
        status: 'active', // Simplified for now
        startDate: user.createdAt,
        features: this.getFeaturesForTier(tier),
        limits: this.getLimitsForTier(tier)
      }
    } catch (error) {
      console.error('Error fetching user subscription:', error)
      return null
    }
  }

  static getFeaturesForTier(tier: SubscriptionTier): string[] {
    switch (tier) {
      case 'free':
        return ['basic_portfolio', 'limited_recommendations']
      case 'trial':
        return ['basic_portfolio', 'recommendations', 'basic_analytics']
      case 'basic':
        return ['portfolio', 'recommendations', 'basic_analytics', 'market_data']
      case 'pro':
        return ['portfolio', 'recommendations', 'advanced_analytics', 'market_data', 'ai_insights', 'real_time_data']
      case 'elite':
        return ['portfolio', 'recommendations', 'advanced_analytics', 'market_data', 'ai_insights', 'real_time_data', 'institutional_features', 'priority_support']
      default:
        return []
    }
  }

  static getLimitsForTier(tier: SubscriptionTier) {
    switch (tier) {
      case 'free':
        return {
          monthlyRecommendations: 5,
          dailyAPIRequests: 100,
          portfolioPositions: 10,
          riskAnalytics: false,
          advancedCharts: false,
          aiInsights: false
        }
      case 'trial':
        return {
          monthlyRecommendations: 50,
          dailyAPIRequests: 500,
          portfolioPositions: 25,
          riskAnalytics: true,
          advancedCharts: false,
          aiInsights: false
        }
      case 'basic':
        return {
          monthlyRecommendations: 100,
          dailyAPIRequests: 1000,
          portfolioPositions: 50,
          riskAnalytics: true,
          advancedCharts: true,
          aiInsights: false
        }
      case 'pro':
        return {
          monthlyRecommendations: 500,
          dailyAPIRequests: 5000,
          portfolioPositions: 200,
          riskAnalytics: true,
          advancedCharts: true,
          aiInsights: true
        }
      case 'elite':
        return {
          monthlyRecommendations: -1, // Unlimited
          dailyAPIRequests: -1, // Unlimited
          portfolioPositions: -1, // Unlimited
          riskAnalytics: true,
          advancedCharts: true,
          aiInsights: true
        }
      default:
        return {
          monthlyRecommendations: 0,
          dailyAPIRequests: 0,
          portfolioPositions: 0,
          riskAnalytics: false,
          advancedCharts: false,
          aiInsights: false
        }
    }
  }

  static hasFeature(tier: SubscriptionTier, feature: string): boolean {
    const features = this.getFeaturesForTier(tier)
    return features.includes(feature)
  }

  static canExceedLimit(tier: SubscriptionTier, limitType: string, currentValue: number): boolean {
    const limits = this.getLimitsForTier(tier)
    
    switch (limitType) {
      case 'monthlyRecommendations':
        return limits.monthlyRecommendations === -1 || currentValue < limits.monthlyRecommendations
      case 'dailyAPIRequests':
        return limits.dailyAPIRequests === -1 || currentValue < limits.dailyAPIRequests
      case 'portfolioPositions':
        return limits.portfolioPositions === -1 || currentValue < limits.portfolioPositions
      default:
        return false
    }
  }

  static canAccess(tier: SubscriptionTier, feature: string): boolean {
    const limits = this.getLimitsForTier(tier)
    const features = this.getFeaturesForTier(tier)
    
    // Check feature-based access
    if (features.includes(feature)) {
      return true
    }
    
    // Check limit-based access
    switch (feature) {
      case 'riskAnalytics':
      case 'riskMonitoring':
        return limits.riskAnalytics
      case 'advancedCharts':
        return limits.advancedCharts
      case 'aiInsights':
        return limits.aiInsights
      default:
        return false
    }
  }
}

export class UsageTracker {
  static async getUserUsage(userId: string): Promise<UsageStats> {
    try {
      // For now, return default values - in a real app this would track actual usage
      return {
        monthlyRecommendations: 0,
        dailyAPIRequests: 0,
        portfolioPositions: 0,
        lastReset: new Date()
      }
    } catch (error) {
      console.error('Error fetching user usage:', error)
      return {
        monthlyRecommendations: 0,
        dailyAPIRequests: 0,
        portfolioPositions: 0,
        lastReset: new Date()
      }
    }
  }

  static async incrementUsage(userId: string, type: 'recommendations' | 'api_requests' | 'positions'): Promise<boolean> {
    try {
      // For now, just return true - in a real app this would increment actual usage counters
      return true
    } catch (error) {
      console.error('Error incrementing usage:', error)
      return false
    }
  }

  static async canMakeRequest(userId: string, type: 'recommendations' | 'api_requests' | 'positions'): Promise<boolean> {
    try {
      const subscription = await SubscriptionManager.getUserSubscription(userId)
      const usage = await this.getUserUsage(userId)
      
      if (!subscription) return false

      switch (type) {
        case 'recommendations':
          return SubscriptionManager.canExceedLimit(subscription.tier, 'monthlyRecommendations', usage.monthlyRecommendations)
        case 'api_requests':
          return SubscriptionManager.canExceedLimit(subscription.tier, 'dailyAPIRequests', usage.dailyAPIRequests)
        case 'positions':
          return SubscriptionManager.canExceedLimit(subscription.tier, 'portfolioPositions', usage.portfolioPositions)
        default:
          return false
      }
    } catch (error) {
      console.error('Error checking request limits:', error)
      return false
    }
  }

  static async checkLimit(userId: string, tier: SubscriptionTier, limitType: string): Promise<{
    allowed: boolean
    upgradeRequired?: SubscriptionTier
    currentUsage?: number
    limit?: number
    remaining?: number
  }> {
    try {
      const subscription = await SubscriptionManager.getUserSubscription(userId)
      const usage = await this.getUserUsage(userId)
      
      if (!subscription) {
        return { allowed: false, upgradeRequired: 'trial' }
      }

      const limits = SubscriptionManager.getLimitsForTier(tier)
      let currentUsage = 0
      let limit = 0
      let allowed = false

      switch (limitType) {
        case 'dailyRecommendations':
        case 'monthlyRecommendations':
          currentUsage = usage.monthlyRecommendations
          limit = limits.monthlyRecommendations
          allowed = limit === -1 || currentUsage < limit
          break
        case 'scanLimit':
        case 'dailyAPIRequests':
          currentUsage = usage.dailyAPIRequests
          limit = limits.dailyAPIRequests
          allowed = limit === -1 || currentUsage < limit
          break
        case 'portfolioPositions':
          currentUsage = usage.portfolioPositions
          limit = limits.portfolioPositions
          allowed = limit === -1 || currentUsage < limit
          break
        default:
          return { allowed: false }
      }

      const upgradeRequired = this.getUpgradeTier(tier, allowed)
      const remaining = limit === -1 ? 999999 : Math.max(0, limit - currentUsage)

      return {
        allowed,
        upgradeRequired,
        currentUsage,
        limit,
        remaining
      }
    } catch (error) {
      console.error('Error checking usage limits:', error)
      return { allowed: false, upgradeRequired: 'trial' }
    }
  }

  private static getUpgradeTier(currentTier: SubscriptionTier, isAllowed: boolean): SubscriptionTier | undefined {
    if (isAllowed) return undefined

    switch (currentTier) {
      case 'free':
        return 'trial'
      case 'trial':
        return 'basic'
      case 'basic':
        return 'pro'
      case 'pro':
        return 'elite'
      default:
        return undefined
    }
  }
}

export class ReferralManager {
  static async processReferral(code: string, userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    const result = await this.processReferralSignup(code, userId)
    return {
      success: result.success,
      error: result.error
    }
  }

  static async getReferralStats(userId: string) {
    return this.getUserReferralStats(userId)
  }

  static async generateReferralCode(userId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    try {
      if (!prisma) {
        throw new Error('Prisma client not initialized')
      }
      
      await prisma.referralCode.create({
        data: {
          userId,
          code,
          createdAt: new Date(),
          isActive: true
        }
      })
      
      return code
    } catch (error) {
      console.error('Error generating referral code:', error)
      throw new Error('Failed to generate referral code')
    }
  }

  static async processReferralSignup(referralCode: string, newUserId: string): Promise<{
    success: boolean
    referrerTrialExtension?: number
    newUserTrialDays?: number
    error?: string
  }> {
    try {
      if (!prisma) {
        return { success: false, error: 'Database connection not available' }
      }

      const referralCodeRecord = await prisma.referralCode.findFirst({
        where: {
          code: referralCode,
          isActive: true
        },
        include: {
          user: true
        }
      })

      if (!referralCodeRecord) {
        return { success: false, error: 'Invalid referral code' }
      }

      const referrerId = referralCodeRecord.userId

      if (!prisma) {
        return { success: false, error: 'Prisma client not initialized' }
      }

      // Check if referrer has reached maximum referrals (3 for 90 days total)
      const existingReferrals = await prisma.referral.count({
        where: { referrerCodeId: referralCodeRecord.id }
      })

      if (existingReferrals >= 3) {
        return { success: false, error: 'Referrer has reached maximum referrals' }
      }

      // Create referral record
      await prisma.referral.create({
        data: {
          referrerCodeId: referralCodeRecord.id,
          referredUserId: newUserId,
          rewardDelivered: true
        }
      })

      if (!prisma) {
        return { success: false, error: 'Prisma client not initialized' }
      }

      // Extend referrer's trial by 30 days
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId }
      })

      if (referrer) {
        const now = new Date()
        const currentExpiry = referrer.trialExpiry || now
        const newExpiry = new Date(Math.max(currentExpiry.getTime(), now.getTime()) + 30 * 24 * 60 * 60 * 1000)

        await prisma.user.update({
          where: { id: referrerId },
          data: { trialExpiry: newExpiry }
        })

        // Give new user 30 days trial
        const newUserExpiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        await prisma.user.update({
          where: { id: newUserId },
          data: { trialExpiry: newUserExpiry }
        })

        return {
          success: true,
          referrerTrialExtension: 30,
          newUserTrialDays: 30
        }
      }

      return { success: false, error: 'Failed to process referral' }
    } catch (error) {
      console.error('Error processing referral signup:', error)
      return { success: false, error: 'Database error' }
    }
  }

  static async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number
    successfulReferrals: number
    remainingReferrals: number
    totalTrialDaysEarned: number
  }> {
    try {
      if (!prisma) {
        throw new Error('Prisma client not initialized')
      }

      // First get the user's referral codes
      const referralCodes = await prisma.referralCode.findMany({
        where: { userId },
        include: { successfulReferrals: true }
      })

      const allReferrals = referralCodes.flatMap(code => code.successfulReferrals)
      
      const totalReferrals = allReferrals.length
      const successfulReferrals = allReferrals.filter(r => r.rewardDelivered).length
      const remainingReferrals = Math.max(0, 3 - totalReferrals)
      const totalTrialDaysEarned = successfulReferrals * 30

      return {
        totalReferrals,
        successfulReferrals,
        remainingReferrals,
        totalTrialDaysEarned
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
      return {
        totalReferrals: 0,
        successfulReferrals: 0,
        remainingReferrals: 3,
        totalTrialDaysEarned: 0
      }
    }
  }
}