'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import SymbolSearch from './SymbolSearch'
import OptionsChainTable from './OptionsChainTable'
import StrategyBuilder from './StrategyBuilder'
import GreeksChart from './GreeksChart'
import ImpliedVolatilityChart from './ImpliedVolatilityChart'
import MarketDataPanel from './MarketDataPanel'
import StrategyRecommendations from '@/components/strategy/StrategyRecommendations'
import QuickStrategyPanel from '@/components/strategy/QuickStrategyPanel'
import PriceAlertsPanel from '@/components/alerts/PriceAlertsPanel'
import { useOptionsChain } from '@/hooks/useOptionsChain'

export default function OptionsChainClient() {
  const searchParams = useSearchParams()
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL')
  const [selectedExpiry, setSelectedExpiry] = useState('')
  const [selectedStrike, setSelectedStrike] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'chain' | 'strategy' | 'analysis'>('chain')
  
  // Get options data for strategy recommendations
  const { data: optionsData } = useOptionsChain(selectedSymbol, selectedExpiry)

  // Set symbol from URL parameter
  useEffect(() => {
    const urlSymbol = searchParams.get('symbol')
    if (urlSymbol) {
      setSelectedSymbol(urlSymbol.toUpperCase())
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Options Chain Explorer
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Real-time options data and advanced analysis tools
            </p>
          </div>
          
          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow">
            {[
              { id: 'chain', label: 'Chain' },
              { id: 'strategy', label: 'Strategy' },
              { id: 'analysis', label: 'Analysis' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id as any)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === mode.id
                    ? 'bg-brand-500 text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Symbol Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SymbolSearch 
            selectedSymbol={selectedSymbol}
            onSymbolChange={setSelectedSymbol}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-9 space-y-6">
            {viewMode === 'chain' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <OptionsChainTable 
                  symbol={selectedSymbol}
                  selectedExpiry={selectedExpiry}
                  onExpiryChange={setSelectedExpiry}
                  selectedStrike={selectedStrike}
                  onStrikeSelect={setSelectedStrike}
                />
              </motion.div>
            )}

            {viewMode === 'strategy' && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <StrategyRecommendations 
                  symbol={selectedSymbol}
                  optionsData={optionsData}
                  underlyingPrice={optionsData?.underlyingPrice || 0}
                />
                <StrategyBuilder 
                  symbol={selectedSymbol}
                />
              </motion.div>
            )}

            {viewMode === 'analysis' && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <GreeksChart symbol={selectedSymbol} />
                <ImpliedVolatilityChart symbol={selectedSymbol} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <MarketDataPanel symbol={selectedSymbol} />
            </motion.div>
            
            {/* Strategy Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <QuickStrategyPanel 
                symbol={selectedSymbol}
                optionsData={optionsData}
                underlyingPrice={optionsData?.underlyingPrice || 0}
                onViewDetailedAnalysis={() => setViewMode('strategy')}
              />
            </motion.div>

            {/* Price Alerts Panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <PriceAlertsPanel 
                symbol={selectedSymbol}
                currentPrice={optionsData?.underlyingPrice || 0}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}