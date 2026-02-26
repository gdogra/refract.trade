'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Mail,
  Smartphone,
  RefreshCw,
  Play,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'

interface NotificationStats {
  pending: number
  sent: number
  failed: number
  total: number
}

interface Notification {
  id: string
  type: string
  priority: string
  category: string
  title: string
  body: string
  status: string
  channels: string[]
  createdAt: string
  sentAt?: string
  retryCount: number
  user?: {
    name: string
    email: string
  }
}

export default function AdminNotificationPanel() {
  const [stats, setStats] = useState<NotificationStats>({
    pending: 0,
    sent: 0,
    failed: 0,
    total: 0
  })
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadNotificationStatus()
  }, [])

  const loadNotificationStatus = async () => {
    try {
      const response = await fetch('/api/admin/notifications/process')
      if (response.ok) {
        const data = await response.json()
        setStats(data.data.stats)
        setNotifications(data.data.recentNotifications)
      }
    } catch (error) {
      console.error('Failed to load notification status:', error)
    } finally {
      setLoading(false)
    }
  }

  const processQueue = async () => {
    try {
      setProcessing(true)
      const response = await fetch('/api/admin/notifications/process', {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Processed ${result.data.processed} notifications`)
        loadNotificationStatus() // Refresh data
      }
    } catch (error) {
      console.error('Failed to process notification queue:', error)
      alert('Failed to process notifications')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'sent':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'normal':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sent
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.sent}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Failed
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.failed}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Queue Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notification Queue</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadNotificationStatus}
                disabled={processing}
              >
                <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={processQueue}
                disabled={processing || stats.pending === 0}
                className="flex items-center space-x-2"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span>Process Queue ({stats.pending})</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white dark:bg-gray-800 rounded-lg border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(notification.status)}
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(notification.priority)}>
                      {notification.priority}
                    </Badge>
                    <Badge className={getStatusColor(notification.status)}>
                      {notification.status}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {notification.body}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{notification.user?.name || 'Unknown User'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {notification.channels.includes('email') && (
                        <Mail className="h-3 w-3" />
                      )}
                      {notification.channels.includes('push') && (
                        <Smartphone className="h-3 w-3" />
                      )}
                    </div>
                    {notification.retryCount > 0 && (
                      <div className="flex items-center space-x-1 text-orange-500">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{notification.retryCount} retries</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Created: {formatDate(notification.createdAt)}</span>
                    {notification.sentAt && (
                      <span>Sent: {formatDate(notification.sentAt)}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {(notifications?.length || 0) === 0 && (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Recent Notifications
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Notifications will appear here as they are created
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}