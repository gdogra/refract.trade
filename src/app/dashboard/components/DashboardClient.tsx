'use client'

import { useSession, signOut } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import PortfolioOverview from './PortfolioOverview'
import RiskMetricsPanel from './RiskMetricsPanel'
import PositionsList from './PositionsList'
import QuickActions from './QuickActions'
import MarketOverview from './MarketOverview'
import AIInsights from './AIInsights'
import AlertsPanel from './AlertsPanel'
import CommunityFeed from '@/components/social/CommunityFeed'
import AlphaAssistant from '@/components/ai/AlphaAssistant'
import { Tooltip } from '@/components/ui/tooltip'
import { Crown, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

export default function DashboardClient() {
  const { data: session } = useSession()
  const userTier = (session?.user as any)?.subscriptionTier || 'free'

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 py-2">
      <motion.div 
        className="max-w-7xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header - Public.com style */}
        <motion.div variants={itemVariants} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Portfolio
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {session?.user?.name || 'Trader'}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                {session?.user?.subscriptionTier || 'free'} plan
              </div>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {(session?.user?.name || 'T').charAt(0).toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* Premium Features Banner for Free Users */}
        {userTier === 'free' && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 text-blue-500" />
                      <Crown className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Unlock Premium Analytics
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get real-time data, AI insights, unlimited positions, and advanced risk tools
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Starting at $29/month
                    </span>
                    <Button
                      onClick={() => window.open('/upgrade', '_blank')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2"
                    >
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Main Dashboard - Public.com style single column mobile-first */}
        <div className="space-y-4">
          {/* Portfolio Value Card - Prominent like Public.com */}
          <motion.div variants={itemVariants}>
            <PortfolioOverview />
          </motion.div>

          {/* Quick Actions - Simplified */}
          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>

          {/* Positions List - Main focus like Public.com */}
          <motion.div variants={itemVariants}>
            <PositionsList />
          </motion.div>

          {/* AI Research Assistant - Public.com Alpha style */}
          <motion.div variants={itemVariants}>
            <AlphaAssistant />
          </motion.div>

          {/* Community Feed - Public.com social features */}
          <motion.div variants={itemVariants}>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Community</h2>
              <CommunityFeed />
            </div>
          </motion.div>

          {/* Secondary Info in Tabs/Accordion style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div variants={itemVariants}>
              <RiskMetricsPanel />
            </motion.div>

            <motion.div variants={itemVariants}>
              <AIInsights />
            </motion.div>
          </div>

          {/* Market Overview - Less prominent */}
          <motion.div variants={itemVariants}>
            <MarketOverview />
          </motion.div>

          {/* Alerts - Bottom */}
          <motion.div variants={itemVariants}>
            <AlertsPanel />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}