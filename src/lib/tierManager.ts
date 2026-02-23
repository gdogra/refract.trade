export type UserTier = 'trial' | 'premium'

export interface TierLimits {
  maxPositions: number
  realTimeData: boolean
  advancedAnalytics: boolean
  aiInsights: boolean
  customAlerts: boolean
  apiAccess: boolean
  prioritySupport: boolean
  unlimitedBacktests: boolean
  institutionalFeatures: boolean
}

export const tierLimits: Record<UserTier, TierLimits> = {
  trial: {
    maxPositions: -1, // unlimited during trial
    realTimeData: true,
    advancedAnalytics: true,
    aiInsights: true,
    customAlerts: true,
    apiAccess: true,
    prioritySupport: true,
    unlimitedBacktests: true,
    institutionalFeatures: true
  },
  premium: {
    maxPositions: -1, // unlimited
    realTimeData: true,
    advancedAnalytics: true,
    aiInsights: true,
    customAlerts: true,
    apiAccess: true,
    prioritySupport: true,
    unlimitedBacktests: true,
    institutionalFeatures: true
  }
}

export function hasFeatureAccess(userTier: UserTier, feature: keyof TierLimits): boolean {
  return tierLimits[userTier][feature] as boolean
}

export function getPositionLimit(userTier: UserTier): number {
  return tierLimits[userTier].maxPositions
}

export function getRequiredTierForFeature(feature: keyof TierLimits): UserTier {
  // All features are available in both tiers now
  return 'trial'
}

export function canAccessFeature(userTier: UserTier, feature: keyof TierLimits): boolean {
  // All features are available to both trial and premium users
  return true
}