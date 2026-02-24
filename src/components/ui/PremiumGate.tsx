'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Lock, Crown, Zap, Star, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { UserTier, canAccessFeature } from '@/lib/tierManager'

interface PremiumGateProps {
  children: ReactNode
  feature: string
  requiredTier: UserTier
  currentTier: UserTier
  title?: string
  description?: string
  className?: string
}

export default function PremiumGate({
  children,
  feature,
  requiredTier,
  currentTier = 'trial',
  title,
  description,
  className = ''
}: PremiumGateProps) {
  const router = useRouter()
  const hasAccess = canAccessFeature(currentTier, feature as any)

  if (hasAccess) {
    return <>{children}</>
  }

  const getTierIcon = (tier: UserTier) => {
    switch (tier) {
      case 'premium': return <Crown className="h-5 w-5 text-purple-500" />
      default: return <Zap className="h-5 w-5 text-green-500" />
    }
  }

  const getTierColor = (tier: UserTier) => {
    switch (tier) {
      case 'premium': return 'from-purple-500/20 to-purple-600/20 border-purple-200 dark:border-purple-800'
      default: return 'from-green-500/20 to-green-600/20 border-green-200 dark:border-green-800'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred Preview */}
      <div className="relative">
        <div className="blur-sm pointer-events-none opacity-30">
          {children}
        </div>
        
        {/* Premium Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Card className={`bg-gradient-to-br ${getTierColor(requiredTier)} border-2 shadow-xl max-w-md mx-4`}>
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Lock className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                  <div className="absolute -top-1 -right-1">
                    {getTierIcon(requiredTier)}
                  </div>
                </div>
              </div>

              <Badge 
                variant="outline" 
                className={`mb-3 ${
                  requiredTier === 'premium' ? 'text-purple-600 border-purple-600' :
                  'text-green-600 border-green-600'
                }`}
              >
                {requiredTier.toUpperCase()} FEATURE
              </Badge>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title || `Unlock ${feature}`}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {description || `This ${feature} feature is available with ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan and above.`}
              </p>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push('/upgrade')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/upgrade')}
                  className="w-full text-xs"
                >
                  View All Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}