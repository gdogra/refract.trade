'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, BarChart3, BookOpen, Settings, Zap, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import AddPositionForm from '@/components/forms/AddPositionForm'

const actions = [
  {
    id: 'new-trade',
    title: 'New Trade',
    description: 'Open a new position',
    icon: Plus,
    color: 'bg-brand-500 hover:bg-brand-600',
    action: 'add-position'
  },
  {
    id: 'analyze',
    title: 'Analyze',
    description: 'Options chain analysis',
    icon: Search,
    color: 'bg-purple-500 hover:bg-purple-600',
    href: '/options'
  },
  {
    id: 'charts',
    title: 'Portfolio',
    description: 'View your positions',
    icon: TrendingUp,
    color: 'bg-blue-500 hover:bg-blue-600',
    href: '/portfolio'
  },
  {
    id: 'learn',
    title: 'Learn',
    description: 'Trading education',
    icon: BookOpen,
    color: 'bg-green-500 hover:bg-green-600',
    href: '/learn'
  },
  {
    id: 'ai-insights',
    title: 'AI Insights',
    description: 'Get recommendations',
    icon: Zap,
    color: 'bg-yellow-500 hover:bg-yellow-600',
    href: '/analytics'
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Account preferences',
    icon: Settings,
    color: 'bg-gray-500 hover:bg-gray-600',
    href: '/settings'
  }
]

export default function QuickActions() {
  const router = useRouter()
  const [showAddPosition, setShowAddPosition] = useState(false)

  const handleActionClick = (action: any) => {
    if (action.action === 'add-position') {
      setShowAddPosition(true)
    } else if (action.href) {
      router.push(action.href)
    }
  }

  return (
    <>
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Quick Actions
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const IconComponent = action.icon
          
          return (
            <motion.button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="group relative overflow-hidden rounded-lg p-4 text-left transition-all hover:shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 ${action.color} opacity-10 group-hover:opacity-15 transition-opacity`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${action.color} text-white mb-3`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                
                <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                  {action.title}
                </h4>
                
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {action.description}
                </p>
              </div>

              {/* Hover effect */}
              <motion.div 
                className="absolute inset-0 bg-white dark:bg-gray-700 opacity-0 group-hover:opacity-5"
                initial={false}
              />
            </motion.button>
          )
        })}
      </div>

    </motion.div>

      {/* Add Position Modal */}
      <AnimatePresence>
        {showAddPosition && (
          <AddPositionForm
            onClose={() => setShowAddPosition(false)}
            onSuccess={() => {
              setShowAddPosition(false)
              // The form will invalidate the positions query automatically
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}