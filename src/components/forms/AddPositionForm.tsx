'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, X, Calendar, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface PositionLeg {
  symbol: string
  optionType: 'call' | 'put'
  strike: number
  expiry: string
  quantity: number
  side: 'buy' | 'sell'
  entryPrice: number
  iv?: number
}

interface AddPositionFormProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function AddPositionForm({ onClose, onSuccess }: AddPositionFormProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    strategyType: '',
    quantity: 1
  })
  
  const [legs, setLegs] = useState<PositionLeg[]>([
    {
      symbol: '',
      optionType: 'call' as const,
      strike: 0,
      expiry: '',
      quantity: 1,
      side: 'buy' as const,
      entryPrice: 0,
      iv: 25
    }
  ])

  const queryClient = useQueryClient()
  
  const addPositionMutation = useMutation({
    mutationFn: async (positionData: any) => {
      const response = await fetch('/api/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(positionData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create position')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] })
      onSuccess?.()
      onClose()
    }
  })

  const addLeg = () => {
    setLegs([...legs, {
      symbol: formData.symbol,
      optionType: 'call',
      strike: 0,
      expiry: '',
      quantity: 1,
      side: 'buy',
      entryPrice: 0,
      iv: 25
    }])
  }

  const removeLeg = (index: number) => {
    setLegs(legs.filter((_, i) => i !== index))
  }

  const updateLeg = (index: number, field: keyof PositionLeg, value: any) => {
    setLegs(legs.map((leg, i) => 
      i === index ? { ...leg, [field]: value } : leg
    ))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.symbol || !formData.strategyType || legs??.length || 0) === 0) {
      return
    }

    // Calculate total entry price as the sum of all leg prices
    const totalEntryPrice = legs.reduce((sum, leg) => {
      const multiplier = leg.side === 'buy' ? 1 : -1
      return sum + (leg.entryPrice * multiplier)
    }, 0)

    const positionData = {
      symbol: formData.symbol.toUpperCase(),
      strategyType: formData.strategyType,
      quantity: formData.quantity,
      entryPrice: Math.abs(totalEntryPrice), // Store as positive value
      legs: legs.map(leg => ({
        ...leg,
        symbol: leg.symbol || formData.symbol,
        expiry: new Date(leg.expiry).toISOString()
      }))
    }

    addPositionMutation.mutate(positionData)
  }

  const strategyTypes = [
    'Long Call',
    'Long Put', 
    'Short Call',
    'Short Put',
    'Bull Call Spread',
    'Bear Put Spread',
    'Iron Condor',
    'Iron Butterfly',
    'Straddle',
    'Strangle',
    'Covered Call',
    'Protective Put',
    'Custom'
  ]

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add New Position
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Position Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Symbol
              </label>
              <Input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                placeholder="AAPL"
                required
                className="uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Strategy
              </label>
              <select
                value={formData.strategyType}
                onChange={(e) => setFormData(prev => ({ ...prev, strategyType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Select Strategy</option>
                {strategyTypes.map(strategy => (
                  <option key={strategy} value={strategy}>{strategy}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contracts
              </label>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                min="1"
                required
              />
            </div>
          </div>

          {/* Position Legs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Position Legs
              </h4>
              <Button
                type="button"
                onClick={addLeg}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Leg</span>
              </Button>
            </div>

            <div className="space-y-4">
              {legs.map((leg, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Leg {index + 1}
                    </h5>
                    {legs?.length || 0 > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLeg(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Type
                      </label>
                      <select
                        value={leg.optionType}
                        onChange={(e) => updateLeg(index, 'optionType', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="call">Call</option>
                        <option value="put">Put</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Side
                      </label>
                      <select
                        value={leg.side}
                        onChange={(e) => updateLeg(index, 'side', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Strike
                      </label>
                      <Input
                        type="number"
                        value={leg.strike}
                        onChange={(e) => updateLeg(index, 'strike', Number(e.target.value))}
                        step="0.5"
                        className="text-sm h-8"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Expiry
                      </label>
                      <Input
                        type="date"
                        value={leg.expiry}
                        onChange={(e) => updateLeg(index, 'expiry', e.target.value)}
                        className="text-sm h-8"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Qty
                      </label>
                      <Input
                        type="number"
                        value={leg.quantity}
                        onChange={(e) => updateLeg(index, 'quantity', Number(e.target.value))}
                        min="1"
                        className="text-sm h-8"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Price
                      </label>
                      <Input
                        type="number"
                        value={leg.entryPrice}
                        onChange={(e) => updateLeg(index, 'entryPrice', Number(e.target.value))}
                        step="0.01"
                        min="0"
                        className="text-sm h-8"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        IV %
                      </label>
                      <Input
                        type="number"
                        value={leg.iv || ''}
                        onChange={(e) => updateLeg(index, 'iv', Number(e.target.value))}
                        step="1"
                        min="1"
                        max="200"
                        className="text-sm h-8"
                        placeholder="25"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={addPositionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addPositionMutation.isPending}
              className="flex items-center space-x-2"
            >
              {addPositionMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>
                {addPositionMutation.isPending ? 'Adding...' : 'Add Position'}
              </span>
            </Button>
          </div>
        </form>

        {addPositionMutation.isError && (
          <div className="px-6 pb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">
                {addPositionMutation.error?.message || 'Failed to add position'}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}