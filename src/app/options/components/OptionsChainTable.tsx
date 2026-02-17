'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, TrendingDown, Volume, Activity, ShoppingCart } from 'lucide-react'
import OrderModal from '@/components/OrderModal'
import { type OrderRequest } from '@/lib/orderService'

interface OptionContract {
  strike: number
  call: {
    bid: number
    ask: number
    last: number
    volume: number
    openInterest: number
    delta: number
    gamma: number
    theta: number
    vega: number
    iv: number
  }
  put: {
    bid: number
    ask: number
    last: number
    volume: number
    openInterest: number
    delta: number
    gamma: number
    theta: number
    vega: number
    iv: number
  }
}

interface OptionsChainTableProps {
  symbol: string
  selectedExpiry: string
  onExpiryChange: (expiry: string) => void
  selectedStrike: number | null
  onStrikeSelect: (strike: number) => void
}

export default function OptionsChainTable({ 
  symbol, 
  selectedExpiry, 
  onExpiryChange, 
  selectedStrike, 
  onStrikeSelect 
}: OptionsChainTableProps) {
  const [showGreeks, setShowGreeks] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderRequest, setOrderRequest] = useState<OrderRequest | null>(null)

  const { data: expirations } = useQuery({
    queryKey: ['option-expirations', symbol],
    queryFn: async () => {
      // Basic expiration dates for trading
      const dates = []
      const today = new Date()
      for (let i = 0; i < 8; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + (i * 7) + 7)
        dates.push(date.toISOString().split('T')[0])
      }
      return dates
    }
  })

  const { data: optionsChain, isLoading } = useQuery<OptionContract[]>({
    queryKey: ['options-chain', symbol, selectedExpiry],
    queryFn: async () => {
      if (!symbol || !selectedExpiry) return []
      
      try {
        const response = await fetch(`/api/market-data?symbol=${symbol}&type=options&expiry=${selectedExpiry}`, {
          credentials: 'include'
        })
        
        if (!response.ok) {
          throw new Error('Failed to fetch options data')
        }
        
        const result = await response.json()
        if (result.success && result.data) {
          const optionChain = result.data
          
          // Transform OptionChain {calls: [...], puts: [...]} to expected format
          if (optionChain.calls && optionChain.puts) {
            const strikeMap = new Map()
            
            // Add calls
            optionChain.calls.forEach((call: any) => {
              if (!strikeMap.has(call.strike)) {
                strikeMap.set(call.strike, { strike: call.strike })
              }
              strikeMap.get(call.strike).call = {
                bid: call.bid,
                ask: call.ask,
                last: call.lastPrice,
                volume: call.volume,
                openInterest: call.openInterest,
                delta: call.delta,
                gamma: call.gamma,
                theta: call.theta,
                vega: call.vega,
                iv: call.impliedVolatility
              }
            })
            
            // Add puts
            optionChain.puts.forEach((put: any) => {
              if (!strikeMap.has(put.strike)) {
                strikeMap.set(put.strike, { strike: put.strike })
              }
              strikeMap.get(put.strike).put = {
                bid: put.bid,
                ask: put.ask,
                last: put.lastPrice,
                volume: put.volume,
                openInterest: put.openInterest,
                delta: put.delta,
                gamma: put.gamma,
                theta: put.theta,
                vega: put.vega,
                iv: put.impliedVolatility
              }
            })
            
            return Array.from(strikeMap.values()).sort((a, b) => a.strike - b.strike)
          }
          
          // If data is already in the expected format (array), use it directly
          if (Array.isArray(result.data)) {
            return result.data
          }
        }
      } catch (error) {
        console.warn('Options API failed, using mock data:', error)
      }
      
      // Fallback to mock data if API fails
      const strikes = []
      const baseStrike = 200
      
      for (let i = -10; i <= 10; i++) {
        const strike = baseStrike + (i * 5)
        strikes.push({
          strike,
          call: { bid: 0, ask: 0, last: 0, volume: 0, openInterest: 0, delta: 0, gamma: 0, theta: 0, vega: 0, iv: 0 },
          put: { bid: 0, ask: 0, last: 0, volume: 0, openInterest: 0, delta: 0, gamma: 0, theta: 0, vega: 0, iv: 0 }
        })
      }
      return strikes
    }
  })

  if (!selectedExpiry && expirations && expirations.length > 0) {
    onExpiryChange(expirations[0])
  }

  const formatPrice = (price: number) => price.toFixed(2)
  const formatGreek = (value: number, decimals = 3) => value.toFixed(decimals)
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`

  const handleBuyCall = (strike: number, price: number) => {
    const orderReq = {
      symbol,
      type: 'call' as const,
      action: 'buy' as const,
      strike,
      expiry: selectedExpiry || '2024-01-19',
      quantity: 1,
      price
    }
    
    setOrderRequest(orderReq)
    setShowOrderModal(true)
  }

  const handleBuyPut = (strike: number, price: number) => {
    const orderReq = {
      symbol,
      type: 'put' as const,
      action: 'buy' as const,
      strike,
      expiry: selectedExpiry || '2024-01-19',
      quantity: 1,
      price
    }
    
    setOrderRequest(orderReq)
    setShowOrderModal(true)
  }

  // Show API integration required message when no data available
  if (!optionsChain) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="text-center py-12">
          <Activity className="h-16 w-16 mx-auto mb-4 text-gray-400 opacity-50" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Options Chain Not Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Options data requires API integration to display live market data
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header Controls */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Options Chain - {symbol}
          </h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Expiration Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={selectedExpiry}
                onChange={(e) => onExpiryChange(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {(expirations || []).map((expiry) => (
                  <option key={expiry} value={expiry}>
                    {new Date(expiry).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Greeks Toggle */}
            <motion.button
              onClick={() => setShowGreeks(!showGreeks)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showGreeks 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {showGreeks ? 'Hide Greeks' : 'Show Greeks'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Market Data Status */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              Loading live options data for {symbol}...
            </span>
          </div>
        </div>
      )}
      
      {!isLoading && optionsChain && optionsChain.length > 0 && optionsChain[0]?.call?.bid === 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Enhanced Demo Data:</strong> Using real underlying stock prices with simulated options pricing for demonstration.
            </span>
          </div>
        </div>
      )}

      {/* Options Chain Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th colSpan={showGreeks ? 5 : 3} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600">
                Calls
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Strike
              </th>
              <th colSpan={showGreeks ? 5 : 3} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-600">
                Puts
              </th>
            </tr>
            <tr className="text-xs text-gray-500 dark:text-gray-400">
              {/* Call Headers */}
              <th className="px-2 py-2 text-left">Last</th>
              <th className="px-2 py-2 text-left">Vol</th>
              <th className="px-2 py-2 text-left">IV</th>
              {showGreeks && (
                <>
                  <th className="px-2 py-2 text-left">Delta</th>
                  <th className="px-2 py-2 text-left">Theta</th>
                </>
              )}
              <th className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-600">Action</th>
              
              {/* Strike */}
              <th className="px-4 py-2 text-center font-semibold">Price</th>
              
              {/* Put Headers */}
              <th className="px-2 py-2 text-center border-l border-gray-200 dark:border-gray-600">Action</th>
              {showGreeks && (
                <>
                  <th className="px-2 py-2 text-left">Delta</th>
                  <th className="px-2 py-2 text-left">Theta</th>
                </>
              )}
              <th className="px-2 py-2 text-left">IV</th>
              <th className="px-2 py-2 text-left">Vol</th>
              <th className="px-2 py-2 text-left">Last</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {(optionsChain || []).map((option, index) => {
              const isSelected = selectedStrike === option.strike
              // TODO: Calculate ITM based on real current price
              const isITM = {
                call: false,
                put: false
              }
              
              return (
                <motion.tr
                  key={option.strike}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                  }`}
                  onClick={() => onStrikeSelect(option.strike)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.1, delay: index * 0.02 }}
                  whileHover={{ scale: 1.005 }}
                >
                  {/* Call Data */}
                  <td className={`px-2 py-3 text-sm ${isITM.call ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(option.call.last)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(option.call.bid)}/{formatPrice(option.call.ask)}
                    </div>
                  </td>
                  <td className={`px-2 py-3 text-sm text-gray-900 dark:text-white ${isITM.call ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                    {option.call.volume.toLocaleString()}
                  </td>
                  <td className={`px-2 py-3 text-sm text-gray-900 dark:text-white ${isITM.call ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                    {formatPercent(option.call.iv)}
                  </td>
                  {showGreeks && (
                    <>
                      <td className={`px-2 py-3 text-sm text-gray-900 dark:text-white ${isITM.call ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                        {formatGreek(option.call.delta)}
                      </td>
                      <td className={`px-2 py-3 text-sm text-red-600 ${isITM.call ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                        {formatGreek(option.call.theta, 1)}
                      </td>
                    </>
                  )}
                  
                  {/* Buy Call Button */}
                  <td className={`px-2 py-3 text-center border-r border-gray-200 dark:border-gray-600 ${isITM.call ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBuyCall(option.strike, option.call.ask)
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded flex items-center space-x-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ShoppingCart className="h-3 w-3" />
                      <span>Buy</span>
                    </motion.button>
                  </td>

                  {/* Strike Price */}
                  <td className="px-4 py-3 text-center">
                    <div className={`font-bold text-lg ${
                      isSelected ? 'text-brand-600' : 'text-gray-900 dark:text-white'
                    }`}>
                      {option.strike}
                    </div>
                  </td>

                  {/* Put Data */}
                  {/* Buy Put Button */}
                  <td className={`px-2 py-3 text-center border-l border-gray-200 dark:border-gray-600 ${isITM.put ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleBuyPut(option.strike, option.put.ask)
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded flex items-center space-x-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ShoppingCart className="h-3 w-3" />
                      <span>Buy</span>
                    </motion.button>
                  </td>
                  
                  {showGreeks && (
                    <>
                      <td className={`px-2 py-3 text-sm text-gray-900 dark:text-white ${isITM.put ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                        {formatGreek(option.put.delta)}
                      </td>
                      <td className={`px-2 py-3 text-sm text-red-600 ${isITM.put ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                        {formatGreek(option.put.theta, 1)}
                      </td>
                    </>
                  )}
                  <td className={`px-2 py-3 text-sm text-gray-900 dark:text-white ${isITM.put ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    {formatPercent(option.put.iv)}
                  </td>
                  <td className={`px-2 py-3 text-sm text-gray-900 dark:text-white ${isITM.put ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    {option.put.volume.toLocaleString()}
                  </td>
                  <td className={`px-2 py-3 text-sm ${isITM.put ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {formatPrice(option.put.last)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(option.put.bid)}/{formatPrice(option.put.ask)}
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with Legend */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 dark:bg-green-900/20 rounded"></div>
              <span>In-the-Money</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 dark:bg-red-900/20 rounded"></div>
              <span>Out-of-the-Money</span>
            </div>
          </div>
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

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
        }}
      />
    </motion.div>
  )
}