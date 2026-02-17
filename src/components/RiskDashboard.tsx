'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Zap,
  Clock,
  BarChart3,
  Activity,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, formatCurrency, formatPercentage, getDaysToExpiry } from '@/lib/utils'

interface RiskScenario {
  name: string
  description: string
  priceMove: number // Percentage
  volMove: number // Percentage  
  timeDecay: number // Days
  expectedPnL: number
  probability: number // Percentage
}

interface VaRCalculation {
  var95: number // 95% Value at Risk
  var99: number // 99% Value at Risk
  expectedShortfall: number // Expected Shortfall (CVaR)
  maxDrawdown: number
}

interface StressTest {
  scenario: string
  marketMove: string
  portfolioPnL: number
  maxLoss: number
  recoveryTime: string // Days to break-even
  probability: number
}

// Mock data - in real app, this would be calculated from actual positions
const mockScenarios: RiskScenario[] = [
  {
    name: '1% Down',
    description: 'Market drops 1% overnight',
    priceMove: -1,
    volMove: 5,
    timeDecay: 1,
    expectedPnL: -245,
    probability: 15.9
  },
  {
    name: '2% Down',
    description: 'Market drops 2% with vol spike',
    priceMove: -2,
    volMove: 10,
    timeDecay: 1,
    expectedPnL: -520,
    probability: 4.6
  },
  {
    name: '5% Down',
    description: 'Significant market correction',
    priceMove: -5,
    volMove: 25,
    timeDecay: 1,
    expectedPnL: -1425,
    probability: 0.3
  },
  {
    name: '1% Up',
    description: 'Market rallies 1%',
    priceMove: 1,
    volMove: -2,
    timeDecay: 1,
    expectedPnL: 285,
    probability: 15.9
  },
  {
    name: '2% Up',
    description: 'Strong market rally',
    priceMove: 2,
    volMove: -5,
    timeDecay: 1,
    expectedPnL: 625,
    probability: 4.6
  },
  {
    name: 'Vol Crush',
    description: 'Volatility drops 20%',
    priceMove: 0,
    volMove: -20,
    timeDecay: 1,
    expectedPnL: -380,
    probability: 8.2
  }
]

const mockVaR: VaRCalculation = {
  var95: -850,
  var99: -1420,
  expectedShortfall: -1650,
  maxDrawdown: -2250
}

const mockStressTests: StressTest[] = [
  {
    scenario: 'Black Monday',
    marketMove: '-22% (1 day)',
    portfolioPnL: -4250,
    maxLoss: -5500,
    recoveryTime: '45',
    probability: 0.01
  },
  {
    scenario: 'Flash Crash',
    marketMove: '-9% (intraday)',
    portfolioPnL: -1850,
    maxLoss: -2200,
    recoveryTime: '12',
    probability: 0.1
  },
  {
    scenario: 'Earnings Shock',
    marketMove: '+/-15% (single stock)',
    portfolioPnL: -925,
    maxLoss: -1150,
    recoveryTime: '8',
    probability: 2.5
  },
  {
    scenario: 'Rate Spike',
    marketMove: '+200bp rates',
    portfolioPnL: -650,
    maxLoss: -780,
    recoveryTime: '22',
    probability: 5.0
  }
]

interface RiskDashboardProps {
  className?: string
}

