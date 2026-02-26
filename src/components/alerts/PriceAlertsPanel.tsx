'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  BellRing, 
  Trash2, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { priceAlertsManager, PriceAlert } from '@/lib/priceAlerts'

interface PriceAlertsPanelProps {
  symbol?: string
  currentPrice?: number
  className?: string
}

export default function PriceAlertsPanel({ 
  symbol, 
  currentPrice = 0,
  className = "" 
}: PriceAlertsPanelProps) {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [triggeredAlerts, setTriggeredAlerts] = useState<PriceAlert[]>([])
  const [showAddAlert, setShowAddAlert] = useState(false)
  const [newAlertPrice, setNewAlertPrice] = useState('')

  // Load alerts on component mount and when symbol changes
  useEffect(() => {
    loadAlerts()
  }, [symbol])

  // Check for triggered alerts when price changes
  useEffect(() => {
    if (symbol && currentPrice > 0) {
      const triggered = priceAlertsManager.checkAlerts(symbol, currentPrice)
      if (triggered.length > 0) {
        setTriggeredAlerts(prev => [...prev, ...triggered])
        loadAlerts() // Refresh to show updated triggered status
        
        // Show browser notifications if supported
        triggered.forEach(alert => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Price Alert: ${alert.symbol}`, {
              body: `${alert.symbol} ${alert.type === 'above' ? 'reached' : 'dropped to'} $${alert.price.toFixed(2)}`,
              icon: '/favicon.ico'
            })
          }
        })
      }
    }
  }, [symbol, currentPrice])

  const loadAlerts = () => {
    const allAlerts = symbol ? 
      priceAlertsManager.getAlertsForSymbol(symbol) : 
      priceAlertsManager.getAllAlerts().filter(a => !a.triggered)
    
    setAlerts(allAlerts)
    setTriggeredAlerts(priceAlertsManager.getTriggeredAlerts())
  }

  const handleAddAlert = () => {
    if (!symbol || !newAlertPrice || !currentPrice) return

    const price = parseFloat(newAlertPrice)
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid price')
      return
    }

    try {
      priceAlertsManager.addAlert(symbol, price, currentPrice)
      setNewAlertPrice('')
      setShowAddAlert(false)
      loadAlerts()
      
      const direction = price > currentPrice ? 'above' : 'below'
      alert(`Price alert set for ${symbol} ${direction} $${price.toFixed(2)}`)
    } catch (error) {
      alert('Failed to set price alert')
    }
  }

  const handleRemoveAlert = (alertId: string) => {
    priceAlertsManager.removeAlert(alertId)
    loadAlerts()
  }

  const clearTriggeredAlerts = () => {
    priceAlertsManager.clearTriggeredAlerts()
    setTriggeredAlerts([])
  }

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className={className}>
      {/* Triggered Alerts Banner */}
      <AnimatePresence>
        {triggeredAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BellRing className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      {triggeredAlerts.length} Price Alert{triggeredAlerts.length > 1 ? 's' : ''} Triggered
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearTriggeredAlerts}
                    className="text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {triggeredAlerts.slice(-3).map(alert => (
                    <div key={alert.id} className="text-sm text-green-700">
                      <span className="font-medium">{alert.symbol}</span> {alert.type === 'above' ? 'reached' : 'dropped to'} {formatPrice(alert.price)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Alerts Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <span>Price Alerts</span>
              {symbol && (
                <Badge variant="outline" className="text-xs">
                  {symbol}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {alerts.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {alerts.length} active
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddAlert(!showAddAlert)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Alert
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add Alert Form */}
          <AnimatePresence>
            {showAddAlert && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alert Price for {symbol || 'Symbol'}
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        step="0.01"
                        value={newAlertPrice}
                        onChange={(e) => setNewAlertPrice(e.target.value)}
                        placeholder={currentPrice ? currentPrice.toFixed(2) : "0.00"}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Button
                        onClick={handleAddAlert}
                        disabled={!symbol || !newAlertPrice}
                        className="text-sm px-4 py-2"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  {currentPrice > 0 && newAlertPrice && (
                    <div className="text-xs text-gray-600">
                      {parseFloat(newAlertPrice) > currentPrice ? (
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span>Alert when price rises above {formatPrice(parseFloat(newAlertPrice))}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span>Alert when price drops below {formatPrice(parseFloat(newAlertPrice))}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Alerts List */}
          <div className="space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active price alerts</p>
                {symbol && (
                  <p className="text-xs mt-1">
                    Set an alert for {symbol} to get notified of price changes
                  </p>
                )}
              </div>
            ) : (
              alerts.map(alert => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${
                      alert.type === 'above' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {alert.type === 'above' ? 
                        <TrendingUp className="h-3 w-3" /> : 
                        <TrendingDown className="h-3 w-3" />
                      }
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{alert.symbol}</span>
                        <span className="text-sm text-gray-600">
                          {alert.type === 'above' ? '≥' : '≤'} {formatPrice(alert.price)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAlert(alert.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))
            )}
          </div>

          {/* Notification Permission */}
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">Enable browser notifications</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestNotificationPermission}
                  className="text-yellow-700 border-yellow-300 text-xs"
                >
                  Enable
                </Button>
              </div>
            </div>
          )}

          {/* Notification Status */}
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && (
            <div className="flex items-center space-x-2 text-xs text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Browser notifications enabled</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}