'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, TrendingDown, X, Clock, Star, BookOpen, BarChart3 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  type: 'symbol' | 'course' | 'page'
  title: string
  subtitle?: string
  price?: number
  change?: number
  changePercent?: number
  href: string
  icon?: React.ComponentType<any>
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Static navigation data - TODO: Add dynamic symbol search API
  const searchData: SearchResult[] = [
    // Pages
    {
      id: 'portfolio',
      type: 'page',
      title: 'Portfolio',
      subtitle: 'View your positions and performance',
      href: '/portfolio',
      icon: BarChart3
    },
    {
      id: 'analytics',
      type: 'page',
      title: 'Analytics',
      subtitle: 'Market analysis and insights',
      href: '/analytics',
      icon: TrendingUp
    },
    {
      id: 'watchlist',
      type: 'page',
      title: 'Watchlist',
      subtitle: 'Track your favorite symbols',
      href: '/watchlist',
      icon: Star
    },
    // Courses
    {
      id: 'options-fundamentals',
      type: 'course',
      title: 'Options Trading Fundamentals',
      subtitle: 'Learn the basics of options trading',
      href: '/learn/courses/options-fundamentals',
      icon: BookOpen
    },
    {
      id: 'advanced-strategies',
      type: 'course',
      title: 'Advanced Options Strategies',
      subtitle: 'Master complex trading strategies',
      href: '/learn/courses/advanced-strategies',
      icon: BookOpen
    },
    {
      id: 'risk-management',
      type: 'course',
      title: 'Risk Management',
      subtitle: 'Essential risk management techniques',
      href: '/learn/courses/risk-management',
      icon: BookOpen
    },
    {
      id: 'technical-analysis',
      type: 'course',
      title: 'Technical Analysis',
      subtitle: 'Use charts and indicators effectively',
      href: '/learn/courses/technical-analysis',
      icon: BookOpen
    }
  ]

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const upperQuery = query.toUpperCase()
    const filteredResults = searchData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle?.toLowerCase().includes(query.toLowerCase())
    )

    // Add dynamic symbol search for any ticker not in our predefined list
    const isSymbolQuery = /^[A-Z]{1,5}$/i.test(query.trim())
    const symbolExists = filteredResults.some(item => 
      item.type === 'symbol' && item.title.toUpperCase() === upperQuery
    )

    if (isSymbolQuery && !symbolExists && query.trim().length >= 1) {
      // Add dynamic symbol result
      filteredResults.unshift({
        id: `symbol-${upperQuery}`,
        type: 'symbol',
        title: upperQuery,
        subtitle: `Search options for ${upperQuery}`,
        href: `/options?symbol=${upperQuery}`
      })
    }

    setResults(filteredResults.slice(0, 8))
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % results.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  const handleSelectResult = (result: SearchResult) => {
    router.push(result.href)
    onClose()
    setQuery('')
  }

  const formatPrice = (price: number) => `$${price.toFixed(2)}`
  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
  }

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'symbol') {
      // For dynamic symbols without price data, use search icon
      if (!result.change) return Search
      return result.change >= 0 ? TrendingUp : TrendingDown
    }
    return result.icon || Search
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white dark:bg-gray-800 rounded-xl mx-4 max-w-2xl w-full shadow-xl border border-gray-200 dark:border-gray-700 max-h-96"
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Search Input */}
        <div className="flex items-center border-b border-gray-200 dark:border-gray-700 p-4">
          <Search className="h-5 w-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search symbols, courses, or pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500"
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-1">Try searching for symbols like AAPL, courses, or pages</p>
            </div>
          )}

          {!query.trim() && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>Start typing to search</p>
              <p className="text-sm mt-1">Search for symbols, courses, or navigate to pages</p>
            </div>
          )}

          {results.map((result, index) => {
            const Icon = getResultIcon(result)
            const isSelected = index === selectedIndex

            return (
              <motion.button
                key={result.id}
                onClick={() => handleSelectResult(result)}
                className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  isSelected ? 'bg-brand-50 dark:bg-brand-900/20 border-r-2 border-brand-500' : ''
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                    result.type === 'symbol' 
                      ? result.change 
                        ? (result.change >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20')
                        : 'bg-gray-100 dark:bg-gray-700'
                      : result.type === 'course'
                      ? 'bg-blue-100 dark:bg-blue-900/20'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      result.type === 'symbol'
                        ? result.change
                          ? (result.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
                          : 'text-gray-600 dark:text-gray-400'
                        : result.type === 'course'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                {result.type === 'symbol' && result.price && (
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatPrice(result.price)}
                    </div>
                    <div className={`text-sm ${
                      result.change && result.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.change && result.changePercent && formatChange(result.change, result.changePercent)}
                    </div>
                  </div>
                )}

                {result.type !== 'symbol' && (
                  <div className="text-xs text-gray-400 uppercase tracking-wide">
                    {result.type}
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Use ↑↓ to navigate, ↵ to select, Esc to close</span>
              <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}