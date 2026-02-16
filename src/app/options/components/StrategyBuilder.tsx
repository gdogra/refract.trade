'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Calculator, TrendingUp, Target, AlertTriangle } from 'lucide-react'

interface OptionLeg {
  id: string
  type: 'call' | 'put'
  action: 'buy' | 'sell'
  strike: number
  expiry: string
  quantity: number
  price: number
}

interface StrategyBuilderProps {
  symbol: string
}

const predefinedStrategies = [
  {
    name: 'Long Call',
    description: 'Bullish strategy with unlimited upside potential',
    legs: [
      { type: 'call', action: 'buy', strike: 190, quantity: 1 }
    ]
  },
  {
    name: 'Bull Call Spread',
    description: 'Limited risk bullish strategy',
    legs: [
      { type: 'call', action: 'buy', strike: 185, quantity: 1 },
      { type: 'call', action: 'sell', strike: 195, quantity: 1 }
    ]
  },
  {
    name: 'Iron Condor',
    description: 'Market neutral strategy for range-bound stocks',
    legs: [
      { type: 'put', action: 'buy', strike: 175, quantity: 1 },
      { type: 'put', action: 'sell', strike: 180, quantity: 1 },
      { type: 'call', action: 'sell', strike: 200, quantity: 1 },
      { type: 'call', action: 'buy', strike: 205, quantity: 1 }
    ]
  },
  {
    name: 'Short Straddle',
    description: 'High probability strategy for low volatility',
    legs: [
      { type: 'call', action: 'sell', strike: 190, quantity: 1 },
      { type: 'put', action: 'sell', strike: 190, quantity: 1 }
    ]
  }
]

