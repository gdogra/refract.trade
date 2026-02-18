'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  AlertTriangle,
  Clock,
  Target,
  Eye,
  Settings
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Area, AreaChart, ScatterChart, Scatter } from 'recharts'

interface VolatilityIntelligenceProps {
  symbol: string
  volatilitySurface: VolatilitySurfaceData
  ivRankData: IVRankData
  termStructure: TermStructureData[]
  skewAnalysis: SkewAnalysisData
  realizedVsImplied: RealizedVsImpliedData
  eventVolatility?: EventVolatilityData
  className?: string
}

interface VolatilitySurfaceData {
  atmVolatility: number
  surfacePoints: Array<{
    strike: number
    expiration: string
    daysToExpiry: number
    impliedVolatility: number
    moneyness: number
    volume: number
    openInterest: number
  }>
  lastUpdated: Date
}

interface IVRankData {
  currentIV: number
  ivRank: number // 0-100
  ivPercentile: number // 0-100
  period: string
  historicalRange: {
    min: number
    max: number
    mean: number
    std: number
  }
  interpretation: 'extremely_low' | 'low' | 'normal' | 'high' | 'extremely_high'
  recommendation: 'buy_premium' | 'sell_premium' | 'neutral'
}

interface TermStructureData {
  expiration: string
  daysToExpiry: number
  atmVolatility: number
  percentile: number
  rank: number
}

interface SkewAnalysisData {
  putSkew: number
  callSkew: number
  overallSkew: number
  skewDirection: 'put_skew' | 'call_skew' | 'neutral'
  skewStrength: 'weak' | 'moderate' | 'strong' | 'extreme'
}

interface RealizedVsImpliedData {
  realizedVolatility: number
  impliedVolatility: number
  spread: number
  spreadPercentile: number
  interpretation: 'undervalued' | 'fairly_valued' | 'overvalued'
  expectedDirection: 'vol_crush' | 'vol_expansion' | 'neutral'
}

interface EventVolatilityData {
  eventType: string
  eventDate: Date
  daysUntilEvent: number
  preEventIV: number
  postEventIVExpected: number
  historicalEventMove: number
  eventPremium: number
  eventRisk: 'low' | 'medium' | 'high' | 'extreme'
}

// Mock data for demonstration
const mockData = {
  volatilitySurface: {
    atmVolatility: 0.285,
    surfacePoints: [
      { strike: 170, expiration: '2024-02-16', daysToExpiry: 28, impliedVolatility: 0.31, moneyness: 1.02, volume: 1250, openInterest: 2800 },
      { strike: 175, expiration: '2024-02-16', daysToExpiry: 28, impliedVolatility: 0.285, moneyness: 0.98, volume: 2150, openInterest: 4200 },
      { strike: 180, expiration: '2024-02-16', daysToExpiry: 28, impliedVolatility: 0.265, moneyness: 0.95, volume: 1850, openInterest: 3600 },
      { strike: 170, expiration: '2024-03-15', daysToExpiry: 56, impliedVolatility: 0.295, moneyness: 1.02, volume: 850, openInterest: 1900 },
      { strike: 175, expiration: '2024-03-15', daysToExpiry: 56, impliedVolatility: 0.275, moneyness: 0.98, volume: 1150, openInterest: 2400 }
    ],
    lastUpdated: new Date()
  },
  ivRankData: {
    currentIV: 0.285,
    ivRank: 75,
    ivPercentile: 78,
    period: '252d',
    historicalRange: { min: 0.12, max: 0.65, mean: 0.28, std: 0.08 },
    interpretation: 'high' as const,
    recommendation: 'sell_premium' as const
  },
  termStructure: [
    { expiration: '2024-02-16', daysToExpiry: 28, atmVolatility: 0.285, percentile: 78, rank: 75 },
    { expiration: '2024-03-15', daysToExpiry: 56, atmVolatility: 0.275, percentile: 72, rank: 68 },
    { expiration: '2024-04-19', daysToExpiry: 91, atmVolatility: 0.265, percentile: 65, rank: 62 },
    { expiration: '2024-06-21', daysToExpiry: 154, atmVolatility: 0.255, percentile: 58, rank: 55 }
  ],
  skewAnalysis: {
    putSkew: 0.045,
    callSkew: -0.015,
    overallSkew: 0.06,
    skewDirection: 'put_skew' as const,
    skewStrength: 'moderate' as const
  },
  realizedVsImplied: {
    realizedVolatility: 0.225,
    impliedVolatility: 0.285,
    spread: 0.06,
    spreadPercentile: 82,
    interpretation: 'overvalued' as const,
    expectedDirection: 'vol_crush' as const
  }
}

