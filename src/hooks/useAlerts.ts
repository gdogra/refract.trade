'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  alertSystem,
  type Alert,
  type AlertRule,
  AlertType,
  AlertSeverity
} from '@/lib/alertSystem'

// Hook for managing alerts
export function useAlerts(userId: string) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial alerts
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true)
        const initialAlerts = alertSystem.getAlerts(userId)
        setAlerts(initialAlerts)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load alerts')
      } finally {
        setLoading(false)
      }
    }

    loadAlerts()
  }, [userId])

  // Subscribe to new alerts
  useEffect(() => {
    const unsubscribe = alertSystem.subscribe(userId, (newAlert) => {
      setAlerts(prev => [newAlert, ...prev])
    })

    return unsubscribe
  }, [userId])

  const markAsRead = useCallback((alertId: string) => {
    alertSystem.markAsRead(alertId)
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ))
  }, [])

  const markAsResolved = useCallback((alertId: string) => {
    alertSystem.markAsResolved(alertId)
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isResolved: true } : alert
    ))
  }, [])

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])

  const markAllAsRead = useCallback(() => {
    const unreadAlerts = alerts.filter(a => !a.isRead)
    unreadAlerts.forEach(alert => alertSystem.markAsRead(alert.id))
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })))
  }, [alerts])

  const createAlert = useCallback((
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string
  ) => {
    const alert = alertSystem.createAlert(type, severity, title, message, userId)
    setAlerts(prev => [alert, ...prev])
    return alert
  }, [userId])

  // Alert counts
  const counts = {
    total: alerts?.length || 0,
    unread: alerts.filter(a => !a.isRead)?.length || 0,
    critical: alerts.filter(a => a.severity === AlertSeverity.CRITICAL && !a.isResolved)?.length || 0,
    actionRequired: alerts.filter(a => a.actionRequired && !a.isResolved)?.length || 0
  }

  return {
    alerts,
    loading,
    error,
    counts,
    markAsRead,
    markAsResolved,
    dismissAlert,
    markAllAsRead,
    createAlert
  }
}

// Hook for alert rules management
export function useAlertRules() {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load rules - in real app, this would be from API
    const loadRules = async () => {
      try {
        setLoading(true)
        // Mock rules loading
        await new Promise(resolve => setTimeout(resolve, 500))
        setRules([
          {
            id: 'delta_risk',
            name: 'High Delta Risk',
            description: 'Alert when portfolio delta exposure exceeds safe levels',
            type: AlertType.PORTFOLIO_RISK,
            enabled: true,
            conditions: [
              { field: 'totalDelta', operator: 'gt', value: 5000 }
            ],
            actions: [
              { type: 'push', enabled: true },
              { type: 'email', enabled: false }
            ],
            cooldownPeriod: 60
          },
          {
            id: 'theta_decay',
            name: 'High Theta Decay',
            description: 'Alert when daily theta decay exceeds threshold',
            type: AlertType.PORTFOLIO_RISK,
            enabled: true,
            conditions: [
              { field: 'totalTheta', operator: 'lt', value: -200 }
            ],
            actions: [
              { type: 'push', enabled: true }
            ],
            cooldownPeriod: 120
          },
          {
            id: 'expiration_warning',
            name: 'Positions Expiring Soon',
            description: 'Alert when positions expire within 7 days',
            type: AlertType.EXPIRATION_WARNING,
            enabled: true,
            conditions: [
              { field: 'timeToExpiry', operator: 'lte', value: 7 }
            ],
            actions: [
              { type: 'push', enabled: true },
              { type: 'email', enabled: true }
            ],
            cooldownPeriod: 1440
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadRules()
  }, [])

  const updateRule = useCallback((rule: AlertRule) => {
    alertSystem.addRule(rule)
    setRules(prev => {
      const index = prev.findIndex(r => r.id === rule.id)
      if (index >= 0) {
        const updated = [...prev]
        updated[index] = rule
        return updated
      } else {
        return [...prev, rule]
      }
    })
  }, [])

  const toggleRule = useCallback((ruleId: string, enabled: boolean) => {
    alertSystem.toggleRule(ruleId, enabled)
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled } : rule
    ))
  }, [])

  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId))
  }, [])

  return {
    rules,
    loading,
    updateRule,
    toggleRule,
    deleteRule
  }
}

