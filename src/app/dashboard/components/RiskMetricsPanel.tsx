'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Shield, Activity, TrendingUp, BarChart3 } from 'lucide-react'
import { RadialBarChart, RadialBar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts'
import RiskVisualization from '@/components/risk/RiskVisualization'

interface RiskMetrics {
  portfolioBeta: number
  valueAtRisk: number
  stressTestScore: number
  concentrationRisk: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
  }
  riskScore: number
  historicalVaR: Array<{
    date: string
    vaR: number
    actual: number
  }>
  riskDistribution: Array<{
    category: string
    value: number
    fill: string
  }>
  stressTestResults: Array<{
    scenario: string
    impact: number
    probability: number
  }>
}

export default function RiskMetricsPanel() {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  
  const { data: riskMetrics, isLoading } = useQuery<RiskMetrics>({
    queryKey: ['risk-metrics'],
    queryFn: async () => {
      // Mock data for now - will connect to API later
      const generateHistoricalVaR = () => {
        return Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          vaR: -(Math.random() * 2000 + 3000),
          actual: -(Math.random() * 1500 + 500)
        }))
      }

      return {
        portfolioBeta: 1.23,
        valueAtRisk: -4567.89,
        stressTestScore: 7.8,
        concentrationRisk: 0.34,
        greeks: {
          delta: 0.67,
          gamma: 0.045,
          theta: -23.45,
          vega: 156.78
        },
        riskScore: 6.5,
        historicalVaR: generateHistoricalVaR(),
        riskDistribution: [
          { category: 'Market Risk', value: 45, fill: '#ef4444' },
          { category: 'Credit Risk', value: 20, fill: '#f59e0b' },
          { category: 'Volatility Risk', value: 25, fill: '#8b5cf6' },
          { category: 'Liquidity Risk', value: 10, fill: '#3b82f6' }
        ],
        stressTestResults: [
          { scenario: 'Market Crash (-20%)', impact: -12500, probability: 0.05 },
          { scenario: 'Volatility Spike (+50%)', impact: -8900, probability: 0.15 },
          { scenario: 'Interest Rate Rise (+200bp)', impact: -5600, probability: 0.25 },
          { scenario: 'Black Swan Event', impact: -18000, probability: 0.02 }
        ]
      }
    }
  })

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-red-600 bg-red-100 dark:bg-red-900/20'
    if (score >= 6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
    return 'text-green-600 bg-green-100 dark:bg-green-900/20'
  }

  const getRiskLevel = (score: number) => {
    if (score >= 8) return 'High Risk'
    if (score >= 6) return 'Moderate Risk'
    return 'Low Risk'
  }

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Risk Analytics</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(riskMetrics?.riskScore || 0)}`}>
          {getRiskLevel(riskMetrics?.riskScore || 0)}
        </div>
      </div>

      <div className="space-y-6">
        {/* Risk Score with Radial Chart */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Risk Score</span>
          </div>
          
          <div className="flex items-center space-between">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" 
                  data={[{ name: 'Risk', value: (riskMetrics?.riskScore || 0) * 10 }]}>
                  <RadialBar
                    dataKey="value"
                    cornerRadius={10}
                    fill={
                      (riskMetrics?.riskScore || 0) >= 8 ? '#ef4444' :
                      (riskMetrics?.riskScore || 0) >= 6 ? '#f59e0b' : '#10b981'
                    }
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 ml-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {riskMetrics?.riskScore}/10
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Overall portfolio risk
              </div>
            </div>
          </div>
        </div>

        {/* Value at Risk Chart */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Value at Risk History</span>
          </div>
          
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskMetrics?.historicalVaR || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                  formatter={(value: number, name: string) => [
                    `$${Math.abs(value).toLocaleString()}`, 
                    name === 'vaR' ? 'VaR' : 'Actual Loss'
                  ]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="vaR"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#f59e0b"
                  fill="none"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Current VaR: <span className="font-semibold text-red-600">
              ${Math.abs(riskMetrics?.valueAtRisk || 0).toLocaleString()}
            </span> (95% confidence)
          </div>
        </div>

        {/* Risk Distribution Chart */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Risk Distribution</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {riskMetrics?.riskDistribution.map((item, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.category}</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{item.value}%</div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <motion.div
                    className="h-2 rounded-full"
                    style={{ backgroundColor: item.fill }}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Greeks */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Portfolio Greeks</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-xs text-blue-600 dark:text-blue-400">Delta</div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {riskMetrics?.greeks.delta.toFixed(3)}
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-xs text-green-600 dark:text-green-400">Gamma</div>
              <div className="text-lg font-bold text-green-700 dark:text-green-300">
                {riskMetrics?.greeks.gamma.toFixed(3)}
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
              <div className="text-xs text-red-600 dark:text-red-400">Theta</div>
              <div className="text-lg font-bold text-red-700 dark:text-red-300">
                ${riskMetrics?.greeks.theta.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-xs text-purple-600 dark:text-purple-400">Vega</div>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                ${riskMetrics?.greeks.vega.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Stress Test Results */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stress Test Scenarios</span>
          </div>
          
          <div className="space-y-2">
            {riskMetrics?.stressTestResults.map((scenario, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {scenario.scenario}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {(scenario.probability * 100).toFixed(1)}% prob.
                  </div>
                </div>
                <div className="text-sm font-semibold text-red-600">
                  ${Math.abs(scenario.impact).toLocaleString()} loss
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <motion.button 
          className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowDetailedAnalysis(true)}
        >
          <BarChart3 className="h-4 w-4" />
          <span>View Detailed Risk Analysis</span>
        </motion.button>
      </div>

      {/* Detailed Risk Analysis Modal */}
      <AnimatePresence>
        {showDetailedAnalysis && (
          <RiskVisualization onClose={() => setShowDetailedAnalysis(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}