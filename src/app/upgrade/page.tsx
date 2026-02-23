'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Check, Gift, Star, ArrowLeft, Sparkles, Clock, Users, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { PRICING } from '@/lib/payments'
import { TrialManager } from '@/lib/subscription'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const subscriptionTier = {
  id: 'premium',
  name: 'Refract Premium',
  price: PRICING.MONTHLY_PRICE,
  period: 'month',
  trialDays: PRICING.TRIAL_DAYS,
  description: 'Professional options trading platform with all features included',
  features: [
    'Real-time market data & options chains',
    'AI-powered strategy recommendations',
    'Advanced Greeks & volatility analysis',
    'Unlimited position tracking',
    'Smart alerts & notifications',
    'Portfolio risk management',
    'Strategy backtesting & optimization',
    'Custom trading rules & safety nets',
    'Options flow intelligence',
    'Broker integrations (IBKR, Schwab, TD)',
    'Advanced charting & analytics',
    'Tax optimization tools',
    'API access for automation',
    'Priority email support'
  ],
  highlights: [
    '30-day free trial',
    'Cancel anytime',
    'No hidden fees',
    'Refer friends = free months'
  ]
}

export default function UpgradePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isStartingTrial, setIsStartingTrial] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [referralCode, setReferralCode] = useState('')

  const handleStartTrial = async () => {
    // If user is not signed in, redirect to signup
    if (!session) {
      router.push('/auth/signup')
      return
    }

    setIsStartingTrial(true)
    
    try {
      // Start the free trial
      if (session.user.id) {
        await TrialManager.startTrial(session.user.id)
      }
      
      setTimeout(() => {
        alert(`🎉 Welcome to your 30-day free trial!\n\n✓ All premium features unlocked\n✓ No credit card required\n✓ Cancel anytime\n✓ Refer friends for bonus months\n\nEnjoy exploring Refract Premium!`)
        setIsStartingTrial(false)
        router.push('/dashboard?trial_started=true')
      }, 2000)
    } catch (error) {
      setIsStartingTrial(false)
      alert('Failed to start trial. Please try again.')
    }
  }

  const handleUpgradeToPremium = () => {
    setShowPaymentForm(true)
  }

  const handleReferralSubmit = async () => {
    if (!referralCode.trim()) return
    
    try {
      const response = await fetch('/api/referrals/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          referralCode: referralCode.trim(),
          newUserId: 'user_123' // TODO: Get from auth
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('🎉 Referral code applied! You and your referrer both get an extra month free!')
      } else {
        alert('Invalid referral code. Please check and try again.')
      }
    } catch (error) {
      alert('Failed to process referral code.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Start Your Free Trial
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Get full access to all premium features for 30 days. No credit card required.
          </p>
        </motion.div>

        {/* Main Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-500 to-purple-500 text-white px-4 py-1 text-sm font-medium">
              Most Popular
            </div>
            
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <Star className="h-12 w-12 text-blue-500" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                {subscriptionTier.name}
              </CardTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    ${subscriptionTier.price}
                  </span>
                  <span className="text-lg text-gray-600 dark:text-gray-400">
                    /month
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Clock className="h-3 w-3 mr-1" />
                  {subscriptionTier.trialDays}-day free trial
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
                {subscriptionTier.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {subscriptionTier.highlights.map((highlight, idx) => (
                  <div key={idx} className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {highlight}
                    </div>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {subscriptionTier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Referral Code Input */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <Gift className="h-5 w-5 text-purple-500" />
                  <span className="font-medium text-purple-700 dark:text-purple-300">
                    Have a referral code?
                  </span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="flex-1 px-3 py-2 border border-purple-200 dark:border-purple-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReferralSubmit}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  Get an extra month free! Your referrer gets one too.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleStartTrial}
                  disabled={isStartingTrial}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 text-lg"
                >
                  {isStartingTrial ? (
                    'Starting Your Trial...'
                  ) : session ? (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Start Free 30-Day Trial
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Sign Up & Start Trial
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleUpgradeToPremium}
                  className="w-full border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Skip Trial & Subscribe Now
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 space-y-1">
                <p>✓ No credit card required for trial</p>
                <p>✓ Cancel anytime • ✓ No long-term contracts • ✓ Secure payment processing</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Why Choose Refract */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl">
                Why Traders Choose Refract
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Star className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">AI-Powered Analysis</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get intelligent strategy recommendations based on real market conditions
                  </p>
                </div>
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Risk Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Built-in safety nets and custom trading rules protect your capital
                  </p>
                </div>
                <div className="text-center">
                  <Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Refer & Earn</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share your referral code and get free months for every friend who joins
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Program CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="text-center">
                <Gift className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
                  Love Refract? Share the Wealth!
                </h3>
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
                  Refer friends and both of you get an extra month of Premium free. No limit on referrals!
                </p>
                <div className="flex justify-center space-x-4 text-xs text-purple-500">
                  <span>✓ Unlimited referrals</span>
                  <span>✓ Instant rewards</span>
                  <span>✓ Everyone wins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}