// Hook for real-time portfolio monitoring
export function usePortfolioMonitoring(positions: any[], userId: string, enabled: boolean = true) {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null)

  const runAnalysis = useCallback(async () => {
    if (!enabled || positions?.length || 0 === 0) return

    try {
      setIsMonitoring(true)
      const alerts = await alertSystem.analyzePortfolio(positions, userId)
      setLastAnalysis(new Date())
      
      // Return number of new alerts generated
      return alerts?.length || 0
    } catch (error) {
      console.error('Portfolio analysis failed:', error)
      return 0
    } finally {
      setIsMonitoring(false)
    }
  }, [positions, userId, enabled])

  // Run analysis when positions change
  useEffect(() => {
    if (enabled && positions?.length || 0 > 0) {
      // Debounce analysis to avoid too frequent calls
      const timer = setTimeout(runAnalysis, 1000)
      return () => clearTimeout(timer)
    }
  }, [positions, enabled, runAnalysis])

  // Periodic analysis (every 5 minutes)
  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(runAnalysis, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [enabled, runAnalysis])

  return {
    isMonitoring,
    lastAnalysis,
    runAnalysis
  }
}

// Hook for alert notifications
export function useAlertNotifications(userId: string) {
  const [hasPermission, setHasPermission] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setIsSupported(true)
      setHasPermission(Notification.permission === 'granted')
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false

    try {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      setHasPermission(granted)
      return granted
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }, [isSupported])

  const showNotification = useCallback(async (alert: Alert) => {
    if (!hasPermission) {
      const granted = await requestPermission()
      if (!granted) return
    }

    try {
      const notification = new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id,
        data: { alertId: alert.id },
        requireInteraction: alert.severity === AlertSeverity.CRITICAL
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
        // Could trigger navigation to alert center
      }

      // Auto-close non-critical notifications
      if (alert.severity !== AlertSeverity.CRITICAL) {
        setTimeout(() => notification.close(), 5000)
      }
    } catch (error) {
      console.error('Failed to show notification:', error)
    }
  }, [hasPermission, requestPermission])

  // Subscribe to alerts and show notifications
  useEffect(() => {
    const unsubscribe = alertSystem.subscribe(userId, (alert) => {
      // Only show notifications for high severity alerts
      if (alert.severity === AlertSeverity.HIGH || alert.severity === AlertSeverity.CRITICAL) {
        showNotification(alert)
      }
    })

    return unsubscribe
  }, [userId, showNotification])

  return {
    isSupported,
    hasPermission,
    requestPermission,
    showNotification
  }
}

// Hook for alert statistics and analytics
export function useAlertAnalytics(userId: string, days: number = 30) {
  const [analytics, setAnalytics] = useState({
    totalAlerts: 0,
    alertsByType: {} as Record<AlertType, number>,
    alertsBySeverity: {} as Record<AlertSeverity, number>,
    responseTime: 0, // Average time to resolve
    falsePositiveRate: 0,
    actionableSaved: 0 // Estimated losses prevented
  })

  useEffect(() => {
    const calculateAnalytics = () => {
      const alerts = alertSystem.getAlerts(userId)
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const recentAlerts = alerts.filter(a => a.timestamp >= cutoffDate)

      const alertsByType = recentAlerts.reduce((acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1
        return acc
      }, {} as Record<AlertType, number>)

      const alertsBySeverity = recentAlerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1
        return acc
      }, {} as Record<AlertSeverity, number>)

      // Calculate average response time for resolved alerts
      const resolvedAlerts = recentAlerts.filter(a => a.isResolved)
      const avgResponseTime = resolvedAlerts?.length || 0 > 0
        ? resolvedAlerts.reduce((sum, alert) => {
            // Assume resolved alerts have a resolution timestamp (would need to add this)
            return sum + (2 * 60 * 60 * 1000) // Mock 2 hours average
          }, 0) / resolvedAlerts?.length || 0
        : 0

      setAnalytics({
        totalAlerts: recentAlerts?.length || 0,
        alertsByType,
        alertsBySeverity,
        responseTime: avgResponseTime / (1000 * 60 * 60), // Convert to hours
        falsePositiveRate: 0.12, // Mock 12% false positive rate
        actionableSaved: recentAlerts.filter(a => a.actionRequired)?.length || 0 * 150 // Mock $150 saved per actionable alert
      })
    }

    calculateAnalytics()
  }, [userId, days])

  return analytics
}