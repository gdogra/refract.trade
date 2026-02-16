'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Save, 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Clock,
  DollarSign,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SettingsConfig {
  sectionTitle: string
  itemLabel: string
  onClose: () => void
  onSave: (data: any) => void
}

interface SettingsConfigModalProps {
  isOpen: boolean
  config: SettingsConfig | null
  onClose: () => void
}

export default function SettingsConfigModal({ isOpen, config, onClose }: SettingsConfigModalProps) {
  const [formData, setFormData] = useState<any>({})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (config) {
      // Initialize form data based on the setting being configured
      const defaultData = getDefaultDataForSetting(config.sectionTitle, config.itemLabel)
      setFormData(defaultData)
    }
  }, [config])

  const getDefaultDataForSetting = (section: string, item: string) => {
    const defaults: { [key: string]: { [key: string]: any } } = {
      'Account Settings': {
        'Profile Information': {
          firstName: 'Alex',
          lastName: 'Chen',
          email: 'alex.chen@email.com',
          phone: '+1 (555) 987-6543',
          timezone: 'America/Los_Angeles'
        },
        'Password & Security': {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          twoFactorEnabled: true
        },
        'Email Preferences': {
          marketUpdates: true,
          portfolioAlerts: true,
          promotionalEmails: false,
          weeklyReports: true
        }
      },
      'Trading Preferences': {
        'Default Order Settings': {
          defaultOrderType: 'limit',
          defaultQuantity: 1,
          defaultDuration: 'day',
          autoConfirm: false
        },
        'Risk Management': {
          maxDailyLoss: 1000,
          maxPositionSize: 50,
          stopLossEnabled: true,
          riskAlerts: true
        },
        'Trading Hours': {
          startTime: '09:30',
          endTime: '16:00',
          timezone: 'America/New_York',
          alertOutsideHours: true
        }
      },
      'Notifications': {
        'Push Notifications': {
          priceAlerts: true,
          orderFills: true,
          marketNews: false,
          systemAlerts: true
        },
        'Email Alerts': {
          dailySummary: true,
          weeklyReport: true,
          portfolioChanges: true,
          riskWarnings: true
        },
        'SMS Notifications': {
          urgentAlerts: false,
          orderConfirmations: false,
          phoneNumber: '+1 (555) 987-6543'
        }
      },
      'Privacy & Security': {
        'Two-Factor Authentication': {
          smsEnabled: true,
          appEnabled: false,
          backupCodes: 3,
          phoneNumber: '+1 (555) 987-6543'
        },
        'Data Privacy': {
          shareAnalytics: false,
          shareWithPartners: false,
          dataDeletion: '2-years',
          cookiePreferences: 'essential'
        },
        'Session Management': {
          autoLogout: 30,
          maxSessions: 3,
          alertNewSessions: true,
          activeSessions: 2
        }
      }
    }

    return defaults[section]?.[item] || {}
  }

  const handleSave = () => {
    if (config) {
      config.onSave(formData)
      onClose()
    }
  }

  const renderFormFields = () => {
    if (!config) return null

    const { sectionTitle, itemLabel } = config

    switch (`${sectionTitle}:${itemLabel}`) {
      case 'Account Settings:Profile Information':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>
        )

      case 'Trading Preferences:Default Order Settings':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Order Type
              </label>
              <select
                value={formData.defaultOrderType || 'limit'}
                onChange={(e) => setFormData({...formData, defaultOrderType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="market">Market Order</option>
                <option value="limit">Limit Order</option>
                <option value="stop">Stop Order</option>
                <option value="stop-limit">Stop-Limit Order</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.defaultQuantity || 1}
                onChange={(e) => setFormData({...formData, defaultQuantity: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoConfirm"
                checked={formData.autoConfirm || false}
                onChange={(e) => setFormData({...formData, autoConfirm: e.target.checked})}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="autoConfirm" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Auto-confirm orders
              </label>
            </div>
          </div>
        )

      case 'Notifications:Push Notifications':
        return (
          <div className="space-y-4">
            {Object.entries({
              priceAlerts: 'Price Alerts',
              orderFills: 'Order Fills',
              marketNews: 'Market News',
              systemAlerts: 'System Alerts'
            }).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                <input
                  type="checkbox"
                  checked={formData[key] || false}
                  onChange={(e) => setFormData({...formData, [key]: e.target.checked})}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
            ))}
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Configuration Panel
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Settings for {itemLabel} are being configured.
            </p>
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This configuration panel will contain specific settings for: <br />
                <strong>{sectionTitle} &gt; {itemLabel}</strong>
              </p>
            </div>
          </div>
        )
    }
  }

  if (!isOpen || !config) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {config.itemLabel}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {config.sectionTitle} Settings
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {renderFormFields()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}