'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  User, 
  Settings, 
  LogOut, 
  CreditCard, 
  Gift,
  Crown,
  Clock,
  ChevronDown 
} from 'lucide-react'
import { Button } from './Button'
import { Badge } from './badge'

export default function UserMenu() {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (status === 'loading') {
    return (
      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
    )
  }

  if (!session?.user) {
    return (
      <div className="flex items-center space-x-2">
        <Link href="/auth/signin">
          <Button variant="outline" size="sm">
            Sign In
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            Start Trial
          </Button>
        </Link>
      </div>
    )
  }

  const handleSignOut = () => {
    signOut({ 
      callbackUrl: '/',
      redirect: true 
    })
  }

  const getSubscriptionBadge = () => {
    const tier = session.user.subscriptionTier
    if (tier === 'trial') {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          <Clock className="h-3 w-3 mr-1" />
          Trial
        </Badge>
      )
    }
    if (tier === 'premium') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      )
    }
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {session.user.name || 'User'}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {session.user.email}
            </span>
            {getSubscriptionBadge()}
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
            >
              {/* User Info Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {session.user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {session.user.email}
                    </p>
                    {getSubscriptionBadge()}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/subscription"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Subscription & Billing</span>
                </Link>

                <Link
                  href="/referral"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Gift className="h-4 w-4" />
                  <span>Referral Program</span>
                </Link>

                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                <Link
                  href="/settings"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}