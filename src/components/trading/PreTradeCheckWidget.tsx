'use client'

import { useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface PreTradeCheckProps {
  onCheck: (result: any) => void
  tradeParams: any
}

export function PreTradeCheckWidget({ onCheck, tradeParams }: PreTradeCheckProps) {
  const [checking, setChecking] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const runPreCheck = async () => {
    setChecking(true)
    
    try {
      const response = await fetch('/api/trading/pre-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeParams)
      })
      
      const result = await response.json()
      setLastResult(result)
      onCheck(result)
    } catch (error) {
      console.error('Pre-check error:', error)
    } finally {
      setChecking(false)
    }
  }

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'green': return 'text-green-600'
      case 'yellow': return 'text-yellow-600'  
      case 'red': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'green': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'yellow': return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'red': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <Shield className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Pre-Trade Safety Check</h3>
        </div>
        
        <button
          onClick={runPreCheck}
          disabled={checking || !tradeParams.symbol}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            checking || !tradeParams.symbol
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {checking ? 'Checking...' : 'Run Safety Check'}
        </button>
      </div>

      {lastResult && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {getScoreIcon(lastResult.safetyCheck.overallScore)}
            <span className={`font-medium ${getScoreColor(lastResult.safetyCheck.overallScore)}`}>
              Overall Score: {lastResult.safetyCheck.overallScore.toUpperCase()}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              lastResult.canProceed 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {lastResult.canProceed ? 'CAN PROCEED' : 'BLOCKED'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(lastResult.safetyCheck.checks).map(([key, check]: [string, any]) => (
              <div key={key} className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {check.status === 'pass' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {check.status === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                  {check.status === 'fail' && <XCircle className="w-4 h-4 text-red-600" />}
                  <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-xs text-gray-500">({check.score})</span>
                </div>
                <p className="text-xs text-gray-700">{check.message}</p>
              </div>
            ))}
          </div>

          {lastResult.allBlockers.length > 0 && (
            <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded">
              <h4 className="font-medium text-red-800 mb-2">Blockers:</h4>
              <ul className="space-y-1">
                {lastResult.allBlockers.map((blocker: string, idx: number) => (
                  <li key={idx} className="text-sm text-red-700">{blocker}</li>
                ))}
              </ul>
            </div>
          )}

          {lastResult.allWarnings.length > 0 && (
            <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
              <ul className="space-y-1">
                {lastResult.allWarnings.map((warning: string, idx: number) => (
                  <li key={idx} className="text-sm text-yellow-700">{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}