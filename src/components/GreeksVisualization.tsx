'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Zap, 
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  AlertTriangle
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn, formatCurrency, getGreekColor, getRiskLevel, getRiskColor } from '@/lib/utils'

// Mock position data - in real app, this would come from props/context
interface Position {
  id: string
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: Date
  quantity: number
  spotPrice: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
  }
  marketValue: number
}

const mockPositions: Position[] = [
  {
    id: '1',
    symbol: 'AAPL',
    type: 'call',
    strike: 190,
    expiry: new Date('2024-03-15'),
    quantity: 5,
    spotPrice: 190.50,
    greeks: { delta: 0.65, gamma: 0.03, theta: -12.5, vega: 18.2, rho: 8.4 },
    marketValue: 2125
  },
  {
    id: '2',
    symbol: 'TSLA',
    type: 'put',
    strike: 240,
    expiry: new Date('2024-03-01'),
    quantity: -3,
    spotPrice: 250.00,
    greeks: { delta: -0.42, gamma: 0.025, theta: -15.8, vega: 22.1, rho: -6.2 },
    marketValue: -1230
  },
  {
    id: '3',
    symbol: 'MSFT',
    type: 'call',
    strike: 380,
    expiry: new Date('2024-04-19'),
    quantity: 2,
    spotPrice: 380.25,
    greeks: { delta: 0.52, gamma: 0.018, theta: -8.3, vega: 15.7, rho: 5.8 },
    marketValue: 1840
  }
]

interface GreeksVisualizationProps {
  positions?: Position[]
  className?: string
}

