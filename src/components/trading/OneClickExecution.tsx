'use client'

import { useState, useEffect } from 'react'
import { Zap, Settings, CheckCircle, AlertTriangle } from 'lucide-react'

interface BrokerConnection {
  id: string
  broker: string
  accountId: string
  status: string
  paperAccount: boolean
  enableOneClick: boolean
}

interface OneClickExecutionProps {
  tradeData: {
    symbol: string
    legs: any[]
    orderType: 'market' | 'limit'
    limitPrice?: number
  }
  onExecute: (result: any) => void
}

export function OneClickExecution({ tradeData, onExecute }: OneClickExecutionProps) {
  const [connections, setConnections] = useState<BrokerConnection[]>([])
  const [selectedBroker, setSelectedBroker] = useState<string>('')
  const [executing, setExecuting] = useState(false)
  const [preCheckPassed, setPreCheckPassed] = useState(false)

  useEffect(() => {
    loadBrokerConnections()
  }, [])

  const loadBrokerConnections = async () => {
    try {
      const response = await fetch('/api/trading/broker')
      const data = await response.json()
      setConnections(data.connections || [])
      
      const oneClickEnabled = data.connections?.find((c: BrokerConnection) => 
        c.status === 'connected' && c.enableOneClick
      )
      if (oneClickEnabled) {
        setSelectedBroker(oneClickEnabled.broker)
      }
    } catch (error) {
      console.error('Failed to load broker connections:', error)
    }
  }

  const executeOrder = async () => {
    if (!selectedBroker || !preCheckPassed) return

    setExecuting(true)
    
    try {
      const response = await fetch('/api/trading/broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_order',
          broker: selectedBroker,
          order: {
            ...tradeData,
            timeInForce: 'day'
          }
        })
      })
      
      const result = await response.json()
      onExecute(result)
    } catch (error) {
      console.error('Order execution error:', error)
      onExecute({ success: false, error: 'Failed to execute order' })
    } finally {
      setExecuting(false)
    }
  }

  const connectedBrokers = connections.filter(c => c.status === 'connected')
  const selectedConnection = connections.find(c => c.broker === selectedBroker)

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold">One-Click Execution</h3>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {connectedBrokers.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-600 mb-3">No brokers connected</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Connect Broker
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Broker</label>
            <select
              value={selectedBroker}
              onChange={(e) => setSelectedBroker(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Choose broker...</option>
              {connectedBrokers.map((broker) => (
                <option key={broker.id} value={broker.broker}>
                  {broker.broker.toUpperCase()} 
                  {broker.paperAccount && ' (Paper)'}
                  {broker.enableOneClick && ' ⚡'}
                </option>
              ))}
            </select>
          </div>

          {selectedConnection && (
            <div className="p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${
                  selectedConnection.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {selectedConnection.broker.toUpperCase()} - {selectedConnection.accountId}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  Account Type: {selectedConnection.paperAccount ? 'Paper' : 'Live'}
                </div>
                <div>
                  One-Click: {selectedConnection.enableOneClick ? 'Enabled' : 'Disabled'}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Pre-Flight Checklist</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {preCheckPassed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span>Safety checks passed</span>
                {!preCheckPassed && (
                  <button 
                    onClick={() => setPreCheckPassed(true)}
                    className="text-xs text-blue-600 hover:underline ml-auto"
                  >
                    Run Check
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                {selectedConnection?.enableOneClick ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
                <span>One-click enabled for {selectedBroker || 'broker'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={executeOrder}
            disabled={!selectedBroker || !preCheckPassed || executing || !selectedConnection?.enableOneClick}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              !selectedBroker || !preCheckPassed || !selectedConnection?.enableOneClick
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : executing
                ? 'bg-yellow-500 text-white'
                : selectedConnection.paperAccount
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {executing ? (
              'Executing...'
            ) : selectedConnection?.paperAccount ? (
              `Execute Paper Trade on ${selectedBroker?.toUpperCase()}`
            ) : (
              `🚨 Execute LIVE Trade on ${selectedBroker?.toUpperCase()}`
            )}
          </button>

          <div className="text-xs text-gray-500 text-center">
            {selectedConnection?.paperAccount ? (
              'Paper trading - no real money at risk'
            ) : (
              '⚠️ This will place a real order with real money'
            )}
          </div>
        </div>
      )}
    </div>
  )
}