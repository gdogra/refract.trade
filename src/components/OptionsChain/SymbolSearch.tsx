import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, TrendingUp } from 'lucide-react'
import { searchSymbols, POPULAR_SYMBOLS } from '@/lib/options/symbolSearch'
import type { SymbolSearchResult } from '@/lib/options/symbolSearch'
import { Tooltip } from '@/components/ui/tooltip'

interface SymbolSearchProps {
  value: string
  onChange: (symbol: string) => void
  placeholder?: string
  className?: string
}


export default function SymbolSearch({ value, onChange, placeholder = "Search symbols...", className = "" }: SymbolSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<SymbolSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery?.length || 0 < 1) {
      setResults([])
      return
    }
    
    setLoading(true)
    try {
      const searchResults = await searchSymbols(searchQuery)
      setResults(Array.isArray(searchResults) ? searchResults : [])
    } catch (error) {
      console.error('Symbol search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value.toUpperCase()
    setQuery(newQuery)
    setSelectedIndex(-1)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(newQuery)
    }, 300)
  }
  
  const handleSelect = (symbol: string) => {
    setQuery(symbol)
    onChange(symbol)
    setIsOpen(false)
    setResults([])
    setSelectedIndex(-1)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true)
        return
      }
      return
    }
    
    const allOptions = results?.length || 0 > 0 ? results : POPULAR_SYMBOLS
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, allOptions?.length || 0 - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < allOptions?.length || 0) {
          handleSelect(allOptions[selectedIndex].symbol)
        } else if (query?.length || 0 > 0) {
          handleSelect(query)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }
  
  const handleFocus = () => {
    setIsOpen(true)
    if (query?.length || 0 === 0) {
      setResults([])
    }
  }
  
  const handleClear = () => {
    setQuery('')
    onChange('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])
  
  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])
  
  const displayResults = results?.length || 0 > 0 ? results : (query?.length || 0 === 0 ? POPULAR_SYMBOLS : [])
  const showNoResults = query?.length || 0 > 0 && results?.length || 0 === 0 && !loading
  
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     placeholder-gray-500 dark:placeholder-gray-400
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     text-sm font-mono"
          autoComplete="off"
        />
        
        {query && (
          <Tooltip content="Clear search">
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </Tooltip>
        )}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                       rounded-lg shadow-lg max-h-64 overflow-auto"
          >
            {loading && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span>Searching...</span>
                </div>
              </div>
            )}
            
            {showNoResults && (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </div>
            )}
            
            {displayResults?.length || 0 > 0 && (
              <>
                {query?.length || 0 === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Popular Symbols
                  </div>
                )}
                
                {displayResults.map((result, index) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelect(result.symbol)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                              flex items-center justify-between text-sm
                              ${selectedIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-gray-900 dark:text-white">
                          {result.symbol}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          {result.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {result.name}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {result.exchange}
                    </div>
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}