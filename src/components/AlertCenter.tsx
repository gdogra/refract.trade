'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  AlertTriangle, 
  Shield, 
  Clock, 
  TrendingDown,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  alertSystem,
  type Alert,
  AlertType,
  AlertSeverity
} from '@/lib/alertSystem'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'
import { toast } from 'react-hot-toast'

// Mock alerts for demonstration
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: AlertType.EXPIRATION_WARNING,
    severity: AlertSeverity.HIGH,
    title: '3 Positions Expiring Soon',
    message: 'You have 3 positions expiring in 2 days. Review for potential assignment risk or profit-taking opportunities.',
    details: {
      timeToExpiry: 2,
      affectedPositions: ['pos1', 'pos2', 'pos3'],
      recommendedAction: 'Review positions for assignment risk and consider closing or rolling',
      confidence: 0.95
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    isResolved: false,
    userId: 'user1',
    actionRequired: true
  },
  {
    id: '2',
    type: AlertType.PORTFOLIO_RISK,
    severity: AlertSeverity.MEDIUM,
    title: 'High Delta Risk',
    message: 'Portfolio risk has exceeded safe levels. Current exposure: 6250, threshold: 5000',
    details: {
      currentValue: 6250,
      thresholdValue: 5000,
      changePercent: 25,
      recommendedAction: 'Consider reducing position sizes or hedging exposure',
      confidence: 0.87
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isRead: false,
    isResolved: false,
    userId: 'user1',
    actionRequired: true
  },
  {
    id: '3',
    type: AlertType.VOLATILITY_SPIKE,
    severity: AlertSeverity.MEDIUM,
    title: 'Volatility Spike Detected',
    message: 'Significant volatility increase detected in 2 position(s). This may affect your Greeks and P&L.',
    details: {
      affectedPositions: ['pos4', 'pos5'],
      changePercent: 35,
      recommendedAction: 'Review vega exposure and consider vol hedging',
      confidence: 0.73
    },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    isRead: true,
    isResolved: false,
    userId: 'user1',
    symbol: 'AAPL'
  },
  {
    id: '4',
    type: AlertType.ASSIGNMENT_RISK,
    severity: AlertSeverity.CRITICAL,
    title: 'High Assignment Risk',
    message: '1 short position(s) have high assignment probability. Consider closing or rolling to avoid unwanted assignment.',
    details: {
      affectedPositions: ['pos6'],
      timeToExpiry: 1,
      recommendedAction: 'Close or roll positions to later expiration',
      confidence: 0.91
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isRead: false,
    isResolved: false,
    userId: 'user1',
    symbol: 'TSLA',
    actionRequired: true
  },
  {
    id: '5',
    type: AlertType.MARKET_EVENT,
    severity: AlertSeverity.LOW,
    title: 'Earnings Announcement',
    message: 'MSFT earnings scheduled for tomorrow after market close. Review positions for potential volatility impact.',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    isRead: true,
    isResolved: false,
    userId: 'user1',
    symbol: 'MSFT'
  }
]

interface AlertCenterProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export default function AlertCenter({ isOpen, onClose, className }: AlertCenterProps) {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<AlertSeverity | 'all'>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)

  // Filter alerts based on search and filters
  const filteredAlerts = useMemo(() => {
    let filtered = alerts

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.symbol?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity)
    }

    // Unread filter
    if (showUnreadOnly) {
      filtered = filtered.filter(alert => !alert.isRead)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [alerts, searchTerm, selectedSeverity, showUnreadOnly])

  // Alert counts
  const alertCounts = useMemo(() => {
    return {
      total: alerts?.length || 0,
      unread: alerts.filter(a => !a.isRead)?.length || 0,
      critical: alerts.filter(a => a.severity === AlertSeverity.CRITICAL && !a.isResolved)?.length || 0,
      actionRequired: alerts.filter(a => a.actionRequired && !a.isResolved)?.length || 0
    }
  }, [alerts])

  const handleMarkAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ))
  }

  const handleMarkAsResolved = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isResolved: true } : alert
    ))
    toast.success('Alert resolved')
  }

  const handleDismiss = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    toast.success('Alert dismissed')
  }

  const handleMarkAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })))
    toast.success('All alerts marked as read')
  }

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case AlertSeverity.HIGH:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case AlertSeverity.MEDIUM:
        return <Info className="h-4 w-4 text-yellow-600" />
      case AlertSeverity.LOW:
        return <CheckCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'border-red-500 bg-red-50 dark:bg-red-900/10'
      case AlertSeverity.HIGH:
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
      case AlertSeverity.MEDIUM:
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
      case AlertSeverity.LOW:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
    }
  }

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case AlertType.PORTFOLIO_RISK:
        return <Shield className="h-4 w-4" />
      case AlertType.EXPIRATION_WARNING:
        return <Clock className="h-4 w-4" />
      case AlertType.VOLATILITY_SPIKE:
        return <Zap className="h-4 w-4" />
      case AlertType.ASSIGNMENT_RISK:
        return <AlertTriangle className="h-4 w-4" />
      case AlertType.MARKET_EVENT:
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (!isOpen) return null

  return (
    <motion.div
      className={cn("fixed inset-0 z-50 flex", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Panel */}
      <motion.div
        className="ml-auto h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-xl"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <BellRing className="h-6 w-6 text-gray-900 dark:text-white" />
                {alertCounts.unread > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {alertCounts.unread > 99 ? '99+' : alertCounts.unread}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Alert Center
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {alertCounts.unread} unread • {alertCounts.actionRequired} require action
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
                Mark All Read
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{alertCounts.total}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{alertCounts.unread}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Unread</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{alertCounts.critical}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Critical</p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{alertCounts.actionRequired}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Action</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-4 mt-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as AlertSeverity | 'all')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Severity</option>
              <option value={AlertSeverity.CRITICAL}>Critical</option>
              <option value={AlertSeverity.HIGH}>High</option>
              <option value={AlertSeverity.MEDIUM}>Medium</option>
              <option value={AlertSeverity.LOW}>Low</option>
            </select>
            
            <Button
              variant={showUnreadOnly ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              {showUnreadOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Unread
            </Button>
          </div>
        </div>

        {/* Alert List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {filteredAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                className={cn(
                  "border rounded-lg p-4 transition-all cursor-pointer",
                  getSeverityColor(alert.severity),
                  !alert.isRead && "ring-2 ring-blue-500/20",
                  alert.isResolved && "opacity-50"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(alert.type)}
                        <h3 className={cn(
                          "font-semibold text-gray-900 dark:text-white",
                          !alert.isRead && "font-bold"
                        )}>
                          {alert.title}
                        </h3>
                        {alert.symbol && (
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium">
                            {alert.symbol}
                          </span>
                        )}
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{formatTimeAgo(alert.timestamp)}</span>
                        {alert.details?.confidence && (
                          <span>Confidence: {(alert.details.confidence * 100).toFixed(0)}%</span>
                        )}
                        {alert.actionRequired && (
                          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-400 rounded-full">
                            Action Required
                          </span>
                        )}
                      </div>

                      {alert.details?.recommendedAction && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                          <strong className="text-blue-800 dark:text-blue-400">Recommended: </strong>
                          <span className="text-blue-700 dark:text-blue-300">{alert.details.recommendedAction}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!alert.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(alert.id)
                        }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkAsResolved(alert.id)
                      }}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDismiss(alert.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAlerts?.length || 0 === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || selectedSeverity !== 'all' || showUnreadOnly 
                  ? 'No alerts match your filters'
                  : 'No alerts yet'
                }
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                {searchTerm || selectedSeverity !== 'all' || showUnreadOnly
                  ? 'Try adjusting your search or filters'
                  : 'Your portfolio alerts will appear here'
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>{filteredAlerts?.length || 0} alert{filteredAlerts?.length || 0 !== 1 ? 's' : ''} shown</span>
            <div className="flex space-x-4">
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
              <Button variant="ghost" size="sm">
                Settings
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Alert Details Modal */}
      {selectedAlert && (
        <motion.div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedAlert(null)}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getSeverityIcon(selectedAlert.severity)}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedAlert.title}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedAlert.message}
            </p>

            {selectedAlert.details && (
              <div className="space-y-3">
                {selectedAlert.details.currentValue && selectedAlert.details.thresholdValue && (
                  <div className="flex justify-between">
                    <span>Current Value:</span>
                    <span className="font-semibold">{formatCurrency(selectedAlert.details.currentValue)}</span>
                  </div>
                )}
                
                {selectedAlert.details.confidence && (
                  <div className="flex justify-between">
                    <span>AI Confidence:</span>
                    <span className="font-semibold">{(selectedAlert.details.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
                
                {selectedAlert.details.affectedPositions && (
                  <div className="flex justify-between">
                    <span>Affected Positions:</span>
                    <span className="font-semibold">{selectedAlert.details.affectedPositions?.length || 0}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  handleMarkAsResolved(selectedAlert.id)
                  setSelectedAlert(null)
                }}
                className="flex-1"
              >
                Resolve
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSelectedAlert(null)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}