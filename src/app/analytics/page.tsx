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

  // Mock AI functions
  const generateStrategy = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate AI processing
    
    const strategies = [
      {
        name: 'Iron Condor on SPY',
        confidence: 87,
        expectedReturn: 15.2,
        riskLevel: 'Medium',
        reasoning: 'Low volatility environment with high IV crush potential after earnings season'
      },
      {
        name: 'Bull Call Spread on AAPL',
        confidence: 92,
        expectedReturn: 22.8,
        riskLevel: 'Low',
        reasoning: 'Strong technical momentum with bullish options flow detected'
      },
      {
        name: 'Short Put on TSLA',
        confidence: 78,
        expectedReturn: 18.5,
        riskLevel: 'High',
        reasoning: 'Oversold conditions with high implied volatility'
      }
    ]
    
    setAiStrategyResult(strategies[Math.floor(Math.random() * strategies.length)])
    setIsAnalyzing(false)
  }

  const runPredictiveAnalysis = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setPredictiveAnalysis({
      symbol: 'SPY',
      currentPrice: 452.30,
      predictedPrice: 465.80,
      confidence: 84,
      timeframe: '1 week',
      factors: ['Strong momentum', 'Low volatility', 'Options flow bullish'],
      risk: 'Moderate'
    })
    setIsAnalyzing(false)
  }

  const generateSmartAlerts = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const alerts = [
      {
        id: 1,
        type: 'opportunity',
        symbol: 'NVDA',
        message: 'Unusual options activity detected - High put volume',
        priority: 'high',
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: 2,
        type: 'risk',
        symbol: 'TSLA',
        message: 'Volatility spike expected after earnings',
        priority: 'medium',
        timestamp: new Date().toLocaleTimeString()
      },
      {
        id: 3,
        type: 'entry',
        symbol: 'SPY',
        message: 'Optimal entry point reached for iron condor',
        priority: 'high',
        timestamp: new Date().toLocaleTimeString()
      }
    ]
    
    setSmartAlerts(alerts)
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">SPY</span>
                    <span className="text-sm font-medium text-green-600">+1.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">VIX</span>
                    <span className="text-sm font-medium text-red-600">-2.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">QQQ</span>
                    <span className="text-sm font-medium text-green-600">+0.8%</span>
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
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Return</span>
                      <span className="text-sm font-medium text-green-600">+15.3%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Win Rate</span>
                      <span className="text-sm font-medium text-blue-600">68%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
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
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio Beta</span>
                    <span className="text-sm font-medium">0.85</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Max Drawdown</span>
                    <span className="text-sm font-medium text-red-600">-5.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                    <span className="text-sm font-medium text-green-600">1.4</span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Market Sentiment</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current market sentiment is moderately bullish with increased volatility expected in the tech sector.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recommended Actions</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Consider protective puts on overweight positions</li>
                      <li>• Look for covered call opportunities on stable holdings</li>
                      <li>• Monitor VIX levels for volatility trades</li>
                    </ul>
                  </div>
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
                      className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                    >
                      <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                        {aiStrategyResult.name}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                          <span className="font-medium text-green-600">{aiStrategyResult.confidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Expected Return:</span>
                          <span className="font-medium text-green-600">{aiStrategyResult.expectedReturn}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Risk Level:</span>
                          <span className={`font-medium ${
                            aiStrategyResult.riskLevel === 'Low' ? 'text-green-600' :
                            aiStrategyResult.riskLevel === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                          }`}>{aiStrategyResult.riskLevel}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">
                        {aiStrategyResult.reasoning}
                      </p>
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
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-blue-900 dark:text-blue-300">
                          {predictiveAnalysis.symbol}
                        </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {predictiveAnalysis.timeframe}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Current:</span>
                          <span className="font-medium">${predictiveAnalysis.currentPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Predicted:</span>
                          <span className="font-medium text-green-600">
                            ${predictiveAnalysis.predictedPrice}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                          <span className="font-medium text-blue-600">
                            {predictiveAnalysis.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Key factors: </span>
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {predictiveAnalysis.factors.join(', ')}
                        </span>
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
                      className="space-y-3"
                    >
                      {smartAlerts.map((alert, index) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-3 rounded-lg border-l-4 ${
                            alert.priority === 'high' 
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-400' 
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                              {alert.symbol}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {alert.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {alert.message}
                          </p>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              alert.type === 'opportunity' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              alert.type === 'risk' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>
                              {alert.type.toUpperCase()}
                            </span>
                            <span className={`text-xs font-medium ${
                              alert.priority === 'high' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {alert.priority.toUpperCase()}
                            </span>
                          </div>
                        </motion.div>
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