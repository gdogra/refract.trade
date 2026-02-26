'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Settings, 
  Trash2,
  CheckCircle2,
  Clock,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { notificationService, type Notification } from '@/lib/notificationService'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [selectedTab, setSelectedTab] = useState<'all' | 'unread'>('all')
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications)
    setNotifications(notificationService.getNotifications())
    
    return unsubscribe
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return CheckCircle
      case 'alert':
        return TrendingUp
      case 'news':
        return Bell
      case 'system':
        return Settings
      default:
        return Bell
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'alert':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'news':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'system':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
  }

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id)
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications?')) {
      notificationService.clearAll()
    }
  }

  const filteredNotifications = selectedTab === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white dark:bg-gray-800 rounded-xl w-96 max-h-[80vh] shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.95, x: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-3">
            <button
              onClick={() => setSelectedTab('all')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                selectedTab === 'all'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              All ({notifications?.length || 0})
            </button>
            <button
              onClick={() => setSelectedTab('unread')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
                selectedTab === 'unread'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Unread ({notificationService.getUnreadCount()})
            </button>
          </div>

          {/* Actions */}
          {notifications?.length || 0 > 0 && (
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={notificationService.getUnreadCount() === 0}
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {(filteredNotifications?.length || 0) === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {selectedTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification, index) => {
                const Icon = getNotificationIcon(notification.type)
                
                return (
                  <motion.div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        getNotificationColor(notification.type)
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-gray-400 hover:text-blue-600 p-1"
                                title="Mark as read"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-gray-400 hover:text-red-600 p-1"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Action Button */}
                        {notification.data?.symbol && (
                          <button
                            onClick={() => {
                              router.push(`/options?symbol=${notification.data.symbol}`)
                              onClose()
                            }}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-2 flex items-center"
                          >
                            View {notification.data.symbol}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}