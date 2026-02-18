'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Send, TrendingUp, TrendingDown, BarChart3, DollarSign, Clock, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'

interface AlphaQuery {
  id: string
  query: string
  timestamp: Date
  response: AlphaResponse
}

interface AlphaResponse {
  summary: string
  keyPoints: string[]
  marketData: {
    currentPrice: number
    change: number
    changePercent: number
    volume: number
    marketCap: string
  }
  analysis: {
    technicals: {
      trend: 'bullish' | 'bearish' | 'neutral'
      support: number
      resistance: number
      rsi: number
      recommendation: string
    }
    fundamentals: {
      peRatio: number
      revenue: string
      earnings: string
      recommendation: string
    }
    sentiment: {
      score: number
      description: string
      newsImpact: 'positive' | 'negative' | 'neutral'
    }
  }
  riskFactors: string[]
  opportunities: string[]
  actionItems: string[]
  confidence: number
}

const suggestedQueries = [
  "What's driving NVDA's recent performance?",
  "Should I buy AAPL calls before earnings?",
  "Is SPY showing any bearish signals?",
  "Best options strategies for high IV environment",
  "TSLA technical analysis and price targets",
  "Market outlook for next 30 days"
]

export default function AlphaAssistant() {
  const [queries, setQueries] = useState<AlphaQuery[]>([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const queriesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    queriesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [queries])

  const generateAlphaResponse = async (query: string): Promise<AlphaResponse> => {
    // Extract symbol if mentioned
    const symbolMatch = query.match(/\b[A-Z]{2,5}\b/)
    const symbol = symbolMatch ? symbolMatch[0] : 'SPY'
    
    // Simulate AI analysis
    const isCallQuery = query.toLowerCase().includes('call') || query.toLowerCase().includes('bull')
    const isPutQuery = query.toLowerCase().includes('put') || query.toLowerCase().includes('bear')
    
    const basePrice = 150 + Math.random() * 200
    const trend = Math.random() > 0.5 ? 'bullish' : 'bearish'
    
    return {
      summary: `Based on my analysis of ${symbol}, I see ${trend} momentum with several key factors supporting this view. Current technical indicators suggest ${trend === 'bullish' ? 'upward' : 'downward'} pressure, while fundamental metrics ${trend === 'bullish' ? 'support' : 'challenge'} the current valuation.`,
      
      keyPoints: [
        `${symbol} is trading ${trend === 'bullish' ? 'above' : 'below'} key moving averages`,
        `Volume profile shows ${trend === 'bullish' ? 'accumulation' : 'distribution'} pattern`,
        `Options flow indicates ${trend === 'bullish' ? 'bullish' : 'bearish'} institutional sentiment`,
        `Recent news sentiment is ${Math.random() > 0.5 ? 'positive' : 'mixed'} for the sector`
      ],
      
      marketData: {
        currentPrice: basePrice,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 0.08,
        volume: Math.floor(Math.random() * 50000000),
        marketCap: `$${Math.floor(basePrice * 100 + Math.random() * 500)}B`
      },
      
      analysis: {
        technicals: {
          trend,
          support: basePrice * 0.92,
          resistance: basePrice * 1.08,
          rsi: 30 + Math.random() * 40,
          recommendation: trend === 'bullish' ? 'Consider call options or long position' : 'Consider put options or protective strategies'
        },
        fundamentals: {
          peRatio: 15 + Math.random() * 25,
          revenue: '+12.5% YoY',
          earnings: 'Beat by $0.15',
          recommendation: trend === 'bullish' ? 'Fundamentals support upward move' : 'Fundamentals suggest caution'
        },
        sentiment: {
          score: 60 + Math.random() * 30,
          description: trend === 'bullish' ? 'Generally optimistic' : 'Mixed to pessimistic',
          newsImpact: trend === 'bullish' ? 'positive' : 'negative'
        }
      },
      
      riskFactors: [
        'Market volatility uncertainty',
        'Earnings date approaching',
        'Sector rotation risk',
        'Macroeconomic headwinds'
      ],
      
      opportunities: trend === 'bullish' ? [
        'Technical breakout potential',
        'Strong earnings momentum',
        'Institutional accumulation',
        'Sector leadership position'
      ] : [
        'Oversold bounce potential',
        'Value opportunity emerging',
        'Defensive hedge opportunity',
        'Contrarian setup forming'
      ],
      
      actionItems: trend === 'bullish' ? [
        `Monitor ${symbol} for breakout above $${(basePrice * 1.05).toFixed(2)}`,
        'Consider call options 30-45 DTE',
        'Set stop-loss at support level',
        'Watch for increased volume confirmation'
      ] : [
        `Watch for breakdown below $${(basePrice * 0.95).toFixed(2)}`,
        'Consider protective puts',
        'Reduce exposure if holding long',
        'Monitor sector weakness'
      ],
      
      confidence: 70 + Math.floor(Math.random() * 25)
    }
  }

  const handleSubmitQuery = async () => {
    if (!currentQuery.trim()) return

    setIsProcessing(true)
    
    // Add user query immediately
    const newQuery: AlphaQuery = {
      id: Date.now().toString(),
      query: currentQuery,
      timestamp: new Date(),
      response: await generateAlphaResponse(currentQuery)
    }

    setTimeout(() => {
      setQueries(prev => [...prev, newQuery])
      setCurrentQuery('')
      setIsProcessing(false)
    }, 1500)
  }

  const handleSuggestedQuery = (query: string) => {
    setCurrentQuery(query)
    handleSubmitQuery()
  }

  return (
    <Card className="h-full max-h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5" />
          <span>Alpha AI Research Assistant</span>
        </CardTitle>
        <p className="text-sm opacity-90">
          Ask me about any stock, market conditions, or trading strategies
        </p>
      </CardHeader>

      {/* Queries History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {queries.length === 0 && !isProcessing && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Ask Alpha Anything
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Get AI-powered insights on stocks, options, and market conditions
            </p>
            
            <div className="space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQueries.slice(0, 3).map((query) => (
                  <Button
                    key={query}
                    size="sm"
                    variant="outline"
                    onClick={() => handleSuggestedQuery(query)}
                    className="text-xs"
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {queries.map((queryItem) => (
          <motion.div
            key={queryItem.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* User Query */}
            <div className="flex justify-end">
              <div className="bg-blue-600 text-white p-3 rounded-lg max-w-xs">
                <p className="text-sm">{queryItem.query}</p>
              </div>
            </div>

            {/* AI Response */}
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Alpha Analysis</span>
                  <Badge className="text-xs bg-purple-100 text-purple-800">
                    {queryItem.response.confidence}% confidence
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  {queryItem.response.summary}
                </p>

                {/* Market Data */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white dark:bg-gray-700 p-2 rounded text-center">
                    <div className="text-lg font-bold">${queryItem.response.marketData.currentPrice.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">Current Price</div>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded text-center">
                    <div className={`text-lg font-bold ${
                      queryItem.response.marketData.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {queryItem.response.marketData.changePercent >= 0 ? '+' : ''}{(queryItem.response.marketData.changePercent * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500">Today</div>
                  </div>
                </div>

                {/* Key Points */}
                <div className="space-y-1">
                  {queryItem.response.keyPoints.map((point, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <div className="w-1 h-1 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{point}</span>
                    </div>
                  ))}
                </div>

                {/* Action Items */}
                {queryItem.response.actionItems.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Action Items:</h4>
                    <div className="space-y-1">
                      {queryItem.response.actionItems.map((action, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <Target className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg flex items-center space-x-3">
              <div className="animate-spin">
                <Sparkles className="h-4 w-4 text-purple-500" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Alpha is analyzing...</span>
            </div>
          </motion.div>
        )}

        <div ref={queriesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmitQuery()}
            placeholder="Ask about any stock, option, or market condition..."
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSubmitQuery}
            disabled={!currentQuery.trim() || isProcessing}
            className="bg-purple-600 hover:bg-purple-700 px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {queries.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {suggestedQueries.slice(0, 2).map((query) => (
              <button
                key={query}
                onClick={() => handleSuggestedQuery(query)}
                className="text-xs text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400 px-2 py-1 rounded"
              >
                {query}
              </button>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}