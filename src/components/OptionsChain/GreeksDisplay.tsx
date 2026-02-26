'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import type { OptionGreeks } from '@/lib/options/yahooOptions'

interface GreeksDisplayProps {
  greeks?: OptionGreeks | null
  loading?: boolean
  className?: string
  compact?: boolean
}

interface GreekInfo {
  label: string
  value: number
  unit?: string
  color: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
  tooltip: string
}

export default function GreeksDisplay({ 
  greeks, 
  loading = false, 
  className = "",
  compact = false 
}: GreeksDisplayProps) {
  
  if (loading) {
    return (
      <div className={`${className} ${compact ? 'p-2' : 'p-3'}`}>
        <div className="animate-pulse">
          <div className={`grid ${compact ? 'grid-cols-3 gap-1' : 'grid-cols-5 gap-2'}`}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`${compact ? 'h-6' : 'h-8'} bg-gray-200 dark:bg-gray-700 rounded`}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (!greeks) {
    return (
      <div className={`${className} ${compact ? 'p-2' : 'p-3'} text-center`}>
        <div className={`text-gray-500 dark:text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>
          <Info className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} mx-auto mb-1 opacity-50`} />
          Greeks unavailable
        </div>
      </div>
    )
  }
  
  const formatNumber = (value: number, decimals: number = 4): string => {
    if (isNaN(value) || !isFinite(value)) return 'N/A'
    
    if (Math.abs(value) < 0.0001 && value !== 0) {
      return value.toExponential(2)
    }
    
    return value.toFixed(decimals)
  }
  
  const getGreekColor = (greek: string, value: number): 'green' | 'red' | 'yellow' | 'blue' | 'gray' => {
    if (isNaN(value) || !isFinite(value)) return 'gray'
    
    switch (greek) {
      case 'delta':
        return value > 0 ? 'green' : 'red'
      case 'gamma':
        return value > 0.05 ? 'yellow' : 'blue'
      case 'theta':
        return value < -0.1 ? 'red' : 'yellow'
      case 'vega':
        return value > 0.1 ? 'blue' : 'gray'
      case 'rho':
        return value > 0 ? 'green' : 'red'
      default:
        return 'gray'
    }
  }
  
  const greekInfos: GreekInfo[] = [
    {
      label: 'Delta',
      value: greeks.delta,
      color: getGreekColor('delta', greeks.delta),
      tooltip: 'Price sensitivity to $1 move in underlying. Range: -1 to 1 for options.'
    },
    {
      label: 'Gamma', 
      value: greeks.gamma,
      color: getGreekColor('gamma', greeks.gamma),
      tooltip: 'Delta sensitivity to $1 move in underlying. Higher gamma = more delta change.'
    },
    {
      label: 'Theta',
      value: greeks.theta,
      unit: '/day',
      color: getGreekColor('theta', greeks.theta), 
      tooltip: 'Time decay - how much option loses in value per day. Usually negative.'
    },
    {
      label: 'Vega',
      value: greeks.vega,
      unit: '%',
      color: getGreekColor('vega', greeks.vega),
      tooltip: 'Volatility sensitivity - price change per 1% volatility change.'
    },
    {
      label: 'Rho',
      value: greeks.rho,
      unit: '%',
      color: getGreekColor('rho', greeks.rho),
      tooltip: 'Interest rate sensitivity - price change per 1% rate change.'
    }
  ]
  
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    gray: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20'
  }
  
  if (compact) {
    return (
      <div className={`${className} p-2`}>
        <div className="grid grid-cols-3 gap-1">
          {greekInfos.slice(0, 3).map((greek, index) => (
            <div
              key={greek.label}
              className="group relative"
            >
              <div className={`px-2 py-1 rounded text-xs text-center transition-colors ${colorClasses[greek.color]}`}>
                <div className="font-medium">{greek.label}</div>
                <div className="font-mono">
                  {formatNumber(greek.value, 3)}{greek.unit || ''}
                </div>
              </div>
              
              {/* Tooltip on hover */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 
                            bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded 
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none 
                            whitespace-nowrap z-10">
                {greek.tooltip}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className={`${className} p-3`}>
      <div className="mb-2">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Greeks</h4>
          <Info className="h-3 w-3 text-gray-400" />
        </div>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {greekInfos.map((greek, index) => (
          <motion.div
            key={greek.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className={`p-2 rounded-lg text-center transition-all duration-200 ${colorClasses[greek.color]} 
                           hover:shadow-md border border-current border-opacity-20`}>
              <div className="text-xs font-medium mb-1">{greek.label}</div>
              <div className="font-mono text-sm font-bold">
                {formatNumber(greek.value)}
              </div>
              {greek.unit && (
                <div className="text-xs opacity-70 mt-1">{greek.unit}</div>
              )}
            </div>
            
            {/* Enhanced tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 
                          bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg 
                          opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none 
                          whitespace-nowrap z-20 shadow-lg">
              <div className="font-medium mb-1">{greek.label}</div>
              <div className="text-gray-300 dark:text-gray-600">{greek.tooltip}</div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent 
                            border-t-gray-900 dark:border-t-gray-100"></div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Summary insights */}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          {Math.abs(greeks.delta) > 0.5 && (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              <span>High delta - sensitive to price moves</span>
            </div>
          )}
          {greeks.theta < -0.1 && (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
              <span>High time decay</span>
            </div>
          )}
          {greeks.vega > 0.2 && (
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              <span>Volatile - sensitive to IV changes</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}