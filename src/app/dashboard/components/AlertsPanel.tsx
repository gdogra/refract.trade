'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Bell, AlertTriangle, Info, CheckCircle, X, Clock } from 'lucide-react'

interface Alert {
  id: string
  type: 'warning' | 'info' | 'success' | 'error'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export default function AlertsPanel() {
  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      // Mock data for now - will connect to real alerts system later
      return [
        {
          id: '1',
          type: 'warning',
          title: 'High IV Detected',
          message: 'AAPL options showing unusually high implied volatility before earnings',
          timestamp: '5 minutes ago',
          isRead: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'info',
          title: 'Position Update',
          message: 'SPY iron condor approaching max profit zone',
          timestamp: '15 minutes ago',
          isRead: false,
          priority: 'medium'
        },
        {
          id: '3',
          type: 'success',
          title: 'Trade Closed',
          message: 'TSLA bull call spread closed for 45% profit',
          timestamp: '1 hour ago',
          isRead: true,
          priority: 'low'
        },
        {
          id: '4',
          type: 'warning',
          title: 'Margin Alert',
          message: 'Approaching 80% of available buying power',
          timestamp: '2 hours ago',
          isRead: false,
          priority: 'critical'
        }
      ]
    }
  })

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return AlertTriangle
      case 'info':
        return Info
      case 'success':
        return CheckCircle
      case 'error':
        return X
      default:
        return Bell
    }
  }

  const getAlertColor = (type: string, priority: string) => {
    if (priority === 'critical') {
      return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    }
    
    switch (type) {
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
      case 'success':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
    }
    
    return colors[priority as keyof typeof colors] || colors.low
  }

  const unreadCount = alerts?.filter(alert => !alert.isRead)?.length || 0 || 0

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-brand-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Alerts
          </h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <motion.button 
          className="text-brand-500 hover:text-brand-600 text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Mark All Read
        </motion.button>
      </div>

      <div className="space-y-3">
        {alerts?.slice(0, 4).map((alert, index) => {
          const IconComponent = getAlertIcon(alert.type)
          const alertColors = getAlertColor(alert.type, alert.priority)
          
          return (
            <motion.div
              key={alert.id}
              className={`border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer ${alertColors} ${
                !alert.isRead ? 'border-l-4' : ''
              }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-1 rounded`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.title}
                        </h4>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityBadge(alert.priority)}`}>
                          {alert.priority}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center space-x-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3" />
                        <span>{alert.timestamp}</span>
                      </div>
                    </div>
                    
                    {!alert.isRead && (
                      <motion.button 
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="h-3 w-3" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Alert Settings */}
      <motion.div 
        className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <motion.button 
          className="w-full text-left text-sm text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          whileHover={{ x: 2 }}
        >
          Configure Alert Settings →
        </motion.button>
      </motion.div>
    </motion.div>
  )
}