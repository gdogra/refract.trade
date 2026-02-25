'use client'

import { ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Crown, Star, Zap, TrendingUp } from 'lucide-react'

interface PremiumGateProps {
  children: ReactNode
  requiredTier?: 'trial' | 'basic' | 'pro' | 'elite'
  feature?: string
  description?: string
  showUpgrade?: boolean
  fallback?: ReactNode
  currentTier?: string
  title?: string
}

export default function PremiumGate({ 
  children, 
  requiredTier = 'basic',
  feature = 'Premium Feature',
  description = 'Upgrade to access this premium feature',
  showUpgrade = true,
  fallback,
  currentTier,
  title
}: PremiumGateProps) {
  const { data: session } = useSession()
  const userTier = currentTier || (session?.user as any)?.subscriptionTier || 'free'
  
  const tierLevels = {
    free: 0,
    trial: 1,
    basic: 2,
    pro: 3,
    elite: 4
  }
  
  const userLevel = tierLevels[userTier as keyof typeof tierLevels] || 0
  const requiredLevel = tierLevels[requiredTier]
  
  const hasAccess = userLevel >= requiredLevel
  
  if (hasAccess) {
    return <>{children}</>
  }
  
  if (fallback) {
    return <>{fallback}</>
  }
  
  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'trial':
        return {
          name: 'Trial',
          icon: <Star className="h-4 w-4" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50 border-blue-200',
          price: 'Free Trial'
        }
      case 'basic':
        return {
          name: 'Basic',
          icon: <Zap className="h-4 w-4" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50 border-green-200',
          price: '$29/month'
        }
      case 'pro':
        return {
          name: 'Pro',
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50 border-purple-200',
          price: '$79/month'
        }
      case 'elite':
        return {
          name: 'Elite',
          icon: <Crown className="h-4 w-4" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          price: '$199/month'
        }
      default:
        return {
          name: 'Premium',
          icon: <Lock className="h-4 w-4" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          price: 'Upgrade required'
        }
    }
  }
  
  const tierInfo = getTierInfo(requiredTier)
  
  return (
    <Card className={`${tierInfo.bgColor} border-2`}>
      <CardHeader className="text-center pb-3">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Lock className="h-6 w-6 text-gray-400" />
          {tierInfo.icon}
        </div>
        <CardTitle className={`text-lg ${tierInfo.color}`}>
          {title || feature}
        </CardTitle>
        <CardDescription className="text-center">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="flex justify-center">
          <Badge variant="outline" className={`${tierInfo.color} border-current`}>
            {tierInfo.name} Required
          </Badge>
        </div>
        
        <div className="text-sm text-gray-600">
          Unlock this feature and many more with {tierInfo.name}
        </div>
        
        {showUpgrade && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              This feature is available to all users.
            </div>
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => alert('Feature access is being updated. All features will be available to all users soon!')}
            >
              Learn More
            </Button>
          </div>
        )}
        
        <div className="text-xs text-gray-500 mt-4">
          Current plan: <span className="capitalize font-medium">{userTier}</span>
        </div>
      </CardContent>
    </Card>
  )
}