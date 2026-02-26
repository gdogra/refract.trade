'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Calendar, Target, MoreHorizontal, Edit, Trash2, Settings } from 'lucide-react'

interface Position {
  id: string
  symbol: string
  strategy: string
  quantity: number
  entryPrice: number
  currentPrice: number
  unrealizedPnl: number
  realizedPnl: number
  pnlPercent: number
  daysToExpiry: number
  entryDate: string
  greeks?: {
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
    theoreticalValue: number
  } | null
  legs: Array<{
    id: string
    symbol: string
    optionType: 'call' | 'put'
    strike: number
    expiry: string
    quantity: number
    side: 'buy' | 'sell'
    entryPrice: number
    exitPrice?: number | null
    iv?: number | null
  }>
  marketData?: {
    currentPrice: number
    change: number
    changePercent: number
    volume: number
    timestamp: string
  } | null
}

export default function PositionsList() {
  const { data: positionsData, isLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const response = await fetch('/api/positions?includeGreeks=true', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch positions')
      }
      
      return response.json()
    }
  })

  const positions = positionsData?.data?.positions || []
  const summary = positionsData?.data?.summary

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

  const formatPercentage = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Positions</h3>
        <motion.button 
          className="text-brand-500 hover:text-brand-600 text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View All
        </motion.button>
      </div>

      <div className="space-y-4">
        {positions?.map((position: Position, index: number) => (
          <motion.div
            key={position.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {position.symbol}
                  </h4>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {position.strategy}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {position.quantity}x
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Target className="h-3 w-3" />
                    <span>Entry: {formatCurrency(position.entryPrice)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{position.daysToExpiry}d to expiry</span>
                  </div>
                </div>

                {position.greeks && (
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      Δ: {(position.greeks?.delta || 0) >= 0 ? '+' : ''}{(position.greeks?.delta || 0).toFixed(2)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Θ: {(position.greeks?.theta || 0) >= 0 ? '+' : ''}{(position.greeks?.theta || 0).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right space-y-1">
                <div className={`font-semibold ${
                  position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(position.unrealizedPnl)}
                </div>
                <div className={`text-sm flex items-center ${
                  position.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {position.pnlPercent >= 0 ? 
                    <TrendingUp className="h-3 w-3 mr-1" /> : 
                    <TrendingDown className="h-3 w-3 mr-1" />
                  }
                  {formatPercentage(position.pnlPercent)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Current: {formatCurrency(position.currentPrice)}
                </div>
              </div>

              <div className="ml-2 flex items-center space-x-1">
                <motion.button 
                  className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    alert(`Edit Position: ${position.symbol}\n\nThis would open a position editor allowing you to:\n• Adjust quantity\n• Modify stop-loss levels\n• Set profit targets\n• Roll to different expiration\n• Close or partially close position`)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </motion.button>
                <motion.button 
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    alert(`Position Settings: ${position.symbol}\n\nAvailable actions:\n• View detailed Greeks\n• Set alerts\n• View trade history\n• Generate performance report\n• Analyze risk scenarios`)
                  }}
                >
                  <Settings className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {summary && (
        <motion.div 
          className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Total Positions
              </span>
              <span className="font-medium">
                {summary.totalPositions}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Portfolio Value
              </span>
              <span className="font-medium">
                {formatCurrency(summary.totalValue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                Total P&L
              </span>
              <span className={`font-semibold ${
                summary.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary.totalPnl)} ({formatPercentage(summary.totalPnlPercent)})
              </span>
            </div>
            {summary.expiringThisWeek > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">
                  Expiring This Week
                </span>
                <span className="font-medium text-amber-600">
                  {summary.expiringThisWeek}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}