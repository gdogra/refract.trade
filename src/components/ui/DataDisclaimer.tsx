/**
 * Data Disclaimer Component
 * Compliance disclaimer for market data usage
 */

'use client'

import { AlertCircle, Shield, Clock } from 'lucide-react'

interface DataDisclaimerProps {
  variant?: 'banner' | 'footer' | 'inline'
  compact?: boolean
  className?: string
}

export default function DataDisclaimer({ 
  variant = 'banner', 
  compact = false,
  className = '' 
}: DataDisclaimerProps) {
  const disclaimerText = compact 
    ? "Data provided for informational purposes only. Not investment advice."
    : "Market data provided for informational purposes only and is not intended as investment advice. Real-time and historical data may be delayed. Options calculations are estimates and should not be the sole basis for trading decisions."

  if (variant === 'footer') {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 ${className}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>{disclaimerText}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Data may be delayed up to 15 minutes</span>
              </div>
            </div>
            <div className="text-xs">
              <span className="text-blue-600 dark:text-blue-400">Powered by Polygon & Alpha Vantage</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-start space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs ${className}`}>
        <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
        <span className="text-yellow-800 dark:text-yellow-200">{disclaimerText}</span>
      </div>
    )
  }

  // Banner variant
  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
            Market Data Disclaimer
          </h4>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            {disclaimerText}
          </p>
          <div className="flex items-center space-x-4 text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Real-time data subject to exchange fees</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>For educational and informational use only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}