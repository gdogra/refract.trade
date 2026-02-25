'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, HelpCircle, AlertCircle, TrendingUp, Calculator, Brain, Zap, Shield } from 'lucide-react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

interface TooltipConfig {
  content: string
  type?: 'info' | 'warning' | 'help' | 'feature' | 'calculation'
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  maxWidth?: number
  showIcon?: boolean
  interactive?: boolean
  examples?: string[]
  relatedFeatures?: Array<{
    name: string
    action: () => void
  }>
}

interface AdvancedTooltipProps {
  children: React.ReactNode
  config: TooltipConfig
  className?: string
}

// Trading-specific tooltip content database
export const TRADING_TOOLTIPS = {
  // Greeks
  delta: {
    content: "Delta measures how much an option's price changes for every $1 move in the underlying stock.",
    type: 'calculation' as const,
    examples: [
      "Delta of 0.5 means option price moves $0.50 for every $1 stock move",
      "Call deltas are positive (0 to 1), put deltas are negative (-1 to 0)",
      "At-the-money options have ~0.5 delta"
    ],
    relatedFeatures: [
      { name: "Greeks Calculator", action: () => console.log('open calculator') },
      { name: "Position Greeks", action: () => console.log('view positions') }
    ]
  },
  
  gamma: {
    content: "Gamma measures how much delta changes as the stock price moves. Higher gamma means delta changes faster.",
    type: 'calculation' as const,
    examples: [
      "High gamma near expiration creates rapid P&L swings",
      "At-the-money options have highest gamma",
      "Gamma is highest for short-term options"
    ]
  },
  
  theta: {
    content: "Theta measures time decay - how much option value decreases each day, all else being equal.",
    type: 'warning' as const,
    examples: [
      "Theta is always negative for long options",
      "Accelerates as expiration approaches",
      "Weekend theta decay affects Friday closes"
    ]
  },
  
  vega: {
    content: "Vega measures sensitivity to volatility changes. High vega means big price swings when IV moves.",
    type: 'calculation' as const,
    examples: [
      "Long options have positive vega",
      "Longer-term options have higher vega",
      "Vega decreases as expiration approaches"
    ]
  },
  
  // Risk Management
  impliedVolatility: {
    content: "IV represents the market's expectation of future volatility. High IV = expensive options.",
    type: 'feature' as const,
    examples: [
      "IV Rank shows where current IV sits vs. historical range",
      "Buy low IV, sell high IV is a common strategy",
      "Earnings typically spike IV, then it collapses"
    ]
  },
  
  riskWeatherMap: {
    content: "Our AI-powered risk visualization shows portfolio health at a glance using weather metaphors.",
    type: 'feature' as const,
    examples: [
      "☀️ Sunny = Low risk, stable positions",
      "⛅ Cloudy = Moderate risk, watch closely", 
      "🌧️ Stormy = High risk, consider adjustments"
    ]
  },
  
  // Platform Features
  portfolioGuardian: {
    content: "AI system that monitors your portfolio 24/7 and suggests protective actions before losses occur.",
    type: 'feature' as const,
    examples: [
      "Detects correlation spikes across positions",
      "Alerts when single positions become too large",
      "Suggests hedges during market stress"
    ]
  },
  
  optionsFlow: {
    content: "Track institutional option trades and unusual activity to follow smart money.",
    type: 'info' as const,
    examples: [
      "Large block trades often signal institutional moves",
      "Unusual call/put ratios indicate sentiment shifts",
      "Dark pool activity reveals hidden institutional flow"
    ]
  },
  
  // Strategies
  ironCondor: {
    content: "Neutral strategy that profits from low volatility. Sell OTM call & put spreads.",
    type: 'help' as const,
    examples: [
      "Max profit = net credit received",
      "Max loss = strike width - net credit",
      "Best in high IV environments"
    ]
  },
  
  coveredCall: {
    content: "Income strategy: own 100 shares + sell call option to generate premium.",
    type: 'help' as const,
    examples: [
      "Reduces cost basis of shares",
      "Caps upside potential",
      "Best for sideways/slightly bullish outlook"
    ]
  }
}

const getTooltipIcon = (type: TooltipConfig['type']) => {
  switch (type) {
    case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case 'help': return <HelpCircle className="h-4 w-4 text-blue-500" />
    case 'feature': return <Zap className="h-4 w-4 text-purple-500" />
    case 'calculation': return <Calculator className="h-4 w-4 text-green-500" />
    default: return <Info className="h-4 w-4 text-gray-500" />
  }
}

