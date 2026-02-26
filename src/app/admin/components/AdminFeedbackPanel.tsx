'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User, 
  Calendar,
  Filter,
  Search,
  Send,
  Star,
  Eye,
  Edit,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface FeedbackItem {
  id: string
  category: string
  subject: string
  message: string
  priority: string
  status: string
  email: string
  name: string
  createdAt: string
  updatedAt: string
  adminResponse?: string
  respondedAt?: string
  satisfactionRating?: number
  user?: {
    id: string
    name: string
    email: string
  }
}

export default function AdminFeedbackPanel() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null)
  const [response, setResponse] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadFeedback()
  }, [])

  useEffect(() => {
    filterFeedback()
  }, [feedback, filter, searchTerm])

  const loadFeedback = async () => {
    try {
      const response = await fetch('/api/admin/feedback')
      if (response.ok) {
        const data = await response.json()
        setFeedback(data.data)
      }
    } catch (error) {
      console.error('Failed to load feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterFeedback = () => {
    let filtered = feedback

    if (filter !== 'all') {
      filtered = filtered.filter(item => item.status === filter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(item =>
        item.subject.toLowerCase().includes(term) ||
        item.message.toLowerCase().includes(term) ||
        item.email.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term)
      )
    }

    setFilteredFeedback(filtered)
  }

  const handleStatusUpdate = async (feedbackId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: feedbackId, status: newStatus })
      })

      if (response.ok) {
        setFeedback(prev => prev.map(item =>
          item.id === feedbackId ? { ...item, status: newStatus } : item
        ))
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleRespond = async () => {
    if (!selectedFeedback || !response.trim()) return

    setIsResponding(true)
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedFeedback.id,
          adminResponse: response,
          status: 'resolved'
        })
      })

      if (res.ok) {
        setFeedback(prev => prev.map(item =>
          item.id === selectedFeedback.id
            ? { 
                ...item, 
                adminResponse: response, 
                status: 'resolved',
                respondedAt: new Date().toISOString()
              }
            : item
        ))
        setResponse('')
        setSelectedFeedback(null)
      }
    } catch (error) {
      console.error('Failed to send response:', error)
    } finally {
      setIsResponding(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bug': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'feature': return <Star className="h-4 w-4 text-blue-500" />
      case 'improvement': return <Edit className="h-4 w-4 text-purple-500" />
      case 'complaint': return <X className="h-4 w-4 text-orange-500" />
      case 'praise': return <CheckCircle className="h-4 w-4 text-green-500" />
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50 border-red-200'
      case 'in_progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200'
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
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
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="open">Open</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Items */}
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedFeedback?.id === item.id ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedFeedback(item)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(item.category)}
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.category.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                {item.subject}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {item.message}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <User className="h-3 w-3" />
                  <span>{item.name} ({item.email})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredFeedback?.length || 0 === 0 && (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No feedback found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No feedback matches your current filters
              </p>
            </div>
          )}
        </div>

        {/* Feedback Detail */}
        <div className="lg:sticky lg:top-4">
          {selectedFeedback ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getCategoryIcon(selectedFeedback.category)}
                      <span>{selectedFeedback.subject}</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className={getPriorityColor(selectedFeedback.priority)}>
                        {selectedFeedback.priority} priority
                      </Badge>
                      <Badge className={getStatusColor(selectedFeedback.status)}>
                        {selectedFeedback.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFeedback(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* User Info */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    From: {selectedFeedback.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {selectedFeedback.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Submitted: {formatDate(selectedFeedback.createdAt)}
                  </p>
                </div>

                {/* Message */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Message</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedFeedback.message}
                  </p>
                </div>

                {/* Status Actions */}
                {selectedFeedback.status === 'open' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(selectedFeedback.id, 'in_progress')}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Mark In Progress
                    </Button>
                  </div>
                )}

                {/* Previous Response */}
                {selectedFeedback.adminResponse && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Admin Response
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap mb-2">
                      {selectedFeedback.adminResponse}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Responded: {selectedFeedback.respondedAt ? formatDate(selectedFeedback.respondedAt) : 'Unknown'}
                    </p>
                  </div>
                )}

                {/* Response Form */}
                {selectedFeedback.status !== 'resolved' && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Send Response
                    </h4>
                    <textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your response to the user..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setResponse('')}
                        disabled={isResponding}
                      >
                        Clear
                      </Button>
                      <Button
                        onClick={handleRespond}
                        disabled={!response.trim() || isResponding}
                        className="flex items-center space-x-2"
                      >
                        {isResponding ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span>Send & Mark Resolved</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* Satisfaction Rating */}
                {selectedFeedback.satisfactionRating && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 dark:text-green-300 mb-2">
                      User Satisfaction
                    </h4>
                    <div className="flex items-center space-x-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < selectedFeedback.satisfactionRating!
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-green-800 dark:text-green-200">
                        {selectedFeedback.satisfactionRating}/5
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select Feedback
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose a feedback item to view details and respond
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}