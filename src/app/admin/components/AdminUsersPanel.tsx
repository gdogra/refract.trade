'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  CreditCard, 
  Shield, 
  Mail,
  Calendar,
  DollarSign,
  AlertTriangle,
  Check,
  X,
  Plus,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface User {
  id: string
  email: string
  name: string
  image?: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
  _count: {
    feedback: number
    notes: number
  }
}

interface RefundData {
  amount: number
  reason: string
  method: string
}

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'admin' | 'active' | 'inactive'>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showRefundForm, setShowRefundForm] = useState(false)
  const [refundData, setRefundData] = useState<RefundData>({
    amount: 0,
    reason: '',
    method: 'stripe'
  })
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, filter, searchTerm])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.data.users)
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (filter !== 'all') {
      switch (filter) {
        case 'admin':
          filtered = filtered.filter(user => user.isAdmin)
          break
        case 'active':
          filtered = filtered.filter(user => {
            const lastActive = new Date(user.updatedAt)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            return lastActive > thirtyDaysAgo
          })
          break
        case 'inactive':
          filtered = filtered.filter(user => {
            const lastActive = new Date(user.updatedAt)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            return lastActive <= thirtyDaysAgo
          })
          break
      }
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      )
    }

    setFilteredUsers(filtered)
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>, note?: string) => {
    try {
      setIsProcessing(true)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...updates, note })
      })

      if (response.ok) {
        const result = await response.json()
        setUsers(prev => prev.map(user =>
          user.id === userId ? { ...user, ...updates } : user
        ))
        setEditingUser(null)
      }
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(prev => prev.filter(user => user.id !== userId))
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Failed to delete user:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRefund = async () => {
    if (!selectedUser || !refundData.amount || !refundData.reason) {
      return
    }

    try {
      setIsProcessing(true)
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: refundData.amount,
          reason: refundData.reason,
          method: refundData.method
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Refund processed successfully! Refund ID: ${result.data.refundId}`)
        setShowRefundForm(false)
        setRefundData({ amount: 0, reason: '', method: 'stripe' })
        // Refresh user data
        loadUsers()
      }
    } catch (error) {
      console.error('Failed to process refund:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getActivityStatus = (updatedAt: string) => {
    const lastActive = new Date(updatedAt)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return lastActive > thirtyDaysAgo ? 'active' : 'inactive'
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
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
                <TabsList>
                  <TabsTrigger value="all">All Users</TabsTrigger>
                  <TabsTrigger value="admin">Admins</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Users ({filteredUsers.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    selectedUser?.id === user.id ? 'ring-2 ring-purple-500' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user.name?.charAt(0) || user.email.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {user.name || 'Unnamed User'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.isAdmin && (
                        <Badge className="text-red-600 bg-red-50 border-red-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      <Badge className={getActivityStatus(user.updatedAt) === 'active' 
                        ? 'text-green-600 bg-green-50 border-green-200'
                        : 'text-gray-600 bg-gray-50 border-gray-200'
                      }>
                        {getActivityStatus(user.updatedAt)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Joined {formatDate(user.createdAt)}</span>
                    <div className="flex items-center space-x-3">
                      <span>{user._count.feedback} feedback</span>
                      <span>{user._count.notes} notes</span>
                    </div>
                  </div>
                </motion.div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No users found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    No users match your current filters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Detail */}
        <div className="lg:sticky lg:top-4">
          {selectedUser ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0)}
                      </div>
                      <div>
                        <span>{selectedUser.name || 'Unnamed User'}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-normal">
                          {selectedUser.email}
                        </p>
                      </div>
                    </CardTitle>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(selectedUser)}
                      disabled={isProcessing}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      disabled={isProcessing || selectedUser.isAdmin}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* User Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {selectedUser.isAdmin && (
                        <Badge className="text-red-600 bg-red-50 border-red-200">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      <Badge className={getActivityStatus(selectedUser.updatedAt) === 'active' 
                        ? 'text-green-600 bg-green-50 border-green-200'
                        : 'text-gray-600 bg-gray-50 border-gray-200'
                      }>
                        {getActivityStatus(selectedUser.updatedAt)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Member since {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last seen: {formatDate(selectedUser.updatedAt)}
                    </p>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedUser._count.feedback}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Feedback Items
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedUser._count.notes}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Admin Notes
                    </div>
                  </div>
                </div>

                {/* Admin Controls */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Admin Controls</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={selectedUser.isAdmin ? "default" : "outline"}
                      onClick={() => handleUpdateUser(selectedUser.id, { isAdmin: !selectedUser.isAdmin }, 
                        selectedUser.isAdmin ? 'Admin privileges removed' : 'Admin privileges granted')}
                      disabled={isProcessing}
                      className="flex items-center justify-center space-x-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span>{selectedUser.isAdmin ? 'Remove Admin' : 'Make Admin'}</span>
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Quick Actions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRefundForm(true)}
                      disabled={isProcessing}
                      className="flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Issue Refund</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => window.open(`mailto:${selectedUser.email}`)}
                      className="flex items-center justify-center space-x-2"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Send Email</span>
                    </Button>
                  </div>
                </div>

                {/* Refund Form */}
                {showRefundForm && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Issue Refund
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={refundData.amount}
                          onChange={(e) => setRefundData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Reason
                        </label>
                        <textarea
                          value={refundData.reason}
                          onChange={(e) => setRefundData(prev => ({ ...prev, reason: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                          rows={3}
                          placeholder="Reason for refund..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Method
                        </label>
                        <select
                          value={refundData.method}
                          onChange={(e) => setRefundData(prev => ({ ...prev, method: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                        >
                          <option value="stripe">Stripe (Original Payment)</option>
                          <option value="manual">Manual Process</option>
                          <option value="credit">Account Credit</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowRefundForm(false)}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRefund}
                          disabled={!refundData.amount || !refundData.reason || isProcessing}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Issue Refund
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select User
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a user to view details and manage their account
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}