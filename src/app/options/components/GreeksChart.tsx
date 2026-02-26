'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Activity, Zap, BarChart3 } from 'lucide-react'

interface GreeksChartProps {
  symbol: string
}

export default function GreeksChart({ symbol }: GreeksChartProps) {
  // Mock Greeks data for visualization
  const greeksData = {
    delta: {
      call: Array.from({ length: 21 }, (_, i) => ({
        strike: 170 + i * 2,
        value: Math.max(0, Math.min(1, (190 - (170 + i * 2)) / 20 + 0.5))
      })),
      put: Array.from({ length: 21 }, (_, i) => ({
        strike: 170 + i * 2,
        value: Math.min(0, Math.max(-1, (190 - (170 + i * 2)) / 20 - 0.5))
      }))
    },
    gamma: Array.from({ length: 21 }, (_, i) => ({
      strike: 170 + i * 2,
      value: Math.exp(-Math.pow((170 + i * 2 - 190) / 10, 2)) * 0.05
    })),
    theta: {
      call: Array.from({ length: 21 }, (_, i) => ({
        strike: 170 + i * 2,
        value: -Math.random() * 30 - 5
      })),
      put: Array.from({ length: 21 }, (_, i) => ({
        strike: 170 + i * 2,
        value: -Math.random() * 30 - 5
      }))
    },
    vega: Array.from({ length: 21 }, (_, i) => ({
      strike: 170 + i * 2,
      value: Math.exp(-Math.pow((170 + i * 2 - 190) / 15, 2)) * 100
    }))
  }

  const currentPrice = 189.95

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Greeks Analysis - {symbol}
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Current Price: ${currentPrice.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delta Chart */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Delta</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Price Sensitivity</span>
          </div>
          
          <div className="relative h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="relative h-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 text-xs text-gray-500 dark:text-gray-400">1.0</div>
              <div className="absolute left-0 top-1/2 text-xs text-gray-500 dark:text-gray-400">0</div>
              <div className="absolute left-0 bottom-0 text-xs text-gray-500 dark:text-gray-400">-1.0</div>
              
              {/* Current price line */}
              <div 
                className="absolute w-px h-full bg-gray-400 dark:bg-gray-500"
                style={{ left: `${((currentPrice - 170) / (210 - 170)) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  Current
                </div>
              </div>
              
              {/* Delta curves */}
              <svg className="w-full h-full">
                {/* Call delta */}
                <path
                  d={`M ${(greeksData?.delta?.call || []).map((point, i) => 
                    `${i * (100 / ((greeksData?.delta?.call??.length || 0 || 1) - 1))} ${100 - ((point?.value || 0) + 1) * 50}`
                  ).join(' L ')}`}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Put delta */}
                <path
                  d={`M ${(greeksData?.delta?.put || []).map((point, i) => 
                    `${i * (100 / ((greeksData?.delta?.put??.length || 0 || 1) - 1))} ${100 - ((point?.value || 0) + 1) * 50}`
                  ).join(' L ')}`}
                  stroke="#ef4444"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-2 right-2 space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Calls</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-red-500"></div>
                  <span className="text-gray-600 dark:text-gray-400">Puts</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Gamma Chart */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Gamma</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Delta Sensitivity</span>
          </div>
          
          <div className="relative h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="relative h-full">
              {/* Current price line */}
              <div 
                className="absolute w-px h-full bg-gray-400 dark:bg-gray-500"
                style={{ left: `${((currentPrice - 170) / (210 - 170)) * 100}%` }}
              />
              
              {/* Gamma curve */}
              <svg className="w-full h-full">
                <path
                  d={`M ${(greeksData?.gamma || []).map((point, i) => 
                    `${i * (100 / ((greeksData?.gamma??.length || 0 || 1) - 1))} ${100 - ((point?.value || 0) / 0.05) * 100}`
                  ).join(' L ')}`}
                  stroke="#10b981"
                  strokeWidth="2"
                  fill="rgba(16, 185, 129, 0.1)"
                />
              </svg>
              
              {/* Peak indicator */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-green-600 dark:text-green-400">
                Peak γ at ATM
              </div>
            </div>
          </div>
        </motion.div>

        {/* Theta Chart */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Theta</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Time Decay</span>
          </div>
          
          <div className="relative h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="relative h-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 text-xs text-gray-500 dark:text-gray-400">0</div>
              <div className="absolute left-0 bottom-0 text-xs text-gray-500 dark:text-gray-400">-35</div>
              
              {/* Current price line */}
              <div 
                className="absolute w-px h-full bg-gray-400 dark:bg-gray-500"
                style={{ left: `${((currentPrice - 170) / (210 - 170)) * 100}%` }}
              />
              
              {/* Theta curves */}
              <svg className="w-full h-full">
                <path
                  d={`M ${(greeksData?.theta?.call || []).map((point, i) => 
                    `${i * (100 / ((greeksData?.theta?.call??.length || 0 || 1) - 1))} ${100 - Math.abs((point?.value || 0) / 35) * 100}`
                  ).join(' L ')}`}
                  stroke="#ef4444"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              
              <div className="absolute bottom-2 right-2 text-xs text-red-600 dark:text-red-400">
                Time decay accelerates
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vega Chart */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Vega</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Volatility Sensitivity</span>
          </div>
          
          <div className="relative h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="relative h-full">
              {/* Current price line */}
              <div 
                className="absolute w-px h-full bg-gray-400 dark:bg-gray-500"
                style={{ left: `${((currentPrice - 170) / (210 - 170)) * 100}%` }}
              />
              
              {/* Vega curve */}
              <svg className="w-full h-full">
                <path
                  d={`M ${(greeksData?.vega || []).map((point, i) => 
                    `${i * (100 / ((greeksData?.vega??.length || 0 || 1) - 1))} ${100 - ((point?.value || 0) / 100) * 100}`
                  ).join(' L ')}`}
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  fill="rgba(139, 92, 246, 0.1)"
                />
              </svg>
              
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-purple-600 dark:text-purple-400">
                Max at ATM
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Portfolio Delta</div>
          <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">+0.67</div>
          <div className="text-xs text-blue-600 dark:text-blue-400">Bullish bias</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="text-xs text-green-600 dark:text-green-400 mb-1">Portfolio Gamma</div>
          <div className="text-lg font-semibold text-green-700 dark:text-green-300">+0.045</div>
          <div className="text-xs text-green-600 dark:text-green-400">Low convexity</div>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <div className="text-xs text-red-600 dark:text-red-400 mb-1">Portfolio Theta</div>
          <div className="text-lg font-semibold text-red-700 dark:text-red-300">-$23.45</div>
          <div className="text-xs text-red-600 dark:text-red-400">Daily decay</div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Portfolio Vega</div>
          <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">+$156</div>
          <div className="text-xs text-purple-600 dark:text-purple-400">Vol exposure</div>
        </div>
      </motion.div>
    </motion.div>
  )
}