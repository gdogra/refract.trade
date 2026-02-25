import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, RefreshCw, Clock } from 'lucide-react'
import { useOptionsChain } from '@/hooks/useOptionsChain'
import SymbolSearch from './SymbolSearch'
import ExpirationSelector from './ExpirationSelector'
import GreeksDisplay from './GreeksDisplay'
import type { OptionsChain, OptionContract } from '@/lib/options/yahooOptions'

interface OptionsChainProps {
  initialSymbol?: string
  initialExpiration?: string
  className?: string
  showHeader?: boolean
  enableRefresh?: boolean
  currentPrice?: number
}

interface OptionRowProps {
  contract: OptionContract
  type: 'call' | 'put'
  isATM?: boolean
  compact?: boolean
}

function OptionsChainSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className={`grid grid-cols-3 gap-4 mb-4 ${compact ? 'p-2' : 'p-4'}`}>
        <div className={`${compact ? 'h-8' : 'h-10'} bg-gray-200 dark:bg-gray-700 rounded`}></div>
        <div className={`${compact ? 'h-8' : 'h-10'} bg-gray-200 dark:bg-gray-700 rounded`}></div>
        <div className={`${compact ? 'h-8' : 'h-10'} bg-gray-200 dark:bg-gray-700 rounded`}></div>
      </div>
      
      {/* Table skeleton */}
      <div className="space-y-1">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`grid grid-cols-7 gap-2 ${compact ? 'p-1' : 'p-2'}`}>
            {[...Array(7)].map((_, j) => (
              <div key={j} className={`${compact ? 'h-6' : 'h-8'} bg-gray-100 dark:bg-gray-800 rounded`}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function OptionsChainError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 text-center border-2 border-dashed border-red-300 dark:border-red-700 rounded-lg"
    >
      <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Unable to Load Options Data
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 
                   text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 
                   dark:hover:bg-red-900/50 transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        <span>Try Again</span>
      </button>
    </motion.div>
  )
}

function OptionRow({ contract, type, isATM = false, compact = false }: OptionRowProps) {
  const isITM = type === 'call' ? contract.inTheMoney : contract.inTheMoney
  const volume = contract.volume || 0
  const openInterest = contract.openInterest || 0
  const hasVolume = volume > 0
  
  const formatNumber = (value: number | undefined, decimals = 2): string => {
    if (typeof value !== 'number' || isNaN(value)) return '-'
    return value.toFixed(decimals)
  }
  
  const formatVolume = (value: number): string => {
    if (value === 0) return '-'
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }
  
  return (
    <motion.div
      layout
      className={`grid grid-cols-7 gap-2 ${compact ? 'py-1 px-2' : 'py-2 px-3'} 
                 border-b border-gray-100 dark:border-gray-800 
                 hover:bg-gray-50 dark:hover:bg-gray-900/30 
                 ${isITM ? 'bg-green-50/50 dark:bg-green-900/10' : ''}
                 ${isATM ? 'ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50/50 dark:bg-blue-900/10' : ''}
                 transition-colors`}
      whileHover={{ scale: 1.005 }}
    >
      {/* Bid */}
      <div className={`text-right ${compact ? 'text-xs' : 'text-sm'} font-mono`}>
        <span className={hasVolume ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
          {formatNumber(contract.bid)}
        </span>
      </div>
      
      {/* Ask */}
      <div className={`text-right ${compact ? 'text-xs' : 'text-sm'} font-mono`}>
        <span className={hasVolume ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}>
          {formatNumber(contract.ask)}
        </span>
      </div>
      
      {/* Last Price */}
      <div className={`text-right ${compact ? 'text-xs' : 'text-sm'} font-mono font-medium`}>
        {formatNumber(contract.lastPrice)}
      </div>
      
      {/* Strike Price */}
      <div className={`text-center ${compact ? 'text-xs' : 'text-sm'} font-mono font-bold 
                     ${isATM ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
        {formatNumber(contract.strike, 0)}
        {isATM && <div className="text-xs text-blue-500">ATM</div>}
      </div>
      
      {/* Volume */}
      <div className={`text-center ${compact ? 'text-xs' : 'text-sm'}`}>
        <span className={hasVolume ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400'}>
          {formatVolume(volume)}
        </span>
      </div>
      
      {/* Open Interest */}
      <div className={`text-center ${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>
        {formatVolume(openInterest)}
      </div>
      
      {/* Greeks (compact) */}
      <div className={`text-center ${compact ? 'text-xs' : 'text-sm'}`}>
        {contract.greeks && (
          <div className="space-y-1">
            <div className={`font-mono ${Math.abs(contract.greeks.delta) > 0.5 ? 'font-bold' : ''}`}>
              Δ {contract.greeks.delta.toFixed(3)}
            </div>
            {!compact && contract.greeks.theta < -0.1 && (
              <div className="text-xs text-red-500">
                Θ {contract.greeks.theta.toFixed(3)}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function OptionsChain({ 
  initialSymbol = "AAPL",
  initialExpiration,
  className = "",
  showHeader = true,
  enableRefresh = true,
  currentPrice
}: OptionsChainProps) {
  const [symbol, setSymbol] = useState(initialSymbol)
  const [selectedExpiration, setSelectedExpiration] = useState<string | undefined>(initialExpiration)
  const [view, setView] = useState<'split' | 'calls' | 'puts'>('split')
  const [compact, setCompact] = useState(false)
  
  // Update symbol when initialSymbol prop changes
  useEffect(() => {
    if (initialSymbol && initialSymbol !== symbol) {
      setSymbol(initialSymbol)
    }
  }, [initialSymbol, symbol])
  
  const { data, loading, error, refetch, isStale } = useOptionsChain(symbol, selectedExpiration)
  
  const sortedCalls = useMemo(() => {
    if (!data?.calls) return []
    return [...data.calls].sort((a, b) => a.strike - b.strike)
  }, [data?.calls])
  
  const sortedPuts = useMemo(() => {
    if (!data?.puts) return []
    return [...data.puts].sort((a, b) => a.strike - b.strike)
  }, [data?.puts])
  
  const atmStrike = useMemo(() => {
    const price = currentPrice || data?.underlyingPrice
    if (!price || !data?.calls.length) return null
    
    return data.calls.reduce((closest, contract) => {
      const currentDiff = Math.abs(contract.strike - price)
      const closestDiff = Math.abs(closest.strike - price)
      return currentDiff < closestDiff ? contract : closest
    }).strike
  }, [currentPrice, data?.underlyingPrice, data?.calls])
  
  const handleRefresh = () => {
    refetch()
  }
  
  const handleExpirationChange = (expiration: string) => {
    setSelectedExpiration(expiration)
  }
  
  if (error) {
    return (
      <div className={className}>
        <OptionsChainError error={error} onRetry={handleRefresh} />
      </div>
    )
  }
  
  return (
    <div className={`${className} bg-white dark:bg-gray-800 rounded-lg shadow-lg`}>
      {showHeader && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Options Chain</span>
              {isStale && (
                <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
                  <Clock className="h-3 w-3" />
                  <span>Stale</span>
                </div>
              )}
            </h2>
            
            <div className="flex items-center space-x-2">
              {/* View toggle */}
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {['split', 'calls', 'puts'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v as typeof view)}
                    className={`px-3 py-1 text-xs font-medium capitalize transition-colors
                               ${view === v 
                                 ? 'bg-blue-500 text-white' 
                                 : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                               }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
              
              {/* Compact toggle */}
              <button
                onClick={() => setCompact(!compact)}
                className={`px-2 py-1 text-xs rounded border transition-colors
                           ${compact 
                             ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300' 
                             : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                           }`}
              >
                Compact
              </button>
              
              {/* Refresh button */}
              {enableRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Symbol Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol
              </label>
              <SymbolSearch
                value={symbol}
                onChange={setSymbol}
                placeholder="Enter symbol..."
              />
            </div>
            
            {/* Current Price */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Price
              </label>
              <div className="flex items-center h-10 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                {loading ? (
                  <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  <span className="font-mono text-lg font-bold text-gray-900 dark:text-white">
                    ${currentPrice?.toFixed(2) || data?.underlyingPrice?.toFixed(2) || '---'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Last Updated */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Updated
              </label>
              <div className="flex items-center h-10 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '---'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex">
        {/* Expiration Selector Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
          <ExpirationSelector
            expirations={data?.expirations || []}
            selectedExpiration={selectedExpiration}
            onExpirationChange={handleExpirationChange}
            loading={loading}
            className="h-full"
          />
        </div>
        
        {/* Options Table */}
        <div className="flex-1">
          {loading ? (
            <OptionsChainSkeleton compact={compact} />
          ) : !data ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select a symbol to view options chain</p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className={`sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10 ${compact ? 'p-2' : 'p-3'}`}>
                <div className="grid grid-cols-7 gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <div className="text-right">Bid</div>
                  <div className="text-right">Ask</div>
                  <div className="text-right">Last</div>
                  <div className="text-center">Strike</div>
                  <div className="text-center">Volume</div>
                  <div className="text-center">OI</div>
                  <div className="text-center">Greeks</div>
                </div>
              </div>
              
              {/* Options Data */}
              <div className="max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {view === 'split' && (
                    <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700">
                      {/* Calls Column */}
                      <div>
                        <div className={`sticky top-0 bg-green-100 dark:bg-green-900/20 ${compact ? 'p-2' : 'p-3'} border-b border-green-200 dark:border-green-800`}>
                          <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300 font-medium">
                            <TrendingUp className="h-4 w-4" />
                            <span className={compact ? 'text-xs' : 'text-sm'}>Calls</span>
                          </div>
                        </div>
                        {sortedCalls.map(contract => (
                          <OptionRow
                            key={`call-${contract.strike}`}
                            contract={contract}
                            type="call"
                            isATM={contract.strike === atmStrike}
                            compact={compact}
                          />
                        ))}
                      </div>
                      
                      {/* Puts Column */}
                      <div>
                        <div className={`sticky top-0 bg-red-100 dark:bg-red-900/20 ${compact ? 'p-2' : 'p-3'} border-b border-red-200 dark:border-red-800`}>
                          <div className="flex items-center justify-center space-x-2 text-red-700 dark:text-red-300 font-medium">
                            <TrendingDown className="h-4 w-4" />
                            <span className={compact ? 'text-xs' : 'text-sm'}>Puts</span>
                          </div>
                        </div>
                        {sortedPuts.map(contract => (
                          <OptionRow
                            key={`put-${contract.strike}`}
                            contract={contract}
                            type="put"
                            isATM={contract.strike === atmStrike}
                            compact={compact}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {view === 'calls' && (
                    <div>
                      <div className={`bg-green-100 dark:bg-green-900/20 ${compact ? 'p-2' : 'p-3'} border-b border-green-200 dark:border-green-800`}>
                        <div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-300 font-medium">
                          <TrendingUp className="h-4 w-4" />
                          <span>Call Options</span>
                        </div>
                      </div>
                      {sortedCalls.map(contract => (
                        <OptionRow
                          key={`call-${contract.strike}`}
                          contract={contract}
                          type="call"
                          isATM={contract.strike === atmStrike}
                          compact={compact}
                        />
                      ))}
                    </div>
                  )}
                  
                  {view === 'puts' && (
                    <div>
                      <div className={`bg-red-100 dark:bg-red-900/20 ${compact ? 'p-2' : 'p-3'} border-b border-red-200 dark:border-red-800`}>
                        <div className="flex items-center justify-center space-x-2 text-red-700 dark:text-red-300 font-medium">
                          <TrendingDown className="h-4 w-4" />
                          <span>Put Options</span>
                        </div>
                      </div>
                      {sortedPuts.map(contract => (
                        <OptionRow
                          key={`put-${contract.strike}`}
                          contract={contract}
                          type="put"
                          isATM={contract.strike === atmStrike}
                          compact={compact}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Footer with metadata */}
              <div className={`border-t border-gray-200 dark:border-gray-700 ${compact ? 'p-2' : 'p-3'} bg-gray-50 dark:bg-gray-900/30`}>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Calls: {sortedCalls.length}</span>
                    <span>Puts: {sortedPuts.length}</span>
                    {(currentPrice || data?.underlyingPrice) && atmStrike && (
                      <span>ATM: ${atmStrike}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span>Yahoo Finance</span>
                    <span>•</span>
                    <span>15 min delay</span>
                    {isStale && (
                      <>
                        <span>•</span>
                        <span className="text-orange-500">Refreshing...</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Export sub-components for individual use
export { SymbolSearch, ExpirationSelector, GreeksDisplay }