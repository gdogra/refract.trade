'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Target } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { orderService } from '@/lib/orderService'

export default function Portfolio() {
  const [positions, setPositions] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])


  // Load positions and orders from orderService
  useEffect(() => {
    const updatePortfolio = () => {
      const optionPositions = orderService.getPositions()
      const allOrders = orderService.getOrders()
      
      // Use only option positions from orderService
      const combinedPositions = optionPositions.map(pos => ({
        symbol: `${pos.symbol} ${pos.strike}${pos.type.charAt(0).toUpperCase()}`,
        quantity: pos.quantity,
        avgPrice: pos.avgPrice,
        currentPrice: pos.avgPrice,
        change: pos.pnl / (pos.quantity * 100),
        changePercent: (pos.pnl / Math.abs(pos.totalCost)) * 100,
        value: pos.currentValue,
        type: 'option'
      }))
      
      setPositions(combinedPositions)
      setOrders(allOrders)
    }
    
    // Initial load
    updatePortfolio()
    
    // Subscribe to order updates
    const unsubscribe = orderService.subscribe(updatePortfolio)
    
    // Also refresh every 10 seconds
    const interval = setInterval(updatePortfolio, 10000)
    
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)
  const totalChange = positions.reduce((sum, pos) => sum + (pos.change * pos.quantity), 0)
  const totalChangePercent = (totalChange / (totalValue - totalChange)) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitor your positions and track performance
          </p>
        </motion.div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${totalValue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Today's Change</p>
                    <p className={`text-2xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(2)}
                    </p>
                  </div>
                  {totalChange >= 0 ? 
                    <TrendingUp className="h-8 w-8 text-green-500" /> : 
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  }
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Performance</p>
                    <p className={`text-2xl font-bold ${totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Positions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {positions.length}
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Positions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-500" />
                <span>Current Positions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Symbol</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Quantity</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Avg Price</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Current Price</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Change</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((position, index) => (
                      <motion.tr 
                        key={position.symbol}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                      >
                        <td className="py-4 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{position.symbol}</div>
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                          {position.quantity}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-600 dark:text-gray-400">
                          ${position.avgPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${position.currentPrice.toFixed(2)}
                        </td>
                        <td className={`py-4 px-4 text-right font-medium ${
                          position.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {position.change >= 0 ? '+' : ''}${position.change.toFixed(2)} 
                          ({position.changePercent >= 0 ? '+' : ''}{position.changePercent.toFixed(1)}%)
                        </td>
                        <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
                          ${position.value.toLocaleString()}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Chart Placeholder */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <Activity className="h-8 w-8 text-blue-500" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Performance</span>
                  </div>
                  
                  {/* Mock Performance Chart */}
                  <div className="w-full h-48 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg relative overflow-hidden mb-4">
                    {/* Chart Grid Lines */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="absolute left-0 right-0 border-t border-white" style={{ top: `${i * 25}%` }} />
                      ))}
                    </div>
                    
                    {/* Performance Line */}
                    <svg className="absolute inset-0 w-full h-full">
                      <polyline
                        points="0,120 40,110 80,95 120,100 160,85 200,75 240,70 280,65 320,60"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        className="drop-shadow-sm"
                      />
                      {/* Data Points */}
                      <circle cx="320" cy="60" r="4" fill="white" className="drop-shadow-sm" />
                    </svg>
                    
                    {/* Performance Stats */}
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-sm opacity-90">30-Day Return</div>
                      <div className="text-xl font-bold">+12.4%</div>
                    </div>
                    
                    <div className="absolute bottom-4 right-4 text-white text-right">
                      <div className="text-sm opacity-90">vs S&P 500</div>
                      <div className="text-xl font-bold">+3.2%</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Sharpe Ratio</div>
                      <div className="font-semibold text-gray-900 dark:text-white">1.85</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Max Drawdown</div>
                      <div className="font-semibold text-red-600">-4.2%</div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Win Rate</div>
                      <div className="font-semibold text-green-600">68%</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}