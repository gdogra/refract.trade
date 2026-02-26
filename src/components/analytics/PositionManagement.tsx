'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  DollarSign,
  Zap,
  Shield,
  ArrowRight,
  Eye,
  Calendar,
  Activity,
  Star
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface PositionManagementProps {
  positions: ManagedPosition[]
  exitIntelligence: ExitIntelligence[]
  tradeQualityScores: TradeQualityScore[]
  onPositionAction: (positionId: string, action: PositionAction) => void
  className?: string
}

interface ManagedPosition {
  id: string
  symbol: string
  strategyType: string
  legs: PositionLeg[]
  entryDate: Date
  entryPrice: number
  currentValue: number
  unrealizedPnL: number
  percentGain: number
  daysHeld: number
  daysToExpiry: number
  currentGreeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
  }
  riskMetrics: {
    maxLoss: number
    breakeven: number
    probabilityOfProfit: number
    timeDecayDaily: number
  }
  tradeQuality: TradeQualityRating
  managementSignals: ManagementSignal[]
}

interface PositionLeg {
  symbol: string
  type: 'call' | 'put' | 'stock'
  strike?: number
  expiry?: Date
  quantity: number
  side: 'buy' | 'sell'
  entryPrice: number
  currentPrice: number
}

interface ExitIntelligence {
  positionId: string
  recommendations: ExitRecommendation[]
  optimalTakeProfitRange: { min: number; max: number }
  timeToCloseGuidance: string
  rollRecommendations: RollRecommendation[]
  riskAdjustedHoldVsClose: HoldVsCloseAnalysis
}

interface ExitRecommendation {
  action: 'take_profit' | 'cut_loss' | 'hold' | 'roll' | 'hedge'
  urgency: 'immediate' | 'today' | 'this_week' | 'when_convenient'
  reasoning: string
  expectedOutcome: string
  confidence: number
  targetPrice?: number
}

interface RollRecommendation {
  type: 'time_roll' | 'strike_roll' | 'diagonal_roll'
  fromExpiry: Date
  toExpiry: Date
  fromStrike?: number
  toStrike?: number
  netCredit: number
  reasoning: string
  probability: number
}

interface HoldVsCloseAnalysis {
  holdScore: number // 0-100
  closeScore: number // 0-100
  recommendation: 'hold' | 'close' | 'partial_close'
  reasoning: string
  keyFactors: string[]
}

interface TradeQualityScore {
  positionId: string
  overallScore: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C'
  numericScore: number
  components: {
    entryTiming: number
    structuralEdge: number
    riskManagement: number
    execution: number
    marketFit: number
  }
  trend: 'improving' | 'stable' | 'deteriorating'
  nextReviewDate: Date
}

type TradeQualityRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'C'

interface ManagementSignal {
  type: 'profit_target' | 'stop_loss' | 'time_decay' | 'vol_change' | 'assignment_risk' | 'roll_opportunity'
  strength: 'weak' | 'moderate' | 'strong'
  message: string
  action: string
  timeframe: string
}

type PositionAction = 'close' | 'roll' | 'hedge' | 'adjust' | 'add_to_watchlist'

// Mock data
const mockPositions: ManagedPosition[] = [
  {
    id: '1',
    symbol: 'AAPL',
    strategyType: 'Iron Condor',
    legs: [],
    entryDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    entryPrice: 2.35,
    currentValue: 1.85,
    unrealizedPnL: 150,
    percentGain: 21.3,
    daysHeld: 12,
    daysToExpiry: 16,
    currentGreeks: { delta: 0.15, gamma: -0.02, theta: 8.5, vega: -12.3 },
    riskMetrics: { maxLoss: -565, breakeven: 172.5, probabilityOfProfit: 0.78, timeDecayDaily: 8.5 },
    tradeQuality: 'AA',
    managementSignals: [
      {
        type: 'profit_target',
        strength: 'strong',
        message: 'Position reached 50% of max profit',
        action: 'Consider taking profits',
        timeframe: 'Today'
      }
    ]
  },
  {
    id: '2', 
    symbol: 'TSLA',
    strategyType: 'Bull Call Spread',
    legs: [],
    entryDate: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
    entryPrice: 4.20,
    currentValue: 2.85,
    unrealizedPnL: -135,
    percentGain: -32.1,
    daysHeld: 18,
    daysToExpiry: 10,
    currentGreeks: { delta: 0.42, gamma: 0.08, theta: -15.2, vega: 8.1 },
    riskMetrics: { maxLoss: -420, breakeven: 244.2, probabilityOfProfit: 0.35, timeDecayDaily: -15.2 },
    tradeQuality: 'B',
    managementSignals: [
      {
        type: 'stop_loss',
        strength: 'moderate',
        message: 'Position down 32% with time decay accelerating',
        action: 'Consider cutting losses or rolling',
        timeframe: 'Today'
      },
      {
        type: 'time_decay',
        strength: 'strong',
        message: 'High theta burn with limited time remaining',
        action: 'Close or roll to later expiration',
        timeframe: 'This week'
      }
    ]
  }
]

