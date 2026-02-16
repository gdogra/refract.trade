'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, Plus, TrendingUp, TrendingDown, Volume, Activity, X, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
  added: Date
}


export default function Watchlist() {
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])

  // Load watchlist from localStorage
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('userWatchlist')
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist))
    }
  }, [])

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (watchlist.length > 0) {
      localStorage.setItem('userWatchlist', JSON.stringify(watchlist))
    }
  }, [watchlist])

  const [newSymbol, setNewSymbol] = useState('')
  const [isAddingSymbol, setIsAddingSymbol] = useState(false)

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
  }

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toLocaleString()
  }

  const handleAddSymbol = async () => {
    if (!newSymbol.trim() || watchlist.some(item => item.symbol === newSymbol.toUpperCase())) {
      return
    }

    // TODO: Replace with real API call to fetch symbol data
    alert(`Symbol ${newSymbol.toUpperCase()} will be added when API integration is complete`)
    setNewSymbol('')
    setIsAddingSymbol(false)
  }

  const handleRemoveSymbol = (symbol: string) => {
    setWatchlist(watchlist.filter(item => item.symbol !== symbol))
  }

  const handleViewOptions = (symbol: string) => {
    router.push(`/options?symbol=${symbol}`)
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <Star className="h-8 w-8 text-yellow-500 mr-3" />
                My Watchlist
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Track your favorite symbols and stay updated on their performance
              </p>
            </div>
            
            <Button 
              onClick={() => setIsAddingSymbol(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Symbol</span>
            </Button>
          </div>
        </motion.div>

        {/* Add Symbol Modal */}
        {isAddingSymbol && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="bg-white dark:bg-gray-800 rounded-xl p-6 mx-4 max-w-md w-full"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Add Symbol to Watchlist
              </h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter symbol (e.g., AAPL)"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSymbol()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  autoFocus
                />
                <Button onClick={handleAddSymbol}>Add</Button>
                <Button variant="ghost" onClick={() => setIsAddingSymbol(false)}>
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Watchlist Items */}
        <div className="space-y-4">
          {watchlist.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No symbols in your watchlist
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add some symbols to track their performance and get quick access to options data
              </p>
              <Button onClick={() => setIsAddingSymbol(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Symbol
              </Button>
            </motion.div>
          ) : (
            watchlist.map((item, index) => (
              <motion.div
                key={item.symbol}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Symbol Info */}
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-bold">
                          {item.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {item.symbol}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.name}
                          </p>
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(item.price)}
                        </div>
                        <div className={`flex items-center text-sm ${
                          item.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.change >= 0 ? 
                            <TrendingUp className="h-4 w-4 mr-1" /> : 
                            <TrendingDown className="h-4 w-4 mr-1" />
                          }
                          <span>{formatChange(item.change, item.changePercent)}</span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="hidden md:flex flex-col space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Volume className="h-4 w-4" />
                          <span>Volume: {formatLargeNumber(item.volume)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4" />
                          <span>P/E: {item.pe.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleViewOptions(item.symbol)}
                        >
                          View Options
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSymbol(item.symbol)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Mobile Metrics */}
                    <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>Volume: {formatLargeNumber(item.volume)}</span>
                        <span>P/E: {item.pe.toFixed(1)}</span>
                        <span>Market Cap: {formatLargeNumber(item.marketCap)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Quick Stats */}
        {watchlist.length > 0 && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Watchlist Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {watchlist.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total Symbols
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {watchlist.filter(item => item.change > 0).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Gaining
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {watchlist.filter(item => item.change < 0).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Losing
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {((watchlist.reduce((sum, item) => sum + item.changePercent, 0) / watchlist.length) || 0).toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Avg Change
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}