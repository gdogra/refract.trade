import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, TrendingUp } from 'lucide-react'

interface ExpirationSelectorProps {
  expirations: string[]
  selectedExpiration?: string
  onExpirationChange: (expiration: string) => void
  loading?: boolean
  className?: string
}

interface GroupedExpirations {
  weekly: string[]
  monthly: string[]
  quarterly: string[]
  leaps: string[]
}

export default function ExpirationSelector({
  expirations,
  selectedExpiration,
  onExpirationChange,
  loading = false,
  className = ""
}: ExpirationSelectorProps) {
  
  const groupedExpirations = useMemo(() => {
    const now = new Date()
    const oneYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    
    const grouped: GroupedExpirations = {
      weekly: [],
      monthly: [],
      quarterly: [],
      leaps: []
    }
    
    expirations.forEach(dateStr => {
      const date = new Date(dateStr)
      const dayOfMonth = date.getDate()
      const dayOfWeek = date.getDay() // 0 = Sunday, 5 = Friday
      const month = date.getMonth()
      const isThirdFriday = dayOfWeek === 5 && dayOfMonth >= 15 && dayOfMonth <= 21
      const isQuarterly = isThirdFriday && (month === 2 || month === 5 || month === 8 || month === 11) // Mar, Jun, Sep, Dec
      
      if (date > oneYear) {
        grouped.leaps.push(dateStr)
      } else if (isQuarterly) {
        grouped.quarterly.push(dateStr)
      } else if (isThirdFriday) {
        grouped.monthly.push(dateStr)
      } else {
        grouped.weekly.push(dateStr)
      }
    })
    
    return grouped
  }, [expirations])
  
  const calculateDTE = (dateStr: string): number => {
    const expiry = new Date(dateStr)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  
  const formatExpirationDisplay = (dateStr: string): string => {
    const date = new Date(dateStr)
    const dte = calculateDTE(dateStr)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    const month = monthNames[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    
    // Highlight nearest expiration
    const isNearest = dateStr === expirations[0]
    
    return `${month} ${day} ${year}${isNearest ? ' (Nearest)' : ''} (${dte} DTE)`
  }
  
  const renderGroup = (title: string, dates: string[], icon: React.ReactNode, color: string) => {
    if (dates?.length || 0 === 0) return null
    
    return (
      <div className="mb-4">
        <div className={`flex items-center space-x-2 mb-2 px-2 py-1 text-xs font-medium ${color}`}>
          {icon}
          <span>{title}</span>
          <span className="text-gray-400">({dates?.length || 0})</span>
        </div>
        <div className="space-y-1">
          {dates.map(dateStr => (
            <motion.button
              key={dateStr}
              onClick={() => onExpirationChange(dateStr)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors
                         hover:bg-gray-50 dark:hover:bg-gray-700
                         ${selectedExpiration === dateStr 
                           ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 font-medium' 
                           : 'text-gray-700 dark:text-gray-300'
                         }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono">
                  {formatExpirationDisplay(dateStr)}
                </span>
                {calculateDTE(dateStr) <= 7 && (
                  <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                    Expires Soon
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md mb-3"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded-md"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (expirations?.length || 0 === 0) {
    return (
      <div className={`w-full p-4 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No expiration dates available</p>
      </div>
    )
  }
  
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Expiration Dates
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {expirations?.length || 0} available
          </span>
        </div>
        
        {/* Quick selector for nearest */}
        {expirations?.length || 0 > 0 && (
          <motion.button
            onClick={() => onExpirationChange(expirations[0])}
            className="w-full mb-3 px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 
                       dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 
                       dark:border-blue-800 rounded-lg text-sm font-medium text-blue-700 
                       dark:text-blue-300 hover:from-blue-100 hover:to-indigo-100 
                       dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Nearest: {formatExpirationDisplay(expirations[0])}</span>
            </div>
          </motion.button>
        )}
      </div>
      
      <div className="max-h-64 overflow-y-auto space-y-1">
        {renderGroup(
          'Weekly Options', 
          groupedExpirations.weekly,
          <Clock className="h-3 w-3" />,
          'text-green-600 dark:text-green-400'
        )}
        
        {renderGroup(
          'Monthly Options', 
          groupedExpirations.monthly,
          <Calendar className="h-3 w-3" />,
          'text-blue-600 dark:text-blue-400'
        )}
        
        {renderGroup(
          'Quarterly Options', 
          groupedExpirations.quarterly,
          <TrendingUp className="h-3 w-3" />,
          'text-purple-600 dark:text-purple-400'
        )}
        
        {renderGroup(
          'LEAPS (1+ Years)', 
          groupedExpirations.leaps,
          <Calendar className="h-3 w-3" />,
          'text-orange-600 dark:text-orange-400'
        )}
      </div>
      
      {/* Data source info */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-1">
          <span>Yahoo Finance</span>
          <span>•</span>
          <span>15 min delay</span>
        </div>
      </div>
    </div>
  )
}