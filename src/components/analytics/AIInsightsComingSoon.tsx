'use client'

import { motion } from 'framer-motion'
import { Brain, Sparkles, Rocket, Clock, Bell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

const upcomingFeatures = [
  {
    icon: Brain,
    title: 'Predictive Market Intelligence',
    description: 'AI models that predict market movements 72 hours in advance',
    eta: 'Q2 2026',
    color: 'text-blue-500'
  },
  {
    icon: Sparkles,
    title: 'Automated Strategy Selection',
    description: 'AI automatically selects optimal strategies based on market conditions',
    eta: 'Q2 2026',
    color: 'text-purple-500'
  },
  {
    icon: Rocket,
    title: 'Deep Learning Risk Engine',
    description: 'Advanced neural networks for superior risk prediction and management',
    eta: 'Q3 2026',
    color: 'text-green-500'
  },
  {
    icon: Bell,
    title: 'Proactive Position Alerts',
    description: 'AI notifications that predict when to adjust positions before losses',
    eta: 'Q2 2026',
    color: 'text-orange-500'
  }
]

export default function AIInsightsComingSoon() {
  const router = useRouter()

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 border-purple-300 dark:border-purple-700">
          <CardContent className="p-8 text-center">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Brain className="h-16 w-16 text-purple-500 mx-auto mb-6" />
            </motion.div>
            
            <Badge variant="outline" className="text-purple-600 border-purple-600 mb-4">
              COMING SOON
            </Badge>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Advanced ML-powered Trading Intelligence
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
              Revolutionary AI features currently in development that will transform how you trade options. 
              Be the first to experience the future of algorithmic trading intelligence.
            </p>
            
            <motion.div
              className="flex justify-center space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                onClick={() => {
                  alert('Waitlist Notification Setup\n\nYou will be notified when:\n• Beta testing begins\n• New features are released\n• Early access becomes available\n\nNotifications can be sent via email or in-app alerts.')
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Bell className="h-4 w-4 mr-2" />
                Join Beta Waitlist
              </Button>
              <Button 
                variant="outline"
                onClick={() => router.push('/upgrade')}
                className="border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                Upgrade for Early Access
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Feature Preview Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Rocket className="h-6 w-6 text-blue-500" />
              <span>In Development</span>
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400">
              Cutting-edge features being built by our AI research team
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {feature.description}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        ETA: {feature.eta}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Development Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Development Timeline
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4"
                >
                  <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-green-600">1</span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Research Phase</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Deep learning model architecture and data pipeline development
                  </p>
                  <Badge className="bg-green-100 text-green-800 mt-2">Completed</Badge>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4"
                >
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-blue-600">2</span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Training Phase</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Training AI models on historical market data and backtesting
                  </p>
                  <Badge className="bg-blue-100 text-blue-800 mt-2">In Progress</Badge>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4"
                >
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg font-bold text-purple-600">3</span>
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Beta Release</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Limited beta testing with select Pro and Elite users
                  </p>
                  <Badge variant="outline" className="mt-2">Q2 2026</Badge>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Newsletter Signup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Stay Updated
            </h3>
            <p className="mb-4 opacity-90">
              Get exclusive updates on AI feature development and early access opportunities
            </p>
            <Button 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-purple-600"
              onClick={() => {
                alert('Newsletter Subscription\n\nYou will receive:\n• Monthly development updates\n• Feature preview access\n• Beta testing invitations\n• Trading insights from our AI team\n\nSubscription confirmed!')
              }}
            >
              Subscribe to Updates
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}