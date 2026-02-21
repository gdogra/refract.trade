'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Shield, 
  Brain,
  AlertTriangle,
  Clock,
  DollarSign,
  BarChart3,
  Zap,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import { OptionsChain, OptionContract } from '@/lib/options/yahooOptions'

interface StrategyScenario {
  scenario: string
  probability: number
  outcome: 'profit' | 'loss' | 'breakeven'
  pnl: number
  description: string
}

interface StrategyRecommendation {
  id: string
  name: string
  type: 'bullish' | 'bearish' | 'neutral' | 'volatility'
  complexity: 'beginner' | 'intermediate' | 'advanced'
  confidence: number
  maxProfit: number
  maxLoss: number
  breakeven: number[]
  probabilityOfProfit: number
  capitalRequired: number
  timeDecay: 'positive' | 'negative' | 'neutral'
  volatilityView: 'high' | 'low' | 'neutral'
  legs: StrategyLeg[]
  scenarios: StrategyScenario[]
  justification: string
  riskProfile: 'low' | 'medium' | 'high'
  timeHorizon: string
  ivRank: number
  marketCondition: string
}

interface StrategyLeg {
  action: 'buy' | 'sell'
  type: 'call' | 'put'
  strike: number
  expiration: string
  quantity: number
  price: number
  delta: number
}

interface StrategyRecommendationsProps {
  symbol: string
  optionsData: OptionsChain | null
  underlyingPrice: number
  className?: string
}

