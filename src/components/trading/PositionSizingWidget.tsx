'use client'

import { useState, useEffect } from 'react'
import { Calculator, TrendingUp, AlertCircle } from 'lucide-react'

interface PositionSizingWidgetProps {
  symbol: string
  optionPrice: number
  strike: number
  expiration: string
  type: 'call' | 'put'
  strategy?: string
}

interface SizingResult {
  recommendedQuantity: number
  maxSafeQuantity: number
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme'
  capitalRequired: number
  maxPotentialLoss: number
  explanation: string
  warnings: string[]
}

export function PositionSizingWidget({
  symbol,
  optionPrice,
  strike,
  expiration,
  type,
  strategy
}: PositionSizingWidgetProps) {
  const [result, setResult] = useState<SizingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [customMaxLoss, setCustomMaxLoss] = useState<number | undefined>()

  useEffect(() => {
    if (symbol && optionPrice > 0) {
      calculateSizing()
    }
  }, [symbol, optionPrice, strike, expiration, type, strategy, customMaxLoss])

  const calculateSizing = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/trading/position-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          type,
          strike,
          expiration,
          optionPrice,
          strategy,
          maxLoss: customMaxLoss
        })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Position sizing error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100'
      case 'moderate': return 'text-yellow-600 bg-yellow-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'extreme': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold">Position Sizing</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Custom Max Loss (optional)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm">$</span>
            <input
              type="number"
              value={customMaxLoss || ''}
              onChange={(e) => setCustomMaxLoss(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Auto-calculated"
              className="flex-1 p-2 border rounded text-sm"
              step="50"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{result.recommendedQuantity}</div>
                <div className="text-sm text-gray-600">Recommended</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{result.maxSafeQuantity}</div>
                <div className="text-sm text-gray-600">Max Safe</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm font-medium">Risk Level</span>
              <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getRiskColor(result.riskLevel)}`}>
                {result.riskLevel}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Capital Required:</span>
                <span className="font-medium">${result.capitalRequired.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Max Potential Loss:</span>
                <span className="font-medium text-red-600">${result.maxPotentialLoss.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">{result.explanation}</p>
            </div>

            {result.warnings.length > 0 && (
              <div className="space-y-2">
                {result.warnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-500">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800">{warning}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}