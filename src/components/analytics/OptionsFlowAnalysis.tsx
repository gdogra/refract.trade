'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  Zap,
  Target,
  ArrowRight,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  AlertCircle,
  Filter
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'

interface OptionsFlowAnalysisProps {
  symbol?: string
  timeframe?: string
}

interface FlowData {
  timestamp: Date
  symbol: string
  optionType: 'call' | 'put'
  strike: number
  expiry: string
  volume: number
  openInterest: number
  premium: number
  notionalValue: number
  flowType: 'unusual' | 'sweep' | 'block' | 'split'
  sentiment: 'bullish' | 'bearish' | 'neutral'
  institutionalProbability: number
}

export default function OptionsFlowAnalysis({ 
  symbol = 'SPY', 
  timeframe = '1d' 
}: OptionsFlowAnalysisProps) {
  const [flowData, setFlowData] = useState<FlowData[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterActive, setFilterActive] = useState(false)

  useEffect(() => {
    fetchOptionsFlow()
  }, [symbol, timeframe])

  const fetchOptionsFlow = async () => {
    setIsLoading(true)
    
    // Mock options flow data (in production, fetch from flow analysis API)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const mockFlows: FlowData[] = [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
        symbol: 'SPY',
        optionType: 'call',
        strike: 530,
        expiry: '2026-03-07',
        volume: 12500,
        openInterest: 45000,
        premium: 2.85,
        notionalValue: 3562500,
        flowType: 'sweep',
        sentiment: 'bullish',
        institutionalProbability: 0.89
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 32), // 32 min ago
        symbol: 'QQQ',
        optionType: 'put',
        strike: 430,
        expiry: '2026-03-14',
        volume: 8900,
        openInterest: 32000,
        premium: 3.20,
        notionalValue: 2848000,
        flowType: 'block',
        sentiment: 'bearish',
        institutionalProbability: 0.92
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 48), // 48 min ago
        symbol: 'AAPL',
        optionType: 'call',
        strike: 190,
        expiry: '2026-02-21',
        volume: 15600,
        openInterest: 28000,
        premium: 1.95,
        notionalValue: 3042000,
        flowType: 'unusual',
        sentiment: 'bullish',
        institutionalProbability: 0.76
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 65), // 1hr 5min ago
        symbol: 'NVDA',
        optionType: 'call',
        strike: 900,
        expiry: '2026-04-18',
        volume: 4200,
        openInterest: 18500,
        premium: 45.50,
        notionalValue: 19110000,
        flowType: 'sweep',
        sentiment: 'bullish',
        institutionalProbability: 0.94
      }
    ]
    
    setFlowData(mockFlows)
    
    // Calculate summary metrics
    const totalNotional = mockFlows.reduce((sum, flow) => sum + flow.notionalValue, 0)
    const bullishFlow = mockFlows.filter(f => f.sentiment === 'bullish').reduce((sum, f) => sum + f.notionalValue, 0)
    const bearishFlow = mockFlows.filter(f => f.sentiment === 'bearish').reduce((sum, f) => sum + f.notionalValue, 0)
    
    setSummary({
      totalFlows: mockFlows?.length || 0,
      totalNotional,
      bullishNotional: bullishFlow,
      bearishNotional: bearishFlow,
      bullishPercentage: (bullishFlow / totalNotional) * 100,
      institutionalPercentage: (mockFlows.filter(f => f.institutionalProbability > 0.8)?.length || 0 / mockFlows?.length || 0) * 100,
      averageSize: totalNotional / mockFlows?.length || 0,
      putCallRatio: bearishFlow / bullishFlow
    })
    
    setIsLoading(false)
  }

  const getFlowTypeIcon = (type: string) => {
    switch (type) {
      case 'sweep': return <Zap className="h-4 w-4 text-yellow-500" />
      case 'block': return <Building2 className="h-4 w-4 text-blue-500" />
      case 'unusual': return <AlertCircle className="h-4 w-4 text-purple-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const formatNotional = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Flow Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-green-500" />
                <span>Options Flow Summary</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={fetchOptionsFlow}
                  variant="outline"
                  size="sm"
                >
                  Refresh
                </Button>
                <Button
                  onClick={() => setFilterActive(!filterActive)}
                  variant={filterActive ? 'default' : 'outline'}
                  size="sm"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          {summary && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {summary.totalFlows}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Flows</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatNotional(summary.totalNotional)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Notional</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {summary.bullishPercentage.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Bullish Flow</div>
                </div>
                
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {summary.institutionalPercentage.toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Institutional</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </motion.div>

      {/* Detailed Flow Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <span>Live Options Flow</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {flowData.map((flow, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-4 rounded-lg border ${
                    flow.sentiment === 'bullish' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    flow.sentiment === 'bearish' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                    'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getFlowTypeIcon(flow.flowType)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {flow.symbol}
                          </span>
                          <Badge variant={flow.optionType === 'call' ? 'default' : 'destructive'}>
                            {flow.optionType.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            ${flow.strike}
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {flow.expiry}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {flow.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white">
                        {formatNotional(flow.notionalValue)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {flow.volume.toLocaleString()} contracts
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Premium:</span>
                      <span className="font-medium ml-1">${flow.premium}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">OI:</span>
                      <span className="font-medium ml-1">{flow.openInterest.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Flow Type:</span>
                      <Badge variant="outline" className="ml-1 text-xs">
                        {flow.flowType.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-500">Institutional:</span>
                      <span className={`font-medium ml-1 ${
                        flow.institutionalProbability > 0.8 ? 'text-green-600' : 
                        flow.institutionalProbability > 0.6 ? 'text-yellow-600' : 'text-gray-600'
                      }`}>
                        {(flow.institutionalProbability * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {flow.sentiment === 'bullish' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : flow.sentiment === 'bearish' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-gray-500" />
                        )}
                        <span className={`font-medium capitalize ${
                          flow.sentiment === 'bullish' ? 'text-green-600' : 
                          flow.sentiment === 'bearish' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {flow.sentiment}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-gray-500">
                        {flow.institutionalProbability > 0.8 ? (
                          <Building2 className="h-4 w-4" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                        <span className="text-xs">
                          {flow.institutionalProbability > 0.8 ? 'Institutional' : 'Retail'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Flow Analytics */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span>Flow Direction Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overall Sentiment</span>
                  <Badge variant={summary.bullishPercentage > 60 ? 'default' : summary.bullishPercentage < 40 ? 'destructive' : 'secondary'}>
                    {summary.bullishPercentage > 60 ? 'Bullish' : 
                     summary.bullishPercentage < 40 ? 'Bearish' : 'Neutral'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Bullish Flow</span>
                    <span className="font-medium text-green-600">
                      {formatNotional(summary.bullishNotional)} ({summary.bullishPercentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Bearish Flow</span>
                    <span className="font-medium text-red-600">
                      {formatNotional(summary.bearishNotional)} ({(100 - summary.bullishPercentage).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Put/Call Ratio</span>
                    <span className="font-medium">{summary.putCallRatio.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${summary.bullishPercentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span>Participant Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Institutional Activity</span>
                  <Badge variant={summary.institutionalPercentage > 70 ? 'default' : 'secondary'}>
                    {summary.institutionalPercentage.toFixed(0)}%
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Avg Trade Size</span>
                    <span className="font-medium">{formatNotional(summary.averageSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Sweep Activity</span>
                    <span className="font-medium text-yellow-600">
                      {flowData.filter(f => f.flowType === 'sweep')?.length || 0} flows
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Block Trades</span>
                    <span className="font-medium text-blue-600">
                      {flowData.filter(f => f.flowType === 'block')?.length || 0} flows
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Smart Money Insights
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Large call sweeps in SPY suggest bullish positioning
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Block trades indicate institutional hedging activity
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Unusual activity concentrated in tech names
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}