'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { 
  Gift, 
  Users, 
  Copy, 
  Share2, 
  Trophy,
  Calendar,
  CheckCircle,
  ExternalLink 
} from 'lucide-react'

interface ReferralStats {
  referralCode: string
  totalReferrals: number
  totalRewards: number
  pendingReferrals: number
  recentReferrals: Array<{
    id: string
    name: string
    date: Date
    status: 'active' | 'pending'
  }>
}

interface ReferralDashboardProps {
  className?: string
}

export default function ReferralDashboard({ className = '' }: ReferralDashboardProps) {
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReferralStats()
  }, [])

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referrals/process')
      const data = await response.json()
      
      // Mock data for demo - in production this would come from the API
      setReferralStats({
        referralCode: data.referralCode || 'REFABC123',
        totalReferrals: 5,
        totalRewards: 5, // months
        pendingReferrals: 2,
        recentReferrals: [
          { id: '1', name: 'John D.', date: new Date('2024-01-15'), status: 'active' },
          { id: '2', name: 'Sarah M.', date: new Date('2024-01-12'), status: 'active' },
          { id: '3', name: 'Mike R.', date: new Date('2024-01-10'), status: 'pending' },
        ]
      })
    } catch (error) {
      console.error('Failed to fetch referral stats:', error)
      // Set mock data on error
      setReferralStats({
        referralCode: 'REFABC123',
        totalReferrals: 0,
        totalRewards: 0,
        pendingReferrals: 0,
        recentReferrals: []
      })
    }
    setLoading(false)
  }

  const copyReferralCode = async () => {
    if (!referralStats) return
    
    try {
      await navigator.clipboard.writeText(referralStats.referralCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareReferral = async () => {
    if (!referralStats) return
    
    const shareData = {
      title: 'Join me on Refract.trade',
      text: `Get a free month of Refract Premium! Use my referral code: ${referralStats.referralCode}`,
      url: `${window.location.origin}/signup?ref=${referralStats.referralCode}`
    }
    
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback to copying the URL
        await navigator.clipboard.writeText(`${shareData.url}\n\n${shareData.text}`)
        alert('Referral link copied to clipboard!')
      }
    } catch (error) {
      console.error('Failed to share:', error)
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading referral stats...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!referralStats) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-6 text-center">
            <Gift className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Unable to load referral information</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <Gift className="h-6 w-6 text-purple-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Referral Program
        </h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {referralStats.totalReferrals}
                  </div>
                  <div className="text-sm text-gray-600">Total Referrals</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Trophy className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {referralStats.totalRewards}
                  </div>
                  <div className="text-sm text-gray-600">Free Months Earned</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-8 w-8 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {referralStats.pendingReferrals}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Referral Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <CardHeader>
            <CardTitle className="text-lg text-purple-700 dark:text-purple-300">
              Your Referral Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-700 rounded-lg px-4 py-2 font-mono text-lg font-bold text-purple-700 dark:text-purple-300 flex-1 text-center">
                {referralStats.referralCode}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyReferralCode}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                {copiedCode ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={shareReferral}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Referral Link
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`${window.location.origin}/signup?ref=${referralStats.referralCode}`, '_blank')}
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center text-sm text-purple-600 dark:text-purple-400 space-y-1">
              <p><strong>How it works:</strong></p>
              <p>1. Share your code with friends</p>
              <p>2. They sign up and get a free month</p>
              <p>3. You get a free month too!</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Referrals */}
      {referralStats.recentReferrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referralStats.recentReferrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {referral.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {referral.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {referral.date.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={referral.status === 'active' ? 'default' : 'secondary'}
                      className={
                        referral.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }
                    >
                      {referral.status === 'active' ? 'Active' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Program Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-dashed border-gray-300">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
              Referral Program Benefits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Unlimited referrals</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Instant rewards</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Both parties get free months</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No expiration on codes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}