const mockExitIntelligence: ExitIntelligence[] = [
  {
    positionId: '1',
    recommendations: [
      {
        action: 'take_profit',
        urgency: 'today',
        reasoning: 'Position has captured 64% of max profit with favorable time decay',
        expectedOutcome: 'Lock in $150 profit, free up capital for new opportunities',
        confidence: 85,
        targetPrice: 1.75
      }
    ],
    optimalTakeProfitRange: { min: 1.70, max: 1.90 },
    timeToCloseGuidance: 'Close within next 2-3 days to avoid Gamma risk',
    rollRecommendations: [],
    riskAdjustedHoldVsClose: {
      holdScore: 35,
      closeScore: 78,
      recommendation: 'close',
      reasoning: 'Risk of gamma acceleration outweighs remaining profit potential',
      keyFactors: ['High profit capture', 'Approaching expiration', 'Gamma risk increasing']
    }
  }
]

const mockTradeQualityScores: TradeQualityScore[] = [
  {
    positionId: '1',
    overallScore: 'AA',
    numericScore: 82,
    components: {
      entryTiming: 88,
      structuralEdge: 85,
      riskManagement: 92,
      execution: 78,
      marketFit: 75
    },
    trend: 'stable',
    nextReviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
]

export default function PositionManagement({
  positions = mockPositions,
  exitIntelligence = mockExitIntelligence,
  tradeQualityScores = mockTradeQualityScores,
  onPositionAction,
  className
}: PositionManagementProps) {
  const [selectedPosition, setSelectedPosition] = useState<ManagedPosition | null>(null)
  const [sortBy, setSortBy] = useState<'pnl' | 'quality' | 'risk' | 'time'>('pnl')

  const getQualityColor = (quality: TradeQualityRating) => {
    switch (quality) {
      case 'AAA': return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
      case 'AA': return 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
      case 'A': return 'bg-green-500 text-white'
      case 'BBB': return 'bg-blue-500 text-white'
      case 'BB': return 'bg-yellow-500 text-white'
      case 'B': return 'bg-orange-500 text-white'
      case 'C': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getSignalColor = (type: ManagementSignal['type']) => {
    switch (type) {
      case 'profit_target': return 'text-green-600 bg-green-100'
      case 'stop_loss': return 'text-red-600 bg-red-100'
      case 'time_decay': return 'text-orange-600 bg-orange-100'
      case 'vol_change': return 'text-purple-600 bg-purple-100'
      case 'assignment_risk': return 'text-yellow-600 bg-yellow-100'
      case 'roll_opportunity': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const sortedPositions = [...positions].sort((a, b) => {
    switch (sortBy) {
      case 'pnl': return b.percentGain - a.percentGain
      case 'quality': return getQualityNumericValue(b.tradeQuality) - getQualityNumericValue(a.tradeQuality)
      case 'risk': return Math.abs(b.riskMetrics.maxLoss) - Math.abs(a.riskMetrics.maxLoss)
      case 'time': return a.daysToExpiry - b.daysToExpiry
      default: return 0
    }
  })

  function getQualityNumericValue(quality: TradeQualityRating): number {
    const values = { 'AAA': 100, 'AA': 90, 'A': 80, 'BBB': 70, 'BB': 60, 'B': 50, 'C': 40 }
    return values[quality] || 0
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-6 w-6" />
                <span>💎 Position Management Superpowers</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Intelligent guidance for managing winners and losers
              </p>
            </div>
            
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="pnl">Sort by P&L</option>
                <option value="quality">Sort by Quality</option>
                <option value="risk">Sort by Risk</option>
                <option value="time">Sort by Time</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Position Cards */}
      <div className="space-y-4">
        {sortedPositions.map((position, index) => {
          const exitIntel = exitIntelligence.find(ei => ei.positionId === position.id)
          const qualityScore = tradeQualityScores.find(tqs => tqs.positionId === position.id)
          
          return (
            <motion.div
              key={position.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "transition-all duration-200 hover:shadow-lg",
                selectedPosition?.id === position.id ? "ring-2 ring-blue-500" : "",
                position.managementSignals?.some(s => s.strength === 'strong') && "border-orange-300"
              )}>
                <CardContent className="p-6">
                  {/* Position Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {position.symbol}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {position.strategyType}
                        </p>
                      </div>
                      
                      <div className={cn("px-3 py-1 rounded-full text-sm font-bold", 
                        getQualityColor(position.tradeQuality))}>
                        {position.tradeQuality}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={cn("text-2xl font-bold",
                        position.percentGain >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {(position.percentGain || 0) >= 0 ? '+' : ''}{(position.percentGain || 0).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        ${(position.unrealizedPnL || 0) >= 0 ? '+' : ''}{(position.unrealizedPnL || 0).toFixed(0)} P&L
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {position.daysHeld}
                      </div>
                      <div className="text-xs text-gray-500">Days Held</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {position.daysToExpiry}
                      </div>
                      <div className="text-xs text-gray-500">Days to Expiry</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {((position.riskMetrics?.probabilityOfProfit || 0) * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Prob of Profit</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className={cn("text-lg font-bold",
                        position.riskMetrics.timeDecayDaily > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        ${(position.riskMetrics?.timeDecayDaily || 0).toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500">Daily Theta</div>
                    </div>
                  </div>

                  {/* Management Signals */}
                  {position.managementSignals.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h5 className="font-medium text-gray-900 dark:text-white">Management Signals</h5>
                      {position.managementSignals.map((signal, signalIndex) => (
                        <div
                          key={signalIndex}
                          className={cn("p-3 rounded-lg border-l-4 flex items-start justify-between",
                            signal.type === 'profit_target' ? 'border-green-500 bg-green-50' :
                            signal.type === 'stop_loss' ? 'border-red-500 bg-red-50' :
                            signal.type === 'time_decay' ? 'border-orange-500 bg-orange-50' :
                            'border-blue-500 bg-blue-50'
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={cn("px-2 py-1 rounded text-xs font-medium capitalize",
                                getSignalColor(signal.type))}>
                                {signal.type.replace('_', ' ')}
                              </span>
                              <span className={cn("px-2 py-1 rounded text-xs font-medium",
                                signal.strength === 'strong' ? 'bg-red-100 text-red-700' :
                                signal.strength === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              )}>
                                {signal.strength}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{signal.message}</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                              {signal.action} • {signal.timeframe}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Exit Intelligence */}
                  {exitIntel && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                      <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-3 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        🎯 Exit Intelligence
                      </h5>
                      
                      {exitIntel.recommendations.map((rec, recIndex) => (
                        <div key={recIndex} className="mb-3 last:mb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className={cn("px-2 py-1 rounded text-xs font-medium capitalize",
                                rec.action === 'take_profit' ? 'bg-green-100 text-green-700' :
                                rec.action === 'cut_loss' ? 'bg-red-100 text-red-700' :
                                rec.action === 'hold' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              )}>
                                {rec.action.replace('_', ' ')}
                              </span>
                              <span className={cn("px-2 py-1 rounded text-xs font-medium",
                                rec.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                                rec.urgency === 'today' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              )}>
                                {rec.urgency}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-blue-700">
                              {rec.confidence}% confidence
                            </span>
                          </div>
                          
                          <p className="text-sm text-blue-800 dark:text-blue-300 mb-1">{rec.reasoning}</p>
                          <p className="text-sm text-blue-700 dark:text-blue-200">{rec.expectedOutcome}</p>
                        </div>
                      ))}
                      
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-700">Optimal Take Profit Range:</span>
                          <span className="font-medium text-blue-900">
                            ${(exitIntel.optimalTakeProfitRange?.min || 0).toFixed(2)} - ${(exitIntel.optimalTakeProfitRange?.max || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-blue-700">Hold vs Close Score:</span>
                          <span className="font-medium text-blue-900">
                            Hold {exitIntel.riskAdjustedHoldVsClose.holdScore} • Close {exitIntel.riskAdjustedHoldVsClose.closeScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Trade Quality Score */}
                  {qualityScore && (
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                      <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <Star className="h-4 w-4 mr-2" />
                        📈 Trade Quality Score
                      </h5>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={cn("px-4 py-2 rounded-lg text-lg font-bold", 
                            getQualityColor(qualityScore.overallScore))}>
                            {qualityScore.overallScore}
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              {qualityScore.numericScore}
                            </div>
                            <div className="text-xs text-gray-500">Numeric Score</div>
                          </div>
                        </div>
                        
                        <div className={cn("px-2 py-1 rounded text-xs font-medium",
                          qualityScore.trend === 'improving' ? 'bg-green-100 text-green-700' :
                          qualityScore.trend === 'deteriorating' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {qualityScore.trend}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(qualityScore.components).map(([component, score]) => (
                          <div key={component} className="text-center">
                            <div className={cn("text-sm font-bold",
                              score >= 80 ? 'text-green-600' :
                              score >= 60 ? 'text-blue-600' :
                              score >= 40 ? 'text-yellow-600' : 'text-red-600'
                            )}>
                              {(score || 0).toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">
                              {component.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {position.managementSignals.some(s => s.type === 'profit_target') && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => onPositionAction(position.id, 'close')}
                      >
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Take Profit
                      </Button>
                    )}
                    
                    {position.managementSignals.some(s => s.type === 'stop_loss') && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => onPositionAction(position.id, 'close')}
                      >
                        <TrendingDown className="h-4 w-4 mr-1" />
                        Cut Loss
                      </Button>
                    )}
                    
                    {position.daysToExpiry <= 21 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onPositionAction(position.id, 'roll')}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Roll
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onPositionAction(position.id, 'hedge')}
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      Hedge
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedPosition(
                        selectedPosition?.id === position.id ? null : position
                      )}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {selectedPosition?.id === position.id ? 'Hide' : 'Details'}
                    </Button>
                  </div>

                  {/* Expanded Details */}
                  {selectedPosition?.id === position.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-gray-200 pt-4 mt-4"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Greeks */}
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-3">Current Greeks</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Delta:</span>
                              <span className="font-medium">{(position.currentGreeks?.delta || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Gamma:</span>
                              <span className="font-medium">{(position.currentGreeks?.gamma || 0).toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Theta:</span>
                              <span className={cn("font-medium",
                                position.currentGreeks.theta > 0 ? 'text-green-600' : 'text-red-600'
                              )}>
                                {(position.currentGreeks?.theta || 0).toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Vega:</span>
                              <span className="font-medium">{(position.currentGreeks?.vega || 0).toFixed(1)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Risk Analysis */}
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-3">Risk Analysis</h5>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Max Loss:</span>
                              <span className="font-medium text-red-600">
                                ${Math.abs(position.riskMetrics?.maxLoss || 0).toFixed(0)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Breakeven:</span>
                              <span className="font-medium">${(position.riskMetrics?.breakeven || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Entry Price:</span>
                              <span className="font-medium">${(position.entryPrice || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Current Value:</span>
                              <span className="font-medium">${(position.currentValue || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Exit Guidance */}
                        {exitIntel && (
                          <div>
                            <h5 className="font-medium text-gray-900 dark:text-white mb-3">Exit Guidance</h5>
                            <div className="space-y-2">
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                                  Recommendation: {exitIntel.riskAdjustedHoldVsClose.recommendation.toUpperCase()}
                                </p>
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                  {exitIntel.riskAdjustedHoldVsClose.reasoning}
                                </p>
                              </div>
                              
                              <div className="text-sm">
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-600">Time Guidance:</span>
                                  <span className="font-medium">{exitIntel.timeToCloseGuidance}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Optimal Range:</span>
                                  <span className="font-medium">
                                    ${(exitIntel.optimalTakeProfitRange?.min || 0).toFixed(2)} - ${(exitIntel.optimalTakeProfitRange?.max || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Position Management Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Position Management Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {positions.filter(p => p.managementSignals.some(s => s.type === 'profit_target')).length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Ready for Profit Taking</div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {positions.filter(p => p.managementSignals.some(s => s.type === 'stop_loss')).length}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Need Loss Management</div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {positions.filter(p => p.daysToExpiry <= 21).length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Approaching Expiration</div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {positions.filter(p => p.tradeQuality === 'AAA' || p.tradeQuality === 'AA').length}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">High Quality Positions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}