export default function RiskDashboard({ className }: RiskDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1d' | '1w' | '1m'>('1d')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<RiskScenario | null>(null)

  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    const totalRisk = Math.abs(mockVaR.var95)
    const maxGain = Math.max(...mockScenarios.map(s => s.expectedPnL))
    const maxLoss = Math.min(...mockScenarios.map(s => s.expectedPnL))
    const riskReward = maxGain / Math.abs(maxLoss)
    
    const avgWinProb = mockScenarios
      .filter(s => s.expectedPnL > 0)
      .reduce((sum, s) => sum + s.probability, 0)
    
    const avgLossProb = mockScenarios
      .filter(s => s.expectedPnL < 0)
      .reduce((sum, s) => sum + s.probability, 0)

    return {
      totalRisk,
      maxGain,
      maxLoss,
      riskReward,
      winProbability: avgWinProb,
      lossProbability: avgLossProb,
      expectedValue: mockScenarios.reduce((sum, s) => sum + (s.expectedPnL * s.probability / 100), 0)
    }
  }, [])

  const getRiskLevel = (value: number) => {
    const absValue = Math.abs(value)
    if (absValue < 500) return { level: 'Low', color: 'text-green-600 bg-green-100' }
    if (absValue < 1000) return { level: 'Medium', color: 'text-yellow-600 bg-yellow-100' }
    return { level: 'High', color: 'text-red-600 bg-red-100' }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Value at Risk */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Value at Risk (95%)
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(mockVaR.var95)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Daily VaR
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Max Drawdown */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Max Drawdown
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(mockVaR.maxDrawdown)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Worst case
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk/Reward Ratio */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Risk/Reward
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {riskMetrics.riskReward.toFixed(2)}:1
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Expected ratio
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Win Probability */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Win Probability
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {riskMetrics.winProbability.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Profit scenarios
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenario Analysis */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Scenario Analysis</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Portfolio P&L under various market conditions
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={showAdvanced ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                Advanced
              </Button>
              <Button variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {mockScenarios.map((scenario, index) => {
              const risk = getRiskLevel(scenario.expectedPnL)
              
              return (
                <motion.div
                  key={scenario.name}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                    selectedScenario?.name === scenario.name && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setSelectedScenario(scenario)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {scenario.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {scenario.description}
                      </p>
                    </div>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", risk.color)}>
                      {risk.level}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">P&L:</span>
                      <span className={cn(
                        "font-semibold",
                        scenario.expectedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(scenario.expectedPnL)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Probability:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {scenario.probability.toFixed(1)}%
                      </span>
                    </div>

                    {showAdvanced && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Price:</span>
                          <span>{scenario.priceMove > 0 ? '+' : ''}{scenario.priceMove}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Vol:</span>
                          <span>{scenario.volMove > 0 ? '+' : ''}{scenario.volMove}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Time:</span>
                          <span>{scenario.timeDecay}d</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* VaR Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Value at Risk Details */}
        <Card>
          <CardHeader>
            <CardTitle>Value at Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">95% VaR (Daily)</span>
                <span className="font-bold text-red-600">{formatCurrency(mockVaR.var95)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">99% VaR (Daily)</span>
                <span className="font-bold text-red-600">{formatCurrency(mockVaR.var99)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium text-gray-900 dark:text-white">Expected Shortfall</span>
                <span className="font-bold text-red-600">{formatCurrency(mockVaR.expectedShortfall)}</span>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Risk Attribution</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Delta Risk</span>
                    </div>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Gamma Risk</span>
                    </div>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Vega Risk</span>
                    </div>
                    <span className="text-sm font-medium">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stress Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Stress Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockStressTests.map((test, index) => (
                <motion.div
                  key={test.scenario}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {test.scenario}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {test.marketMove}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {test.probability}% prob
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">P&L:</span>
                      <div className="font-semibold text-red-600">
                        {formatCurrency(test.portfolioPnL)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Max Loss:</span>
                      <div className="font-semibold text-red-600">
                        {formatCurrency(test.maxLoss)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Recovery:</span>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {test.recoveryTime}d
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {Math.abs(riskMetrics.maxLoss) > 1000 && (
        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-200">
                  Risk Management Recommendations
                </h4>
                <div className="text-sm text-orange-800 dark:text-orange-300 mt-1 space-y-1">
                  {Math.abs(mockVaR.var95) > 800 && (
                    <p>• Consider reducing position sizes - current VaR exceeds recommended limits</p>
                  )}
                  {riskMetrics.riskReward < 1.5 && (
                    <p>• Risk/reward ratio below optimal threshold - consider adjusting positions</p>
                  )}
                  {riskMetrics.lossProbability > 50 && (
                    <p>• High probability of loss scenarios - review defensive strategies</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}