export default function VolatilityIntelligence({
  symbol,
  volatilitySurface = mockData.volatilitySurface,
  ivRankData = mockData.ivRankData,
  termStructure = mockData.termStructure,
  skewAnalysis = mockData.skewAnalysis,
  realizedVsImplied = mockData.realizedVsImplied,
  eventVolatility,
  className
}: VolatilityIntelligenceProps) {
  const [selectedView, setSelectedView] = useState<'surface' | 'rank' | 'term' | 'skew'>('rank')

  const getIVRankColor = (rank: number) => {
    if (rank >= 80) return 'text-red-600 bg-red-100 border-red-200'
    if (rank >= 60) return 'text-orange-600 bg-orange-100 border-orange-200'
    if (rank >= 40) return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    if (rank >= 20) return 'text-blue-600 bg-blue-100 border-blue-200'
    return 'text-green-600 bg-green-100 border-green-200'
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'sell_premium': return 'text-red-600 bg-red-100'
      case 'buy_premium': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const termStructureChart = termStructure.map(point => ({
    expiry: point.expiration.split('-')[1] + '/' + point.expiration.split('-')[2],
    days: point.daysToExpiry,
    vol: point.atmVolatility * 100,
    rank: point.rank
  }))

  const surfaceChart = volatilitySurface.surfacePoints.map(point => ({
    strike: point.strike,
    vol: point.impliedVolatility * 100,
    moneyness: point.moneyness,
    volume: point.volume,
    expiry: point.daysToExpiry
  }))

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-6 w-6" />
                <span>Volatility Intelligence: {symbol}</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Institutional-grade volatility analysis and trading insights
              </p>
            </div>
            
            <div className="flex space-x-2">
              {['rank', 'term', 'skew', 'surface'].map(view => (
                <Button
                  key={view}
                  variant={selectedView === view ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedView(view as any)}
                  className="capitalize"
                >
                  {view === 'rank' ? 'IV Rank' : 
                   view === 'term' ? 'Term Structure' :
                   view === 'skew' ? 'Skew' : 'Surface'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* IV Rank Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IV Rank Card */}
        <Card className={cn("border-2", getIVRankColor(ivRankData.ivRank))}>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {ivRankData.ivRank}
              </div>
              <div className="text-sm opacity-80 mb-4">IV Rank ({ivRankData.period})</div>
              
              <div className={cn("px-4 py-2 rounded-lg text-sm font-medium mb-4", 
                getRecommendationColor(ivRankData.recommendation))}>
                {ivRankData.recommendation === 'sell_premium' ? '📉 SELL PREMIUM' :
                 ivRankData.recommendation === 'buy_premium' ? '📈 BUY PREMIUM' : '⚪ NEUTRAL'}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current IV:</span>
                  <span className="font-medium">{(ivRankData.currentIV * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Percentile:</span>
                  <span className="font-medium">{ivRankData.ivPercentile.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Range:</span>
                  <span className="font-medium">
                    {(ivRankData.historicalRange.min * 100).toFixed(0)}% - {(ivRankData.historicalRange.max * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Realized vs Implied */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Realized vs Implied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Realized Vol (30d):</span>
                <span className="text-lg font-bold">
                  {(realizedVsImplied.realizedVolatility * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Implied Vol:</span>
                <span className="text-lg font-bold">
                  {(realizedVsImplied.impliedVolatility * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm text-gray-600">Spread:</span>
                <span className={cn("text-lg font-bold",
                  realizedVsImplied.spread > 0 ? 'text-red-600' : 'text-green-600'
                )}>
                  {realizedVsImplied.spread > 0 ? '+' : ''}{(realizedVsImplied.spread * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className={cn("p-3 rounded-lg text-center",
                realizedVsImplied.interpretation === 'overvalued' ? 'bg-red-100 text-red-800' :
                realizedVsImplied.interpretation === 'undervalued' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              )}>
                <div className="font-medium capitalize">{realizedVsImplied.interpretation}</div>
                <div className="text-xs mt-1">
                  Expecting {realizedVsImplied.expectedDirection.replace('_', ' ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skew Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Volatility Skew</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className={cn("text-3xl font-bold mb-2",
                  skewAnalysis.skewDirection === 'put_skew' ? 'text-red-600' :
                  skewAnalysis.skewDirection === 'call_skew' ? 'text-green-600' :
                  'text-gray-600'
                )}>
                  {(Math.abs(skewAnalysis.overallSkew) * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {skewAnalysis.skewDirection.replace('_', ' ')} ({skewAnalysis.skewStrength})
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Put Skew:</span>
                  <span className="font-medium text-red-600">
                    {skewAnalysis.putSkew > 0 ? '+' : ''}{(skewAnalysis.putSkew * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Call Skew:</span>
                  <span className="font-medium text-green-600">
                    {skewAnalysis.callSkew > 0 ? '+' : ''}{(skewAnalysis.callSkew * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              {skewAnalysis.skewStrength === 'extreme' && (
                <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                      Extreme Skew Alert
                    </span>
                  </div>
                  <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                    Consider skew-aware strategies or arbitrage opportunities
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualization Area */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedView === 'rank' && 'IV Rank Historical Analysis'}
            {selectedView === 'term' && 'Term Structure Analysis'}
            {selectedView === 'skew' && 'Volatility Skew Profile'}
            {selectedView === 'surface' && 'Volatility Surface'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="h-96">
            {selectedView === 'rank' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { date: 'Jan', rank: 45 },
                  { date: 'Feb', rank: 62 },
                  { date: 'Mar', rank: 78 },
                  { date: 'Apr', rank: 85 },
                  { date: 'May', rank: 75 },
                  { date: 'Now', rank: ivRankData.ivRank }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'IV Rank']}
                    labelFormatter={(label) => `Period: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="rank"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                  {/* Add horizontal lines for key levels */}
                  <Line
                    type="monotone"
                    dataKey={() => 80}
                    stroke="#ef4444"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={() => 20}
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {selectedView === 'term' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={termStructureChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="expiry" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'ATM Vol']}
                    labelFormatter={(label) => `Expiration: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="vol"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {selectedView === 'skew' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={surfaceChart.filter(p => p.expiry === 28)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="strike" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Implied Vol']}
                    labelFormatter={(label) => `Strike: $${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="vol"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {selectedView === 'surface' && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={surfaceChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="moneyness" />
                  <YAxis dataKey="vol" />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'vol') return [`${value.toFixed(1)}%`, 'Implied Vol']
                      if (name === 'volume') return [value, 'Volume']
                      return [value, name]
                    }}
                    labelFormatter={(label) => `Moneyness: ${label}`}
                  />
                  <Scatter 
                    dataKey="vol" 
                    fill="#8884d8"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trading Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volatility Strategy Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Strategy Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Primary Recommendation */}
              <div className={cn("p-4 rounded-lg border-2",
                ivRankData.recommendation === 'sell_premium' ? 'border-red-300 bg-red-50' :
                ivRankData.recommendation === 'buy_premium' ? 'border-green-300 bg-green-50' :
                'border-gray-300 bg-gray-50'
              )}>
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-5 w-5" />
                  <span className="font-semibold">Primary Signal</span>
                </div>
                <p className="text-sm mb-3">
                  {ivRankData.recommendation === 'sell_premium' 
                    ? 'High IV rank suggests selling premium strategies'
                    : ivRankData.recommendation === 'buy_premium'
                    ? 'Low IV rank suggests buying premium strategies'
                    : 'IV in normal range, consider other factors'}
                </p>
                
                <div className="space-y-2">
                  {ivRankData.recommendation === 'sell_premium' && (
                    <>
                      <div className="text-sm">✅ Iron Condors</div>
                      <div className="text-sm">✅ Credit Spreads</div>
                      <div className="text-sm">✅ Short Strangles</div>
                      <div className="text-sm">❌ Long Straddles</div>
                    </>
                  )}
                  {ivRankData.recommendation === 'buy_premium' && (
                    <>
                      <div className="text-sm">✅ Long Straddles</div>
                      <div className="text-sm">✅ Long Calls/Puts</div>
                      <div className="text-sm">✅ Debit Spreads</div>
                      <div className="text-sm">❌ Credit Spreads</div>
                    </>
                  )}
                </div>
              </div>

              {/* Realized vs Implied Analysis */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Realized vs Implied Analysis
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>RV/IV Ratio:</span>
                    <span className="font-medium">
                      {((realizedVsImplied.realizedVolatility / realizedVsImplied.impliedVolatility) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spread Percentile:</span>
                    <span className="font-medium">{realizedVsImplied.spreadPercentile}%</span>
                  </div>
                  <div className={cn("p-2 rounded text-xs font-medium",
                    realizedVsImplied.expectedDirection === 'vol_crush' ? 'bg-red-100 text-red-700' :
                    realizedVsImplied.expectedDirection === 'vol_expansion' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  )}>
                    Expected: {realizedVsImplied.expectedDirection.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Event Risk */}
              {eventVolatility && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h5 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Upcoming Event: {eventVolatility.eventType}
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Days Until Event:</span>
                      <span className="font-medium">{eventVolatility.daysUntilEvent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Historical Move:</span>
                      <span className="font-medium">±{(eventVolatility.historicalEventMove * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Event Premium:</span>
                      <span className="font-medium">{(eventVolatility.eventPremium * 100).toFixed(1)}%</span>
                    </div>
                    <div className={cn("text-center p-2 rounded text-xs font-medium",
                      eventVolatility.eventRisk === 'extreme' ? 'bg-red-100 text-red-700' :
                      eventVolatility.eventRisk === 'high' ? 'bg-orange-100 text-orange-700' :
                      eventVolatility.eventRisk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {eventVolatility.eventRisk.toUpperCase()} RISK
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Volatility Regime Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Volatility Regime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Regime */}
              <div className="text-center">
                <div className={cn("text-2xl font-bold mb-2",
                  ivRankData.interpretation === 'extremely_high' ? 'text-red-600' :
                  ivRankData.interpretation === 'high' ? 'text-orange-600' :
                  ivRankData.interpretation === 'normal' ? 'text-blue-600' :
                  ivRankData.interpretation === 'low' ? 'text-yellow-600' :
                  'text-green-600'
                )}>
                  {ivRankData.interpretation.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">Current Volatility Regime</div>
              </div>

              {/* Regime Characteristics */}
              <div className="space-y-3">
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                  <h6 className="font-medium text-gray-900 dark:text-white mb-2">Regime Characteristics</h6>
                  {ivRankData.interpretation === 'high' || ivRankData.interpretation === 'extremely_high' ? (
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• Options expensive relative to history</li>
                      <li>• Market showing elevated fear/uncertainty</li>
                      <li>• Premium selling opportunities available</li>
                      <li>• Vol crush risk for long premium</li>
                    </ul>
                  ) : ivRankData.interpretation === 'low' || ivRankData.interpretation === 'extremely_low' ? (
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• Options cheap relative to history</li>
                      <li>• Market complacency indicated</li>
                      <li>• Premium buying opportunities available</li>
                      <li>• Potential for volatility expansion</li>
                    </ul>
                  ) : (
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      <li>• Options fairly priced</li>
                      <li>• No strong volatility edge</li>
                      <li>• Focus on directional strategies</li>
                      <li>• Monitor for regime changes</li>
                    </ul>
                  )}
                </div>

                {/* Trading Edge */}
                <div className={cn("p-3 rounded-lg",
                  ivRankData.interpretation === 'high' || ivRankData.interpretation === 'extremely_high' ? 'bg-red-100' :
                  ivRankData.interpretation === 'low' || ivRankData.interpretation === 'extremely_low' ? 'bg-green-100' :
                  'bg-gray-100'
                )}>
                  <h6 className="font-medium mb-2">Trading Edge</h6>
                  <div className="text-sm">
                    {ivRankData.interpretation === 'high' || ivRankData.interpretation === 'extremely_high' 
                      ? 'Strong edge for premium selling strategies. Options are expensive and likely to decay in value.'
                      : ivRankData.interpretation === 'low' || ivRankData.interpretation === 'extremely_low'
                      ? 'Strong edge for premium buying strategies. Options are cheap and volatility may expand.'
                      : 'No strong volatility edge. Focus on other market factors for trading decisions.'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volatility Alerts */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                Volatility Intelligence Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Current Regime:</span>
                    <span className="font-medium text-blue-900">{ivRankData.interpretation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Primary Edge:</span>
                    <span className="font-medium text-blue-900">{ivRankData.recommendation.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Confidence:</span>
                    <span className="font-medium text-blue-900">
                      {ivRankData.ivRank > 80 || ivRankData.ivRank < 20 ? 'High' : 'Medium'}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Skew Bias:</span>
                    <span className="font-medium text-blue-900">{skewAnalysis.skewDirection.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">RV vs IV:</span>
                    <span className="font-medium text-blue-900">{realizedVsImplied.interpretation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Expected Move:</span>
                    <span className="font-medium text-blue-900">{realizedVsImplied.expectedDirection.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Recommended Actions</h5>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  {ivRankData.recommendation === 'sell_premium' && (
                    <>
                      <li>• Focus on credit strategies (iron condors, credit spreads)</li>
                      <li>• Avoid long straddles/strangles</li>
                      <li>• Consider covered calls on long stock positions</li>
                      <li>• Target 30-45 DTE for optimal time decay</li>
                    </>
                  )}
                  {ivRankData.recommendation === 'buy_premium' && (
                    <>
                      <li>• Focus on debit strategies (long calls/puts, debit spreads)</li>
                      <li>• Consider long straddles for volatility expansion</li>
                      <li>• Avoid credit strategies</li>
                      <li>• Target 45+ DTE for volatility expansion time</li>
                    </>
                  )}
                  {skewAnalysis.skewStrength === 'extreme' && (
                    <li>• Extreme skew detected - consider skew arbitrage strategies</li>
                  )}
                  {eventVolatility && eventVolatility.daysUntilEvent <= 7 && (
                    <li>• Event risk detected - consider event-specific strategies or avoid</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}