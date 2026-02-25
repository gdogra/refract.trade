'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { MARKET_DATA_DISCLAIMER, getDataFreshness } from '@/lib/liveMarketData'

interface MarketDataDisclaimerProps {
  variant?: 'compact' | 'full' | 'floating'
  timestamp?: number
  dataSource?: string
  className?: string
}

export default function MarketDataDisclaimer({ 
  variant = 'compact', 
  timestamp,
  dataSource = 'Yahoo Finance',
  className = ''
}: MarketDataDisclaimerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const freshness = timestamp ? getDataFreshness(timestamp) : null

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        <Clock className="h-3 w-3" />
        <span>{MARKET_DATA_DISCLAIMER.short}</span>
        {freshness && (
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            freshness.status === 'fresh' ? 'bg-green-100 text-green-700' :
            freshness.status === 'delayed' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {freshness.ageMinutes}m ago
          </span>
        )}
      </div>
    )
  }

  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed bottom-4 right-4 max-w-sm bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-lg z-40 ${className}`}
      >
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-blue-900 mb-1">
              Market Data Notice
            </div>
            <div className="text-xs text-blue-700">
              {MARKET_DATA_DISCLAIMER.short} • Source: {dataSource}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // Full variant with expandable details
  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center space-x-2">
          <div className={`p-1 rounded ${
            freshness?.status === 'fresh' ? 'bg-green-100' :
            freshness?.status === 'delayed' ? 'bg-yellow-100' :
            'bg-red-100'
          }`}>
            {freshness?.status === 'fresh' ? 
              <Clock className="h-4 w-4 text-green-600" /> :
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            }
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Market Data Information
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Data from {dataSource} {freshness ? `• ${freshness.description}` : ''}
            </div>
          </div>
        </div>
        {isExpanded ? 
          <ChevronUp className="h-4 w-4 text-gray-500" /> :
          <ChevronDown className="h-4 w-4 text-gray-500" />
        }
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Disclaimer
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {MARKET_DATA_DISCLAIMER.full}
                </p>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data Sources
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {MARKET_DATA_DISCLAIMER.sources}
                </p>
              </div>

              {timestamp && (
                <div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Updated
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      freshness?.status === 'fresh' ? 'bg-green-500' :
                      freshness?.status === 'delayed' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(timestamp).toLocaleTimeString()} • {freshness?.description}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  💡 <strong>For Real-Time Data:</strong> Connect your broker account or subscribe to a professional market data feed.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Quick disclaimer badge for inline use
export function DataDelayBadge({ 
  timestamp, 
  className = '' 
}: { 
  timestamp?: number
  className?: string 
}) {
  const freshness = timestamp ? getDataFreshness(timestamp) : null
  
  if (!freshness) return null

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
      freshness.status === 'fresh' ? 'bg-green-100 text-green-800' :
      freshness.status === 'delayed' ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    } ${className}`}>
      <Clock className="h-3 w-3 mr-1" />
      {freshness.ageMinutes}m
    </span>
  )
}