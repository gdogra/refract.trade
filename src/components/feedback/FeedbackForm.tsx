'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { 
  MessageSquare, 
  X, 
  Send, 
  Bug, 
  Lightbulb, 
  AlertTriangle, 
  Heart, 
  Settings,
  Camera,
  Upload,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'

interface FeedbackFormProps {
  isOpen: boolean
  onClose: () => void
  initialCategory?: string
  initialSubject?: string
}

const FEEDBACK_CATEGORIES = [
  { id: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500 bg-red-50 border-red-200', description: 'Something is broken or not working' },
  { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-blue-500 bg-blue-50 border-blue-200', description: 'Suggest a new feature or improvement' },
  { id: 'improvement', label: 'Improvement', icon: Settings, color: 'text-purple-500 bg-purple-50 border-purple-200', description: 'Suggest how to make something better' },
  { id: 'complaint', label: 'Issue/Complaint', icon: AlertTriangle, color: 'text-orange-500 bg-orange-50 border-orange-200', description: 'Something is frustrating or problematic' },
  { id: 'praise', label: 'Praise/Compliment', icon: Heart, color: 'text-green-500 bg-green-50 border-green-200', description: 'Share positive feedback' }
]

export default function FeedbackForm({ 
  isOpen, 
  onClose, 
  initialCategory = '', 
  initialSubject = '' 
}: FeedbackFormProps) {
  const { data: session } = useSession()
  const [step, setStep] = useState<'category' | 'details' | 'submitted'>('category')
  const [formData, setFormData] = useState({
    category: initialCategory,
    subject: initialSubject,
    message: '',
    email: session?.user?.email || '',
    name: session?.user?.name || '',
    priority: 'medium',
    screenshot: null as File | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCategorySelect = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category: categoryId }))
    setStep('details')
  }

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, screenshot: file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.category || !formData.subject.trim() || !formData.message.trim()) {
      setSubmitError('Please fill in all required fields')
      return
    }
    
    setIsSubmitting(true)
    setSubmitError('')
    
    try {
      // Gather system info
      const systemInfo = {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString()
      }
      
      // Create FormData for file upload
      const submitData = new FormData()
      submitData.append('category', formData.category)
      submitData.append('subject', formData.subject)
      submitData.append('message', formData.message)
      submitData.append('email', formData.email)
      submitData.append('name', formData.name)
      submitData.append('priority', formData.priority)
      submitData.append('systemInfo', JSON.stringify(systemInfo))
      
      if (formData.screenshot) {
        submitData.append('screenshot', formData.screenshot)
      }
      
      const response = await fetch('/api/feedback-simple', {
        method: 'POST',
        body: submitData
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }
      
      setStep('submitted')
    } catch (error) {
      setSubmitError('Failed to submit feedback. Please try again.')
      console.error('Feedback submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategory = FEEDBACK_CATEGORIES.find(cat => cat.id === formData.category)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="h-full">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Send Feedback</span>
                </CardTitle>
                <button
                  onClick={onClose}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {selectedCategory && step !== 'submitted' && (
                <div className="flex items-center space-x-2 mt-2">
                  <selectedCategory.icon className="h-4 w-4" />
                  <span className="text-sm">{selectedCategory.label}</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto">
              {step === 'category' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      How can we help you?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Select the type of feedback you'd like to share
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {FEEDBACK_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-105 ${category.color} hover:shadow-md`}
                      >
                        <div className="flex items-start space-x-3">
                          <category.icon className="h-6 w-6 mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-medium">{category.label}</h4>
                            <p className="text-sm opacity-80">{category.description}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'details' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Contact Info for non-logged in users */}
                    {!session?.user && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Your Name
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of your feedback"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                        required
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Details
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Please provide as much detail as possible..."
                        rows={5}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                        required
                      />
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700"
                      >
                        <option value="low">Low - When you have time</option>
                        <option value="medium">Medium - Normal priority</option>
                        <option value="high">High - Important issue</option>
                        <option value="critical">Critical - Urgent problem</option>
                      </select>
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Screenshot (Optional)
                      </label>
                      <div className="flex items-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center space-x-2"
                        >
                          <Camera className="h-4 w-4" />
                          <span>Add Screenshot</span>
                        </Button>
                        {formData.screenshot && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Upload className="h-3 w-3 mr-1" />
                            Image attached
                          </Badge>
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshot}
                        className="hidden"
                      />
                    </div>

                    {/* Error Message */}
                    {submitError && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                        {submitError}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep('category')}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center space-x-2"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 'submitted' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Thank you for your feedback!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    We've received your {selectedCategory?.label.toLowerCase()} and will review it soon. 
                    {session?.user ? ' You\'ll be notified when we respond.' : ' We\'ll email you when we have an update.'}
                  </p>
                  <Button onClick={onClose}>
                    Close
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}