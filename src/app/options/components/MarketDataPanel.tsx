'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Volume, Activity, Clock, DollarSign } from 'lucide-react'
import OrderModal from '@/components/OrderModal'
import { type OrderRequest } from '@/lib/orderService'

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  dayRange: { low: number; high: number }
  volume: number
  avgVolume: number
  marketCap: number
  pe: number
  beta: number
  iv30: number
  ivRank: number
  earnings: string
  dividend: number
  divYield: number
}

interface MarketDataPanelProps {
  symbol: string
}

export default function MarketDataPanel({ symbol }: MarketDataPanelProps) {
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderRequest, setOrderRequest] = useState<OrderRequest | null>(null)
  const router = useRouter()

  const { data: marketData, isLoading, error } = useQuery<MarketData>({
    queryKey: ['market-data', symbol],
    queryFn: async () => {
      if (!symbol) throw new Error('No symbol provided')
      
      const response = await fetch(`/api/market-data?symbol=${symbol}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch market data')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Market data request failed')
      }
      
      // Transform API response to match expected interface
      const apiData = result.data
      return {
        symbol: apiData.symbol,
        price: apiData.price,
        change: apiData.change,
        changePercent: apiData.changePercent,
        dayRange: { low: apiData.low || apiData.price * 0.95, high: apiData.high || apiData.price * 1.05 },
        volume: apiData.volume || 0,
        avgVolume: apiData.volume || 0, // Use same volume as average for now
        marketCap: 0, // Not available in our API
        pe: 0, // Not available in our API
        beta: 0, // Not available in our API
        iv30: 25, // Default IV
        ivRank: 50, // Default IV rank
        earnings: 'N/A',
        dividend: 0,
        divYield: 0
      }
    },
    enabled: !!symbol, // Enable query when symbol is provided
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000 // Consider data stale after 15 seconds
  })

  // Show API integration message when no data
  if (!marketData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 sticky top-6">
        <div className="text-center py-8">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400 opacity-50" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Market Data Not Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Real-time market data requires API integration
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`
  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatEarningsDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays > 0) return `${diffDays} days`
    return `${Math.abs(diffDays)} days ago`
  }

  const handleQuickTrade = () => {
    // Quick trade opens the options chain for immediate trading
    router.push(`/options?symbol=${symbol}`)
  }

  const handleBuyCall = () => {
    // Create a buy call order for the current symbol
    // Use next Friday as expiry date
    const nextFriday = new Date()
    nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7))
    
    const orderRequest = {
      symbol,
      type: 'call' as const,
      action: 'buy' as const,
      strike: Math.round((marketData?.price || 190) * 1.05), // 5% OTM
      expiry: nextFriday.toISOString().split('T')[0],
      quantity: 1,
      price: 2.50
    }
    
    setOrderRequest(orderRequest)
    setShowOrderModal(true)
  }

  const handleBuyPut = () => {
    // Create a buy put order for the current symbol
    // Use next Friday as expiry date
    const nextFriday = new Date()
    nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7))
    
    const orderRequest = {
      symbol,
      type: 'put' as const,
      action: 'buy' as const,
      strike: Math.round((marketData?.price || 190) * 0.95), // 5% OTM
      expiry: nextFriday.toISOString().split('T')[0],
      quantity: 1,
      price: 2.00
    }
    
    setOrderRequest(orderRequest)
    setShowOrderModal(true)
  }

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 sticky top-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Header with Price */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {marketData?.symbol}
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Live
          </div>
        </div>
        
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {formatPrice(marketData?.price || 0)}
        </div>
        
        <div className={`flex items-center text-sm ${
          (marketData?.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {(marketData?.change || 0) >= 0 ? 
            <TrendingUp className="h-4 w-4 mr-1" /> : 
            <TrendingDown className="h-4 w-4 mr-1" />
          }
          <span>
            {(marketData?.change || 0) >= 0 ? '+' : ''}{marketData?.change.toFixed(2)} 
            ({(marketData?.changePercent || 0) >= 0 ? '+' : ''}{marketData?.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-4">
        {/* Day Range */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Day Range</span>
            <span className="text-gray-900 dark:text-white">
              {formatPrice(marketData?.dayRange.low || 0)} - {formatPrice(marketData?.dayRange.high || 0)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
            <div 
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-red-400 to-green-400 rounded-full"
              style={{ 
                width: `${((marketData?.price || 0) - (marketData?.dayRange.low || 0)) / 
                  ((marketData?.dayRange.high || 1) - (marketData?.dayRange.low || 0)) * 100}%` 
              }}
            />
            <div 
              className="absolute top-0 w-1 h-2 bg-gray-900 dark:bg-white rounded-full"
              style={{ 
                left: `${((marketData?.price || 0) - (marketData?.dayRange.low || 0)) / 
                  ((marketData?.dayRange.high || 1) - (marketData?.dayRange.low || 0)) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Volume</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatLargeNumber(marketData?.volume || 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Avg: {formatLargeNumber(marketData?.avgVolume || 0)}
            </div>
          </div>
        </div>

        {/* Implied Volatility */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">IV (30d)</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {formatPercent(marketData?.iv30 || 0)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Rank: {marketData?.ivRank}%
            </div>
          </div>
        </div>

        {/* Market Cap */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Market Cap</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {formatLargeNumber(marketData?.marketCap || 0)}
          </span>
        </div>

        {/* P/E Ratio */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">P/E Ratio</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {marketData?.pe.toFixed(1)}
          </span>
        </div>

        {/* Beta */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Beta</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {marketData?.beta.toFixed(2)}
          </span>
        </div>

        {/* Dividend */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Dividend</span>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              ${marketData?.dividend.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Yield: {formatPercent(marketData?.divYield || 0)}
            </div>
          </div>
        </div>

        {/* Earnings */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Earnings</span>
          </div>
          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
            {formatEarningsDate(marketData?.earnings || '')}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        <motion.button 
          onClick={handleQuickTrade}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Quick Trade
        </motion.button>
        
        <div className="grid grid-cols-2 gap-2">
          <motion.button 
            onClick={handleBuyCall}
            className="bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-400 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Buy Calls
          </motion.button>
          
          <motion.button 
            onClick={handleBuyPut}
            className="bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Buy Puts
          </motion.button>
        </div>
      </div>

      {/* News Alert */}
      <motion.div 
        className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-xs text-yellow-800 dark:text-yellow-200">
          ⚡ High options activity detected
        </div>
        <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
          Unusual volume in weekly calls
        </div>
      </motion.div>

      {/* Order Modal */}
      <OrderModal
        isOpen={showOrderModal}
        onClose={() => {
          setShowOrderModal(false)
          setOrderRequest(null)
        }}
        orderRequest={orderRequest}
        onOrderSubmitted={(orderId) => {
          console.log('Order submitted:', orderId)
          // Could show a success toast or redirect to portfolio
        }}
      />
    </motion.div>
  )
}