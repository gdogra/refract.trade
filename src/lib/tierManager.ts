export type UserTier = 'free' | 'pro' | 'elite'

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
  free: {
    maxPositions: 5,
    realTimeData: false,
    advancedAnalytics: false,
    aiInsights: false,
    customAlerts: false,
    apiAccess: false,
    prioritySupport: false,
    unlimitedBacktests: false,
    institutionalFeatures: false
  },
  pro: {
    maxPositions: -1, // unlimited
    realTimeData: true,
    advancedAnalytics: true,
    aiInsights: true,
    customAlerts: true,
    apiAccess: false,
    prioritySupport: true,
    unlimitedBacktests: true,
    institutionalFeatures: false
  },
  elite: {
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
  if (tierLimits.free[feature]) return 'free'
  if (tierLimits.pro[feature]) return 'pro'
  return 'elite'
}

export function canAccessFeature(userTier: UserTier, feature: keyof TierLimits): boolean {
  const tiers: UserTier[] = ['free', 'pro', 'elite']
  const userTierIndex = tiers.indexOf(userTier)
  const requiredTierIndex = tiers.indexOf(getRequiredTierForFeature(feature))
  
  return userTierIndex >= requiredTierIndex
}