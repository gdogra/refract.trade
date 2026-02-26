'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  Eye, 
  Zap, 
  AlertCircle,
  Target,
  Gauge,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'

interface MarketIntelligenceProps {
  symbol?: string
}

export default function MarketIntelligence({ symbol = 'SPY' }: MarketIntelligenceProps) {
  const [marketData, setMarketData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMarketIntelligence()
  }, [symbol])

  const fetchMarketIntelligence = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbol,
          insightType: 'market_intelligence',
          timeframe: '1w'
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setMarketData(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch market intelligence:', error)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const sentiment = marketData?.marketIntelligence?.sentiment
  const technical = marketData?.marketIntelligence?.technicalAnalysis
  const flow = marketData?.marketIntelligence?.flowAnalysis
  const forecasts = marketData?.predictiveModeling?.priceForecasts

  const getTrendIcon = (trend: string) => {
    if (trend === 'Uptrend') return <ArrowUp className="h-4 w-4 text-green-500" />
    if (trend === 'Downtrend') return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Market Sentiment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <span>Market Sentiment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sentiment && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {sentiment.overall}
                  </div>
                  <div className={`text-sm font-medium ${getConfidenceColor(sentiment.confidence)}`}>
                    {(sentiment.confidence * 100).toFixed(0)}% Confidence
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Key Drivers:</div>
                  {sentiment.drivers?.map((driver: string, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">{driver}</span>
                    </div>
                  ))}
                  
                  {(sentiment.contraryIndicators?.length || 0) > 0 && (
                    <>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-3">Risks:</div>
                      {sentiment.contraryIndicators.map((risk: string, idx: number) => (
                        <div key={idx} className="flex items-center space-x-2">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">{risk}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <span>Technical Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {technical && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Trend</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(technical.trend)}
                    <span className="font-medium">{technical.trend}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Support</span>
                    <span className="font-medium text-green-600">${technical.support}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Resistance</span>
                    <span className="font-medium text-red-600">${technical.resistance}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Momentum</span>
                    <Badge variant={technical.momentum === 'Positive' ? 'default' : 'destructive'}>
                      {technical.momentum}
                    </Badge>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Key Levels</div>
                  <div className="flex flex-wrap gap-1">
                    {technical.keyLevels?.map((level: number, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        ${level}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Options Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-500" />
              <span>Options Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {flow && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {flow.optionsFlow}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    P/C Ratio: {flow.putCallRatio}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Unusual Activity:</div>
                  {flow.unusualActivity?.map((activity: any, idx: number) => (
                    <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <div className="font-medium text-gray-900 dark:text-white">{activity.symbol}</div>
                      <div className="text-gray-600 dark:text-gray-400">{activity.activity}</div>
                      <Badge 
                        variant={activity.significance === 'High' ? 'destructive' : 'secondary'}
                        className="mt-1"
                      >
                        {activity.significance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Price Forecasts */}
      {forecasts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span>AI Price Forecasts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(forecasts).map(([timeframe, forecast]: [string, any]) => (
                  <div key={timeframe} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-center mb-3">
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
                        {timeframe}
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        ${forecast.target}
                      </div>
                      <div className={`text-sm ${getConfidenceColor(forecast.confidence)}`}>
                        {(forecast.confidence * 100).toFixed(0)}% confidence
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Low</span>
                        <span className="font-medium">${forecast.range[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">High</span>
                        <span className="font-medium">${forecast.range[1]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Range</span>
                        <span className="font-medium">
                          {((forecast.range[1] - forecast.range[0]) / forecast.target) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* AI Alerts */}
      {marketData?.automatedAlerts && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span>AI-Powered Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketData.automatedAlerts.map((alert: any, idx: number) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          alert.type === 'opportunity' ? 'bg-green-500' :
                          alert.type === 'risk' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {alert.title}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(alert.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        💡 {alert.actionRequired}
                      </span>
                      <span className="text-xs text-gray-500">
                        {alert.timeframe}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}