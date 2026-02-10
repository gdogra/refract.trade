'use client'

import { motion } from 'framer-motion'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell,
  ScatterChart, Scatter, RadialBarChart, RadialBar
} from 'recharts'
import { 
  Shield, AlertTriangle, TrendingUp, Activity, 
  BarChart3, Target, Zap, Eye, Settings 
} from 'lucide-react'

interface RiskVisualizationProps {
  onClose?: () => void
}

export default function RiskVisualization({ onClose }: RiskVisualizationProps) {
  // Comprehensive risk data for visualization
  const riskData = {
    // Value at Risk over time with confidence intervals
    varHistory: Array.from({ length: 252 }, (_, i) => ({
      date: new Date(Date.now() - (251 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      var95: -(Math.random() * 2000 + 3000),
      var99: -(Math.random() * 3000 + 5000),
      actualLoss: -(Math.random() * 1500 + 500),
    })),
    
    // Risk attribution by asset class and strategy
    riskAttribution: [
      { category: 'Equity Options', value: 45, exposure: 125000, color: '#ef4444' },
      { category: 'Index Spreads', value: 25, exposure: 67000, color: '#f59e0b' },
      { category: 'Volatility Trades', value: 20, exposure: 45000, color: '#8b5cf6' },
      { category: 'Covered Calls', value: 10, exposure: 23000, color: '#10b981' }
    ],
    
    // Greeks over time
    greeksTimeSeries: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      delta: Math.random() * 2 - 1,
      gamma: Math.random() * 0.1,
      theta: -(Math.random() * 40 + 10),
      vega: Math.random() * 200 + 50,
    })),
    
    // Correlation matrix data
    correlationMatrix: [
      { asset1: 'SPY', asset2: 'QQQ', correlation: 0.85 },
      { asset1: 'SPY', asset2: 'IWM', correlation: 0.72 },
      { asset1: 'SPY', asset2: 'VIX', correlation: -0.68 },
      { asset1: 'QQQ', asset2: 'IWM', correlation: 0.65 },
      { asset1: 'QQQ', asset2: 'VIX', correlation: -0.71 },
      { asset1: 'IWM', asset2: 'VIX', correlation: -0.58 },
    ],
    
    // Stress test scenarios
    stressTests: [
      { scenario: 'Market Crash (-20%)', portfolio: -15600, benchmark: -12000, probability: 0.05 },
      { scenario: 'Vol Spike (+100%)', portfolio: -8900, benchmark: -4200, probability: 0.15 },
      { scenario: 'Rate Hike (+300bp)', portfolio: -7200, benchmark: -5800, probability: 0.20 },
      { scenario: 'Currency Crisis', portfolio: -11400, benchmark: -8900, probability: 0.08 },
      { scenario: 'Sector Rotation', portfolio: -5600, benchmark: -3200, probability: 0.25 },
    ],
    
    // Risk metrics evolution
    riskMetricsHistory: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(Date.now() - (89 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sharpe: Math.random() * 1.5 + 0.5,
      sortino: Math.random() * 2 + 0.8,
      calmar: Math.random() * 1 + 0.3,
      maxDrawdown: -(Math.random() * 15 + 5),
    }))
  }

  const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#6366f1']

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-brand-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Risk Analytics Dashboard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Top Level Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div 
              className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">1-Day VaR</span>
              </div>
              <div className="text-2xl font-bold text-red-600">$4,567</div>
              <div className="text-xs text-red-500">95% confidence</div>
            </motion.div>

            <motion.div 
              className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Max Drawdown</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">-8.2%</div>
              <div className="text-xs text-yellow-500">Last 90 days</div>
            </motion.div>

            <motion.div 
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Sharpe Ratio</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">1.34</div>
              <div className="text-xs text-blue-500">Risk-adjusted return</div>
            </motion.div>

            <motion.div 
              className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Beta</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">1.23</div>
              <div className="text-xs text-purple-500">vs S&P 500</div>
            </motion.div>
          </div>

          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* VaR History Chart */}
            <motion.div 
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Value at Risk - 1 Year History
              </h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskData.varHistory.slice(-60)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${Math.abs(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                      formatter={(value: number, name: string) => [
                        `$${Math.abs(value).toLocaleString()}`, 
                        name === 'var95' ? '95% VaR' : name === 'var99' ? '99% VaR' : 'Actual Loss'
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="var99"
                      stroke="#dc2626"
                      fill="#dc2626"
                      fillOpacity={0.1}
                    />
                    <Area
                      type="monotone"
                      dataKey="var95"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.2}
                    />
                    {/* Actual loss line would be added here in a real LineChart component */}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Risk Attribution Pie Chart */}
            <motion.div 
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Risk Attribution by Strategy
              </h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData.riskAttribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ category, value }) => `${category}: ${value}%`}
                    >
                      {riskData.riskAttribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        [`${value}% (${props.payload.exposure.toLocaleString()} exposure)`, 'Risk Contribution']
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Greeks Time Series */}
            <motion.div 
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Portfolio Greeks - 30 Day Evolution
              </h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskData.greeksTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).getDate().toString()}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="delta" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="gamma" stroke="#10b981" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="vega" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Stress Test Results */}
            <motion.div 
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Stress Test Scenarios
              </h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskData.stressTests} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      dataKey="scenario" 
                      type="category" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                      formatter={(value: number, name: string) => [
                        `$${Math.abs(value).toLocaleString()}`, 
                        name === 'portfolio' ? 'Portfolio Loss' : 'Benchmark Loss'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="portfolio" fill="#ef4444" name="Portfolio" />
                    <Bar dataKey="benchmark" fill="#6b7280" name="Benchmark" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Risk Metrics Performance */}
          <motion.div 
            className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Risk-Adjusted Performance Metrics
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={riskData.riskMetricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f9fafb'
                    }}
                    formatter={(value: number, name: string) => [
                      value.toFixed(2), 
                      name.charAt(0).toUpperCase() + name.slice(1) + ' Ratio'
                    ]}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sharpe" stroke="#3b82f6" strokeWidth={2} dot={false} name="Sharpe" />
                  <Line type="monotone" dataKey="sortino" stroke="#10b981" strokeWidth={2} dot={false} name="Sortino" />
                  <Line type="monotone" dataKey="calmar" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Calmar" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
              Export Report
            </button>
            <button className="px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors">
              Configure Alerts
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}