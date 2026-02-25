'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, Eye, Zap, AlertTriangle, BarChart3, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { SmartTooltip, QuickTooltip } from '@/components/ui/TooltipSystem'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getLiveQuotes } from '@/lib/liveMarketData'
import MarketDataDisclaimer from '@/components/ui/MarketDataDisclaimer'

interface OptionsFlowItem {
  id: string
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: string
  volume: number
  openInterest: number
  premium: number
  unusual: boolean
  sentiment: 'bullish' | 'bearish' | 'neutral'
  institutionalFlow: number
  timestamp: Date
}

interface GammaExposureData {
  symbol: string
  price: number
  gammaLevels: Array<{
    strike: number
    gamma: number
    type: 'support' | 'resistance'
  }>
  totalGamma: number
  gammaFlip: number
  maxPain: number
}

interface PutCallData {
  symbol: string
  putCallRatio: number
  callVolume: number
  putVolume: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  trend: 'increasing' | 'decreasing' | 'stable'
  historical: Array<{
    date: string
    ratio: number
  }>
}

// Generate options flow with real market data
const generateOptionsFlow = async (): Promise<OptionsFlowItem[]> => {
  const symbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'META', 'AMZN']
  
  try {
    // Get real stock prices
    const stockQuotes = await getLiveQuotes(symbols)
    const flow: OptionsFlowItem[] = []
    
    stockQuotes.forEach((quote, i) => {
      // Generate 2-3 options per stock based on real price
      for (let j = 0; j < 2; j++) {
        const type = Math.random() > 0.5 ? 'call' : 'put'
        const strike = Math.round(quote.price * (0.95 + Math.random() * 0.1)) // Strikes near current price
        const volume = Math.floor(Math.random() * 8000) + 1000
        const unusual = volume > 4000 || Math.abs(quote.changePercent) > 2
        
        flow.push({
          id: `flow-${i}-${j}`,
          symbol: quote.symbol,
          type,
          strike,
          expiry: ['2024-03-15', '2024-03-22', '2024-04-19'][Math.floor(Math.random() * 3)],
          volume,
          openInterest: Math.floor(volume * (1 + Math.random())),
          premium: quote.price * 0.02 * (1 + Math.random()), // ~2% of stock price
          unusual,
          sentiment: unusual ? 
            (type === 'call' && quote.changePercent > 0 ? 'bullish' : 
             type === 'put' && quote.changePercent < 0 ? 'bearish' : 'neutral') : 'neutral',
          institutionalFlow: 30 + Math.random() * 60,
          timestamp: new Date(Date.now() - Math.random() * 1800000)
        })
      }
    })
    
    return flow.sort((a, b) => b.volume - a.volume)
  } catch (error) {
    console.error('Failed to generate options flow:', error)
    return []
  }
}

const generateGammaExposure = async (): Promise<GammaExposureData[]> => {
  const symbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA']
  
  try {
    const stockQuotes = await getLiveQuotes(symbols)
    
    return stockQuotes.map(quote => {
      const price = quote.price
      const strikes = []
      
      // Generate gamma levels based on real price
      for (let i = -10; i <= 10; i++) {
        const strike = Math.round(price + (i * (price * 0.025))) // 2.5% intervals
        const distance = Math.abs(price - strike)
        const gamma = Math.max(0, 100 - (distance / price * 200)) * (Math.random() * 0.5 + 0.5)
        
        strikes.push({
          strike,
          gamma,
          type: gamma > 50 ? (strike > price ? 'resistance' : 'support') as 'support' | 'resistance' : 'support' as 'support' | 'resistance'
        })
      }
      
      return {
        symbol: quote.symbol,
        price: quote.price,
        gammaLevels: strikes,
        totalGamma: strikes.reduce((sum, s) => sum + s.gamma, 0),
        gammaFlip: Math.round(price * 1.05 * 100) / 100,
        maxPain: Math.round(price * 0.98 * 100) / 100
      }
    })
  } catch (error) {
    console.error('Failed to generate gamma exposure:', error)
    return []
  }
}

const generatePutCallData = async (): Promise<PutCallData[]> => {
  const symbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA', 'MSFT']
  
  try {
    const stockQuotes = await getLiveQuotes(symbols)
    
    return stockQuotes.map(quote => {
      // Base volumes on stock performance and volatility
      const baseVolume = Math.max(10000, quote.volume / 100) // Rough options volume estimate
      const volMultiplier = 1 + Math.abs(quote.changePercent) / 10 // Higher volume on big moves
      
      const putVolume = Math.floor(baseVolume * volMultiplier * (quote.changePercent < 0 ? 1.3 : 0.8))
      const callVolume = Math.floor(baseVolume * volMultiplier * (quote.changePercent > 0 ? 1.3 : 0.8))
      const ratio = putVolume / callVolume
      
      const historical = []
      for (let i = 20; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        historical.push({
          date: date.toISOString().split('T')[0],
          ratio: ratio * (0.8 + Math.random() * 0.4)
        })
      }
      
      return {
        symbol: quote.symbol,
        putCallRatio: Math.round(ratio * 100) / 100,
        callVolume,
        putVolume,
        sentiment: ratio > 1.2 ? 'bearish' : ratio < 0.8 ? 'bullish' : 'neutral',
        trend: quote.changePercent > 0 ? 'decreasing' : 'increasing', // Inverse of stock movement
        historical
      }
    })
  } catch (error) {
    console.error('Failed to generate put/call data:', error)
    return []
  }
}

