'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  Target, 
  Brain,
  Compass,
  Plane,
  DollarSign,
  BarChart3,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react'

interface PortfolioState {
  totalCapital: number
  deployedCapital: number
  maxPortfolioRisk: number
  maxDrawdownTolerance: number
  currentDrawdown: number
  riskUtilization: number
  positions: Position[]
  cashBalance: number
}

interface Position {
  id: string
  symbol: string
  strategy: string
  size: number
  pnl: number
  risk: number
  daysInTrade: number
  exitSignal?: 'hold' | 'profit_target' | 'stop_loss' | 'roll' | 'hedge'
  qualityScore: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C'
}

interface TradeRecommendation {
  id: string
  symbol: string
  strategy: string
  rationale: string
  sizing: number
  maxRisk: number
  entryPrice: number
  profitTarget: number
  stopLoss: number
  timeHorizon: string
  qualityScore: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C'
  portfolioFit: number
  riskBudgetUsed: number
}

interface BiggestThreat {
  scenario: string
  probability: number
  potentialLoss: number
  affectedPositions: string[]
  mitigation: string
  urgency: 'critical' | 'high' | 'medium' | 'low'
}

type PilotMode = 'advisor' | 'copilot' | 'autopilot'

export default function AIPortfolioPilot() {
  const [pilotMode, setPilotMode] = useState<PilotMode>('advisor')
  const [portfolioState, setPortfolioState] = useState<PortfolioState>({
    totalCapital: 50000,
    deployedCapital: 32000,
    maxPortfolioRisk: 0.15,
    maxDrawdownTolerance: 0.10,
    currentDrawdown: 0.03,
    riskUtilization: 0.68,
    positions: [
      {
        id: '1',
        symbol: 'AAPL',
        strategy: 'Iron Condor',
        size: 5,
        pnl: 450,
        risk: 2500,
        daysInTrade: 12,
        exitSignal: 'profit_target',
        qualityScore: 'AA'
      },
      {
        id: '2',
        symbol: 'NVDA',
        strategy: 'Put Credit Spread',
        size: 3,
        pnl: -180,
        risk: 1500,
        daysInTrade: 8,
        exitSignal: 'hold',
        qualityScore: 'A'
      }
    ],
    cashBalance: 18000
  })

  const [currentRecommendation, setCurrentRecommendation] = useState<TradeRecommendation>({
    id: 'rec1',
    symbol: 'MSFT',
    strategy: 'Iron Butterfly',
    rationale: 'High IV rank (85th percentile) with earnings event passed. Low realized volatility suggests premium compression opportunity. Portfolio currently under-hedged against tech sector concentration.',
    sizing: 4,
    maxRisk: 1600,
    entryPrice: 2.40,
    profitTarget: 1.20,
    stopLoss: 3.60,
    timeHorizon: '21 DTE',
    qualityScore: 'AAA',
    portfolioFit: 0.92,
    riskBudgetUsed: 0.24
  })

  const [biggestThreat, setBiggestThreat] = useState<BiggestThreat>({
    scenario: 'Tech sector correlation spike during market selloff',
    probability: 0.23,
    potentialLoss: 4200,
    affectedPositions: ['AAPL', 'NVDA', 'MSFT'],
    mitigation: 'Consider SPY put hedge or reduce tech exposure by 30%',
    urgency: 'high'
  })

  const [isMonitoring, setIsMonitoring] = useState(true)
  const [alertsCount, setAlertsCount] = useState(3)

  const riskUtilizationColor = portfolioState.riskUtilization > 0.8 ? 'destructive' : 
                              portfolioState.riskUtilization > 0.6 ? 'orange' : 'default'

  const getThreatUrgencyColor = (urgency: string) => {
    switch(urgency) {
      case 'critical': return 'destructive'
      case 'high': return 'orange'
      case 'medium': return 'yellow'
      default: return 'default'
    }
  }

  const getQualityScoreColor = (score: string) => {
    if (['AAA', 'AA'].includes(score)) return 'default'
    if (['A', 'BBB'].includes(score)) return 'yellow'
    return 'destructive'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-3">
            <Brain className="h-8 w-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">AI Portfolio Pilot</h1>
            <Compass className="h-8 w-8 text-blue-400" />
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Tell me what to trade, how big, when to exit, and how it fits my portfolio.
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <Compass className="h-4 w-4" />
              <span>Waze for derivatives</span>
            </div>
            <div className="flex items-center space-x-2">
              <Plane className="h-4 w-4" />
              <span>Autopilot, not steering wheel</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Safety-first alpha engine</span>
            </div>
          </div>
        </motion.div>

        {/* Pilot Mode Selector */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Plane className="h-5 w-5 text-blue-400" />
                <span>AI Trade Pilot Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={pilotMode} onValueChange={(value) => setPilotMode(value as PilotMode)}>
                <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                  <TabsTrigger value="advisor" className="data-[state=active]:bg-green-600">
                    🟢 Advisor
                  </TabsTrigger>
                  <TabsTrigger value="copilot" className="data-[state=active]:bg-yellow-600">
                    🟡 Co-Pilot
                  </TabsTrigger>
                  <TabsTrigger value="autopilot" className="data-[state=active]:bg-red-600">
                    🔴 Autopilot
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-4 text-slate-300">
                  {pilotMode === 'advisor' && (
                    <div className="space-y-2">
                      <p className="font-medium">Recommends trades • Explains rationale • Suggests sizing • Monitors risk</p>
                      <p className="text-sm text-slate-400">You retain full control of all trade decisions</p>
                    </div>
                  )}
                  {pilotMode === 'copilot' && (
                    <div className="space-y-2">
                      <p className="font-medium">Alerts when to adjust • Suggests rolls/hedges • Exit signals</p>
                      <p className="text-sm text-slate-400">Active guidance throughout trade lifecycle</p>
                    </div>
                  )}
                  {pilotMode === 'autopilot' && (
                    <div className="space-y-2">
                      <p className="font-medium">Executes trades automatically • Rebalances portfolio • Enforces risk limits</p>
                      <p className="text-sm text-orange-400">⚠️ Requires broker permissions (Premium feature)</p>
                    </div>
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Portfolio Context */}
          <div className="space-y-6">
            
            {/* Dynamic Risk Budget */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    <span>Dynamic Risk Budget</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Total Capital</span>
                      <span className="text-white font-medium">${portfolioState.totalCapital.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Capital at Risk</span>
                      <span className="text-orange-400 font-medium">${(portfolioState.deployedCapital * portfolioState.maxPortfolioRisk).toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Risk Utilization</span>
                        <span className="text-white font-medium">{(portfolioState.riskUtilization * 100).toFixed(0)}%</span>
                      </div>
                      <Progress 
                        value={portfolioState.riskUtilization * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300 text-sm">Available Risk Budget</span>
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        ${((1 - portfolioState.riskUtilization) * portfolioState.totalCapital * portfolioState.maxPortfolioRisk).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Portfolio Context */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <span>Current Positions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {portfolioState.positions.map((position) => (
                      <div key={position.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">{position.symbol}</span>
                            <Badge variant="outline" className={getQualityScoreColor(position.qualityScore)}>
                              {position.qualityScore}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400">{position.strategy} • {position.daysInTrade}d</p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className={`font-medium ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ${position.pnl}
                          </div>
                          <div className="text-xs text-slate-400">
                            Risk: ${position.risk}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Center Column - AI Recommendations */}
          <div className="space-y-6">
            
            {/* Portfolio-Aware Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    <span>Portfolio-Aware Recommendation</span>
                  </CardTitle>
                  <p className="text-slate-300 text-sm">
                    Given your current positions, capital, and risk tolerance, THIS is the optimal next trade.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{currentRecommendation.symbol}</h3>
                      <p className="text-slate-300">{currentRecommendation.strategy}</p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${getQualityScoreColor(currentRecommendation.qualityScore)} text-lg px-3 py-1`}
                    >
                      {currentRecommendation.qualityScore}
                    </Badge>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                    <p className="text-slate-200 leading-relaxed">{currentRecommendation.rationale}</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Size</span>
                          <span className="text-white font-medium">{currentRecommendation.sizing} contracts</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Max Risk</span>
                          <span className="text-orange-400 font-medium">${currentRecommendation.maxRisk}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Entry</span>
                          <span className="text-white font-medium">${currentRecommendation.entryPrice}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Profit Target</span>
                          <span className="text-green-400 font-medium">${currentRecommendation.profitTarget}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Stop Loss</span>
                          <span className="text-red-400 font-medium">${currentRecommendation.stopLoss}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Time Horizon</span>
                          <span className="text-white font-medium">{currentRecommendation.timeHorizon}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                      <div className="space-y-1">
                        <span className="text-slate-400 text-sm">Portfolio Fit</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={currentRecommendation.portfolioFit * 100} className="h-2 w-20" />
                          <span className="text-green-400 text-sm font-medium">{(currentRecommendation.portfolioFit * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400 text-sm">Risk Budget Used</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={currentRecommendation.riskBudgetUsed * 100} className="h-2 w-20" />
                          <span className="text-orange-400 text-sm font-medium">{(currentRecommendation.riskBudgetUsed * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button className="flex-1">
                      Execute Trade
                    </Button>
                    <Button variant="outline" className="flex-1">
                      Modify Size
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* What Could Hurt You Most */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <span>What Could Hurt You Most Right Now?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={getThreatUrgencyColor(biggestThreat.urgency)} className="uppercase tracking-wide">
                      {biggestThreat.urgency} Risk
                    </Badge>
                    <span className="text-slate-300 text-sm">
                      {(biggestThreat.probability * 100).toFixed(0)}% probability
                    </span>
                  </div>

                  <div className="bg-slate-700/50 p-4 rounded-lg space-y-3">
                    <h4 className="text-white font-medium">{biggestThreat.scenario}</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Potential Loss</span>
                      <span className="text-red-400 font-bold text-lg">-${biggestThreat.potentialLoss.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-sm">Affected Positions</span>
                      <div className="flex flex-wrap gap-1">
                        {biggestThreat.affectedPositions.map((symbol) => (
                          <Badge key={symbol} variant="outline" className="text-xs">
                            {symbol}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
                    <h5 className="text-blue-300 font-medium mb-2">💡 Mitigation Strategy</h5>
                    <p className="text-slate-200 text-sm">{biggestThreat.mitigation}</p>
                  </div>

                  <Button className="w-full">
                    Implement Protection
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

          </div>

          {/* Right Column - Monitoring & Status */}
          <div className="space-y-6">
            
            {/* Continuous Monitoring Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-400" />
                    <span>Continuous Monitoring</span>
                    <Badge variant={isMonitoring ? 'default' : 'destructive'} className="ml-auto">
                      {isMonitoring ? 'ACTIVE' : 'PAUSED'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">Volatility Changes</span>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">Trend Shifts</span>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">Event Risk</span>
                      <AlertTriangle className="h-4 w-4 text-orange-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">Liquidity Deterioration</span>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">Profit Targets</span>
                      <Target className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm">Correlation Spikes</span>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                  </div>

                  {alertsCount > 0 && (
                    <div className="bg-orange-900/30 p-3 rounded-lg border border-orange-700">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-orange-400" />
                        <span className="text-orange-300 font-medium">
                          {alertsCount} Active Alerts
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* If You Do Nothing */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <span>If You Do Nothing...</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-400" />
                        <span className="text-green-300 font-medium">Positive Theta Decay</span>
                      </div>
                      <p className="text-slate-300 text-sm">
                        Your iron condors will gain ~$89 from time decay over the next 3 days
                      </p>
                    </div>
                    
                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        <span className="text-orange-300 font-medium">NVDA Position Risk</span>
                      </div>
                      <p className="text-slate-300 text-sm">
                        Put spread approaching 50% max loss. Consider rolling or closing by Friday.
                      </p>
                    </div>

                    <div className="bg-slate-700/50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-400" />
                        <span className="text-blue-300 font-medium">Opportunity Cost</span>
                      </div>
                      <p className="text-slate-300 text-sm">
                        $3,200 risk budget unused while high-quality setups available in energy sector
                      </p>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-purple-600 text-purple-300 hover:bg-purple-900/30">
                    Show Full Analysis
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Trade Lifecycle Management */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    <span>Active Management Signals</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-900/30 rounded-lg border border-green-700">
                      <div className="space-y-1">
                        <span className="text-green-300 font-medium">AAPL Iron Condor</span>
                        <p className="text-green-200 text-sm">Take profit at 50% max gain</p>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Close
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-900/30 rounded-lg border border-yellow-700">
                      <div className="space-y-1">
                        <span className="text-yellow-300 font-medium">NVDA Put Spread</span>
                        <p className="text-yellow-200 text-sm">Consider rolling down and out</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-300">
                        Roll
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Portfolio Health Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-400">+$270</div>
              <p className="text-slate-400 text-sm">Today's P&L</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">68%</div>
              <p className="text-slate-400 text-sm">Risk Utilized</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">AAA</div>
              <p className="text-slate-400 text-sm">Portfolio Quality</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">87</div>
              <p className="text-slate-400 text-sm">Health Score</p>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}