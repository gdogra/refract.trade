'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  BarChart3, 
  Search, 
  BookOpen, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  Zap,
  TrendingUp,
  PieChart,
  Bell,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import SearchModal from '@/components/SearchModal'
import NotificationModal from '@/components/NotificationModal'
import { notificationService } from '@/lib/notificationService'

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home
  },
  {
    name: 'Options',
    href: '/options',
    icon: BarChart3
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: TrendingUp
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: PieChart
  },
  {
    name: 'Watchlist',
    href: '/watchlist',
    icon: Star
  },
  {
    name: 'Learn',
    href: '/learn',
    icon: BookOpen
  }
]

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  // Static navigation data - TODO: Add dynamic symbol search API
  const searchData = [
    { id: 'portfolio', type: 'page', title: 'Portfolio', subtitle: 'View your positions', href: '/portfolio' },
    { id: 'analytics', type: 'page', title: 'Analytics', subtitle: 'Advanced analysis tools', href: '/analytics' },
    { id: 'watchlist', type: 'page', title: 'Watchlist', subtitle: 'Your saved symbols', href: '/watchlist' },
    { id: 'learn', type: 'page', title: 'Learn', subtitle: 'Trading education', href: '/learn' },
    { id: 'settings', type: 'page', title: 'Settings', subtitle: 'Account settings', href: '/settings' }
  ]

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const upperQuery = searchQuery.toUpperCase()
    const filteredResults = searchData.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Add dynamic symbol search for any ticker not in our predefined list
    const isSymbolQuery = /^[A-Z]{1,5}$/i.test(searchQuery.trim())
    const symbolExists = filteredResults.some(item => 
      item.type === 'symbol' && item.title.toUpperCase() === upperQuery
    )

    if (isSymbolQuery && !symbolExists && searchQuery.trim().length >= 1) {
      filteredResults.unshift({
        id: `symbol-${upperQuery}`,
        type: 'symbol',
        title: upperQuery,
        subtitle: `Search options for ${upperQuery}`,
        href: `/options?symbol=${upperQuery}`
      })
    }

    setSearchResults(filteredResults.slice(0, 6))
    setSelectedSearchIndex(0)
    setShowSearchResults(true)
  }, [searchQuery])

  // Keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside to close search results
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.closest('.search-container')?.contains(e.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Subscribe to notification updates
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount())
    })
    
    // Set initial count
    setUnreadCount(notificationService.getUnreadCount())
    
    return unsubscribe
  }, [])

  // Search handlers
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSearchIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSearchIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSearchIndex < searchResults.length) {
          handleSearchSelect(searchResults[selectedSearchIndex])
        }
        break
      case 'Escape':
        setShowSearchResults(false)
        searchInputRef.current?.blur()
        break
    }
  }

  const handleSearchSelect = (result: any) => {
    router.push(result.href)
    setSearchQuery('')
    setShowSearchResults(false)
    searchInputRef.current?.blur()
  }

  // Don't show navigation on auth pages
  if (pathname?.startsWith('/auth')) {
    return null
  }

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Refract.trade
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                const IconComponent = item.icon
                
                return (
                  <Link key={item.name} href={item.href}>
                    <motion.div
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent className="h-4 w-4" />
                      <span>{item.name}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side - Search, Notifications, User Menu */}
          <div className="flex items-center space-x-4">
            {/* Search Input with Autocomplete */}
            <div className="relative hidden sm:block search-container">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search symbols, pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => searchQuery.trim() && setShowSearchResults(true)}
                  className="w-64 pl-10 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showSearchResults && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[100]"
                  >
                    {searchResults.map((result, index) => (
                      <motion.button
                        key={result.id}
                        onClick={() => handleSearchSelect(result)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                          index === selectedSearchIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          result.type === 'symbol' ? 'bg-green-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {result.title}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {result.subtitle}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Search Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="sm:hidden"
              onClick={() => setShowSearchModal(true)}
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative"
              onClick={() => setShowNotificationModal(true)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm">Account</span>
              </Button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
                  >
                    <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </div>
                    </Link>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </div>
                    </Link>
                    <hr className="my-1 border-gray-200 dark:border-gray-700" />
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4"
            >
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href
                  const IconComponent = item.icon
                  
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                      <div
                        className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium ${
                          isActive
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <SearchModal
            isOpen={showSearchModal}
            onClose={() => setShowSearchModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <NotificationModal
            isOpen={showNotificationModal}
            onClose={() => setShowNotificationModal(false)}
          />
        )}
      </AnimatePresence>
    </nav>
  )
}