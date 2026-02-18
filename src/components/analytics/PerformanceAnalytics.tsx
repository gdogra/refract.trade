'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar, 
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'

interface PerformanceAnalyticsProps {
  timeframe?: '1d' | '1w' | '1m' | '3m' | '1y' | 'all'
}

export default function PerformanceAnalytics({ timeframe = '1m' }: PerformanceAnalyticsProps) {
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceData()
  }, [timeframe])

  const fetchPerformanceData = async () => {
    setIsLoading(true)
    
    // Mock performance data (in production, fetch from analytics API)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockData = {
      summary: {
        totalReturn: 12.4,
        totalReturnDollar: 6200,
        winRate: 84.2,
        totalTrades: 127,
        avgHoldTime: 3.2,
        maxDrawdown: -5.8,
        sharpeRatio: 1.8,
        sortinoRatio: 2.4,
        calmarRatio: 2.1,
        profitFactor: 2.8
      },
      breakdown: {
        byStrategy: [
          { name: 'Iron Condor', trades: 45, winRate: 88.9, avgReturn: 2.8, totalPnL: 1890 },
          { name: 'Credit Spread', trades: 38, winRate: 81.6, avgReturn: 1.9, totalPnL: 1425 },
          { name: 'Covered Call', trades: 28, winRate: 85.7, avgReturn: 2.1, totalPnL: 1180 },
          { name: 'Protective Put', trades: 16, winRate: 75.0, avgReturn: 1.2, totalPnL: 385 }
        ],
        bySymbol: [
          { symbol: 'SPY', trades: 42, winRate: 90.5, avgReturn: 2.6, totalPnL: 2180 },
          { symbol: 'QQQ', trades: 31, winRate: 83.9, avgReturn: 2.9, totalPnL: 1790 },
          { symbol: 'AAPL', trades: 28, winRate: 82.1, avgReturn: 2.2, totalPnL: 1230 },
          { symbol: 'NVDA', trades: 26, winRate: 76.9, avgReturn: 3.8, totalPnL: 1000 }
        ],
        byTimeframe: [
          { period: 'Week 1', pnl: 340, trades: 8, winRate: 87.5 },
          { period: 'Week 2', pnl: 520, trades: 12, winRate: 91.7 },
          { period: 'Week 3', pnl: 180, trades: 9, winRate: 77.8 },
          { period: 'Week 4', pnl: 890, trades: 15, winRate: 86.7 }
        ]
      },
      riskMetrics: {
        maxConsecutiveLosses: 3,
        maxConsecutiveWins: 12,
        largestWin: 485,
        largestLoss: -320,
        avgWin: 95,
        avgLoss: -68,
        expectancy: 2.4,
        volatility: 0.158,
        beta: 0.85
      },
      insights: [
        {
          type: 'strength',
          title: 'Exceptional Win Rate',
          description: 'Your 84.2% win rate is in the top 5% of options traders',
          impact: 'high'
        },
        {
          type: 'opportunity', 
          title: 'Theta Strategy Excellence',
          description: 'Iron condors showing 88.9% win rate - consider increasing allocation',
          impact: 'medium'
        },
        {
          type: 'caution',
          title: 'Concentration Risk',
          description: 'Over 60% of profits from SPY/QQQ - consider diversification',
          impact: 'low'
        }
      ]
    }
    
    setPerformanceData(mockData)
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { summary, breakdown, riskMetrics, insights } = performanceData

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Return</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              +{summary.totalReturn}%
            </div>
            <div className="text-sm text-gray-500">${summary.totalReturnDollar.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {summary.winRate}%
            </div>
            <div className="text-sm text-gray-500">{summary.totalTrades} trades</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {summary.sharpeRatio}
            </div>
            <div className="text-sm text-gray-500">Risk-adjusted return</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Max Drawdown</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.maxDrawdown}%
            </div>
            <div className="text-sm text-gray-500">Peak to trough</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Strategy Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              <span>Performance by Strategy</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.byStrategy.map((strategy: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{strategy.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {strategy.trades} trades • {strategy.winRate}% win rate
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">
                      ${strategy.totalPnL.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {strategy.avgReturn}% avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <span>Performance by Symbol</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.bySymbol.map((symbolData: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{symbolData.symbol}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {symbolData.trades} trades • {symbolData.winRate}% win rate
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 dark:text-green-400">
                      ${symbolData.totalPnL.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {symbolData.avgReturn}% avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Risk Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-orange-500" />
              <span>Risk Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Risk Ratios</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                    <span className="font-medium">{summary.sharpeRatio}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sortino Ratio</span>
                    <span className="font-medium">{summary.sortinoRatio}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Calmar Ratio</span>
                    <span className="font-medium">{summary.calmarRatio}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Profit Factor</span>
                    <span className="font-medium text-green-600">{summary.profitFactor}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Trade Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Largest Win</span>
                    <span className="font-medium text-green-600">${riskMetrics.largestWin}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Largest Loss</span>
                    <span className="font-medium text-red-600">${riskMetrics.largestLoss}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Win</span>
                    <span className="font-medium">${riskMetrics.avgWin}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Loss</span>
                    <span className="font-medium">${riskMetrics.avgLoss}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Streaks</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Max Winning Streak</span>
                    <span className="font-medium text-green-600">{riskMetrics.maxConsecutiveWins}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Max Losing Streak</span>
                    <span className="font-medium text-red-600">{riskMetrics.maxConsecutiveLosses}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Expectancy</span>
                    <span className="font-medium">${riskMetrics.expectancy}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Portfolio Beta</span>
                    <span className="font-medium">{riskMetrics.beta}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <span>AI Performance Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {insights.map((insight: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'strength' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    insight.type === 'opportunity' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {insight.type === 'strength' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {insight.type === 'opportunity' && <Target className="h-4 w-4 text-blue-500" />}
                    {insight.type === 'caution' && <TrendingDown className="h-4 w-4 text-yellow-500" />}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {insight.title}
                    </span>
                    <Badge 
                      variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'outline' : 'secondary'}
                      className="text-xs"
                    >
                      {insight.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {insight.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Weekly Performance Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-500" />
              <span>Weekly Performance Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {breakdown.byTimeframe.map((week: any, idx: number) => (
                <div key={idx} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {week.period}
                  </div>
                  <div className={`text-xl font-bold ${week.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {week.pnl >= 0 ? '+' : ''}${week.pnl}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {week.trades} trades • {week.winRate}% win
                  </div>
                  <div className="mt-2">
                    <div className={`w-full h-2 rounded-full ${
                      week.winRate >= 90 ? 'bg-green-500' :
                      week.winRate >= 80 ? 'bg-blue-500' :
                      week.winRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}