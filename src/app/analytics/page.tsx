'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, PieChart, Zap, AlertTriangle, Brain, Sparkles, Target, Activity, Bell, Play, RefreshCw, Eye, Shield, Users, Gauge } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Import analytics components
import VolatilityIntelligence from '@/components/analytics/VolatilityIntelligence'
import PositionManagement from '@/components/analytics/PositionManagement'
import AIPortfolioPilot from '@/components/analytics/AIPortfolioPilot'
import WhatCouldHurtYou from '@/components/analytics/WhatCouldHurtYou'
import DynamicRiskBudgeting from '@/components/analytics/DynamicRiskBudgeting'
import AIInsightsComingSoon from '@/components/analytics/AIInsightsComingSoon'
import { Tooltip } from '@/components/ui/tooltip'
import PremiumGate from '@/components/ui/PremiumGate'
import OpportunitiesScanner from '@/components/analytics/OpportunitiesScanner'
import PortfolioHealthDashboard from '@/components/analytics/PortfolioHealthDashboard'
import MarketIntelligence from '@/components/analytics/MarketIntelligence'
import PerformanceAnalytics from '@/components/analytics/PerformanceAnalytics'
import RealTimeMonitoring from '@/components/analytics/RealTimeMonitoring'
import OptionsFlowAnalysis from '@/components/analytics/OptionsFlowAnalysis'
import StrategyBacktester from '@/components/analytics/StrategyBacktester'

