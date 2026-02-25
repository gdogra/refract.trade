'use client'

import React, { useState, useRef, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

// Provider for compound tooltip components
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// Context for tooltip state
const TooltipContext = createContext<{
  isVisible: boolean
  setIsVisible: (visible: boolean) => void
  content?: React.ReactNode
  setContent: (content: React.ReactNode) => void
}>({
  isVisible: false,
  setIsVisible: () => {},
  setContent: () => {}
})

// Root tooltip component for compound pattern
export function TooltipRoot({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)
  const [content, setContent] = useState<React.ReactNode>(null)

  return (
    <TooltipContext.Provider value={{ isVisible, setIsVisible, content, setContent }}>
      <div className="relative inline-block">
        {children}
        <AnimatePresence>
          {isVisible && content && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 max-w-xs bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2"
            >
              {content}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-700 border border-gray-700 dark:border-gray-600 transform rotate-45 border-t-0 border-l-0" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipContext.Provider>
  )
}

// Trigger component
export function TooltipTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  const { setIsVisible } = useContext(TooltipContext)
  
  return (
    <div
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
    </div>
  )
}

// Content component
export function TooltipContent({ children, side, align }: { 
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}) {
  const { setContent } = useContext(TooltipContext)
  
  useEffect(() => {
    setContent(children)
    return () => setContent(null)
  }, [children, setContent])
  
  return null
}

export function Tooltip({ 
  children, 
  content, 
  position = 'top', 
  delay = 300,
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = (event: React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      
      let x = rect.left + rect.width / 2
      let y = rect.top
      
      switch (position) {
        case 'top':
          y = rect.top - 8
          break
        case 'bottom':
          y = rect.bottom + 8
          break
        case 'left':
          x = rect.left - 8
          y = rect.top + rect.height / 2
          break
        case 'right':
          x = rect.right + 8
          y = rect.top + rect.height / 2
          break
      }
      
      setCoords({ x, y })
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const getTooltipPosition = () => {
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%) translateY(-8px)' }
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%) translateY(8px)' }
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%) translateX(-8px)' }
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%) translateX(8px)' }
    }
  }

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg border border-gray-700 dark:border-gray-600 max-w-xs"
            style={getTooltipPosition()}
          >
            {content}
            <div 
              className={`absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 border border-gray-700 dark:border-gray-600 transform rotate-45 ${
                position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-t-0 border-l-0' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-b-0 border-r-0' :
                position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2 border-l-0 border-b-0' :
                'right-full top-1/2 -translate-y-1/2 translate-x-1/2 border-r-0 border-t-0'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}