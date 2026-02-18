'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  DollarSign,
  Percent,
  Clock,
  Award,
  AlertTriangle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'

interface StrategyBacktesterProps {
  defaultStrategy?: string
  defaultSymbol?: string
}

interface BacktestResult {
  strategy: string
  symbol: string
  period: string
  totalTrades: number
  winRate: number
  totalReturn: number
  sharpeRatio: number
  maxDrawdown: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  winLossRatio: number
  bestTrade: number
  worstTrade: number
  consecutiveWins: number
  consecutiveLosses: number
}

export default function StrategyBacktester({ 
  defaultStrategy = 'iron_condor', 
  defaultSymbol = 'SPY' 
}: StrategyBacktesterProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<BacktestResult | null>(null)
  const [currentStrategy, setCurrentStrategy] = useState(defaultStrategy)
  const [currentSymbol, setCurrentSymbol] = useState(defaultSymbol)
  const [progress, setProgress] = useState(0)
  const [backtestHistory, setBacktestHistory] = useState<any[]>([])

  const strategies = [
    { id: 'iron_condor', name: 'Iron Condor', description: 'High probability credit strategy' },
    { id: 'credit_spread', name: 'Credit Spread', description: 'Directional credit strategy' },
    { id: 'covered_call', name: 'Covered Call', description: 'Income generation strategy' },
    { id: 'protective_put', name: 'Protective Put', description: 'Hedging strategy' },
    { id: 'long_straddle', name: 'Long Straddle', description: 'Volatility expansion play' },
    { id: 'short_strangle', name: 'Short Strangle', description: 'Range-bound strategy' }
  ]

  const symbols = ['SPY', 'QQQ', 'IWM', 'AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN']

  const runBacktest = async () => {
    setIsRunning(true)
    setProgress(0)
    
    try {
      // Simulate backtest progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Generate realistic backtest results
      const strategy = strategies.find(s => s.id === currentStrategy)
      const winRate = 0.65 + Math.random() * 0.25 // 65-90%
      const totalTrades = Math.floor(Math.random() * 200) + 50 // 50-250 trades
      const avgWin = 50 + Math.random() * 150 // $50-200
      const avgLoss = -30 - Math.random() * 70 // -$30 to -100
      
      const backtestResult: BacktestResult = {
        strategy: strategy?.name || 'Unknown',
        symbol: currentSymbol,
        period: '1 Year',
        totalTrades,
        winRate: winRate * 100,
        totalReturn: ((avgWin * winRate - Math.abs(avgLoss) * (1 - winRate)) * totalTrades / 10000) * 100,
        sharpeRatio: 1.2 + Math.random() * 1.5, // 1.2-2.7
        maxDrawdown: -(Math.random() * 15 + 5), // -5% to -20%
        profitFactor: (avgWin * winRate) / (Math.abs(avgLoss) * (1 - winRate)),
        avgWin,
        avgLoss,
        winLossRatio: avgWin / Math.abs(avgLoss),
        bestTrade: avgWin * (1.5 + Math.random()),
        worstTrade: avgLoss * (1.5 + Math.random()),
        consecutiveWins: Math.floor(Math.random() * 15) + 3,
        consecutiveLosses: Math.floor(Math.random() * 5) + 1
      }
      
      setResults(backtestResult)
      
      // Add to history
      setBacktestHistory(prev => [
        {
          ...backtestResult,
          timestamp: new Date(),
          id: Date.now()
        },
        ...prev.slice(0, 4) // Keep last 5 backtests
      ])
      
    } catch (error) {
      console.error('Backtest error:', error)
    }
    
    setIsRunning(false)
    setProgress(100)
  }

  const resetBacktest = () => {
    setResults(null)
    setProgress(0)
  }

  const getPerformanceGrade = (sharpe: number, winRate: number) => {
    const score = (sharpe * 0.6) + (winRate * 0.004) // Weighted scoring
    if (score >= 2.5) return { grade: 'A+', color: 'text-green-600' }
    if (score >= 2.0) return { grade: 'A', color: 'text-green-600' }
    if (score >= 1.5) return { grade: 'B+', color: 'text-blue-600' }
    if (score >= 1.0) return { grade: 'B', color: 'text-blue-600' }
    if (score >= 0.5) return { grade: 'C', color: 'text-yellow-600' }
    return { grade: 'D', color: 'text-red-600' }
  }

  return (
    <div className="space-y-6">
      {/* Backtest Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-purple-500" />
              <span>Strategy Backtester</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Strategy
                </label>
                <select
                  value={currentStrategy}
                  onChange={(e) => setCurrentStrategy(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={isRunning}
                >
                  {strategies.map(strategy => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name} - {strategy.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol
                </label>
                <select
                  value={currentSymbol}
                  onChange={(e) => setCurrentSymbol(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={isRunning}
                >
                  {symbols.map(symbol => (
                    <option key={symbol} value={symbol}>
                      {symbol}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end space-x-2">
                <Button
                  onClick={runBacktest}
                  disabled={isRunning}
                  className="flex-1 flex items-center justify-center space-x-2"
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Run Backtest</span>
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={resetBacktest}
                  variant="outline"
                  disabled={isRunning}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {isRunning && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Backtest Progress</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-purple-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Backtest Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span>Backtest Results</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{results.strategy}</Badge>
                  <Badge variant="outline">{results.symbol}</Badge>
                  {(() => {
                    const grade = getPerformanceGrade(results.sharpeRatio, results.winRate)
                    return <Badge className={grade.color}>{grade.grade}</Badge>
                  })()}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Key Metrics */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>Performance</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Return</span>
                      <span className={`font-bold ${results.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {results.totalReturn >= 0 ? '+' : ''}{results.totalReturn.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Win Rate</span>
                      <span className="font-medium">{results.winRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Trades</span>
                      <span className="font-medium">{results.totalTrades}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Sharpe Ratio</span>
                      <span className="font-medium">{results.sharpeRatio.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span>Risk Analysis</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Max Drawdown</span>
                      <span className="font-bold text-red-600">{results.maxDrawdown.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Profit Factor</span>
                      <span className="font-medium">{results.profitFactor.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Win/Loss Ratio</span>
                      <span className="font-medium">{results.winLossRatio.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Max Consecutive Losses</span>
                      <span className="font-medium text-orange-600">{results.consecutiveLosses}</span>
                    </div>
                  </div>
                </div>

                {/* Trade Statistics */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span>Trade Stats</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Avg Win</span>
                      <span className="font-medium text-green-600">${results.avgWin.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Avg Loss</span>
                      <span className="font-medium text-red-600">${results.avgLoss.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Best Trade</span>
                      <span className="font-medium text-green-600">${results.bestTrade.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Worst Trade</span>
                      <span className="font-medium text-red-600">${results.worstTrade.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    <span>Advanced</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Winning Streak</span>
                      <span className="font-medium text-green-600">{results.consecutiveWins}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Expectancy</span>
                      <span className="font-medium">
                        ${((results.avgWin * results.winRate/100) + (results.avgLoss * (1 - results.winRate/100))).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Recovery Factor</span>
                      <span className="font-medium">
                        {(Math.abs(results.totalReturn / results.maxDrawdown)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Calmar Ratio</span>
                      <span className="font-medium">
                        {(results.totalReturn / Math.abs(results.maxDrawdown)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <div className="flex items-center space-x-2 mb-3">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">AI Performance Analysis</span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className={`p-3 rounded border ${
                    results.sharpeRatio > 1.5 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    results.sharpeRatio > 1.0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Risk-Adjusted Performance
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {results.sharpeRatio > 1.5 ? 'Excellent' : 
                       results.sharpeRatio > 1.0 ? 'Good' : 'Needs Improvement'} Sharpe ratio indicates 
                      {results.sharpeRatio > 1.5 ? ' exceptional' : 
                       results.sharpeRatio > 1.0 ? ' solid' : ' weak'} risk-adjusted returns.
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded border ${
                    results.winRate > 80 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    results.winRate > 70 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
                    'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                  }`}>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Consistency Analysis
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {results.winRate > 80 ? 'Highly consistent' : 
                       results.winRate > 70 ? 'Reasonably consistent' : 'Inconsistent'} strategy with 
                      {results.winRate.toFixed(0)}% success rate across {results.totalTrades} trades.
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded border ${
                    Math.abs(results.maxDrawdown) < 10 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    Math.abs(results.maxDrawdown) < 20 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}>
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      Drawdown Control
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.abs(results.maxDrawdown) < 10 ? 'Excellent' : 
                       Math.abs(results.maxDrawdown) < 20 ? 'Acceptable' : 'High'} maximum drawdown of 
                      {results.maxDrawdown.toFixed(1)}% shows 
                      {Math.abs(results.maxDrawdown) < 10 ? ' strong' : ' concerning'} risk control.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Backtest History */}
      {backtestHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                <span>Recent Backtests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backtestHistory.map((backtest, idx) => (
                  <div key={backtest.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {backtest.strategy} • {backtest.symbol}
                        </div>
                        <div className="text-xs text-gray-500">
                          {backtest.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="text-center">
                        <div className={`font-bold ${backtest.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {backtest.totalReturn >= 0 ? '+' : ''}{backtest.totalReturn.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Return</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {backtest.winRate.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Win Rate</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {backtest.sharpeRatio.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">Sharpe</div>
                      </div>
                      
                      {(() => {
                        const grade = getPerformanceGrade(backtest.sharpeRatio, backtest.winRate)
                        return (
                          <Badge className={grade.color}>
                            {grade.grade}
                          </Badge>
                        )
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}