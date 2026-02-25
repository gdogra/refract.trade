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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true
        }
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
}

export class ReferralManager {
  static async generateReferralCode(userId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    try {
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

      // Check if referrer has reached maximum referrals (3 for 90 days total)
      const existingReferrals = await prisma.referral.count({
        where: { referrerId }
      })

      if (existingReferrals >= 3) {
        return { success: false, error: 'Referrer has reached maximum referrals' }
      }

      // Create referral record
      await prisma.referral.create({
        data: {
          referrerId,
          refereeId: newUserId,
          createdAt: new Date(),
          rewardGiven: true
        }
      })

      // Extend referrer's trial by 30 days
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId }
      })

      if (referrer) {
        const currentTrialDays = referrer.trialDaysLeft || 0
        const newTrialDays = Math.min(currentTrialDays + 30, 90) // Max 90 days

        await prisma.user.update({
          where: { id: referrerId },
          data: { trialDaysLeft: newTrialDays }
        })

        // Give new user 30 days trial
        await prisma.user.update({
          where: { id: newUserId },
          data: { trialDaysLeft: 30 }
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
      const referrals = await prisma.referral.findMany({
        where: { referrerId: userId }
      })

      const totalReferrals = referrals.length
      const successfulReferrals = referrals.filter(r => r.rewardGiven).length
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