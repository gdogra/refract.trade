'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Zap,
  Brain,
  ArrowRight,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { OptionsChain } from '@/lib/options/yahooOptions'

interface QuickStrategy {
  name: string
  type: 'bullish' | 'bearish' | 'neutral' | 'volatility'
  confidence: number
  description: string
  reasoning: string
  riskLevel: 'low' | 'medium' | 'high'
}

interface QuickStrategyPanelProps {
  symbol: string
  optionsData: OptionsChain | null
  underlyingPrice: number
  className?: string
}

export default function QuickStrategyPanel({ 
  symbol, 
  optionsData, 
  underlyingPrice,
  className = "" 
}: QuickStrategyPanelProps) {
  
  // Analyze market conditions and generate quick recommendations
  const analysis = useMemo(() => {
    if (!optionsData || !underlyingPrice) return null

    // Calculate IV metrics
    const avgCallIV = optionsData.calls.reduce((sum, call) => sum + call.impliedVolatility, 0) / optionsData.calls.length
    const avgPutIV = optionsData.puts.reduce((sum, put) => sum + put.impliedVolatility, 0) / optionsData.puts.length
    const ivRank = Math.min(100, Math.max(0, (avgCallIV - 0.15) / 0.4 * 100))
    const skew = avgPutIV - avgCallIV

    // Find ATM options
    const atmStrike = optionsData.calls.reduce((closest, call) => 
      Math.abs(call.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice) ? call : closest
    ).strike

    const atmCall = optionsData.calls.find(c => c.strike === atmStrike)
    const atmPut = optionsData.puts.find(p => p.strike === atmStrike)

    // Calculate volume metrics
    const totalCallVolume = optionsData.calls.reduce((sum, call) => sum + call.volume, 0)
    const totalPutVolume = optionsData.puts.reduce((sum, put) => sum + put.volume, 0)
    const putCallVolumeRatio = totalPutVolume / totalCallVolume

    // Generate quick strategies
    const strategies: QuickStrategy[] = []

    // High IV strategies
    if (ivRank > 60) {
      strategies.push({
        name: 'Sell Premium',
        type: 'neutral',
        confidence: 0.85,
        description: 'Iron Condor or Credit Spreads',
        reasoning: `IV rank at ${ivRank.toFixed(0)}% - options are overpriced`,
        riskLevel: 'medium'
      })
    }

    // High skew strategies
    if (Math.abs(skew) > 0.05) {
      strategies.push({
        name: skew > 0 ? 'Put Credit Spread' : 'Call Credit Spread',
        type: skew > 0 ? 'bullish' : 'bearish',
        confidence: 0.75,
        description: 'Exploit skew inefficiency',
        reasoning: `${Math.abs(skew * 100).toFixed(1)}% skew creates arbitrage opportunity`,
        riskLevel: 'medium'
      })
    }

    // Volume-based strategies
    if (putCallVolumeRatio > 1.5) {
      strategies.push({
        name: 'Contrarian Call Buy',
        type: 'bullish',
        confidence: 0.65,
        description: 'Heavy put buying suggests oversold',
        reasoning: `Put/Call volume ratio: ${putCallVolumeRatio.toFixed(2)} indicates fear`,
        riskLevel: 'medium'
      })
    } else if (putCallVolumeRatio < 0.7) {
      strategies.push({
        name: 'Protective Put',
        type: 'bearish',
        confidence: 0.70,
        description: 'Heavy call buying suggests tops',
        reasoning: `Low put/call ratio (${putCallVolumeRatio.toFixed(2)}) indicates complacency`,
        riskLevel: 'low'
      })
    }

    // Time decay strategies for short expiry
    const daysToExpiry = optionsData.calls[0]?.daysToExpiry || 0
    if (daysToExpiry < 10 && ivRank > 50) {
      strategies.push({
        name: 'Time Decay Play',
        type: 'neutral',
        confidence: 0.80,
        description: 'Sell theta-rich options',
        reasoning: `${daysToExpiry} DTE with high IV creates time decay opportunity`,
        riskLevel: 'low'
      })
    }

    // Default conservative strategy
    if (strategies.length === 0) {
      strategies.push({
        name: 'Cash-Secured Put',
        type: 'bullish',
        confidence: 0.60,
        description: 'Generate income below market',
        reasoning: 'Conservative income strategy with defined risk',
        riskLevel: 'low'
      })
    }

    return {
      ivRank,
      skew,
      atmStrike,
      atmCall,
      atmPut,
      putCallVolumeRatio,
      daysToExpiry,
      marketCondition: ivRank > 70 ? 'High Vol' : ivRank < 30 ? 'Low Vol' : 'Normal Vol',
      strategies: strategies.slice(0, 3) // Top 3 recommendations
    }
  }, [optionsData, underlyingPrice])

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'neutral': return <Target className="h-4 w-4 text-blue-500" />
      case 'volatility': return <Zap className="h-4 w-4 text-purple-500" />
      default: return <Brain className="h-4 w-4 text-gray-500" />
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'  
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (!analysis) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading strategy analysis...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`${className} space-y-4`}>
      {/* Market Snapshot */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <span>AI Strategy Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{analysis.ivRank.toFixed(0)}%</div>
              <div className="text-xs text-gray-600">IV Rank</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{analysis.daysToExpiry}</div>
              <div className="text-xs text-gray-600">DTE</div>
            </div>
          </div>

          {/* Market Condition */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Market Condition</span>
              <Badge variant="outline">{analysis.marketCondition}</Badge>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              P/C Volume Ratio: {analysis.putCallVolumeRatio.toFixed(2)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Strategy Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <span>Top Strategies</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {analysis.strategies.length} found
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {analysis.strategies.map((strategy, index) => (
            <motion.div
              key={index}
              className="p-3 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStrategyIcon(strategy.type)}
                  <span className="font-medium text-sm">{strategy.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="text-xs">
                    {(strategy.confidence * 100).toFixed(0)}%
                  </Badge>
                  <Badge className={`${getRiskColor(strategy.riskLevel)} text-xs`}>
                    {strategy.riskLevel}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-2">{strategy.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{strategy.reasoning}</span>
                <ArrowRight className="h-3 w-3 text-gray-400" />
              </div>
            </motion.div>
          ))}
          
          {/* View Full Analysis Button */}
          <Button variant="outline" className="w-full text-sm">
            View Detailed Analysis
          </Button>
        </CardContent>
      </Card>

      {/* Market Alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span>Market Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analysis.ivRank > 80 && (
            <div className="p-2 bg-orange-50 border border-orange-200 rounded text-xs">
              <span className="font-medium text-orange-700">Extreme IV:</span>
              <span className="text-orange-600 ml-1">
                Consider selling premium - vol crush likely
              </span>
            </div>
          )}
          
          {analysis.daysToExpiry < 5 && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
              <span className="font-medium text-red-700">Time Decay Warning:</span>
              <span className="text-red-600 ml-1">
                Options lose value rapidly - {analysis.daysToExpiry} DTE
              </span>
            </div>
          )}
          
          {Math.abs(analysis.skew) > 0.08 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <span className="font-medium text-blue-700">Skew Opportunity:</span>
              <span className="text-blue-600 ml-1">
                {analysis.skew > 0 ? 'Puts' : 'Calls'} relatively expensive
              </span>
            </div>
          )}

          {analysis.strategies.length === 0 && (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 text-center">
              No clear opportunities identified
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full text-xs">
            Set Price Alert
          </Button>
          <Button variant="outline" size="sm" className="w-full text-xs">
            Add to Watchlist  
          </Button>
          <Button variant="outline" size="sm" className="w-full text-xs">
            View Earnings Calendar
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}