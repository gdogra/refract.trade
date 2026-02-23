'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  Star, 
  Calendar, 
  CreditCard, 
  Settings,
  Gift,
  AlertTriangle,
  CheckCircle,
  Crown
} from 'lucide-react'
import { SubscriptionInfo, TrialInfo } from '@/lib/subscription'
import { PRICING } from '@/lib/payments'

interface SubscriptionStatusProps {
  className?: string
}

export default function SubscriptionStatus({ className = '' }: SubscriptionStatusProps) {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [])

  const fetchSubscriptionInfo = async () => {
    try {
      // Mock data for demo - in production this would come from the API
      const now = new Date()
      const trialEnd = new Date(now)
      trialEnd.setDate(trialEnd.getDate() + 15) // 15 days remaining

      setTrialInfo({
        userId: 'user_123',
        startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // Started 15 days ago
        endDate: trialEnd,
        isActive: true,
        extendedByReferral: false
      })

      setSubscriptionInfo({
        userId: 'user_123',
        tier: 'trial',
        status: 'trial',
        trialStartDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        trialEndDate: trialEnd,
        referralCode: 'REFABC123'
      })
    } catch (error) {
      console.error('Failed to fetch subscription info:', error)
    }
    setLoading(false)
  }

  const handleUpgrade = () => {
    window.location.href = '/upgrade'
  }

  const handleManageBilling = () => {
    // TODO: Open Stripe customer portal
    alert('Opening billing management...')
  }

  const handleCancelSubscription = async () => {
    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST'
      })
      
      if (response.ok) {
        alert('Subscription cancelled successfully. You will retain access until your current period ends.')
        fetchSubscriptionInfo()
      } else {
        alert('Failed to cancel subscription. Please try again.')
      }
    } catch (error) {
      alert('Failed to cancel subscription. Please try again.')
    }
    setShowCancelConfirm(false)
  }

  const getDaysRemaining = (endDate: Date): number => {
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const getTrialProgress = (startDate: Date, endDate: Date): number => {
    const now = new Date()
    const totalDuration = endDate.getTime() - startDate.getTime()
    const elapsed = now.getTime() - startDate.getTime()
    return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
  }

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading subscription info...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subscriptionInfo || !trialInfo) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Unable to load subscription information</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const daysRemaining = getDaysRemaining(trialInfo.endDate)
  const trialProgress = getTrialProgress(trialInfo.startDate, trialInfo.endDate)
  const isTrialExpiring = daysRemaining <= 7

  return (
    <div className={`${className} space-y-6`}>
      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className={`${
          subscriptionInfo.status === 'trial' 
            ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-green-200 bg-green-50 dark:bg-green-900/20'
        }`}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                {subscriptionInfo.status === 'trial' ? (
                  <Clock className="h-5 w-5 text-blue-500" />
                ) : (
                  <Crown className="h-5 w-5 text-green-500" />
                )}
                <span className={
                  subscriptionInfo.status === 'trial' 
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-green-700 dark:text-green-300'
                }>
                  {subscriptionInfo.status === 'trial' ? '30-Day Free Trial' : 'Premium Subscription'}
                </span>
              </CardTitle>
              <Badge 
                variant={subscriptionInfo.status === 'active' ? 'default' : 'secondary'}
                className={
                  subscriptionInfo.status === 'trial' 
                    ? 'bg-blue-100 text-blue-700'
                    : subscriptionInfo.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {subscriptionInfo.status === 'trial' ? 'Trial Active' : 
                 subscriptionInfo.status === 'active' ? 'Active' : 'Expired'}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {subscriptionInfo.status === 'trial' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Trial Progress</span>
                    <span className={`font-medium ${
                      isTrialExpiring ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left
                    </span>
                  </div>
                  <Progress 
                    value={trialProgress} 
                    className={`h-2 ${
                      isTrialExpiring ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'
                    }`} 
                  />
                  <div className="text-xs text-gray-500">
                    Trial ends {trialInfo.endDate.toLocaleDateString()}
                  </div>
                </div>

                {isTrialExpiring && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        Trial expiring soon!
                      </span>
                    </div>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      Upgrade now to continue using all premium features.
                    </p>
                  </motion.div>
                )}
              </>
            )}

            {subscriptionInfo.status === 'active' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Next billing date</span>
                  <span className="font-medium text-green-600">
                    {subscriptionInfo.nextBillingDate?.toLocaleDateString() || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Monthly charge</span>
                  <span className="font-medium text-green-600">
                    ${PRICING.MONTHLY_PRICE}/month
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {subscriptionInfo.status === 'trial' ? (
          <>
            <Button
              onClick={handleUpgrade}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Star className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/referral'}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Gift className="h-4 w-4 mr-2" />
              Refer Friends
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={handleManageBilling}
              className="border-gray-300"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Cancel Subscription
            </Button>
          </>
        )}
      </motion.div>

      {/* Features Access */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Real-time market data</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>AI strategy recommendations</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Advanced risk analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Unlimited positions</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Portfolio optimization</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Broker integrations</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cancellation Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Cancel Subscription?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to cancel your subscription? You'll retain access to premium features until your current billing period ends.
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1"
                >
                  Keep Subscription
                </Button>
                <Button
                  onClick={handleCancelSubscription}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}