export default function StrategyBuilder({ symbol }: StrategyBuilderProps) {
  const [legs, setLegs] = useState<OptionLeg[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [legCounter, setLegCounter] = useState(0)

  const addLeg = () => {
    const newId = `leg-${Date.now()}-${legCounter}`
    setLegCounter(prev => prev + 1)
    
    const newLeg: OptionLeg = {
      id: newId,
      type: 'call',
      action: 'buy',
      strike: 190,
      expiry: '2024-01-19',
      quantity: 1,
      price: 2.50
    }
    setLegs([...legs, newLeg])
  }

  const removeLeg = (id: string) => {
    setLegs(legs.filter(leg => leg.id !== id))
  }

  const updateLeg = (id: string, updates: Partial<OptionLeg>) => {
    setLegs(legs.map(leg => leg.id === id ? { ...leg, ...updates } : leg))
  }

  const loadStrategy = (strategyName: string) => {
    const strategy = predefinedStrategies.find(s => s.name === strategyName)
    if (strategy) {
      const currentTime = Date.now()
      const newLegs: OptionLeg[] = strategy.legs.map((leg, index) => ({
        id: `strategy-${currentTime}-${index}`,
        type: leg.type as 'call' | 'put',
        action: leg.action as 'buy' | 'sell',
        strike: leg.strike,
        expiry: '2024-01-19',
        quantity: leg.quantity,
        price: Math.random() * 3 + 1 // Mock price
      }))
      setLegs(newLegs)
      setSelectedStrategy(strategyName)
      setLegCounter(strategy.legs.length)
    }
  }

  const calculateStrategy = () => {
    // Mock calculation - in real app would use Black-Scholes or similar
    const totalCost = legs.reduce((sum, leg) => {
      const cost = leg.price * leg.quantity * 100 // Options are per 100 shares
      return leg.action === 'buy' ? sum + cost : sum - cost
    }, 0)

    const maxProfit = Math.random() * 1000 + 200
    const maxLoss = Math.abs(totalCost)
    const breakevens = legs.length > 0 ? [legs[0].strike + totalCost/100] : []

    return {
      totalCost,
      maxProfit,
      maxLoss,
      breakevens,
      probabilityOfProfit: 0.65
    }
  }

  const strategy = calculateStrategy()

  const handleExecuteStrategy = () => {
    if (legs.length === 0) {
      alert('Please add at least one leg to your strategy')
      return
    }
    const confirmation = confirm(`Execute strategy "${selectedStrategy || 'Custom'}" with ${legs.length} legs for a net cost of $${Math.abs(strategy.totalCost).toFixed(2)}?`)
    if (confirmation) {
      alert(`Strategy executed successfully! Order submitted for ${legs.length} legs.`)
      // TODO: Implement actual order execution
    }
  }

  const handleBacktest = () => {
    if (legs.length === 0) {
      alert('Please add at least one leg to backtest')
      return
    }
    alert(`Backtesting ${selectedStrategy || 'Custom'} strategy over historical data...`)
    // TODO: Implement actual backtesting
  }

  const handleSaveStrategy = () => {
    if (legs.length === 0) {
      alert('Please add at least one leg to save')
      return
    }
    const strategyName = prompt('Enter a name for your strategy:')
    if (strategyName) {
      alert(`Strategy "${strategyName}" saved successfully!`)
      // TODO: Implement actual strategy saving
    }
  }

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Strategy Builder - {symbol}
          </h2>
          <motion.button
            onClick={addLeg}
            className="flex items-center space-x-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Leg</span>
          </motion.button>
        </div>

        {/* Predefined Strategies */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Strategies
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {predefinedStrategies.map((strategy) => (
              <motion.button
                key={strategy.name}
                onClick={() => loadStrategy(strategy.name)}
                className={`p-3 text-left border rounded-lg transition-all ${
                  selectedStrategy === strategy.name
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                  {strategy.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {strategy.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Strategy Legs */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Strategy Legs {legs.length > 0 && `(${legs.length})`}
          </h3>
          
          {legs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calculator className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">No legs added yet</p>
              <p className="text-sm">Click "Add Leg" or select a quick strategy to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {legs.map((leg, index) => (
                <motion.div
                  key={leg.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Leg {index + 1}
                    </div>
                    <motion.button
                      onClick={() => removeLeg(leg.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="h-4 w-4" />
                    </motion.button>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Action
                      </label>
                      <select
                        value={leg.action}
                        onChange={(e) => updateLeg(leg.id, { action: e.target.value as 'buy' | 'sell' })}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Type
                      </label>
                      <select
                        value={leg.type}
                        onChange={(e) => updateLeg(leg.id, { type: e.target.value as 'call' | 'put' })}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="call">Call</option>
                        <option value="put">Put</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Strike
                      </label>
                      <input
                        type="number"
                        value={leg.strike}
                        onChange={(e) => updateLeg(leg.id, { strike: parseFloat(e.target.value) })}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        value={leg.price}
                        onChange={(e) => updateLeg(leg.id, { price: parseFloat(e.target.value) })}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={leg.quantity}
                        onChange={(e) => updateLeg(leg.id, { quantity: parseInt(e.target.value) })}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Expiry
                      </label>
                      <select
                        value={leg.expiry}
                        onChange={(e) => updateLeg(leg.id, { expiry: e.target.value })}
                        className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="2024-01-12">Jan 12</option>
                        <option value="2024-01-19">Jan 19</option>
                        <option value="2024-01-26">Jan 26</option>
                        <option value="2024-02-16">Feb 16</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Strategy Analysis */}
        {legs.length > 0 && (
          <motion.div 
            className="border-t border-gray-200 dark:border-gray-600 pt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Strategy Analysis
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Net Cost</span>
                  <span className={`font-semibold ${strategy.totalCost >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(strategy.totalCost).toFixed(2)} {strategy.totalCost >= 0 ? 'Debit' : 'Credit'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Max Profit</span>
                  <span className="font-semibold text-green-600">
                    ${strategy.maxProfit.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Max Loss</span>
                  <span className="font-semibold text-red-600">
                    ${strategy.maxLoss.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Probability of Profit</span>
                  <span className="font-semibold text-blue-600">
                    {(strategy.probabilityOfProfit * 100).toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Breakeven</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${strategy.breakevens[0]?.toFixed(2) || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Risk/Reward Chart Placeholder */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-sm">P&L Chart</div>
                  <div className="text-xs">Coming Soon</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 mt-6">
              <motion.button 
                onClick={handleExecuteStrategy}
                className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Target className="h-4 w-4" />
                <span>Execute Strategy</span>
              </motion.button>
              
              <motion.button 
                onClick={handleBacktest}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calculator className="h-4 w-4" />
                <span>Backtest</span>
              </motion.button>
              
              <motion.button 
                onClick={handleSaveStrategy}
                className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Save Strategy</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}