// Import analytics engines
import { 
  AnalyticsController,
  calculatePortfolioGreeks,
  analyzeLiquidityProfile,
  scanForOpportunities,
  rankOpportunities,
  AnalyticsUtils
} from '@/lib/analytics'

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [portfolioData, setPortfolioData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const currentUserTier = 'trial' // In production, get this from user session
  const [analyticsController] = useState(() => new AnalyticsController({
    updateFrequency: 5,
    riskTolerance: 'moderate',
    focusAreas: ['volatility', 'liquidity', 'risk', 'opportunities']
  }))

  useEffect(() => {
    initializeAnalytics()
  }, [])

  const initializeAnalytics = async () => {
    setIsLoading(true)
    try {
      // Initialize with mock portfolio data
      const mockPositions = [
        {
          id: 'pos1',
          userId: 'user1',
          accountId: 'acc1',
          symbol: 'SPY',
          strategyType: 'Short Put',
          quantity: 10,
          entryDate: new Date('2026-02-13'),
          entryPrice: 2.50,
          unrealizedPnl: 125,
          delta: -0.25,
          gamma: 0.015,
          theta: -0.08,
          vega: 0.12,
          isActive: true,
          legs: [{
            id: 'leg1',
            positionId: 'pos1',
            symbol: 'SPY',
            optionType: 'put' as const,
            strike: 525,
            expiry: new Date('2026-03-21'),
            quantity: 10,
            side: 'sell' as const,
            entryPrice: 2.50,
            delta: -0.25,
            gamma: 0.015,
            theta: -0.08,
            vega: 0.12,
            iv: 0.18
          }]
        },
        {
          id: 'pos2',
          userId: 'user1',
          accountId: 'acc1',
          symbol: 'AAPL',
          strategyType: 'Long Call',
          quantity: 5,
          entryDate: new Date('2026-02-10'),
          entryPrice: 3.80,
          unrealizedPnl: -95,
          delta: 0.45,
          gamma: 0.022,
          theta: -0.12,
          vega: 0.18,
          isActive: true,
          legs: [{
            id: 'leg2',
            positionId: 'pos2',
            symbol: 'AAPL',
            optionType: 'call' as const,
            strike: 190,
            expiry: new Date('2026-03-21'),
            quantity: 5,
            side: 'buy' as const,
            entryPrice: 3.80,
            delta: 0.45,
            gamma: 0.022,
            theta: -0.12,
            vega: 0.18,
            iv: 0.25
          }]
        }
      ]

      // Run comprehensive analysis
      const analyticsResult = await analyticsController.analyzeSymbol('SPY')
      
      // Calculate portfolio metrics
      const currentPrices = new Map([['SPY', 525], ['AAPL', 190]])
      const volatilities = new Map([['SPY', 0.18], ['AAPL', 0.25]])
      const portfolioGreeks = calculatePortfolioGreeks(mockPositions, currentPrices, volatilities)
      
      setAnalyticsData(analyticsResult)
      setPortfolioData({
        positions: mockPositions,
        greeks: portfolioGreeks,
        totalValue: mockPositions.reduce((sum, pos) => sum + (pos.quantity * pos.entryPrice * 100), 0),
        totalPnL: mockPositions.reduce((sum, pos) => sum + (pos.unrealizedPnl || 0), 0),
        totalRisk: mockPositions.reduce((sum, pos) => sum + Math.abs(pos.delta || 0) * pos.quantity * 100, 0)
      })
    } catch (error) {
      console.error('Analytics initialization error:', error)
    }
    setIsLoading(false)
  }

  const refreshAnalytics = async () => {
    setIsLoading(true)
    await initializeAnalytics()
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Brain className="h-8 w-8 text-purple-600 mr-3" />
                Analytics & AI Insights
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Hedge-fund-grade analytics and AI-powered trading intelligence
              </p>
            </div>
            <Button 
              onClick={refreshAnalytics}
              disabled={isLoading}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div 
            className="flex justify-center items-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading analytics engines...</p>
            </div>
          </motion.div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <TabsList className="grid w-full grid-cols-5">
                <Tooltip content="Portfolio overview with key metrics and P&L summary">
                  <TabsTrigger value="overview" className="flex items-center space-x-1">
                    <Gauge className="h-4 w-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="Market intelligence with AI sentiment analysis and institutional insights">
                  <TabsTrigger value="market-intel" className="flex items-center space-x-1">
                    <Brain className="h-4 w-4" />
                    <span className="hidden sm:inline">Market AI</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="Performance tracking with detailed analytics and strategy breakdowns">
                  <TabsTrigger value="performance" className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="hidden sm:inline">Performance</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="Real-time portfolio monitoring with automated alerts">
                  <TabsTrigger value="monitoring" className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Live</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="Options flow analysis tracking institutional money movements">
                  <TabsTrigger value="flow" className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Flow</span>
                  </TabsTrigger>
                </Tooltip>
              </TabsList>
              
              <TabsList className="grid w-full grid-cols-6">
                <Tooltip content="Volatility intelligence with IV surface analysis and forecasting">
                  <TabsTrigger value="volatility" className="flex items-center space-x-1">
                    <BarChart3 className="h-4 w-4" />
                    <span className="hidden sm:inline">Volatility</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="Position management with Greeks analysis and adjustment recommendations">
                  <TabsTrigger value="positions" className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span className="hidden sm:inline">Positions</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="AI-powered portfolio assistant providing personalized guidance">
                  <TabsTrigger value="ai-pilot" className="flex items-center space-x-1">
                    <Sparkles className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Pilot</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="Advanced risk analysis showing worst-case scenarios and protection strategies">
                  <TabsTrigger value="risk-analysis" className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Risk</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="Strategy backtesting with historical performance analysis">
                  <TabsTrigger value="backtest" className="flex items-center space-x-1">
                    <Play className="h-4 w-4" />
                    <span className="hidden sm:inline">Backtest</span>
                  </TabsTrigger>
                </Tooltip>
                <Tooltip content="Advanced ML-powered trading intelligence in development">
                  <TabsTrigger value="ai-insights-soon" className="flex items-center space-x-1">
                    <Brain className="h-4 w-4" />
                    <span className="hidden sm:inline">AI Future</span>
                  </TabsTrigger>
                </Tooltip>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Portfolio Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5 text-blue-500" />
                        <span>Portfolio Summary</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {portfolioData && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                ${(portfolioData.totalValue / 1000).toFixed(1)}K
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${portfolioData.totalPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                ${portfolioData.totalPnL > 0 ? '+' : ''}${portfolioData.totalPnL}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Unrealized P&L</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Portfolio Delta</span>
                              <span className="font-medium">{portfolioData.greeks?.netDelta?.toFixed(3) || '0.000'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Portfolio Theta</span>
                              <span className="font-medium text-red-600">${portfolioData.greeks?.netTheta?.toFixed(0) || '0'}/day</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Portfolio Vega</span>
                              <span className="font-medium">{portfolioData.greeks?.netVega?.toFixed(1) || '0.0'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Market Conditions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                        <span>Market Intelligence</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">18.5</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">VIX Level</div>
                            <div className="text-xs text-red-600">-2.1%</div>
                          </div>
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">45%</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">IV Rank</div>
                            <div className="text-xs text-green-600">Moderate</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Market Regime</span>
                            <span className="font-medium text-green-600">Low Volatility</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Trend Strength</span>
                            <span className="font-medium">Moderate</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Options Flow</span>
                            <span className="font-medium text-blue-600">Bullish</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        <span>AI Recommendations</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                            💰 High Confidence Setup
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            SPY Iron Condor • 14 DTE • 68% PoP
                          </div>
                        </div>
                        
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            📊 Portfolio Balance
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            Consider adding delta hedge
                          </div>
                        </div>
                        
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                            🔮 Market Outlook
                          </div>
                          <div className="text-xs text-gray-700 dark:text-gray-300">
                            Neutral to bullish bias next 5 days
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="market-intel">
              <PremiumGate
                feature="advancedAnalytics"
                requiredTier="premium"
                currentTier={currentUserTier}
                title="Market Intelligence Dashboard"
                description="Access real-time sentiment analysis, institutional insights, and AI-powered market intelligence to make informed trading decisions."
              >
                <MarketIntelligence />
              </PremiumGate>
            </TabsContent>

            <TabsContent value="performance">
              <PerformanceAnalytics />
            </TabsContent>

            <TabsContent value="monitoring">
              <PremiumGate
                feature="realTimeData"
                requiredTier="premium"
                currentTier={currentUserTier}
                title="Real-Time Portfolio Monitoring"
                description="Monitor your portfolio with live data feeds, instant alerts, and automated risk notifications. Never miss a critical market move again."
              >
                <RealTimeMonitoring />
              </PremiumGate>
            </TabsContent>

            <TabsContent value="flow">
              <PremiumGate
                feature="institutionalFeatures"
                requiredTier="premium"
                currentTier={currentUserTier}
                title="Institutional Options Flow"
                description="Track smart money movements with institutional-grade options flow analysis, unusual activity alerts, and block trade monitoring."
              >
                <OptionsFlowAnalysis />
              </PremiumGate>
            </TabsContent>

            <TabsContent value="volatility">
              <VolatilityIntelligence 
                symbol="SPY"
                volatilitySurface={{
                  atmVolatility: 0.185,
                  lastUpdated: new Date(),
                  surfacePoints: [
                    { strike: 520, expiration: '2026-03-21', daysToExpiry: 31, impliedVolatility: 0.18, moneyness: 0.99, volume: 5000, openInterest: 12000 },
                    { strike: 525, expiration: '2026-03-21', daysToExpiry: 31, impliedVolatility: 0.175, moneyness: 1.00, volume: 8000, openInterest: 25000 },
                    { strike: 530, expiration: '2026-03-21', daysToExpiry: 31, impliedVolatility: 0.19, moneyness: 1.01, volume: 6000, openInterest: 18000 }
                  ]
                }}
                ivRankData={{
                  currentIV: 0.185,
                  ivRank: 45.2,
                  ivPercentile: 52.8,
                  historicalRange: { min: 0.12, max: 0.45, mean: 0.22, std: 0.08 },
                  period: '252d',
                  interpretation: 'normal',
                  recommendation: 'neutral'
                }}
                termStructure={[
                  { expiration: '2026-03-21', daysToExpiry: 31, atmVolatility: 0.185, percentile: 52.8, rank: 45.2 }
                ]}
                skewAnalysis={{
                  putSkew: 1.15,
                  callSkew: 0.95,
                  overallSkew: 1.05,
                  skewDirection: 'put_skew',
                  skewStrength: 'moderate'
                }}
                realizedVsImplied={{
                  realizedVolatility: 0.158,
                  impliedVolatility: 0.185,
                  spread: 0.027,
                  spreadPercentile: 68,
                  interpretation: 'fairly_valued',
                  expectedDirection: 'neutral'
                }}
              />
            </TabsContent>

            <TabsContent value="positions">
              <PositionManagement 
                positions={portfolioData ? portfolioData.positions.map((pos: any) => ({
                  id: pos.id,
                  symbol: pos.symbol,
                  strategy: pos.strategyType,
                  entryDate: pos.entryDate.toISOString().split('T')[0],
                  daysInTrade: Math.ceil((Date.now() - pos.entryDate.getTime()) / (1000 * 60 * 60 * 24)),
                  currentValue: pos.quantity * pos.entryPrice * 100,
                  unrealizedPnL: pos.unrealizedPnl || 0,
                  delta: pos.delta || 0,
                  gamma: pos.gamma || 0,
                  theta: pos.theta || 0,
                  vega: pos.vega || 0,
                  legs: pos.legs
                })) : []}
                exitIntelligence={[
                  { 
                    positionId: 'pos1', 
                    recommendations: [{ action: 'hold', confidence: 0.75, reasoning: 'Time decay favorable', expectedOutcome: 'Profit from theta', urgency: 'when_convenient', targetPrice: 1.50 }],
                    optimalTakeProfitRange: { min: 1.25, max: 1.75 },
                    timeToCloseGuidance: '21 DTE recommended',
                    rollRecommendations: [{ 
                      type: 'strike_roll', 
                      fromExpiry: new Date('2026-03-21'), 
                      toExpiry: new Date('2026-04-18'), 
                      fromStrike: 525, 
                      toStrike: 520, 
                      netCredit: 1.50, 
                      reasoning: 'Roll down for safety', 
                      probability: 0.68 
                    }],
                    riskAdjustedHoldVsClose: { 
                      holdScore: 0.75, 
                      closeScore: 0.25, 
                      recommendation: 'hold',
                      reasoning: 'Theta decay advantage outweighs risk',
                      keyFactors: ['favorable_time_decay', 'moderate_delta', 'stable_volatility']
                    }
                  }
                ]}
                tradeQualityScores={[
                  { 
                    positionId: 'pos1', 
                    overallScore: 'A', 
                    numericScore: 85, 
                    trend: 'improving',
                    nextReviewDate: new Date('2026-02-25'),
                    components: {
                      entryTiming: 0.9,
                      structuralEdge: 0.8,
                      riskManagement: 0.85,
                      execution: 0.9,
                      marketFit: 0.8
                    }
                  },
                  { 
                    positionId: 'pos2', 
                    overallScore: 'B', 
                    numericScore: 72, 
                    trend: 'stable',
                    nextReviewDate: new Date('2026-02-25'),
                    components: {
                      entryTiming: 0.7,
                      structuralEdge: 0.75,
                      riskManagement: 0.7,
                      execution: 0.8,
                      marketFit: 0.65
                    }
                  }
                ]}
                onPositionAction={(positionId: string, action: any) => {
                  console.log(`Position action: ${action} on ${positionId}`)
                }}
              />
            </TabsContent>

            <TabsContent value="ai-pilot">
              <PremiumGate
                feature="aiInsights"
                requiredTier="premium"
                currentTier={currentUserTier}
                title="AI Portfolio Pilot"
                description="Let our advanced AI manage your portfolio with machine learning insights, automated rebalancing, and predictive position adjustments."
              >
                <AIPortfolioPilot />
              </PremiumGate>
            </TabsContent>

            <TabsContent value="risk-analysis">
              <WhatCouldHurtYou />
            </TabsContent>

            <TabsContent value="backtest">
              <StrategyBacktester />
            </TabsContent>

            <TabsContent value="ai-insights-soon">
              <AIInsightsComingSoon />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}