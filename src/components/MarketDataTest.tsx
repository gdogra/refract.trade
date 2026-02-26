'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { marketDataService } from '@/lib/marketData'
import { RefreshCw, Activity, AlertCircle, CheckCircle } from 'lucide-react'

interface ProviderStatus {
  name: string
  connected: boolean
  rateLimit: {
    remaining: number
    resetTime: Date
  }
}

interface ServiceInfo {
  enableRealData: boolean
  provider: string
  hasRealDataService: boolean
  providerCount: number
  cacheSize: number
  subscriberCount: number
}

export default function MarketDataTest() {
  const [symbol, setSymbol] = useState('AAPL')
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [serviceInfo, setServiceInfo] = useState<ServiceInfo | null>(null)
  const [providers, setProviders] = useState<ProviderStatus[]>([])

  useEffect(() => {
    loadServiceStatus()
  }, [])

  const loadServiceStatus = async () => {
    try {
      const response = await fetch('/api/options/quote?symbol=AAPL')
      const data = await response.json()
      
      if (data.success) {
        setServiceInfo({
          enableRealData: true,
          provider: 'Yahoo Finance',
          hasRealDataService: true,
          providerCount: 1,
          cacheSize: 0,
          subscriberCount: 0
        })
        setProviders([{
          name: 'Yahoo Finance',
          connected: true,
          rateLimit: {
            remaining: 100,
            resetTime: new Date()
          }
        }])
      }
    } catch (err) {
      console.error('Failed to load service status:', err)
    }
  }

  const testQuote = async () => {
    if (!symbol.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/options/quote?symbol=${symbol.toUpperCase()}`)
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch quote')
      }
      
      setQuote(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quote')
    } finally {
      setLoading(false)
    }
  }

  const testBatchQuotes = async () => {
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA']
    setLoading(true)
    setError(null)
    
    try {
      const promises = symbols.map(async (sym) => {
        const response = await fetch(`/api/options/quote?symbol=${sym}`)
        const result = await response.json()
        return { symbol: sym, ...result }
      })
      
      const batchData = await Promise.all(promises)
      setQuote(batchData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch batch quotes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Market Data API Test
        </h1>
        <Button onClick={loadServiceStatus} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Service Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceInfo && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                {serviceInfo.enableRealData ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                )}
                <span className="text-sm">
                  Real Data: {serviceInfo.enableRealData ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {serviceInfo.hasRealDataService ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">
                  Service: {serviceInfo.hasRealDataService ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">Providers: </span>
                <span className="font-medium">{serviceInfo.providerCount}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">Cache Size: </span>
                <span className="font-medium">{serviceInfo.cacheSize}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">Subscribers: </span>
                <span className="font-medium">{serviceInfo.subscriberCount}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-gray-600">Primary: </span>
                <span className="font-medium">{serviceInfo.provider}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provider Status */}
      {providers?.length || 0 > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providers.map((provider, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {provider.connected ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">{provider.name}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Rate Limit: {provider.rateLimit?.remaining || 'Unknown'} remaining
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quote Testing */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Input
                placeholder="Enter symbol (e.g., AAPL)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="max-w-xs"
              />
              <Button onClick={testQuote} disabled={loading}>
                {loading ? 'Loading...' : 'Get Quote'}
              </Button>
              <Button onClick={testBatchQuotes} disabled={loading} variant="outline">
                {loading ? 'Loading...' : 'Test Batch (AAPL,MSFT,GOOGL,TSLA)'}
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
                </div>
              </div>
            )}

            {quote && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Market Data Response:</h4>
                <pre className="text-sm overflow-x-auto bg-white dark:bg-gray-900 p-3 rounded border">
                  {JSON.stringify(quote, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Environment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">NEXT_PUBLIC_ENABLE_REAL_DATA: </span>
              <span className="font-medium">{process.env.NEXT_PUBLIC_ENABLE_REAL_DATA || 'undefined'}</span>
            </div>
            <div>
              <span className="text-gray-600">NEXT_PUBLIC_MARKET_DATA_PROVIDER: </span>
              <span className="font-medium">{process.env.NEXT_PUBLIC_MARKET_DATA_PROVIDER || 'undefined'}</span>
            </div>
            <div>
              <span className="text-gray-600">NODE_ENV: </span>
              <span className="font-medium">{process.env.NODE_ENV || 'undefined'}</span>
            </div>
            <div>
              <span className="text-gray-600">Build Time: </span>
              <span className="font-medium">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}