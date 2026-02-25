'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Copy, Gift, Users, Clock, TrendingUp } from 'lucide-react'
// Simple toast function replacement
const toast = {
  success: (message: string) => {
    console.log('Toast Success:', message)
    // In a real app, you'd use a proper toast library
  },
  error: (message: string) => {
    console.log('Toast Error:', message)
    // In a real app, you'd use a proper toast library
  }
}

interface ReferralStats {
  referralCode?: string
  totalReferrals: number
  successfulReferrals: number
  remainingReferrals: number
  totalTrialDaysEarned: number
  maxTrialDaysFromReferrals: number
  trialDaysRemaining: number
  referrals: Array<{
    id: string
    referredUserName: string
    referredUserEmail?: string
    status: string
    rewardDays: number
    createdAt: string
  }>
}

export function ReferralDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchReferralStats()
    }
  }, [session])

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referrals')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        console.error('Failed to fetch referral stats:', data.error)
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReferralCode = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setStats(prev => prev ? {
          ...prev,
          referralCode: data.data.referralCode
        } : null)
        toast.success('Referral code generated!')
      } else {
        toast.error('Failed to generate referral code')
      }
    } catch (error) {
      console.error('Error generating referral code:', error)
      toast.error('Failed to generate referral code')
    } finally {
      setGenerating(false)
    }
  }

  const copyReferralLink = () => {
    if (stats?.referralCode) {
      const shareUrl = `${window.location.origin}/auth/signup?ref=${stats.referralCode}`
      navigator.clipboard.writeText(shareUrl)
      toast.success('Referral link copied to clipboard!')
    }
  }

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode)
      toast.success('Referral code copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Failed to load referral information.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Program
          </CardTitle>
          <CardDescription>
            Earn 30 extra trial days for each friend you refer (up to 90 days total)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Referral Code Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Your Referral Code</h3>
            {stats.referralCode ? (
              <div className="flex items-center gap-2">
                <code className="px-3 py-2 bg-gray-100 rounded font-mono text-lg">
                  {stats.referralCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyReferralCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyReferralLink}
                >
                  Copy Link
                </Button>
              </div>
            ) : (
              <Button
                onClick={generateReferralCode}
                disabled={generating}
                className="w-full sm:w-auto"
              >
                {generating ? 'Generating...' : 'Generate Referral Code'}
              </Button>
            )}
          </div>

          <Separator />

          {/* Statistics Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{stats.successfulReferrals}</div>
              <div className="text-sm text-muted-foreground">Successful Referrals</div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{stats.totalTrialDaysEarned}</div>
              <div className="text-sm text-muted-foreground">Days Earned</div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{stats.trialDaysRemaining}</div>
              <div className="text-sm text-muted-foreground">Trial Days Left</div>
            </div>
            
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <Gift className="h-5 w-5 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{stats.remainingReferrals}</div>
              <div className="text-sm text-muted-foreground">Referrals Left</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Maximum</span>
              <span>{stats.totalTrialDaysEarned} / {stats.maxTrialDaysFromReferrals} days</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(stats.totalTrialDaysEarned / stats.maxTrialDaysFromReferrals) * 100}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      {stats.referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
            <CardDescription>
              Track your successful referrals and rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{referral.referredUserName}</div>
                    {referral.referredUserEmail && (
                      <div className="text-sm text-muted-foreground">
                        {referral.referredUserEmail}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                      {referral.status}
                    </Badge>
                    {referral.status === 'completed' && (
                      <div className="text-sm font-medium text-green-600">
                        +{referral.rewardDays} days
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}