'use client'

import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Clock, AlertCircle } from 'lucide-react'

interface ImpliedVolatilityChartProps {
  symbol: string
}

export default function ImpliedVolatilityChart({ symbol }: ImpliedVolatilityChartProps) {
  // Mock IV data for visualization
  const ivData = {
    skew: {
      calls: Array.from({ length: 11 }, (_, i) => ({
        strike: 170 + i * 4,
        iv: 0.25 + (i - 5) * 0.01 + Math.random() * 0.02
      })),
      puts: Array.from({ length: 11 }, (_, i) => ({
        strike: 170 + i * 4,
        iv: 0.30 + (5 - i) * 0.015 + Math.random() * 0.02
      }))
    },
    termStructure: [
      { days: 7, iv: 0.32, label: '1W' },
      { days: 14, iv: 0.28, label: '2W' },
      { days: 30, iv: 0.26, label: '1M' },
      { days: 60, iv: 0.25, label: '2M' },
      { days: 90, iv: 0.24, label: '3M' },
      { days: 180, iv: 0.23, label: '6M' },
      { days: 365, iv: 0.22, label: '1Y' }
    ],
    history: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      iv: 0.25 + Math.sin(i * 0.2) * 0.05 + Math.random() * 0.02
    }))
  }

  const currentPrice = 189.95
  const currentIV = 0.285

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Implied Volatility Analysis - {symbol}
        </h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            Current IV: <span className="font-semibold text-gray-900 dark:text-white">{formatPercent(currentIV)}</span>
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            IV Rank: <span className="font-semibold text-orange-600">65%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volatility Skew */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Volatility Skew</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Strike vs IV</span>
          </div>
          
          <div className="relative h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="relative h-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 text-xs text-gray-500 dark:text-gray-400">35%</div>
              <div className="absolute left-0 top-1/2 text-xs text-gray-500 dark:text-gray-400">27.5%</div>
              <div className="absolute left-0 bottom-0 text-xs text-gray-500 dark:text-gray-400">20%</div>
              
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 text-xs text-gray-500 dark:text-gray-400">170</div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400">190</div>
              <div className="absolute bottom-0 right-0 text-xs text-gray-500 dark:text-gray-400">210</div>
              
              {/* Current price line */}
              <div 
                className="absolute w-px h-full bg-gray-400 dark:bg-gray-500"
                style={{ left: `${(currentPrice - 170) / (210 - 170)) * 100}%` }}
              >
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  ATM
                </div>
              </div>
              
              {/* Skew curves */}
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Call skew */}
                <path
                  d={`M ${ivData.skew.calls.map((point, i) => 
                    `${i * (100 / (ivData.skew.calls?.length || 0 - 1))},${100 - ((point.iv - 0.2) / 0.15) * 100}`
                  ).join(' L ')}`}
                  stroke="#3b82f6"
                  strokeWidth="1"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
                {/* Put skew */}
                <path
                  d={`M ${ivData.skew.puts.map((point, i) => 
                    `${i * (100 / (ivData.skew.puts?.length || 0 - 1))},${100 - ((point.iv - 0.2) / 0.15) * 100}`
                  ).join(' L ')}`}
                  stroke="#ef4444"
                  strokeWidth="1"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              
              {/* Legend */}
              <div className="absolute top-2 right-2 space-y-1 text-xs">
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

          {/* Skew Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Call Skew</div>
              <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">-2.3%</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">OTM lower IV</div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="text-xs text-red-600 dark:text-red-400 mb-1">Put Skew</div>
              <div className="text-sm font-semibold text-red-700 dark:text-red-300">+4.7%</div>
              <div className="text-xs text-red-600 dark:text-red-400">Elevated put IV</div>
            </div>
          </div>
        </motion.div>

        {/* Term Structure */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Term Structure</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Time vs IV</span>
          </div>
          
          <div className="relative h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="relative h-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 text-xs text-gray-500 dark:text-gray-400">35%</div>
              <div className="absolute left-0 bottom-0 text-xs text-gray-500 dark:text-gray-400">20%</div>
              
              {/* Term structure bars */}
              <div className="flex items-end justify-between h-full pt-4 pb-6">
                {ivData.termStructure.map((point, i) => {
                  const height = ((point.iv - 0.2) / 0.15) * 100
                  return (
                    <div key={point.label} className="flex flex-col items-center space-y-1">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {formatPercent(point.iv)}
                      </div>
                      <motion.div 
                        className="bg-gradient-to-t from-green-600 to-green-400 rounded-t"
                        style={{ 
                          height: `${height}%`,
                          width: '16px'
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {point.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Term structure shows <span className="text-orange-600 font-medium">contango</span> (front month premium)
          </div>
        </motion.div>

        {/* Historical IV */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Historical IV</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">30 Days</span>
          </div>
          
          <div className="relative h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="relative h-full">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 text-xs text-gray-500 dark:text-gray-400">30%</div>
              <div className="absolute left-0 top-1/2 text-xs text-gray-500 dark:text-gray-400">25%</div>
              <div className="absolute left-0 bottom-0 text-xs text-gray-500 dark:text-gray-400">20%</div>
              
              {/* Historical IV line */}
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d={`M ${ivData.history.map((point, i) => 
                    `${i * (100 / (ivData.history?.length || 0 - 1))},${100 - ((point.iv - 0.2) / 0.1) * 100}`
                  ).join(' L ')}`}
                  stroke="#8b5cf6"
                  strokeWidth="1"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
                
                {/* Fill area under curve */}
                <path
                  d={`M ${ivData.history.map((point, i) => 
                    `${i * (100 / (ivData.history?.length || 0 - 1))},${100 - ((point.iv - 0.2) / 0.1) * 100}`
                  ).join(' L ')} L 100,100 L 0,100 Z`}
                  fill="rgba(139, 92, 246, 0.1)"
                />
              </svg>
            </div>
          </div>

          {/* IV Stats */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400">Min</div>
              <div className="font-semibold text-gray-900 dark:text-white">22.1%</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400">Avg</div>
              <div className="font-semibold text-gray-900 dark:text-white">25.8%</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400">Max</div>
              <div className="font-semibold text-gray-900 dark:text-white">29.4%</div>
            </div>
          </div>
        </motion.div>

        {/* IV Rank & Percentile */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">IV Metrics</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">Rankings</span>
          </div>
          
          <div className="space-y-4">
            {/* IV Rank */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">IV Rank (1Y)</span>
                <span className="text-sm font-semibold text-orange-600">65%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <motion.div 
                  className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Higher than 65% of the past year
              </div>
            </div>

            {/* IV Percentile */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">IV Percentile (1Y)</span>
                <span className="text-sm font-semibold text-orange-600">72%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <motion.div 
                  className="h-2 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: '72%' }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current IV in 72nd percentile
              </div>
            </div>

            {/* HV vs IV */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Historical vs Implied</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">HV (30d)</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">23.4%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">IV (30d)</div>
                  <div className="text-sm font-semibold text-orange-600">28.5%</div>
                </div>
                <div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">Premium</div>
                  <div className="text-sm font-semibold text-orange-600">+5.1%</div>
                </div>
              </div>
            </div>

            {/* Trading Signal */}
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">High IV Environment</span>
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                Consider selling premium strategies. IV above historical average suggests overpriced options.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}