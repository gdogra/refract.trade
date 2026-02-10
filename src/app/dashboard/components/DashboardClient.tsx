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

export default function DashboardClient() {
  const { data: session } = useSession()

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <motion.div 
        className="max-w-7xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {session?.user?.name || 'Trader'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here's your portfolio overview and trading insights
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg px-4 py-2 shadow">
              <span className="text-sm text-gray-600 dark:text-gray-400">Account Status</span>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium capitalize">
                  {session?.user?.subscriptionTier || 'basic'}
                </span>
              </div>
            </div>
            <Button
              onClick={() => signOut({ callbackUrl: '/' })}
              variant="outline"
              className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Portfolio Overview */}
            <motion.div variants={itemVariants}>
              <PortfolioOverview />
            </motion.div>

            {/* Market Overview */}
            <motion.div variants={itemVariants}>
              <MarketOverview />
            </motion.div>

            {/* Positions List */}
            <motion.div variants={itemVariants}>
              <PositionsList />
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <QuickActions />
            </motion.div>

            {/* Risk Metrics */}
            <motion.div variants={itemVariants}>
              <RiskMetricsPanel />
            </motion.div>

            {/* AI Insights */}
            <motion.div variants={itemVariants}>
              <AIInsights />
            </motion.div>

            {/* Alerts */}
            <motion.div variants={itemVariants}>
              <AlertsPanel />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}