export function AdvancedTooltip({ children, config, className = '' }: AdvancedTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  
  return (
    <RadixTooltip.Provider delayDuration={config.delay || 300}>
      <RadixTooltip.Root open={isOpen} onOpenChange={setIsOpen}>
        <RadixTooltip.Trigger asChild>
          <div 
            ref={triggerRef}
            className={`inline-flex items-center cursor-help ${className}`}
          >
            {children}
            {config.showIcon !== false && (
              <span className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
                {getTooltipIcon(config.type)}
              </span>
            )}
          </div>
        </RadixTooltip.Trigger>
        
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="z-50"
            side={config.position || 'top'}
            sideOffset={8}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className={`
                bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700
                p-4 max-w-sm text-sm leading-relaxed
              `}
              style={{ maxWidth: config.maxWidth || 320 }}
            >
              {/* Header with icon and type */}
              <div className="flex items-start space-x-2 mb-2">
                {getTooltipIcon(config.type)}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white mb-1">
                    {config.content}
                  </div>
                </div>
              </div>
              
              {/* Examples */}
              {config.examples && config.examples.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Examples:
                  </div>
                  <ul className="space-y-1">
                    {config.examples.map((example, index) => (
                      <li key={index} className="text-xs text-gray-600 dark:text-gray-300 flex">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Related Features */}
              {config.relatedFeatures && config.relatedFeatures.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Related:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {config.relatedFeatures.map((feature, index) => (
                      <button
                        key={index}
                        onClick={feature.action}
                        className="text-xs px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                      >
                        {feature.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <RadixTooltip.Arrow className="fill-white dark:fill-gray-800" />
            </motion.div>
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

// Quick tooltip for simple cases
interface QuickTooltipProps {
  content: string
  children: React.ReactNode
  type?: 'info' | 'warning' | 'help'
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function QuickTooltip({ content, children, type = 'info', position = 'top' }: QuickTooltipProps) {
  return (
    <AdvancedTooltip
      config={{
        content,
        type,
        position,
        showIcon: false
      }}
    >
      {children}
    </AdvancedTooltip>
  )
}

// Smart tooltip that automatically selects content based on context
interface SmartTooltipProps {
  id: keyof typeof TRADING_TOOLTIPS
  children: React.ReactNode
  className?: string
}

export function SmartTooltip({ id, children, className }: SmartTooltipProps) {
  const config = TRADING_TOOLTIPS[id]
  
  if (!config) {
    return <>{children}</>
  }
  
  return (
    <AdvancedTooltip config={config} className={className}>
      {children}
    </AdvancedTooltip>
  )
}

// Contextual help overlay for complex features
interface ContextualHelpProps {
  isOpen: boolean
  onClose: () => void
  helpPoints: Array<{
    id: string
    element: string // CSS selector
    title: string
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right'
  }>
}

export function ContextualHelp({ isOpen, onClose, helpPoints }: ContextualHelpProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [elementPositions, setElementPositions] = useState<Record<string, DOMRect>>({})
  
  useEffect(() => {
    if (isOpen) {
      const positions: Record<string, DOMRect> = {}
      helpPoints.forEach(point => {
        const element = document.querySelector(point.element)
        if (element) {
          positions[point.id] = element.getBoundingClientRect()
        }
      })
      setElementPositions(positions)
    }
  }, [isOpen, helpPoints])
  
  if (!isOpen || helpPoints.length === 0) return null
  
  const currentPoint = helpPoints[currentStep]
  const position = elementPositions[currentPoint.id]
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black bg-opacity-50"
        onClick={onClose}
      >
        {/* Spotlight effect */}
        {position && (
          <div
            className="absolute border-4 border-blue-400 rounded-lg"
            style={{
              left: position.left - 4,
              top: position.top - 4,
              width: position.width + 8,
              height: position.height + 8,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
            }}
          />
        )}
        
        {/* Help bubble */}
        {position && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm"
            style={{
              left: position.left + position.width / 2 - 160,
              top: position.bottom + 20
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {currentPoint.title}
              </h4>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ×
              </button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {currentPoint.content}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {currentStep + 1} of {helpPoints.length}
              </span>
              
              <div className="flex space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Previous
                  </button>
                )}
                
                {currentStep < helpPoints.length - 1 ? (
                  <button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-3 py-1 text-xs text-white rounded"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={onClose}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Got it!
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}