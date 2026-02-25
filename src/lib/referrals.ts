import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class ReferralManager {
  // Generate a unique referral code for a user
  static async generateReferralCode(userId: string): Promise<string> {
    const code = `REF${Math.random().toString(36).substr(2, 8).toUpperCase()}`
    
    try {
      await prisma.referralCode.create({
        data: {
          userId,
          code,
          isActive: true
        }
      })
      
      return code
    } catch (error) {
      // If code collision (unlikely), try again
      if (error instanceof Error && error.message.includes('unique constraint')) {
        return this.generateReferralCode(userId)
      }
      throw error
    }
  }

  // Get user's referral code
  static async getUserReferralCode(userId: string): Promise<string | null> {
    const referral = await prisma.referralCode.findFirst({
      where: {
        userId,
        isActive: true
      },
      select: { code: true }
    })
    
    return referral?.code || null
  }

  // Process a referral signup
  static async processReferralSignup(referralCode: string, newUserId: string): Promise<{
    success: boolean
    referrerTrialExtension?: number
    newUserTrialDays?: number
    error?: string
  }> {
    try {
      // Find the referrer by code
      const referralRecord = await prisma.referralCode.findUnique({
        where: { 
          code: referralCode,
          isActive: true
        },
        include: {
          user: true,
          _count: {
            select: {
              successfulReferrals: true
            }
          }
        }
      })
      
      if (!referralRecord) {
        return { success: false, error: 'Invalid referral code' }
      }

      // Check if referrer has reached max referrals (3 max = 90 days total)
      const MAX_REFERRALS = 3
      if (referralRecord._count.successfulReferrals >= MAX_REFERRALS) {
        return { success: false, error: 'Referral limit reached' }
      }

      // Check if new user hasn't already been referred
      const existingReferral = await prisma.referral.findFirst({
        where: {
          referredUserId: newUserId
        }
      })

      if (existingReferral) {
        return { success: false, error: 'User already referred' }
      }

      // Create referral record
      const referral = await prisma.referral.create({
        data: {
          referrerCodeId: referralRecord.id,
          referredUserId: newUserId,
          status: 'completed',
          rewardType: 'trial_extension',
          rewardValue: 30 // 30 days
        }
      })

      // Extend referrer's trial by 30 days
      const trialExtensionDays = 30
      const currentTrialExpiry = referralRecord.user.trialExpiry || new Date()
      const newTrialExpiry = new Date(currentTrialExpiry)
      newTrialExpiry.setDate(newTrialExpiry.getDate() + trialExtensionDays)

      await prisma.user.update({
        where: { id: referralRecord.userId },
        data: { 
          trialExpiry: newTrialExpiry,
          totalTrialDays: (referralRecord.user.totalTrialDays || 30) + trialExtensionDays
        }
      })

      // Give new user 30 days trial
      const newUserTrialExpiry = new Date()
      newUserTrialExpiry.setDate(newUserTrialExpiry.getDate() + 30)
      
      await prisma.user.update({
        where: { id: newUserId },
        data: { 
          trialExpiry: newUserTrialExpiry,
          totalTrialDays: 30,
          referredBy: referralRecord.userId
        }
      })

      // Create notifications for both users
      try {
        await this.createReferralNotifications(referralRecord.userId, newUserId, trialExtensionDays)
      } catch (error) {
        console.error('Failed to create referral notifications:', error)
      }

      return {
        success: true,
        referrerTrialExtension: trialExtensionDays,
        newUserTrialDays: 30
      }

    } catch (error) {
      console.error('Error processing referral signup:', error)
      return { success: false, error: 'Failed to process referral' }
    }
  }

  // Get referral statistics for a user
  static async getReferralStats(userId: string) {
    const [referralCode, referrals, totalEarned] = await Promise.all([
      this.getUserReferralCode(userId),
      
      prisma.referral.findMany({
        where: {
          referralCode: {
            userId
          }
        },
        include: {
          referredUser: {
            select: {
              name: true,
              email: true,
              createdAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      prisma.referral.aggregate({
        where: {
          referralCode: {
            userId
          },
          status: 'completed'
        },
        _sum: {
          rewardValue: true
        }
      })
    ])

    const successfulReferrals = referrals.filter(r => r.status === 'completed')
    const remainingReferrals = Math.max(0, 3 - successfulReferrals.length)

    return {
      referralCode,
      totalReferrals: referrals.length,
      successfulReferrals: successfulReferrals.length,
      remainingReferrals,
      totalTrialDaysEarned: totalEarned._sum.rewardValue || 0,
      maxTrialDaysFromReferrals: 90, // 3 referrals × 30 days
      referrals: referrals.map(r => ({
        id: r.id,
        referredUserName: r.referredUser?.name || 'Anonymous',
        referredUserEmail: r.referredUser?.email,
        status: r.status,
        rewardDays: r.rewardValue,
        createdAt: r.createdAt
      }))
    }
  }

  // Create notifications for successful referral
  private static async createReferralNotifications(referrerId: string, referredUserId: string, extensionDays: number) {
    // Notification for referrer
    await prisma.smartNotification.create({
      data: {
        userId: referrerId,
        type: 'referral_reward',
        priority: 'normal',
        category: 'achievement',
        title: 'Referral Reward Earned!',
        body: `You've earned ${extensionDays} extra trial days for referring a new user to Refract.trade!`,
        explanation: 'Your referral was successful and your trial period has been extended.',
        contextData: {
          extensionDays,
          referredUserId,
          rewardType: 'trial_extension'
        },
        actionButtons: [
          {
            label: 'View Referrals',
            action: 'view_referrals',
            data: {}
          }
        ],
        channels: ['push', 'email']
      }
    })

    // Notification for new user
    await prisma.smartNotification.create({
      data: {
        userId: referredUserId,
        type: 'welcome_referral',
        priority: 'high',
        category: 'welcome',
        title: 'Welcome to Refract.trade!',
        body: 'You\'ve been referred by a friend and received 30 days of free trial access!',
        explanation: 'Enjoy full access to all premium features during your trial period.',
        contextData: {
          trialDays: 30,
          referrerId,
          welcomeBonus: true
        },
        actionButtons: [
          {
            label: 'Start Trading',
            action: 'start_trial',
            data: {}
          }
        ],
        channels: ['push', 'email']
      }
    })
  }

  // Get user's current trial days remaining
  static async getTrialDaysRemaining(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialExpiry: true }
    })

    if (!user?.trialExpiry) return 0

    const now = new Date()
    const expiry = new Date(user.trialExpiry)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
  }

  // Extend trial for existing user (admin function)
  static async extendTrial(userId: string, days: number, reason: string, adminId?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { trialExpiry: true, totalTrialDays: true }
    })

    if (!user) throw new Error('User not found')

    const currentExpiry = user.trialExpiry || new Date()
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()))
    newExpiry.setDate(newExpiry.getDate() + days)

    await prisma.user.update({
      where: { id: userId },
      data: {
        trialExpiry: newExpiry,
        totalTrialDays: (user.totalTrialDays || 30) + days
      }
    })

    // Log admin action if performed by admin
    if (adminId) {
      await prisma.adminAction.create({
        data: {
          adminId,
          action: 'trial_extended',
          details: {
            userId,
            extensionDays: days,
            reason,
            newExpiryDate: newExpiry.toISOString()
          }
        }
      })
    }

    return {
      newExpiryDate: newExpiry,
      totalTrialDays: (user.totalTrialDays || 30) + days
    }
  }
}