'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Calendar, DollarSign, TrendingUp, TrendingDown, Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { calculateGreeks, getTimeToExpiry, type GreeksInput } from '@/lib/greeks'
import { toast } from 'react-hot-toast'

interface AddPositionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (position: NewPositionData) => Promise<void>
  defaultSymbol?: string
}

export interface NewPositionData {
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: string
  quantity: number
  entryPrice: number
  entryDate: string
  notes?: string
  tags: string[]
}

export default function AddPositionForm({ isOpen, onClose, onSubmit, defaultSymbol }: AddPositionFormProps) {
  const [formData, setFormData] = useState<NewPositionData>({
    symbol: defaultSymbol || '',
    type: 'call',
    strike: 0,
    expiry: '',
    quantity: 1,
    entryPrice: 0,
    entryDate: new Date().toISOString().split('T')[0],
    notes: '',
    tags: []
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [calculatedGreeks, setCalculatedGreeks] = useState<any>(null)
  const [tagInput, setTagInput] = useState('')
  
  const symbolRef = useRef<HTMLInputElement>(null)
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        symbol: defaultSymbol || '',
        type: 'call',
        strike: 0,
        expiry: '',
        quantity: 1,
        entryPrice: 0,
        entryDate: new Date().toISOString().split('T')[0],
        notes: '',
        tags: []
      })
      setErrors({})
      setCurrentPrice(null)
      setCalculatedGreeks(null)
      setTagInput('')
      
      // Focus on symbol input after animation
      setTimeout(() => {
        symbolRef.current?.focus()
      }, 200)
    }
  }, [isOpen, defaultSymbol])
  
  // Calculate Greeks when relevant fields change
  useEffect(() => {
    if (formData.symbol && formData.strike > 0 && formData.expiry && currentPrice) {
      const timeToExpiry = getTimeToExpiry(formData.expiry)
      if (timeToExpiry > 0) {
        const input: GreeksInput = {
          spotPrice: currentPrice,
          strike: formData.strike,
          timeToExpiry,
          riskFreeRate: 0.05, // Default 5%
          volatility: 0.30,   // Default 30% vol
        }
        
        const greeks = calculateGreeks(input, formData.type === 'call')
        setCalculatedGreeks(greeks)
      }
    }
  }, [formData.symbol, formData.strike, formData.expiry, formData.type, currentPrice])
  
  // Real function to get current price from market data API
  const fetchCurrentPrice = async (symbol: string) => {
    try {
      const response = await fetch(`/api/options/quote?symbol=${symbol.toUpperCase()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch price for ${symbol}`)
      }
      
      const data = await response.json()
      if (data.success && data.data?.price) {
        const price = data.data.price
        setCurrentPrice(price)
        
        // Auto-suggest strike prices based on real current price
        if (formData.strike === 0) {
          const suggestedStrike = formData.type === 'call' 
            ? Math.ceil(price / 5) * 5 // Round up to nearest $5 for calls
            : Math.floor(price / 5) * 5 // Round down to nearest $5 for puts
          
          setFormData(prev => ({ ...prev, strike: suggestedStrike }))
        }
      } else {
        console.error('No price data available for symbol:', symbol)
        setCurrentPrice(null)
      }
    } catch (error) {
      console.error('Failed to fetch real market price for', symbol, ':', error)
      setCurrentPrice(null)
      // Show user-friendly error but don't fall back to fake data
      toast.error(`Unable to fetch real price for ${symbol}. Please check the symbol.`)
    }
  }
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required'
    } else if (!/^[A-Z]{1,5}$/.test(formData.symbol.toUpperCase())) {
      newErrors.symbol = 'Symbol must be 1-5 letters'
    }
    
    if (formData.strike <= 0) {
      newErrors.strike = 'Strike must be greater than 0'
    }
    
    if (!formData.expiry) {
      newErrors.expiry = 'Expiry date is required'
    } else {
      const expiryDate = new Date(formData.expiry)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (expiryDate <= today) {
        newErrors.expiry = 'Expiry must be in the future'
      }
    }
    
    if (formData.quantity === 0) {
      newErrors.quantity = 'Quantity cannot be zero'
    }
    
    if (formData.entryPrice < 0) {
      newErrors.entryPrice = 'Entry price cannot be negative'
    }
    
    if (!formData.entryDate) {
      newErrors.entryDate = 'Entry date is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors)?.length || 0 === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const positionData = {
        ...formData,
        symbol: formData.symbol.toUpperCase(),
      }
      
      await onSubmit(positionData)
      toast.success('Position added successfully!')
      onClose()
    } catch (error) {
      console.error('Failed to add position:', error)
      toast.error('Failed to add position. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const symbol = e.target.value.toUpperCase()
    setFormData(prev => ({ ...prev, symbol }))
    
    if (symbol?.length || 0 >= 1) {
      fetchCurrentPrice(symbol)
    }
  }
  
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }
  
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }
  
  const getTotalCost = () => {
    return Math.abs(formData.entryPrice * formData.quantity * 100)
  }
  
  const getDaysToExpiry = () => {
    if (!formData.expiry) return null
    const expiry = new Date(formData.expiry)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plus className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Add New Position
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter your options position details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Symbol *
                </label>
                <input
                  ref={symbolRef}
                  type="text"
                  value={formData.symbol}
                  onChange={handleSymbolChange}
                  placeholder="AAPL"
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.symbol ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={isSubmitting}
                  maxLength={5}
                />
                {errors.symbol && (
                  <p className="text-red-600 text-sm mt-1">{errors.symbol}</p>
                )}
                {currentPrice && (
                  <p className="text-green-600 text-sm mt-1">
                    Current Price: ${currentPrice.toFixed(2)}
                  </p>
                )}
              </div>
              
              {/* Option Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Option Type *
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'call' }))}
                    className={`flex-1 py-2 px-3 rounded-lg border font-medium transition-colors ${
                      formData.type === 'call'
                        ? 'bg-green-100 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <TrendingUp className="h-4 w-4 mx-auto mb-1" />
                    Call
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'put' }))}
                    className={`flex-1 py-2 px-3 rounded-lg border font-medium transition-colors ${
                      formData.type === 'put'
                        ? 'bg-red-100 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <TrendingDown className="h-4 w-4 mx-auto mb-1" />
                    Put
                  </button>
                </div>
              </div>
            </div>
            
            {/* Strike and Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strike Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Strike Price *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.strike || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      strike: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="150.00"
                    step="0.01"
                    min="0"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.strike ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.strike && (
                  <p className="text-red-600 text-sm mt-1">{errors.strike}</p>
                )}
              </div>
              
              {/* Expiry Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expiry Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.expiry}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expiry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.expiry && (
                  <p className="text-red-600 text-sm mt-1">{errors.expiry}</p>
                )}
                {getDaysToExpiry() && (
                  <p className={`text-sm mt-1 ${
                    getDaysToExpiry()! < 7 ? 'text-red-600' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {getDaysToExpiry()} days to expiry
                  </p>
                )}
              </div>
            </div>
            
            {/* Quantity and Entry Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity *
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      quantity: Math.max(-999, prev.quantity - 1) 
                    }))}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                    disabled={isSubmitting}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      quantity: parseInt(e.target.value) || 0 
                    }))}
                    className={`flex-1 text-center px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      quantity: Math.min(999, prev.quantity + 1) 
                    }))}
                    className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                    disabled={isSubmitting}
                  >
                    +
                  </button>
                </div>
                {errors.quantity && (
                  <p className="text-red-600 text-sm mt-1">{errors.quantity}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Negative = Short position
                </p>
              </div>
              
              {/* Entry Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Entry Price *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.entryPrice || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      entryPrice: parseFloat(e.target.value) || 0 
                    }))}
                    placeholder="3.50"
                    step="0.01"
                    min="0"
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.entryPrice ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.entryPrice && (
                  <p className="text-red-600 text-sm mt-1">{errors.entryPrice}</p>
                )}
                {formData.entryPrice > 0 && formData.quantity !== 0 && (
                  <p className="text-blue-600 text-sm mt-1">
                    Total Cost: ${getTotalCost().toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            
            {/* Entry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Entry Date *
              </label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.entryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={isSubmitting}
              />
              {errors.entryDate && (
                <p className="text-red-600 text-sm mt-1">{errors.entryDate}</p>
              )}
            </div>
            
            {/* Greeks Preview */}
            {calculatedGreeks && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Theoretical Greeks
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Delta</span>
                      <div className="font-mono font-medium text-gray-900 dark:text-white">
                        {calculatedGreeks.delta.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Gamma</span>
                      <div className="font-mono font-medium text-gray-900 dark:text-white">
                        {calculatedGreeks.gamma.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Theta</span>
                      <div className="font-mono font-medium text-red-600">
                        {calculatedGreeks.theta.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Vega</span>
                      <div className="font-mono font-medium text-gray-900 dark:text-white">
                        {calculatedGreeks.vega.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Price</span>
                      <div className="font-mono font-medium text-blue-600">
                        ${calculatedGreeks.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    * Based on 30% IV and 5% risk-free rate
                  </p>
                </CardContent>
              </Card>
            )}
            
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.tags || []).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-blue-600"
                      disabled={isSubmitting}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="earnings-play, covered-call, etc."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addTag}
                  disabled={!tagInput.trim() || isSubmitting}
                >
                  Add
                </Button>
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes about this position..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                disabled={isSubmitting}
              />
            </div>
            
            {/* Risk Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Risk Reminder</p>
                  <p>
                    Options trading involves significant risk. Make sure all position details are accurate.
                    Double-check expiry dates and quantities before submitting.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Adding Position...' : 'Add Position'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}