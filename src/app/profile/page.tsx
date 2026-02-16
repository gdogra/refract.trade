'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/contexts/UserContext'
import { motion } from 'framer-motion'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Bell, 
  CreditCard, 
  Download,
  Edit2,
  Check,
  X,
  Camera,
  Activity,
  TrendingUp,
  DollarSign,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default function Profile() {
  const { user, setUser, isLoggedIn } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || 'John',
    lastName: user?.lastName || 'Doe',
    email: user?.email || 'john.doe@example.com',
    phone: user?.phone || '+1 (555) 123-4567',
    location: user?.location || 'New York, NY',
    joinDate: user?.joinDate || '2023-01-15',
    accountType: user?.accountType || 'Pro',
    tradingExperience: 'Advanced',
    bio: 'Experienced options trader with a focus on volatility strategies and risk management.'
  })

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        location: user.location,
        joinDate: user.joinDate,
        accountType: user.accountType,
        tradingExperience: 'Advanced',
        bio: 'Experienced options trader with a focus on volatility strategies and risk management.'
      })
    }
  }, [user])

  const [editedData, setEditedData] = useState(profileData)
  const [activeTab, setActiveTab] = useState<'personal' | 'trading' | 'security' | 'preferences'>('personal')

  const handleSave = () => {
    setProfileData(editedData)
    
    // Update user context
    if (user) {
      const updatedUser = {
        ...user,
        firstName: editedData.firstName,
        lastName: editedData.lastName,
        email: editedData.email,
        phone: editedData.phone,
        location: editedData.location,
        accountType: editedData.accountType as 'Basic' | 'Pro' | 'Premium'
      }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
    }
    
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedData(profileData)
    setIsEditing(false)
  }

  const tradingStats = {
    totalTrades: 142,
    winRate: 68.5,
    totalReturn: 23.7,
    avgHoldTime: '3.2 days',
    favoriteStrategy: 'Iron Condor',
    riskScore: 7.2
  }

  const accountSettings = {
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: false,
    marketDataNotifications: true,
    orderConfirmations: true,
    priceAlerts: true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-r from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                      {profileData.firstName[0]}{profileData.lastName[0]}
                    </div>
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-800 rounded-full border-2 border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-brand-600">
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {profileData.accountType} Account
                  </p>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Member since {new Date(profileData.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{profileData.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{profileData.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{profileData.location}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant={isEditing ? "ghost" : "default"}
                    size="sm"
                    className="w-full"
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Trading Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{tradingStats.totalTrades}</div>
                    <div className="text-xs text-gray-500">Total Trades</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{tradingStats.winRate}%</div>
                    <div className="text-xs text-gray-500">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">+{tradingStats.totalReturn}%</div>
                    <div className="text-xs text-gray-500">Total Return</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{tradingStats.riskScore}</div>
                    <div className="text-xs text-gray-500">Risk Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  {[
                    { id: 'personal', label: 'Personal Info', icon: User },
                    { id: 'trading', label: 'Trading', icon: TrendingUp },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'preferences', label: 'Preferences', icon: Bell }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === id
                          ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'personal' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Personal Information</CardTitle>
                    {!isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          First Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedData.firstName}
                            onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-gray-900 dark:text-white">{profileData.firstName}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Last Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editedData.lastName}
                            onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-gray-900 dark:text-white">{profileData.lastName}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email
                        </label>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editedData.email}
                            onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-gray-900 dark:text-white">{profileData.email}</div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone
                        </label>
                        {isEditing ? (
                          <input
                            type="tel"
                            value={editedData.phone}
                            onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-gray-900 dark:text-white">{profileData.phone}</div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Bio
                        </label>
                        {isEditing ? (
                          <textarea
                            value={editedData.bio}
                            onChange={(e) => setEditedData({ ...editedData, bio: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        ) : (
                          <div className="text-gray-900 dark:text-white">{profileData.bio}</div>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex space-x-3 mt-6">
                        <Button onClick={handleSave}>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button variant="ghost" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === 'trading' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Trading Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-600">{tradingStats.totalTrades}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Trades</div>
                        </div>
                        
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-600">{tradingStats.winRate}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Win Rate</div>
                        </div>
                        
                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-600">+{tradingStats.totalReturn}%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total Return</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Trading Preferences</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300">Experience Level</span>
                          <span className="text-gray-900 dark:text-white font-medium">{profileData.tradingExperience}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300">Favorite Strategy</span>
                          <span className="text-gray-900 dark:text-white font-medium">{tradingStats.favoriteStrategy}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300">Average Hold Time</span>
                          <span className="text-gray-900 dark:text-white font-medium">{tradingStats.avgHoldTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300">Risk Score</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-900 dark:text-white font-medium">{tradingStats.riskScore}/10</span>
                            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                              <div 
                                className="h-2 bg-gradient-to-r from-green-500 to-red-500 rounded-full"
                                style={{ width: `${tradingStats.riskScore * 10}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Security Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Password</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Last changed 30 days ago</p>
                        </div>
                        <Button variant="ghost" size="sm">Change Password</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                        </div>
                        <Button variant="ghost" size="sm">Enable 2FA</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">Login History</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">View recent login activity</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === 'preferences' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5" />
                      <span>Notification Preferences</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(accountSettings).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-700 dark:text-gray-300 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              className="sr-only peer"
                              onChange={() => {}}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}