export default function GreeksVisualization({ positions = mockPositions, className }: GreeksVisualizationProps) {
  const [selectedGreek, setSelectedGreek] = useState<'delta' | 'gamma' | 'theta' | 'vega'>('delta')
  const [viewMode, setViewMode] = useState<'summary' | 'breakdown' | 'heatmap'>('summary')

  // Calculate portfolio-level Greeks
  const portfolioGreeks = useMemo(() => {
    const totals = positions.reduce((acc, position) => {
      const multiplier = position.quantity * 100 // Options multiplier
      
      acc.totalDelta += position.greeks.delta * multiplier
      acc.totalGamma += position.greeks.gamma * multiplier  
      acc.totalTheta += position.greeks.theta * position.quantity
      acc.totalVega += position.greeks.vega * position.quantity
      acc.totalRho += position.greeks.rho * position.quantity
      acc.totalValue += Math.abs(position.marketValue)
      
      return acc
    }, {
      totalDelta: 0,
      totalGamma: 0, 
      totalTheta: 0,
      totalVega: 0,
      totalRho: 0,
      totalValue: 0
    })

    // Calculate normalized Greeks (per $10k portfolio)
    const normalizationFactor = totals.totalValue > 0 ? 10000 / totals.totalValue : 0
    
    return {
      ...totals,
      normalizedDelta: totals.totalDelta * normalizationFactor,
      normalizedGamma: totals.totalGamma * normalizationFactor,
      normalizedTheta: totals.totalTheta * normalizationFactor,
      normalizedVega: totals.totalVega * normalizationFactor
    }
  }, [positions])

  // Calculate risk metrics
  const riskMetrics = useMemo(() => {
    const deltaRisk = Math.abs(portfolioGreeks.totalDelta)
    const gammaRisk = Math.abs(portfolioGreeks.totalGamma * 100) // Gamma risk for 1% move
    const thetaRisk = Math.abs(portfolioGreeks.totalTheta)
    const vegaRisk = Math.abs(portfolioGreeks.totalVega)

    return {
      deltaRisk: {
        value: deltaRisk,
        level: getRiskLevel(deltaRisk, { low: 1000, medium: 5000 }),
        description: 'Directional risk from price moves'
      },
      gammaRisk: {
        value: gammaRisk,
        level: getRiskLevel(gammaRisk, { low: 50, medium: 200 }),
        description: 'Convexity risk from large moves'
      },
      thetaRisk: {
        value: thetaRisk,
        level: getRiskLevel(thetaRisk, { low: 50, medium: 200 }),
        description: 'Time decay risk'
      },
      vegaRisk: {
        value: vegaRisk,
        level: getRiskLevel(vegaRisk, { low: 100, medium: 500 }),
        description: 'Volatility risk'
      }
    }
  }, [portfolioGreeks])

  // Generate P&L scenarios
  const pnlScenarios = useMemo(() => {
    const scenarios = []
    const baseSpot = 190.50 // Average spot price
    
    for (let i = -20; i <= 20; i += 2) {
      const priceChange = i / 100 // Percentage change
      const newSpot = baseSpot * (1 + priceChange)
      
      let totalPnL = 0
      
      positions.forEach(position => {
        const spotMove = newSpot - position.spotPrice
        const deltaContribution = position.greeks.delta * spotMove * position.quantity * 100
        const gammaContribution = 0.5 * position.greeks.gamma * Math.pow(spotMove, 2) * position.quantity * 100
        
        totalPnL += deltaContribution + gammaContribution
      })
      
      scenarios.push({
        priceChange: priceChange * 100,
        pnl: totalPnL,
        spotPrice: newSpot
      })
    }
    
    return scenarios
  }, [positions])

  const greeksData = [
    {
      name: 'Delta',
      key: 'delta' as const,
      value: portfolioGreeks.totalDelta,
      normalized: portfolioGreeks.normalizedDelta,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      description: 'Price sensitivity',
      unit: '$',
      risk: riskMetrics.deltaRisk
    },
    {
      name: 'Gamma',
      key: 'gamma' as const,
      value: portfolioGreeks.totalGamma,
      normalized: portfolioGreeks.normalizedGamma,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      description: 'Delta sensitivity',
      unit: '',
      risk: riskMetrics.gammaRisk
    },
    {
      name: 'Theta',
      key: 'theta' as const,
      value: portfolioGreeks.totalTheta,
      normalized: portfolioGreeks.normalizedTheta,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      description: 'Time decay',
      unit: '$/day',
      risk: riskMetrics.thetaRisk
    },
    {
      name: 'Vega',
      key: 'vega' as const,
      value: portfolioGreeks.totalVega,
      normalized: portfolioGreeks.normalizedVega,
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      description: 'Vol sensitivity',
      unit: '$/1% vol',
      risk: riskMetrics.vegaRisk
    }
  ]

  const selectedGreekData = greeksData.find(g => g.key === selectedGreek)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Portfolio Greeks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {greeksData.map((greek) => (
          <Card 
            key={greek.key}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg",
              selectedGreek === greek.key && "ring-2 ring-blue-500"
            )}
            onClick={() => setSelectedGreek(greek.key)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {greek.name}
                  </p>
                  <p className={cn("text-2xl font-bold", greek.color)}>
                    {greek.key === 'theta' ? formatCurrency(greek.value) : greek.value.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {greek.description}
                  </p>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", greek.bgColor)}>
                  <greek.icon className={cn("h-6 w-6", greek.color)} />
                </div>
              </div>
              
              {/* Risk indicator */}
              <div className="mt-3 flex items-center space-x-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  getRiskColor(greek.risk.level)
                )}>
                  {greek.risk.level.toUpperCase()} RISK
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {greek.unit}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Mode Selector */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Greeks Analysis</CardTitle>
            <div className="flex space-x-2">
              {[
                { key: 'summary', label: 'Summary', icon: BarChart3 },
                { key: 'breakdown', label: 'Breakdown', icon: PieChart },
                { key: 'heatmap', label: 'Heat Map', icon: Target }
              ].map(mode => (
                <Button
                  key={mode.key}
                  variant={viewMode === mode.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(mode.key as any)}
                  className="flex items-center space-x-2"
                >
                  <mode.icon className="h-4 w-4" />
                  <span>{mode.label}</span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {viewMode === 'summary' && (
            <div className="space-y-6">
              {/* Selected Greek Details */}
              {selectedGreekData && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className={cn("w-16 h-16 rounded-lg flex items-center justify-center", selectedGreekData.bgColor)}>
                      <selectedGreekData.icon className={cn("h-8 w-8", selectedGreekData.color)} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedGreekData.name}: {selectedGreekData.key === 'theta' ? formatCurrency(selectedGreekData.value) : selectedGreekData.value.toFixed(2)}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedGreekData.description} • {selectedGreekData.risk.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Current Value</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedGreekData.key === 'theta' ? formatCurrency(selectedGreekData.value) : selectedGreekData.value.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Normalized (/10k)</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedGreekData.normalized.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Risk Level</p>
                      <span className={cn(
                        "inline-block px-3 py-1 rounded-full text-sm font-medium",
                        getRiskColor(selectedGreekData.risk.level)
                      )}>
                        {selectedGreekData.risk.level.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* P&L Scenario Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  P&L Scenarios (Price Movement)
                </h3>
                <div className="relative h-64">
                  {/* Simple ASCII-style chart */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-21 gap-1 w-full max-w-4xl">
                      {pnlScenarios.map((scenario, index) => {
                        const height = Math.abs(scenario.pnl) / Math.max(...pnlScenarios.map(s => Math.abs(s.pnl))) * 100
                        const isProfit = scenario.pnl >= 0
                        
                        return (
                          <div
                            key={index}
                            className="flex flex-col items-center"
                            style={{ minHeight: '200px' }}
                          >
                            <div className="flex-1 flex items-end">
                              <div
                                className={cn(
                                  "w-4 transition-all hover:opacity-80",
                                  isProfit ? "bg-green-500" : "bg-red-500"
                                )}
                                style={{ 
                                  height: `${Math.max(height, 2)}%`,
                                  marginBottom: isProfit ? '0' : 'auto',
                                  marginTop: isProfit ? 'auto' : '0'
                                }}
                                title={`${scenario.priceChange.toFixed(0)}%: ${formatCurrency(scenario.pnl)}`}
                              />
                            </div>
                            {index % 4 === 0 && (
                              <div className="text-xs text-gray-500 mt-2">
                                {scenario.priceChange > 0 ? '+' : ''}{scenario.priceChange.toFixed(0)}%
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>-20%</span>
                  <span>Underlying Price Movement</span>
                  <span>+20%</span>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'breakdown' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Position-by-Position {selectedGreekData?.name} Breakdown
              </h3>
              
              <div className="space-y-3">
                {positions.map((position) => {
                  const greekValue = position.greeks[selectedGreek]
                  const contribution = greekValue * position.quantity * (selectedGreek === 'theta' ? 1 : 100)
                  const percentage = portfolioGreeks[`total${selectedGreek.charAt(0).toUpperCase() + selectedGreek.slice(1)}` as keyof typeof portfolioGreeks] !== 0
                    ? Math.abs(contribution / (portfolioGreeks[`total${selectedGreek.charAt(0).toUpperCase() + selectedGreek.slice(1)}` as keyof typeof portfolioGreeks] as number)) * 100
                    : 0

                  return (
                    <motion.div
                      key={position.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {position.symbol}
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            position.type === 'call' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          )}>
                            {position.type.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ${position.strike} • {position.expiry.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {selectedGreek === 'theta' ? formatCurrency(contribution) : contribution.toFixed(0)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {percentage.toFixed(1)}% of total
                          </p>
                        </div>
                        
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full transition-all",
                              selectedGreekData?.color.replace('text-', 'bg-') || 'bg-blue-500'
                            )}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {viewMode === 'heatmap' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Risk Heat Map
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Matrix */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Risk Matrix
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(riskMetrics).map(([key, risk]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full",
                            risk.level === 'low' ? 'bg-green-500' :
                            risk.level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                          )} />
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {key.replace('Risk', '')}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getRiskColor(risk.level)
                          )}>
                            {risk.level.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio Composition */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    Portfolio Composition
                  </h4>
                  <div className="space-y-2">
                    {positions.map((position) => (
                      <div key={position.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {position.symbol}
                          </span>
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            position.type === 'call' ? 'bg-green-500' : 'bg-red-500'
                          )} />
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(Math.abs(position.marketValue))}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(Math.abs(position.marketValue) / portfolioGreeks.totalValue) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      {Object.values(riskMetrics).some(risk => risk.level === 'high') && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-200">
                  High Risk Detected
                </h4>
                <div className="text-sm text-red-800 dark:text-red-300 mt-1 space-y-1">
                  {Object.entries(riskMetrics)
                    .filter(([_, risk]) => risk.level === 'high')
                    .map(([key, risk]) => (
                      <p key={key}>
                        • <strong>{key.replace('Risk', '')}:</strong> {risk.description}
                      </p>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}