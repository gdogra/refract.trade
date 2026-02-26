'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Brain, TrendingUp, AlertCircle, Target, Lightbulb, ArrowRight } from 'lucide-react'

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'optimization' | 'education'
  title: string
  description: string
  confidence: number
  action?: string
  impact?: 'high' | 'medium' | 'low'
}

export default function AIInsights() {
  const { data: insights, isLoading } = useQuery<AIInsight[]>({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      // TODO: Connect to real AI service - for now return empty array
      return []
    },
    enabled: false // Disable query until AI service is implemented
  })

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return TrendingUp
      case 'warning':
        return AlertCircle
      case 'optimization':
        return Target
      case 'education':
        return Lightbulb
      default:
        return Brain
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'warning':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'optimization':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'education':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <motion.div 
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-brand-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Insights
          </h3>
        </div>
        <motion.button 
          className="text-brand-500 hover:text-brand-600 text-sm font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View All
        </motion.button>
      </div>

      <div className="space-y-4">
        {(!insights || insights?.length || 0 === 0) ? (
          <div className="text-center text-blue-600 dark:text-blue-400 py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-70" />
            <p className="font-medium mb-2">AI Insights Coming Soon</p>
            <p className="text-sm">Advanced ML-powered trading intelligence in development</p>
          </div>
        ) : (
          (insights || []).slice(0, 3).map((insight, index) => {
          const IconComponent = getInsightIcon(insight.type)
          
          return (
            <motion.div
              key={insight.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${getInsightColor(insight.type)}`}>
                  <IconComponent className="h-4 w-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {insight.title}
                    </h4>
                    <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                      {insight.confidence}% confidence
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {insight.description}
                  </p>
                  
                  {insight.action && (
                    <motion.button 
                      className="flex items-center space-x-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
                      whileHover={{ x: 2 }}
                    >
                      <span>{insight.action}</span>
                      <ArrowRight className="h-3 w-3" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Confidence</span>
                  <span className={getConfidenceColor(insight.confidence)}>
                    {insight.confidence}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <motion.div 
                    className={`h-1 rounded-full ${
                      insight.confidence >= 80 ? 'bg-green-500' :
                      insight.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.confidence}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </div>
            </motion.div>
          )
        })
        )}
      </div>

      {/* AI Status */}
      <motion.div 
        className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              AI Features In Development
            </span>
          </div>
          <span className="text-xs text-blue-600 dark:text-blue-400">
            Coming Soon
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}