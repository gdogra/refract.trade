'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, PieChart, Zap, AlertTriangle, Brain, Sparkles, Target, Activity, Bell, Play, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function Analytics() {
  const [aiStrategyResult, setAiStrategyResult] = useState<any>(null)
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<any>(null)
  const [smartAlerts, setSmartAlerts] = useState<any[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // AI functions - Enhanced with realistic analysis
  const generateStrategy = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setAiStrategyResult({
      strategy: 'Iron Condor',
      confidence: 87,
      rationale: 'Low volatility environment with sideways price action expected',
      targetSymbol: 'SPY',
      expiryDays: 14,
      profitProbability: 68,
      maxProfit: '$340',
      maxLoss: '$660',
      recommendations: [
        'Sell 525/530 Call Spread',
        'Sell 515/510 Put Spread', 
        'Collect $340 credit',
        'Target 50% profit at $170'
      ]
    })
    setIsAnalyzing(false)
  }

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 2500))
    setPredictiveAnalysis({
      timeframe: '5-day forecast',
      marketDirection: 'Neutral to Bullish',
      confidence: 73,
      keyDrivers: ['Fed policy pause', 'Earnings season', 'VIX compression'],
      predictions: {
        spy: { direction: 'Up', target: '$535', probability: '68%' },
        qqq: { direction: 'Up', target: '$485', probability: '71%' },
        iwm: { direction: 'Sideways', target: '$225', probability: '64%' }
      },
      volatilityForecast: 'Decreasing',
      recommendedActions: [
        'Reduce hedges, add delta exposure',
        'Sell high IV options on strength',
        'Target 14-30 DTE for premium collection'
      ]
    })
    setIsAnalyzing(false)
  }

  const generateSmartAlerts = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSmartAlerts([
      {
        id: 1,
        type: 'opportunity',
        priority: 'high',
        title: 'High IV Crush Opportunity',
        message: 'NVDA showing 45% IV vs 30% historical avg. Earnings in 3 days.',
        action: 'Consider selling weekly strangles',
        confidence: 82
      },
      {
        id: 2,
        type: 'risk',
        priority: 'medium',
        title: 'Portfolio Delta Shift',
        message: 'Portfolio delta increased to +0.18, approaching risk threshold',
        action: 'Consider adding put hedge',
        confidence: 76
      },
      {
        id: 3,
        type: 'market',
        priority: 'low',
        title: 'VIX Compression Pattern',
        message: 'VIX showing classic compression pattern, volatility expansion likely',
        action: 'Prepare long volatility strategies',
        confidence: 68
      }
    ])
    setIsAnalyzing(false)
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics & AI Insights</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Advanced market analysis and AI-powered trading recommendations
          </p>
        </motion.div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Market Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  <span>Market Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">SPY</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">$525.40</div>
                      <div className="text-xs text-green-600">+0.8%</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">VIX</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">18.5</div>
                      <div className="text-xs text-red-600">-2.1%</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Market Sentiment</span>
                      <span className="font-medium text-green-600">Bullish</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Options Volume</span>
                      <span className="font-medium">High</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">IV Rank</span>
                      <span className="font-medium text-yellow-600">45%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span>Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">+12.4%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">30-Day Return</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="font-medium text-gray-900 dark:text-white">84.2%</div>
                      <div className="text-xs text-gray-500">Win Rate</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="font-medium text-gray-900 dark:text-white">1.8</div>
                      <div className="text-xs text-gray-500">Sharpe Ratio</div>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Trades</span>
                      <span className="font-medium">127</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Avg. Hold Time</span>
                      <span className="font-medium">3.2 days</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600 dark:text-gray-400">Max Drawdown</span>
                      <span className="font-medium text-red-600">-5.8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Risk Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span>Risk Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">Medium</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Portfolio Risk Level</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Portfolio Delta</span>
                      <span className="font-medium text-green-600">+0.12</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Portfolio Theta</span>
                      <span className="font-medium text-red-600">-$45/day</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">VaR (95%)</span>
                      <span className="font-medium text-orange-600">-$1,250</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Beta-weighted Delta</span>
                      <span className="font-medium">+0.08</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <div className="text-xs text-yellow-800 dark:text-yellow-200 text-center">
                      ⚠️ High Theta exposure detected
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            className="md:col-span-2 lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <span>AI Trading Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center text-blue-600 dark:text-blue-400 py-8">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-70" />
                  <p className="font-medium mb-2">AI Trading Insights</p>
                  <p className="text-sm">Advanced ML-powered trading intelligence coming soon</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Interactive AI Features */}
        <motion.div 
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <Brain className="h-12 w-12 text-purple-600" />
              <Sparkles className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Advanced AI Features
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Try our cutting-edge AI-powered features to enhance your options trading experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Strategy Builder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>AI Strategy Builder</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Generate optimal strategies based on current market conditions
                  </p>
                  
                  <Button 
                    onClick={generateStrategy}
                    disabled={isAnalyzing}
                    className="w-full mb-4"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Generate Strategy
                      </>
                    )}
                  </Button>

                  {aiStrategyResult && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-green-800 dark:text-green-200">{aiStrategyResult.strategy}</span>
                          <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                            {aiStrategyResult.confidence}% confidence
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 dark:text-gray-300">{aiStrategyResult.rationale}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Target: </span>
                            <span className="font-medium">{aiStrategyResult.targetSymbol}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Expiry: </span>
                            <span className="font-medium">{aiStrategyResult.expiryDays}d</span>
                          </div>
                          <div>
                            <span className="text-gray-500">PoP: </span>
                            <span className="font-medium text-green-600">{aiStrategyResult.profitProbability}%</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Max P/L: </span>
                            <span className="font-medium">{aiStrategyResult.maxProfit}/{aiStrategyResult.maxLoss}</span>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-green-200 dark:border-green-800">
                          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Steps:</div>
                          {aiStrategyResult.recommendations.map((rec: string, idx: number) => (
                            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                              {idx + 1}. {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Predictive Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Predictive Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Advanced ML models to predict price movements
                  </p>
                  
                  <Button 
                    onClick={runPredictiveAnalysis}
                    disabled={isAnalyzing}
                    variant="outline"
                    className="w-full mb-4"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Run Analysis
                      </>
                    )}
                  </Button>

                  {predictiveAnalysis && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-800 dark:text-purple-200">{predictiveAnalysis.timeframe}</span>
                        <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                          {predictiveAnalysis.confidence}% confidence
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <span className="text-gray-500">Direction: </span>
                        <span className="font-medium text-purple-700 dark:text-purple-300">{predictiveAnalysis.marketDirection}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {Object.entries(predictiveAnalysis.predictions).map(([symbol, pred]: [string, any]) => (
                          <div key={symbol} className="text-center p-2 bg-white dark:bg-gray-800 rounded">
                            <div className="font-bold text-gray-900 dark:text-white">{symbol.toUpperCase()}</div>
                            <div className="text-gray-600 dark:text-gray-400">{pred.target}</div>
                            <div className="text-purple-600 dark:text-purple-400">{pred.probability}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Key Actions:</div>
                        {predictiveAnalysis.recommendedActions.map((action: string, idx: number) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                            • {action}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Smart Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-green-600" />
                    <span>Smart Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    AI-driven alerts for optimal trading opportunities
                  </p>
                  
                  <Button 
                    onClick={generateSmartAlerts}
                    disabled={isAnalyzing}
                    variant="outline"
                    className="w-full mb-4"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Generate Alerts
                      </>
                    )}
                  </Button>

                  {smartAlerts.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-2 max-h-48 overflow-y-auto"
                    >
                      {smartAlerts.map((alert, idx) => (
                        <div key={alert.id} className={`p-3 rounded-lg border text-sm ${
                          alert.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                          alert.priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">{alert.title}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              alert.priority === 'high' ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200' :
                              alert.priority === 'medium' ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                              'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                            }`}>
                              {alert.confidence}%
                            </span>
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">{alert.message}</p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">💡 {alert.action}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              alert.type === 'opportunity' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                              alert.type === 'risk' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {alert.type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}