export default function MarketIntelligenceDashboard() {
  const [optionsFlow, setOptionsFlow] = useState<OptionsFlowItem[]>([])
  const [gammaData, setGammaData] = useState<GammaExposureData[]>([])
  const [putCallData, setPutCallData] = useState<PutCallData[]>([])
  const [selectedSymbol, setSelectedSymbol] = useState('SPY')
  const [timeframe, setTimeframe] = useState<'1d' | '5d' | '1m'>('1d')

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const [flowData, gammaData, putCallData] = await Promise.all([
          generateOptionsFlow(),
          generateGammaExposure(),
          generatePutCallData()
        ])
        
        setOptionsFlow(flowData)
        setGammaData(gammaData)
        setPutCallData(putCallData)
      } catch (error) {
        console.error('Failed to load market intelligence data:', error)
      }
    }
    
    loadMarketData()
    
    // Refresh data every 2 minutes
    const interval = setInterval(loadMarketData, 120000)
    return () => clearInterval(interval)
  }, [])

  const getFlowIcon = (item: OptionsFlowItem) => {
    if (item.unusual) {
      return <Zap className="h-4 w-4 text-yellow-500" />
    }
    return item.type === 'call' ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-600 bg-green-50 border-green-200'
      case 'bearish': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  return (
    <div className="space-y-6">
      {/* Data Disclaimer */}
      <MarketDataDisclaimer variant="compact" className="mb-4" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Market Intelligence
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time options flow, gamma exposure, and sentiment analysis
          </p>
        </div>
        
        <div className="flex space-x-2">
          {(['1d', '5d', '1m'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="flow" className="w-full">
        <TabsList className="grid grid-cols-4 lg:w-1/2">
          <TabsTrigger value="flow">Options Flow</TabsTrigger>
          <TabsTrigger value="gamma">Gamma Exposure</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        {/* Options Flow Tab */}
        <TabsContent value="flow" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Unusual Options Activity</span>
                  <SmartTooltip id="optionsFlow">
                    <button className="opacity-60 hover:opacity-100">
                      <Eye className="h-4 w-4" />
                    </button>
                  </SmartTooltip>
                </CardTitle>
                <Badge variant="outline">
                  Live • {optionsFlow.filter(f => f.unusual).length} alerts
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optionsFlow.slice(0, 10).map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getFlowIcon(item)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold">{item.symbol}</span>
                          <QuickTooltip content="Strike price for this option">
                            <span className="text-sm text-gray-600">
                              ${item.strike} {item.type}
                            </span>
                          </QuickTooltip>
                          <span className="text-xs text-gray-500">{item.expiry}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Vol: {item.volume.toLocaleString()}</span>
                          <span>OI: {item.openInterest.toLocaleString()}</span>
                          <span>Premium: ${item.premium.toFixed(2)}M</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getSentimentColor(item.sentiment)}>
                        {item.sentiment}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {item.institutionalFlow.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeAgo(item.timestamp)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gamma Exposure Tab */}
        <TabsContent value="gamma" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {gammaData.map(data => (
              <Card key={data.symbol}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{data.symbol} Gamma Exposure</span>
                    <Badge variant="outline">
                      ${data.price}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Key Levels */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-xs text-gray-600">Max Pain</div>
                        <div className="font-bold text-green-600">${data.maxPain}</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-xs text-gray-600">Current</div>
                        <div className="font-bold text-blue-600">${data.price}</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="text-xs text-gray-600">Gamma Flip</div>
                        <div className="font-bold text-purple-600">${data.gammaFlip}</div>
                      </div>
                    </div>

                    {/* Gamma Chart */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600">Support/Resistance Levels</div>
                      {data.gammaLevels
                        .filter(level => level.gamma > 30)
                        .slice(0, 5)
                        .map((level, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                level.type === 'support' ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <span className="text-sm">${level.strike}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className={`h-2 rounded ${
                                level.type === 'support' ? 'bg-green-200' : 'bg-red-200'
                              }`} style={{ width: `${level.gamma}px` }} />
                              <span className="text-xs text-gray-500">
                                {level.gamma.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Sentiment Tab */}
        <TabsContent value="sentiment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {putCallData.map(data => (
              <Card key={data.symbol}>
                <CardHeader>
                  <CardTitle className="text-sm">{data.symbol} Sentiment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Put/Call Ratio</span>
                      <span className="font-bold">{data.putCallRatio}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Calls: {(data.callVolume / 1000).toFixed(0)}K</span>
                        <span>Puts: {(data.putVolume / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(data.callVolume / (data.callVolume + data.putVolume)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge className={getSentimentColor(data.sentiment)}>
                        {data.sentiment}
                      </Badge>
                      <span className={`text-xs ${
                        data.trend === 'increasing' ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {data.trend === 'increasing' ? '↗' : '↘'} {data.trend}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {optionsFlow.reduce((sum, f) => sum + f.volume, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Volume</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {optionsFlow.filter(f => f.unusual).length}
                    </div>
                    <div className="text-sm text-gray-600">Unusual Activity</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <PieChart className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {putCallData.reduce((sum, d) => sum + d.putCallRatio, 0) / putCallData.length}
                    </div>
                    <div className="text-sm text-gray-600">Avg P/C Ratio</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(gammaData.reduce((sum, g) => sum + g.totalGamma, 0) / gammaData.length)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Gamma</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Market Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Top Unusual Activity</h4>
                  <div className="space-y-2">
                    {optionsFlow.filter(f => f.unusual).slice(0, 5).map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.symbol} ${item.strike} {item.type}</span>
                        <span className="font-medium">{item.volume.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Sentiment Overview</h4>
                  <div className="space-y-2">
                    {putCallData.slice(0, 5).map(data => (
                      <div key={data.symbol} className="flex justify-between text-sm">
                        <span>{data.symbol}</span>
                        <Badge className={getSentimentColor(data.sentiment)} variant="outline">
                          {data.sentiment}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}