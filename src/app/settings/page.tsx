'use client'

import { motion } from 'framer-motion'
import { Settings, User, Bell, Shield, Palette, Globe, LogOut } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const settingsSections = [
    {
      title: 'Account Settings',
      icon: User,
      items: [
        { label: 'Profile Information', description: 'Update your personal details' },
        { label: 'Password & Security', description: 'Change password and security settings' },
        { label: 'Email Preferences', description: 'Manage email notifications' }
      ]
    },
    {
      title: 'Trading Preferences',
      icon: Settings,
      items: [
        { label: 'Default Order Settings', description: 'Set default order types and sizes' },
        { label: 'Risk Management', description: 'Configure risk limits and alerts' },
        { label: 'Trading Hours', description: 'Set active trading hours' }
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Push Notifications', description: 'Mobile and desktop notifications' },
        { label: 'Email Alerts', description: 'Market and portfolio alerts' },
        { label: 'SMS Notifications', description: 'Text message alerts' }
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { label: 'Two-Factor Authentication', description: 'Enhanced account security' },
        { label: 'Data Privacy', description: 'Control your data sharing preferences' },
        { label: 'Session Management', description: 'Manage active sessions' }
      ]
    },
    {
      title: 'Appearance',
      icon: Palette,
      items: [
        { label: 'Theme', description: 'Dark mode, light mode, or system' },
        { label: 'Dashboard Layout', description: 'Customize your dashboard' },
        { label: 'Chart Settings', description: 'Default chart preferences' }
      ]
    },
    {
      title: 'Regional',
      icon: Globe,
      items: [
        { label: 'Language', description: 'Select your preferred language' },
        { label: 'Time Zone', description: 'Set your local time zone' },
        { label: 'Currency Display', description: 'Default currency format' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Customize your trading experience and account preferences
          </p>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settingsSections.map((section, sectionIndex) => {
            const IconComponent = section.icon
            
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + sectionIndex * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <IconComponent className="h-5 w-5 text-blue-500" />
                      <span>{section.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <motion.div
                          key={item.label}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.2 + sectionIndex * 0.1 + itemIndex * 0.05 }}
                        >
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {item.label}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {item.description}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            Configure
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Account Actions */}
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Account Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <h4 className="font-medium text-red-600 text-sm">Export Data</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Download all your trading data and account history
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div>
                    <h4 className="font-medium text-red-600 text-sm">Close Account</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Permanently close your Refract.trade account
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-600">
                    Close Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Support */}
        <motion.div 
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            <Settings className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              Need help? Contact our support team
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}