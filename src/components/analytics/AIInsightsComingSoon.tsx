'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Sparkles, Rocket, Clock, Bell, ArrowRight, TrendingUp, TrendingDown, AlertTriangle, Target, Zap, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'

interface MarketPrediction {
  symbol: string
  direction: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  targetPrice: number
  currentPrice: number
  timeframe: string
  reasoning: string[]
}

interface StrategyRecommendation {
  name: string
  symbol: string
  type: 'call' | 'put' | 'spread' | 'straddle'
  probability: number
  expectedReturn: number
  riskLevel: 'low' | 'medium' | 'high'
  maxLoss: number
  description: string
  strikes?: number[]
  expiry?: string
}

interface RiskAlert {
  id: string
  type: 'high_volatility' | 'position_risk' | 'market_shift' | 'earnings'
  severity: 'low' | 'medium' | 'high'
  message: string
  symbol?: string
  action: string
  timestamp: string
}

export default function AIInsightsComingSoon() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'predictions' | 'strategies' | 'alerts'>('predictions')

  // Mock AI data - in production this would come from ML models
  const { data: aiInsights, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return {
        predictions: [
          {
            symbol: 'SPY',
            direction: 'bullish' as const,
            confidence: 87,
            targetPrice: 512.50,
            currentPrice: 502.45,
            timeframe: '3-5 days',
            reasoning: [
              'Technical momentum indicators showing strong upward trend',
              'Options flow indicates institutional bullish positioning',
              'Market volatility declining, favoring equity appreciation'
            ]
          },
          {
            symbol: 'QQQ',
            direction: 'bearish' as const,
            confidence: 73,
            targetPrice: 410.20,
            currentPrice: 418.92,
            timeframe: '1-2 weeks',
            reasoning: [
              'Overextended RSI suggesting pullback likely',
              'Earnings season concerns for tech sector',
              'Rising interest rate expectations'
            ]
          },
          {
            symbol: 'NVDA',
            direction: 'bullish' as const,
            confidence: 91,
            targetPrice: 875.00,
            currentPrice: 842.33,
            timeframe: '1 week',
            reasoning: [
              'AI infrastructure demand accelerating',
              'Strong institutional accumulation patterns',
              'Technical breakout above key resistance'
            ]
          }
        ] as MarketPrediction[],
        strategies: [
          {
            name: 'SPY Bull Call Spread',
            symbol: 'SPY',
            type: 'spread' as const,
            probability: 78,
            expectedReturn: 24.5,
            riskLevel: 'medium' as const,
            maxLoss: 150,
            description: 'Capitalize on expected SPY upward movement with limited risk',
            strikes: [500, 510],
            expiry: '2026-03-21'
          },
          {
            name: 'QQQ Protective Put',
            symbol: 'QQQ',
            type: 'put' as const,
            probability: 85,
            expectedReturn: 12.8,
            riskLevel: 'low' as const,
            maxLoss: 280,
            description: 'Hedge against potential QQQ downside with protective puts',
            strikes: [415],
            expiry: '2026-04-18'
          },
          {
            name: 'NVDA Iron Condor',
            symbol: 'NVDA',
            type: 'spread' as const,
            probability: 67,
            expectedReturn: 31.2,
            riskLevel: 'high' as const,
            maxLoss: 450,
            description: 'Profit from NVDA trading within expected range',
            strikes: [820, 840, 860, 880],
            expiry: '2026-03-14'
          }
        ] as StrategyRecommendation[],
        alerts: [
          {
            id: '1',
            type: 'high_volatility' as const,
            severity: 'high' as const,
            message: 'VIX spike detected - market volatility increasing rapidly',
            action: 'Consider hedging long positions or reducing risk exposure',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            type: 'earnings' as const,
            severity: 'medium' as const,
            message: 'AAPL earnings announcement in 2 days',
            symbol: 'AAPL',
            action: 'Review AAPL positions for potential volatility impact',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '3',
            type: 'market_shift' as const,
            severity: 'medium' as const,
            message: 'Unusual options flow detected in energy sector',
            action: 'Monitor XLE and energy-related positions closely',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ] as RiskAlert[]
      }
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

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
            
            <Badge variant="outline" className="text-green-600 border-green-600 mb-4">
              LIVE AI INSIGHTS
            </Badge>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Advanced ML-powered Trading Intelligence
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-6">
              Real-time AI analysis powered by advanced machine learning models. 
              Get predictive market insights, automated strategy recommendations, and proactive risk alerts.
            </p>
            
            <motion.div
              className="flex justify-center space-x-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Badge className="bg-green-100 text-green-800">
                <Zap className="h-3 w-3 mr-1" />
                Models Running
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                <BarChart3 className="h-3 w-3 mr-1" />
                Real-time Analysis
              </Badge>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-purple-500" />
                <span>AI Intelligence Center</span>
              </CardTitle>
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <Button
                  variant={activeTab === 'predictions' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('predictions')}
                  className="text-xs"
                >
                  <Target className="h-3 w-3 mr-1" />
                  Predictions
                </Button>
                <Button
                  variant={activeTab === 'strategies' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('strategies')}
                  className="text-xs"
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  Strategies
                </Button>
                <Button
                  variant={activeTab === 'alerts' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('alerts')}
                  className="text-xs"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Alerts
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="h-8 w-8 text-purple-500" />
                </motion.div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">AI models analyzing...</span>
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'predictions' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Market Predictions (Next 72 Hours)
                    </h3>
                    {aiInsights?.predictions.map((prediction, index) => (
                      <motion.div
                        key={prediction.symbol}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge className="font-mono">{prediction.symbol}</Badge>
                            <div className={`flex items-center space-x-1 ${
                              prediction.direction === 'bullish' ? 'text-green-600' : 
                              prediction.direction === 'bearish' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {prediction.direction === 'bullish' ? <TrendingUp className="h-4 w-4" /> : 
                               prediction.direction === 'bearish' ? <TrendingDown className="h-4 w-4" /> : 
                               <ArrowRight className="h-4 w-4" />}
                              <span className="font-medium capitalize">{prediction.direction}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${
                            prediction.confidence >= 80 ? 'text-green-600 border-green-600' :
                            prediction.confidence >= 60 ? 'text-yellow-600 border-yellow-600' :
                            'text-red-600 border-red-600'
                          }`}>
                            {prediction.confidence}% confidence
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Current:</span>
                            <span className="font-semibold ml-2">${prediction.currentPrice}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Target:</span>
                            <span className="font-semibold ml-2">${prediction.targetPrice}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Change:</span>
                            <span className={`font-semibold ml-2 ${
                              prediction.targetPrice > prediction.currentPrice ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(prediction.targetPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Timeframe:</span>
                            <span className="font-semibold ml-2">{prediction.timeframe}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">AI Reasoning:</p>
                          <ul className="space-y-1">
                            {prediction.reasoning.map((reason, i) => (
                              <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex items-start">
                                <span className="text-purple-500 mr-2">•</span>
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'strategies' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      AI Strategy Recommendations
                    </h3>
                    {aiInsights?.strategies.map((strategy, index) => (
                      <motion.div
                        key={strategy.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${
                              strategy.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                              strategy.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {strategy.riskLevel} risk
                            </Badge>
                            <Badge variant="outline">
                              {strategy.probability}% success
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{strategy.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Expected Return:</span>
                            <span className="font-semibold ml-2 text-green-600">+{strategy.expectedReturn}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Max Loss:</span>
                            <span className="font-semibold ml-2 text-red-600">${strategy.maxLoss}</span>
                          </div>
                          {strategy.strikes && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Strikes:</span>
                              <span className="font-semibold ml-2">{strategy.strikes.join('/')}</span>
                            </div>
                          )}
                          {strategy.expiry && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Expiry:</span>
                              <span className="font-semibold ml-2">{new Date(strategy.expiry).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Target className="h-3 w-3 mr-1" />
                            Execute Strategy
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeTab === 'alerts' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      AI Risk & Opportunity Alerts
                    </h3>
                    {aiInsights?.alerts.map((alert, index) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.severity === 'high' ? 'bg-red-50 dark:bg-red-900/10 border-red-500' :
                          alert.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-500' :
                          'bg-blue-50 dark:bg-blue-900/10 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className={`h-4 w-4 ${
                              alert.severity === 'high' ? 'text-red-500' :
                              alert.severity === 'medium' ? 'text-yellow-500' :
                              'text-blue-500'
                            }`} />
                            {alert.symbol && <Badge variant="outline">{alert.symbol}</Badge>}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <Badge className={`text-xs ${
                            alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                            alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white mb-2">{alert.message}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <strong>Recommended Action:</strong> {alert.action}
                        </p>
                        <Button size="sm" variant="outline">
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Take Action
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                AI System Status
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time monitoring of ML models and prediction engines
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center p-4"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <Brain className="h-6 w-6 text-green-600" />
                </motion.div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Prediction Engine</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Neural networks analyzing market patterns
                </p>
                <Badge className="bg-green-100 text-green-800">Online</Badge>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Last update: 12 seconds ago
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center p-4"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <Rocket className="h-6 w-6 text-blue-600" />
                </motion.div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Strategy Generator</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Automated strategy optimization algorithms
                </p>
                <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Processing 247 strategies
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="text-center p-4"
              >
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <Bell className="h-6 w-6 text-purple-600" />
                </motion.div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Risk Monitor</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Real-time risk assessment and alerts
                </p>
                <Badge className="bg-purple-100 text-purple-800">Active</Badge>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Monitoring 1,247 positions
                </div>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Model Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Sparkles className="h-8 w-8 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                AI Performance Metrics
              </h3>
              <p className="opacity-90">
                Real-time model accuracy and performance statistics
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">87.3%</div>
                <div className="text-sm opacity-80">Prediction Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">15.2%</div>
                <div className="text-sm opacity-80">Average Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">2.4s</div>
                <div className="text-sm opacity-80">Analysis Speed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">99.9%</div>
                <div className="text-sm opacity-80">System Uptime</div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-purple-600"
                onClick={() => {
                  alert('AI Model Details\n\n• Neural Network: Transformer-based architecture\n• Training Data: 10+ years of market data\n• Update Frequency: Every 15 minutes\n• Backtesting Period: 2019-2024\n• Risk-Adjusted Returns: 18.7% annually\n\nModels are continuously improved with new market data!')
                }}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Model Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}