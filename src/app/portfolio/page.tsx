'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Target } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default function Portfolio() {
  const positions = [
    {
      symbol: 'AAPL',
      quantity: 100,
      avgPrice: 150.25,
      currentPrice: 155.80,
      change: 5.55,
      changePercent: 3.7,
      value: 15580
    },
    {
      symbol: 'TSLA',
      quantity: 50,
      avgPrice: 220.50,
      currentPrice: 215.30,
      change: -5.20,
      changePercent: -2.4,
      value: 10765
    },
    {
      symbol: 'SPY',
      quantity: 200,
      avgPrice: 420.00,
      currentPrice: 425.75,
      change: 5.75,
      changePercent: 1.4,
      value: 85150
    }
  ]

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
              <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Performance chart coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}