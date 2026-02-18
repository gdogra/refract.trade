'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Check, Zap, Crown, Rocket, ArrowLeft, Sparkles, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'

const pricingTiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    badge: null,
    description: 'Perfect for getting started with options trading',
    features: [
      '5 positions maximum',
      'Basic portfolio overview',
      'Manual trade entry',
      'Simple P&L tracking',
      'Educational content',
      'Community forum access'
    ],
    limitations: [
      'No real-time data',
      'No advanced analytics',
      'No AI insights',
      'Basic risk metrics only'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    badge: 'Most Popular',
    badgeColor: 'bg-blue-500',
    description: 'Advanced tools for serious traders',
    features: [
      'Unlimited positions',
      'Real-time market data',
      'Advanced analytics dashboard',
      'AI-powered insights',
      'Risk analysis tools',
      'Options flow analysis',
      'Volatility intelligence',
      'Performance tracking',
      'Email alerts',
      'Priority support'
    ],
    limitations: []
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 79,
    period: 'month',
    badge: 'Best Value',
    badgeColor: 'bg-purple-500',
    description: 'Professional-grade platform for elite traders',
    features: [
      'Everything in Pro',
      'Advanced AI portfolio management',
      'Institutional-grade risk tools',
      'Custom strategy backtesting',
      'Real-time options flow alerts',
      'Advanced Greeks monitoring',
      'Tax optimization tools',
      'API access',
      'Phone support',
      'Custom indicators'
    ],
    limitations: []
  }
]

export default function UpgradePage() {
  const router = useRouter()
  const [selectedTier, setSelectedTier] = useState('pro')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpgrade = async (tierId: string) => {
    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      alert(`Upgrading to ${pricingTiers.find(t => t.id === tierId)?.name} plan!\n\nIn production, this would:\n• Process payment securely\n• Update your account tier immediately\n• Enable all premium features\n• Send confirmation email\n\nRedirecting to dashboard...`)
      setIsProcessing(false)
      router.push('/dashboard?upgraded=true')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
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
            Upgrade Your Trading Experience
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Unlock advanced AI insights, professional-grade analytics, and institutional tools to maximize your options trading success
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className={`relative h-full transition-all duration-300 ${
                tier.id === 'pro' ? 'ring-2 ring-blue-500 scale-105' : 
                tier.id === 'elite' ? 'ring-2 ring-purple-500' : ''
              } ${selectedTier === tier.id ? 'shadow-xl' : 'hover:shadow-lg'}`}>
                {tier.badge && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 ${tier.badgeColor} text-white text-xs font-medium rounded-full`}>
                    {tier.badge}
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {tier.id === 'free' && <Zap className="h-8 w-8 text-green-500" />}
                    {tier.id === 'pro' && <Star className="h-8 w-8 text-blue-500" />}
                    {tier.id === 'elite' && <Crown className="h-8 w-8 text-purple-500" />}
                  </div>
                  <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    ${tier.price}
                    <span className="text-lg text-gray-600 dark:text-gray-400">
                      /{tier.period}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {tier.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {tier.limitations.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Limitations:</p>
                      <div className="space-y-1">
                        {tier.limitations.map((limitation, idx) => (
                          <div key={idx} className="text-xs text-gray-500 dark:text-gray-400">
                            • {limitation}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    {tier.id === 'free' ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUpgrade(tier.id)}
                        disabled={isProcessing}
                        className={`w-full ${
                          tier.id === 'pro' 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {isProcessing ? 'Processing...' : `Upgrade to ${tier.name}`}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Why Upgrade?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Rocket className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get predictive market analysis and personalized trading recommendations
                  </p>
                </div>
                <div className="text-center">
                  <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Professional-grade risk analysis and performance tracking tools
                  </p>
                </div>
                <div className="text-center">
                  <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Real-Time Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Live market data, options flow, and institutional insights
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}