export default function StrategyRecommendations({ 
  symbol, 
  optionsData, 
  underlyingPrice,
  className = "" 
}: StrategyRecommendationsProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [marketOutlook, setMarketOutlook] = useState<'bullish' | 'bearish' | 'neutral'>('neutral')
  const [volatilityView, setVolatilityView] = useState<'increasing' | 'decreasing' | 'stable'>('stable')
  const [timeHorizon, setTimeHorizon] = useState<'short' | 'medium' | 'long'>('medium')

  // Analyze current market conditions
  const marketAnalysis = useMemo(() => {
    if (!optionsData) return null

    // Calculate IV rank (simplified)
    const avgIV = optionsData.calls.reduce((sum, call) => sum + call.impliedVolatility, 0) / optionsData.calls.length
    const ivRank = Math.min(100, Math.max(0, (avgIV - 0.15) / 0.4 * 100)) // Normalize to 0-100

    // Analyze skew
    const atmStrike = optionsData.calls.reduce((closest, call) => 
      Math.abs(call.strike - underlyingPrice) < Math.abs(closest.strike - underlyingPrice) ? call : closest
    ).strike

    const putSkew = optionsData.puts.find(put => put.strike === atmStrike)?.impliedVolatility || 0
    const callSkew = optionsData.calls.find(call => call.strike === atmStrike)?.impliedVolatility || 0
    const skew = putSkew - callSkew

    return {
      ivRank,
      avgIV,
      skew,
      atmStrike,
      marketCondition: ivRank > 70 ? 'high_volatility' : ivRank < 30 ? 'low_volatility' : 'normal',
      daysToExpiry: optionsData.calls[0]?.daysToExpiry || 7
    }
  }, [optionsData, underlyingPrice])

  // Generate strategy recommendations based on market conditions and user outlook
  const recommendations = useMemo((): StrategyRecommendation[] => {
    if (!optionsData || !marketAnalysis) return []

    const strategies: StrategyRecommendation[] = []

    // Iron Condor - High IV, Neutral Outlook
    if (marketAnalysis.ivRank > 60 && marketOutlook === 'neutral') {
      const atmStrike = marketAnalysis.atmStrike
      const putStrike = atmStrike - 10
      const callStrike = atmStrike + 10
      const putSpreadStrike = atmStrike - 20
      const callSpreadStrike = atmStrike + 20

      const sellPut = optionsData.puts.find(p => p.strike === putStrike)
      const buyPut = optionsData.puts.find(p => p.strike === putSpreadStrike)
      const sellCall = optionsData.calls.find(c => c.strike === callStrike)
      const buyCall = optionsData.calls.find(c => c.strike === callSpreadStrike)

      if (sellPut && buyPut && sellCall && buyCall) {
        const credit = (sellPut.bid + sellCall.bid) - (buyPut.ask + buyCall.ask)
        const maxLoss = 1000 - (credit * 100)

        strategies.push({
          id: 'iron_condor',
          name: 'Iron Condor',
          type: 'neutral',
          complexity: 'advanced',
          confidence: 0.85,
          maxProfit: credit * 100,
          maxLoss: maxLoss,
          breakeven: [putStrike + credit, callStrike - credit],
          probabilityOfProfit: 0.68,
          capitalRequired: maxLoss,
          timeDecay: 'positive',
          volatilityView: 'high',
          legs: [
            { action: 'sell', type: 'put', strike: putStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: sellPut.bid, delta: sellPut.delta },
            { action: 'buy', type: 'put', strike: putSpreadStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: buyPut.ask, delta: buyPut.delta },
            { action: 'sell', type: 'call', strike: callStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: sellCall.bid, delta: sellCall.delta },
            { action: 'buy', type: 'call', strike: callSpreadStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: buyCall.ask, delta: buyCall.delta }
          ],
          scenarios: [
            {
              scenario: `${symbol} stays between $${putStrike} and $${callStrike}`,
              probability: 0.68,
              outcome: 'profit',
              pnl: credit * 100,
              description: 'Maximum profit achieved if stock stays within profit zone at expiration'
            },
            {
              scenario: `${symbol} moves beyond $${putSpreadStrike} or $${callSpreadStrike}`,
              probability: 0.15,
              outcome: 'loss',
              pnl: -maxLoss,
              description: 'Maximum loss if stock makes large move in either direction'
            },
            {
              scenario: 'Early profit taking at 50% max gain',
              probability: 0.45,
              outcome: 'profit',
              pnl: (credit * 100) * 0.5,
              description: 'Conservative exit strategy to lock in profits early'
            }
          ],
          justification: `High IV rank (${marketAnalysis.ivRank.toFixed(0)}%) suggests options are overpriced. Iron condor profits from time decay and volatility compression. Best when expecting ${symbol} to trade sideways.`,
          riskProfile: 'medium',
          timeHorizon: `${marketAnalysis.daysToExpiry} days`,
          ivRank: marketAnalysis.ivRank,
          marketCondition: 'High volatility, range-bound expected'
        })
      }
    }

    // Covered Call - Neutral to Slightly Bullish
    if ((marketOutlook === 'neutral' || marketOutlook === 'bullish') && marketAnalysis.ivRank > 40) {
      const callStrike = Math.ceil(underlyingPrice * 1.05 / 5) * 5 // 5% OTM
      const callOption = optionsData.calls.find(c => c.strike >= callStrike)

      if (callOption) {
        const premium = callOption.bid * 100
        const stockCost = underlyingPrice * 100
        const totalCost = stockCost - premium

        strategies.push({
          id: 'covered_call',
          name: 'Covered Call',
          type: 'bullish',
          complexity: 'beginner',
          confidence: 0.75,
          maxProfit: (callStrike - underlyingPrice) * 100 + premium,
          maxLoss: totalCost,
          breakeven: [underlyingPrice - (premium / 100)],
          probabilityOfProfit: 0.72,
          capitalRequired: totalCost,
          timeDecay: 'positive',
          volatilityView: 'high',
          legs: [
            { action: 'buy', type: 'call', strike: 0, expiration: 'stock', quantity: 100, price: underlyingPrice, delta: 1 },
            { action: 'sell', type: 'call', strike: callStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: callOption.bid, delta: callOption.delta }
          ],
          scenarios: [
            {
              scenario: `${symbol} stays below $${callStrike}`,
              probability: 0.72,
              outcome: 'profit',
              pnl: premium,
              description: 'Keep premium and stock if price stays below strike'
            },
            {
              scenario: `${symbol} rises above $${callStrike}`,
              probability: 0.28,
              outcome: 'profit',
              pnl: (callStrike - underlyingPrice) * 100 + premium,
              description: 'Stock called away but profit from appreciation + premium'
            },
            {
              scenario: `${symbol} drops significantly`,
              probability: 0.15,
              outcome: 'loss',
              pnl: -(underlyingPrice - (callStrike * 0.9)) * 100 + premium,
              description: 'Stock decline partially offset by call premium collected'
            }
          ],
          justification: `Elevated IV (${marketAnalysis.ivRank.toFixed(0)}%) makes call premium attractive. Generate income on existing/new stock position while allowing for ${((callStrike/underlyingPrice - 1) * 100).toFixed(1)}% upside.`,
          riskProfile: 'low',
          timeHorizon: `${marketAnalysis.daysToExpiry} days`,
          ivRank: marketAnalysis.ivRank,
          marketCondition: 'Income generation with limited upside'
        })
      }
    }

    // Bull Put Spread - Bullish Outlook
    if (marketOutlook === 'bullish') {
      const sellStrike = Math.floor(underlyingPrice * 0.95 / 5) * 5 // 5% OTM
      const buyStrike = sellStrike - 5

      const sellPut = optionsData.puts.find(p => p.strike === sellStrike)
      const buyPut = optionsData.puts.find(p => p.strike === buyStrike)

      if (sellPut && buyPut) {
        const credit = (sellPut.bid - buyPut.ask) * 100
        const maxLoss = 500 - credit

        strategies.push({
          id: 'bull_put_spread',
          name: 'Bull Put Spread',
          type: 'bullish',
          complexity: 'intermediate',
          confidence: 0.78,
          maxProfit: credit,
          maxLoss: maxLoss,
          breakeven: [sellStrike - (credit / 100)],
          probabilityOfProfit: 0.75,
          capitalRequired: maxLoss,
          timeDecay: 'positive',
          volatilityView: 'high',
          legs: [
            { action: 'sell', type: 'put', strike: sellStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: sellPut.bid, delta: sellPut.delta },
            { action: 'buy', type: 'put', strike: buyStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: buyPut.ask, delta: buyPut.delta }
          ],
          scenarios: [
            {
              scenario: `${symbol} stays above $${sellStrike}`,
              probability: 0.75,
              outcome: 'profit',
              pnl: credit,
              description: 'Both puts expire worthless, keep full credit'
            },
            {
              scenario: `${symbol} between $${buyStrike} and $${sellStrike}`,
              probability: 0.15,
              outcome: 'profit',
              pnl: credit * 0.3,
              description: 'Partial profit as short put moves in-the-money'
            },
            {
              scenario: `${symbol} drops below $${buyStrike}`,
              probability: 0.10,
              outcome: 'loss',
              pnl: -maxLoss,
              description: 'Maximum loss if stock falls significantly'
            }
          ],
          justification: `Bullish outlook on ${symbol} with high IV (${marketAnalysis.ivRank.toFixed(0)}%) creates opportunity to collect premium below current price. Profits if stock stays flat or rises.`,
          riskProfile: 'medium',
          timeHorizon: `${marketAnalysis.daysToExpiry} days`,
          ivRank: marketAnalysis.ivRank,
          marketCondition: 'Bullish sentiment with elevated premium'
        })
      }
    }

    // Long Straddle - High Volatility Expected
    if (volatilityView === 'increasing') {
      const atmStrike = marketAnalysis.atmStrike
      const atmCall = optionsData.calls.find(c => c.strike === atmStrike)
      const atmPut = optionsData.puts.find(p => p.strike === atmStrike)

      if (atmCall && atmPut) {
        const totalCost = (atmCall.ask + atmPut.ask) * 100
        const breakeven1 = atmStrike - (atmCall.ask + atmPut.ask)
        const breakeven2 = atmStrike + (atmCall.ask + atmPut.ask)

        strategies.push({
          id: 'long_straddle',
          name: 'Long Straddle',
          type: 'volatility',
          complexity: 'intermediate',
          confidence: 0.65,
          maxProfit: Infinity,
          maxLoss: totalCost,
          breakeven: [breakeven1, breakeven2],
          probabilityOfProfit: 0.45,
          capitalRequired: totalCost,
          timeDecay: 'negative',
          volatilityView: 'low',
          legs: [
            { action: 'buy', type: 'call', strike: atmStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: atmCall.ask, delta: atmCall.delta },
            { action: 'buy', type: 'put', strike: atmStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: atmPut.ask, delta: atmPut.delta }
          ],
          scenarios: [
            {
              scenario: `${symbol} moves beyond $${breakeven2.toFixed(2)} or below $${breakeven1.toFixed(2)}`,
              probability: 0.45,
              outcome: 'profit',
              pnl: (underlyingPrice * 0.15) * 100, // Assumes 15% move
              description: 'Profits from large moves in either direction'
            },
            {
              scenario: `${symbol} stays between $${breakeven1.toFixed(2)} and $${breakeven2.toFixed(2)}`,
              probability: 0.55,
              outcome: 'loss',
              pnl: -totalCost * 0.7,
              description: 'Loses money if stock stays within breakeven range'
            },
            {
              scenario: 'Volatility expansion without price movement',
              probability: 0.25,
              outcome: 'profit',
              pnl: totalCost * 0.3,
              description: 'Can profit from IV increase even without directional movement'
            }
          ],
          justification: `Expecting significant volatility increase. Current IV rank at ${marketAnalysis.ivRank.toFixed(0)}% suggests potential for vol expansion. Earnings, FDA approval, or major news catalyst expected.`,
          riskProfile: 'high',
          timeHorizon: `${marketAnalysis.daysToExpiry} days`,
          ivRank: marketAnalysis.ivRank,
          marketCondition: 'Anticipating volatility explosion'
        })
      }
    }

    // Short Iron Butterfly - High IV, Neutral with Tight Range
    if (marketOutlook === 'neutral' && marketAnalysis.ivRank > 70) {
      const atmStrike = marketAnalysis.atmStrike
      const lowerStrike = atmStrike - 5
      const upperStrike = atmStrike + 5

      const atmCall = optionsData.calls.find(c => c.strike === atmStrike)
      const atmPut = optionsData.puts.find(p => p.strike === atmStrike)
      const upperCall = optionsData.calls.find(c => c.strike === upperStrike)
      const lowerPut = optionsData.puts.find(p => p.strike === lowerStrike)

      if (atmCall && atmPut && upperCall && lowerPut) {
        const credit = (atmCall.bid + atmPut.bid - upperCall.ask - lowerPut.ask) * 100
        const maxLoss = 500 - credit

        strategies.push({
          id: 'iron_butterfly',
          name: 'Iron Butterfly',
          type: 'neutral',
          complexity: 'advanced',
          confidence: 0.80,
          maxProfit: credit,
          maxLoss: maxLoss,
          breakeven: [atmStrike - (credit/100), atmStrike + (credit/100)],
          probabilityOfProfit: 0.62,
          capitalRequired: maxLoss,
          timeDecay: 'positive',
          volatilityView: 'high',
          legs: [
            { action: 'sell', type: 'put', strike: atmStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: atmPut.bid, delta: atmPut.delta },
            { action: 'sell', type: 'call', strike: atmStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: atmCall.bid, delta: atmCall.delta },
            { action: 'buy', type: 'put', strike: lowerStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: lowerPut.ask, delta: lowerPut.delta },
            { action: 'buy', type: 'call', strike: upperStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: upperCall.ask, delta: upperCall.delta }
          ],
          scenarios: [
            {
              scenario: `${symbol} closes exactly at $${atmStrike}`,
              probability: 0.15,
              outcome: 'profit',
              pnl: credit,
              description: 'Maximum profit if stock pins to ATM strike at expiration'
            },
            {
              scenario: `${symbol} stays within $${lowerStrike}-$${upperStrike} range`,
              probability: 0.62,
              outcome: 'profit',
              pnl: credit * 0.6,
              description: 'Partial profit from volatility crush and time decay'
            },
            {
              scenario: `${symbol} moves beyond wings ($${lowerStrike}/$${upperStrike})`,
              probability: 0.23,
              outcome: 'loss',
              pnl: -maxLoss,
              description: 'Maximum loss if stock moves outside profit zone'
            }
          ],
          justification: `Extremely high IV rank (${marketAnalysis.ivRank.toFixed(0)}%) suggests vol crush opportunity. Butterfly maximizes profit from pinning action and volatility compression. Perfect for post-earnings scenarios.`,
          riskProfile: 'medium',
          timeHorizon: `${marketAnalysis.daysToExpiry} days`,
          ivRank: marketAnalysis.ivRank,
          marketCondition: 'Extreme IV with expected range-bound trading'
        })
      }
    }

    // Cash-Secured Put - Bullish, Want to Own Stock
    if (marketOutlook === 'bullish') {
      const putStrike = Math.floor(underlyingPrice * 0.95 / 5) * 5 // 5% OTM
      const targetPut = optionsData.puts.find(p => p.strike === putStrike)

      if (targetPut) {
        const premium = targetPut.bid * 100
        const cashRequired = putStrike * 100

        strategies.push({
          id: 'cash_secured_put',
          name: 'Cash-Secured Put',
          type: 'bullish',
          complexity: 'beginner',
          confidence: 0.70,
          maxProfit: premium,
          maxLoss: cashRequired - premium,
          breakeven: [putStrike - (premium / 100)],
          probabilityOfProfit: 0.78,
          capitalRequired: cashRequired,
          timeDecay: 'positive',
          volatilityView: 'high',
          legs: [
            { action: 'sell', type: 'put', strike: putStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: targetPut.bid, delta: targetPut.delta }
          ],
          scenarios: [
            {
              scenario: `${symbol} stays above $${putStrike}`,
              probability: 0.78,
              outcome: 'profit',
              pnl: premium,
              description: 'Keep premium, put expires worthless'
            },
            {
              scenario: `${symbol} assigned at $${putStrike}`,
              probability: 0.22,
              outcome: 'profit',
              pnl: 0,
              description: 'Own 100 shares at effective cost of $' + (putStrike - premium/100).toFixed(2)
            },
            {
              scenario: `${symbol} drops below $${(putStrike - premium/100).toFixed(2)} (breakeven)`,
              probability: 0.08,
              outcome: 'loss',
              pnl: -(putStrike * 0.1) * 100,
              description: 'Loss if assigned and stock continues declining'
            }
          ],
          justification: `Bullish on ${symbol} and willing to own at $${putStrike}. High IV (${marketAnalysis.ivRank.toFixed(0)}%) provides good premium income. Essentially getting paid to place a buy order below market.`,
          riskProfile: 'low',
          timeHorizon: `${marketAnalysis.daysToExpiry} days`,
          ivRank: marketAnalysis.ivRank,
          marketCondition: 'Bullish with income generation opportunity'
        })
      }
    }

    // Long Put - Bearish Protection
    if (marketOutlook === 'bearish') {
      const putStrike = Math.floor(underlyingPrice * 0.95 / 5) * 5
      const protectionPut = optionsData.puts.find(p => p.strike === putStrike)

      if (protectionPut) {
        const cost = protectionPut.ask * 100
        const intrinsicAtBreakeven = (protectionPut.ask) * 100

        strategies.push({
          id: 'long_put',
          name: 'Protective Put',
          type: 'bearish',
          complexity: 'beginner',
          confidence: 0.60,
          maxProfit: (putStrike * 100) - cost,
          maxLoss: cost,
          breakeven: [putStrike - protectionPut.ask],
          probabilityOfProfit: 0.40,
          capitalRequired: cost,
          timeDecay: 'negative',
          volatilityView: 'low',
          legs: [
            { action: 'buy', type: 'put', strike: putStrike, expiration: optionsData.selectedExpiration, quantity: 1, price: protectionPut.ask, delta: protectionPut.delta }
          ],
          scenarios: [
            {
              scenario: `${symbol} drops to $${(putStrike * 0.9).toFixed(2)}`,
              probability: 0.25,
              outcome: 'profit',
              pnl: (putStrike - (putStrike * 0.9)) * 100 - cost,
              description: '10% drop generates significant profit'
            },
            {
              scenario: `${symbol} stays above $${putStrike}`,
              probability: 0.60,
              outcome: 'loss',
              pnl: -cost,
              description: 'Put expires worthless, lose premium paid'
            },
            {
              scenario: 'Portfolio protection (if holding stock)',
              probability: 1.0,
              outcome: 'profit',
              pnl: 0,
              description: 'Insurance against stock portfolio decline'
            }
          ],
          justification: `Bearish outlook on ${symbol} or portfolio hedging need. Put provides downside protection with limited risk. Acts as insurance against significant decline.`,
          riskProfile: 'low',
          timeHorizon: `${marketAnalysis.daysToExpiry} days`,
          ivRank: marketAnalysis.ivRank,
          marketCondition: 'Bearish protection or hedging'
        })
      }
    }

    return strategies.sort((a, b) => b.confidence - a.confidence)
  }, [optionsData, marketAnalysis, marketOutlook, volatilityView, timeHorizon, symbol, underlyingPrice])

  const getStrategyIcon = (type: string) => {
    switch (type) {
      case 'bullish': return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'bearish': return <TrendingDown className="h-5 w-5 text-red-500" />
      case 'neutral': return <Minus className="h-5 w-5 text-blue-500" />
      case 'volatility': return <Zap className="h-5 w-5 text-purple-500" />
      default: return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-100 text-green-700 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (!optionsData || !marketAnalysis) {
    return (
      <div className={className}>
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              Strategy Analysis Loading
            </h3>
            <p className="text-gray-500">
              Analyzing options chain for {symbol} to generate personalized strategy recommendations...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Market Outlook Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-500" />
              <span>Your Market Outlook</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Direction</label>
                <select
                  value={marketOutlook}
                  onChange={(e) => setMarketOutlook(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="bullish">Bullish (Up)</option>
                  <option value="neutral">Neutral (Sideways)</option>
                  <option value="bearish">Bearish (Down)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Volatility View</label>
                <select
                  value={volatilityView}
                  onChange={(e) => setVolatilityView(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="increasing">Increasing</option>
                  <option value="stable">Stable</option>
                  <option value="decreasing">Decreasing</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Horizon</label>
                <select
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="short">Short (1-2 weeks)</option>
                  <option value="medium">Medium (1-2 months)</option>
                  <option value="long">Long (3+ months)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Analysis Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              <span>{symbol} Market Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{marketAnalysis.ivRank.toFixed(0)}%</div>
                <div className="text-sm text-gray-600">IV Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${underlyingPrice.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Current Price</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{marketAnalysis.daysToExpiry}</div>
                <div className="text-sm text-gray-600">Days to Expiry</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{(marketAnalysis.skew * 100).toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Put/Call Skew</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Recommendations */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Target className="h-6 w-6 text-blue-500" />
            <span>Recommended Strategies</span>
            <Badge variant="outline">{recommendations.length} strategies</Badge>
          </h2>

          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  No Optimal Strategies Found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your market outlook or time horizon to see different strategy recommendations.
                </p>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((strategy, index) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-l-4 ${
                  strategy.type === 'bullish' ? 'border-green-500' :
                  strategy.type === 'bearish' ? 'border-red-500' :
                  strategy.type === 'neutral' ? 'border-blue-500' :
                  'border-purple-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-3">
                        {getStrategyIcon(strategy.type)}
                        <span>{strategy.name}</span>
                        <Badge className={getComplexityColor(strategy.complexity)}>
                          {strategy.complexity}
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="font-mono">
                          {(strategy.confidence * 100).toFixed(0)}% confidence
                        </Badge>
                        <Badge variant={strategy.riskProfile === 'low' ? 'default' : strategy.riskProfile === 'medium' ? 'secondary' : 'destructive'}>
                          {strategy.riskProfile} risk
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Strategy Overview */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Strategy Justification</h4>
                        <p className="text-gray-700 leading-relaxed">{strategy.justification}</p>
                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
                          <span>Market: {strategy.marketCondition}</span>
                          <span>•</span>
                          <span>Horizon: {strategy.timeHorizon}</span>
                        </div>
                      </div>

                      {/* Key Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {strategy.maxProfit === Infinity ? '∞' : `$${strategy.maxProfit.toFixed(0)}`}
                          </div>
                          <div className="text-sm text-gray-600">Max Profit</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-red-600">$${strategy.maxLoss.toFixed(0)}</div>
                          <div className="text-sm text-gray-600">Max Loss</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{(strategy.probabilityOfProfit * 100).toFixed(0)}%</div>
                          <div className="text-sm text-gray-600">Win Rate</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">${strategy.capitalRequired.toFixed(0)}</div>
                          <div className="text-sm text-gray-600">Capital Req</div>
                        </div>
                      </div>

                      {/* Breakeven Points */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Breakeven Points</h4>
                        <div className="flex items-center space-x-4">
                          {strategy.breakeven.map((point, i) => (
                            <Badge key={i} variant="outline" className="font-mono">
                              ${point.toFixed(2)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Strategy Legs */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Strategy Legs</h4>
                        <div className="space-y-2">
                          {strategy.legs.map((leg, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Badge variant={leg.action === 'buy' ? 'default' : 'secondary'}>
                                  {leg.action}
                                </Badge>
                                <span className="font-mono">
                                  {leg.strike === 0 ? 'Stock' : `${leg.strike} ${leg.type?.toUpperCase()}`}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {leg.quantity} {leg.strike === 0 ? 'shares' : 'contracts'}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${leg.price.toFixed(2)}</div>
                                <div className="text-sm text-gray-600">Δ {leg.delta.toFixed(3)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Scenarios Analysis */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Outcome Scenarios</h4>
                        <div className="space-y-3">
                          {strategy.scenarios.map((scenario, i) => (
                            <div key={i} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge 
                                    variant={
                                      scenario.outcome === 'profit' ? 'default' : 
                                      scenario.outcome === 'loss' ? 'destructive' : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {(scenario.probability * 100).toFixed(0)}% chance
                                  </Badge>
                                  <span className="font-medium">{scenario.scenario}</span>
                                </div>
                                <div className={`font-bold ${
                                  scenario.outcome === 'profit' ? 'text-green-600' :
                                  scenario.outcome === 'loss' ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {scenario.pnl >= 0 ? '+' : ''}${scenario.pnl.toFixed(0)}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{scenario.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4 border-t">
                        <Button 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            alert(`Building ${strategy.name} strategy for ${symbol}...`)
                          }}
                        >
                          Build Strategy
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => {
                            alert(`Running backtest for ${strategy.name} on ${symbol}...`)
                          }}
                        >
                          Backtest
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            alert(`${strategy.name} strategy saved to watchlist!`)
                          }}
                        >
                          Save to Watchlist
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Quick Strategy Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span>Quick Strategy Builder</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'covered_call', name: 'Covered Call', type: 'income' },
                { id: 'protective_put', name: 'Protective Put', type: 'hedge' },
                { id: 'iron_condor', name: 'Iron Condor', type: 'neutral' },
                { id: 'straddle', name: 'Straddle', type: 'volatility' }
              ].map((strategy) => (
                <Button
                  key={strategy.id}
                  variant={selectedStrategy === strategy.id ? "default" : "outline"}
                  size="sm"
                  className="h-12 text-xs"
                  onClick={() => {
                    setSelectedStrategy(strategy.id)
                    alert(`Quick building ${strategy.name} for ${symbol}...`)
                  }}
                >
                  {strategy.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Condition Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-gray-900">Current Market Condition</h3>
                <p className="text-sm text-gray-600">{marketAnalysis.marketCondition.replace('_', ' ')}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="text-lg font-bold text-purple-600">
                  {marketAnalysis.ivRank.toFixed(0)}% IV Rank
                </div>
                <div className="text-sm text-gray-600">
                  {marketAnalysis.marketCondition.replace('_', ' ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}