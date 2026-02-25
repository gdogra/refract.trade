'use client'

import { useState } from 'react'
import { MessageSquare, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import FeedbackForm from './FeedbackForm'

interface FeedbackButtonProps {
  variant?: 'floating' | 'inline'
  category?: string
  subject?: string
  className?: string
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function FeedbackButton({ 
  variant = 'floating',
  category = '',
  subject = '',
  className = '',
  size = 'default'
}: FeedbackButtonProps) {
  const [isFormOpen, setIsFormOpen] = useState(false)

  if (variant === 'floating') {
    return (
      <>
        <div className={`fixed bottom-20 right-6 z-40 ${className}`}>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
            title="Send Feedback"
          >
            <MessageSquare className="h-6 w-6 group-hover:scale-110 transition-transform" />
          </Button>
        </div>
        
        <FeedbackForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialCategory={category}
          initialSubject={subject}
        />
      </>
    )
  }

  // Inline variant
  return (
    <>
      <Button
        onClick={() => setIsFormOpen(true)}
        variant="outline"
        size={size}
        className={`flex items-center space-x-2 ${className}`}
      >
        <HelpCircle className="h-4 w-4" />
        <span>Feedback</span>
      </Button>
      
      <FeedbackForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialCategory={category}
        initialSubject={subject}
      />
    </>
  )
}

// Quick feedback triggers for specific contexts
export function BugReportButton({ className = '' }: { className?: string }) {
  return (
    <FeedbackButton
      variant="inline"
      category="bug"
      subject="Bug Report"
      className={className}
    />
  )
}

export function FeatureRequestButton({ className = '' }: { className?: string }) {
  return (
    <FeedbackButton
      variant="inline"
      category="feature"
      subject="Feature Request"
      className={className}
    />
  )
}

export function ImprovementButton({ className = '' }: { className?: string }) {
  return (
    <FeedbackButton
      variant="inline"
      category="improvement"
      subject="Improvement Suggestion"
      className={className}
    />
  )
}