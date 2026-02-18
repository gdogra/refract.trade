'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, TrendingDown, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { watchlistService } from '@/lib/watchlistService'

interface SearchResult {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  isWatchlisted?: boolean
}

interface SymbolSearchProps {
  selectedSymbol: string
  onSymbolChange: (symbol: string) => void
}

export default function SymbolSearch({ selectedSymbol, onSymbolChange }: SymbolSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: searchResults } = useQuery<SearchResult[]>({
    queryKey: ['symbol-search', query],
    queryFn: async () => {
      if (query.length < 1) return []
      
      // Basic symbol validation and results
      const commonSymbols = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'MSFT', name: 'Microsoft Corporation', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'TSLA', name: 'Tesla, Inc.', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'PLTR', name: 'Palantir Technologies Inc.', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'ORCL', name: 'Oracle Corporation', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'META', name: 'Meta Platforms Inc.', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'NFLX', name: 'Netflix Inc.', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', price: 0, change: 0, changePercent: 0, volume: 0 },
        { symbol: 'INTC', name: 'Intel Corporation', price: 0, change: 0, changePercent: 0, volume: 0 }
      ]
      
      const filteredSymbols = commonSymbols.filter(result => 
        result.symbol.toLowerCase().includes(query.toLowerCase()) ||
        result.name.toLowerCase().includes(query.toLowerCase())
      )
      
      // Add dynamic symbol search for any ticker not in our predefined list
      const upperQuery = query.toUpperCase()
      const isSymbolQuery = /^[A-Z]{1,5}$/i.test(query.trim())
      const symbolExists = filteredSymbols.some(result => 
        result.symbol.toUpperCase() === upperQuery
      )
      
      if (isSymbolQuery && !symbolExists && query.trim().length >= 1) {
        filteredSymbols.unshift({
          symbol: upperQuery,
          name: `${upperQuery} (Search for options)`,
          price: 0,
          change: 0,
          changePercent: 0,
          volume: 0
        })
      }
      
      return filteredSymbols.slice(0, 8)
    },
    enabled: query.length > 0
  })

  const popularSymbols = [
    { symbol: 'SPY', name: 'S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Nasdaq 100 ETF' },
    { symbol: 'AAPL', name: 'Apple' },
    { symbol: 'TSLA', name: 'Tesla' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'MSFT', name: 'Microsoft' }
  ]

  const handleSymbolSelect = useCallback((symbol: string) => {
    onSymbolChange(symbol)
    setQuery('')
    setIsOpen(false)
  }, [onSymbolChange])

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
  }

  const handleAddToWatchlist = () => {
    const symbolInfo = watchlistService.getSymbolInfo(selectedSymbol)
    if (symbolInfo) {
      const success = watchlistService.addToWatchlist(symbolInfo.symbol, symbolInfo.name)
      if (success) {
        alert(`${selectedSymbol} added to your watchlist!`)
      } else {
        alert(`${selectedSymbol} is already in your watchlist`)
      }
    }
  }

  const handleViewChart = () => {
    // Redirect to a chart service or show chart modal
    window.open(`https://finance.yahoo.com/chart/${selectedSymbol}`, '_blank')
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-4">
          {/* Current Symbol Display */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedSymbol}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Current Selection
            </div>
          </div>

          {/* Search Input */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search symbols (e.g., AAPL, SPY, TSLA)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setIsOpen(true)
                }}
                onFocus={() => setIsOpen(true)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isOpen && (
                <motion.div 
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {query.length > 0 && searchResults && Array.isArray(searchResults) && searchResults.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
                        SEARCH RESULTS
                      </div>
                      {searchResults.map((result) => (
                        <motion.button
                          key={result.symbol}
                          onClick={() => handleSymbolSelect(result.symbol)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
                          whileHover={{ x: 2 }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {result.symbol}
                              </span>
                              {result.isWatchlisted && (
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {result.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatPrice(result.price)}
                            </div>
                            <div className={`text-xs flex items-center ${
                              result.change >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {result.change >= 0 ? 
                                <TrendingUp className="h-3 w-3 mr-1" /> : 
                                <TrendingDown className="h-3 w-3 mr-1" />
                              }
                              {formatChange(result.change, result.changePercent)}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {query.length === 0 && (
                    <div className="p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-2 font-medium">
                        POPULAR SYMBOLS
                      </div>
                      {popularSymbols.map((symbol) => (
                        <motion.button
                          key={symbol.symbol}
                          onClick={() => handleSymbolSelect(symbol.symbol)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-left transition-colors"
                          whileHover={{ x: 2 }}
                        >
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {symbol.symbol}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {symbol.name}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {query.length > 0 && (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) && (
                    <div className="p-6 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        No symbols found for "{query}"
                      </div>
                      <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Try searching for a different symbol
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2">
            <motion.button 
              onClick={handleAddToWatchlist}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add to Watchlist
            </motion.button>
            <motion.button 
              onClick={handleViewChart}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Chart
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}