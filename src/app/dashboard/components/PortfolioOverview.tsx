'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Activity, Edit, Save, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface PortfolioStats {
  totalValue: number
  dailyChange: number
  dailyChangePercent: number
  totalPnL: number
  totalPnLPercent: number
  buyingPower: number
  riskUtilization: number
  performanceHistory: Array<{
    date: string
    value: number
    benchmark: number
  }>
}

export default function PortfolioOverview() {
  const [isEditing, setIsEditing] = useState(false)
  const [editValues, setEditValues] = useState<Partial<PortfolioStats>>({})

  const { data: portfolio, isLoading } = useQuery<PortfolioStats>({
    queryKey: ['portfolio-overview'],
    queryFn: async () => {
      // Mock data for now - will connect to API later
      const generatePerformanceHistory = () => {
        let portfolioValue = 110000
        let benchmarkValue = 110000
        return Array.from({ length: 30 }, (_, i) => {
          const portfolioChange = (Math.random() - 0.45) * 0.02 // Slightly positive bias
          const benchmarkChange = (Math.random() - 0.5) * 0.015 // Market movement
          
          portfolioValue *= (1 + portfolioChange)
          benchmarkValue *= (1 + benchmarkChange)
          
          return {
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: portfolioValue,
            benchmark: benchmarkValue
          }
        })
      }

      return {
        totalValue: 125840.32,
        dailyChange: 2340.50,
        dailyChangePercent: 1.89,
        totalPnL: 15840.32,
        totalPnLPercent: 14.39,
        buyingPower: 45600.00,
        riskUtilization: 0.68,
        performanceHistory: generatePerformanceHistory()
      }
    }
  })

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
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
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Portfolio Overview</h2>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          {!isEditing ? (
            <motion.button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1 text-sm text-brand-600 hover:text-brand-700 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </motion.button>
          ) : (
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => {
                  // Save changes here
                  alert('Portfolio changes saved! In production, this would update your actual portfolio data.')
                  setIsEditing(false)
                  setEditValues({})
                }}
                className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsEditing(false)
                  setEditValues({})
                }}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Portfolio Value - Public.com style prominent display */}
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Portfolio Value</div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {formatCurrency(portfolio?.totalValue || 0)}
          </div>
          <div className={`flex items-center justify-center space-x-1 text-lg font-medium ${
            (portfolio?.dailyChangePercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {(portfolio?.dailyChangePercent || 0) >= 0 ? 
              <TrendingUp className="h-5 w-5" /> : 
              <TrendingDown className="h-5 w-5" />
            }
            <span>{formatCurrency(portfolio?.dailyChange || 0)}</span>
            <span>({formatPercentage(portfolio?.dailyChangePercent || 0)}) today</span>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(portfolio?.totalPnL || 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total Return</div>
            <div className={`text-xs font-medium ${
              (portfolio?.totalPnLPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(portfolio?.totalPnLPercent || 0)}
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(portfolio?.buyingPower || 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Buying Power</div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {((portfolio?.riskUtilization || 0) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Risk Used</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
              <motion.div 
                className={`h-1 rounded-full ${
                  (portfolio?.riskUtilization || 0) > 0.8 ? 'bg-red-500' :
                  (portfolio?.riskUtilization || 0) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${(portfolio?.riskUtilization || 0) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Performance Chart - Simplified Public.com style */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Performance
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400">30 days</div>
          </div>
          
          <div className="h-16">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={portfolio?.performanceHistory || []}>
                <XAxis hide />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  )
}