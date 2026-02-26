'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, TrendingUp, Shield, Clock, X, CheckCircle } from 'lucide-react'

interface SmartAlert {
  id: string
  type: string
  priority: 'urgent' | 'high' | 'normal' | 'low'
  category: string
  title: string
  body: string
  explanation: string
  actionRequired: boolean
  contextData: any
  actionButtons?: Array<{
    label: string
    action: string
    data: any
  }>
  read: boolean
  dismissed: boolean
  createdAt: string
}

export function SmartAlertsPanel({ userId }: { userId: string }) {
  const [alerts, setAlerts] = useState<SmartAlert[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('unread')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [filter])

  const loadAlerts = async () => {
    try {
      const response = await fetch(`/api/alerts?active=true&category=${filter}`)
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Failed to load alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, read: true })
      })
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, read: true } : a))
    } catch (error) {
      console.error('Failed to mark alert as read:', error)
    }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, dismissed: true })
      })
      setAlerts(alerts.filter(a => a.id !== alertId))
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'normal': return 'border-blue-500 bg-blue-50'
      case 'low': return 'border-gray-500 bg-gray-50'
      default: return 'border-gray-300 bg-gray-50'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'position_action': return <TrendingUp className="w-4 h-4" />
      case 'rule_violation': return <Shield className="w-4 h-4" />
      case 'market_warning': return <AlertTriangle className="w-4 h-4" />
      default: return <Bell className="w-4 h-4" />
    }
  }

  const unreadCount = alerts.filter(a => !a.read)?.length || 0
  const urgentCount = alerts.filter(a => a.priority === 'urgent')?.length || 0

  if (loading) {
    return (
      <div className="border rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Smart Alerts</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
          {urgentCount > 0 && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
              {urgentCount} urgent
            </span>
          )}
        </div>
        
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="text-sm border rounded px-2 py-1"
        >
          <option value="unread">Unread</option>
          <option value="urgent">Urgent</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts?.length || 0 === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No alerts to display</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border-l-4 transition-opacity ${
                getPriorityColor(alert.priority)
              } ${alert.read ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2 flex-1">
                  {getTypeIcon(alert.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase ${
                        alert.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        alert.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{alert.body}</p>
                    
                    {alert.explanation && (
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer font-medium">Why this matters</summary>
                        <p className="mt-1 pl-3">{alert.explanation}</p>
                      </details>
                    )}
                    
                    {alert.actionButtons && alert.actionButtons?.length || 0 > 0 && (
                      <div className="flex gap-2 mt-3">
                        {alert.actionButtons.map((button, idx) => (
                          <button
                            key={idx}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            {button.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-2">
                  <div className="text-xs text-gray-500">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(alert.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  
                  {!alert.read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="p-1 hover:bg-white rounded"
                      title="Mark as read"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="p-1 hover:bg-white rounded"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Alerts refresh every 30 seconds
      </div>
    </div>
  )
}