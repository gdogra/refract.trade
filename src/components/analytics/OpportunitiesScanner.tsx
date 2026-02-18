'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  TrendingUp,
  Shield,
  Clock,
  Zap,
  Target,
  Star,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Settings,
  Eye
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface OpportunitiesScannerProps {
  opportunities: RankedOpportunity[]
  scanStatus: ScanStatus
  filters: OpportunityFilters
  onFilterChange: (filters: OpportunityFilters) => void
  onRefreshScan: () => void
  className?: string
}

interface RankedOpportunity {
  id: string
  symbol: string
  strategyName: string
  strategyType: string
  raos: number
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  rank: number
  expectedReturn: number
  maxLoss: number
  probabilityOfProfit: number
  liquidityScore: number
  timeToExpiry: number
  marketFit: number
  riskLevel: 'Low' | 'Medium' | 'High'
  executionReadiness: boolean
  reasoning: string
  keyMetrics: {
    expectedValue: number
    sharpeRatio: number
    kellyFraction: number
    riskReward: number
  }
  executionGuidance: {
    optimalTime: string
    estimatedSlippage: number
    recommendedSize: number
  }
}

interface ScanStatus {
  isScanning: boolean
  lastScanTime: Date
  symbolsScanned: number
  opportunitiesFound: number
  errors: string[]
}

interface OpportunityFilters {
  minRAOS: number
  maxRisk: number
  minLiquidity: number
  maxDaysToExpiry: number
  strategyTypes: string[]
  tiers: string[]
  requireExecutionReady: boolean
}

// Mock data for demonstration
const mockOpportunities: RankedOpportunity[] = [
  {
    id: '1',
    symbol: 'AAPL',
    strategyName: 'Iron Condor 170/175/185/190',
    strategyType: 'Iron Condor',
    raos: 87.5,
    tier: 'S',
    rank: 1,
    expectedReturn: 12.5,
    maxLoss: -425,
    probabilityOfProfit: 0.78,
    liquidityScore: 95,
    timeToExpiry: 28,
    marketFit: 88,
    riskLevel: 'Low',
    executionReadiness: true,
    reasoning: 'High IV rank (85th percentile) in neutral trending market creates premium selling opportunity',
    keyMetrics: {
      expectedValue: 156,
      sharpeRatio: 2.4,
      kellyFraction: 0.18,
      riskReward: 2.95
    },
    executionGuidance: {
      optimalTime: '9:30-10:30 AM EST',
      estimatedSlippage: 0.05,
      recommendedSize: 3
    }
  },
  {
    id: '2',
    symbol: 'TSLA',
    strategyName: 'Bull Call Spread 240/250',
    strategyType: 'Bull Call Spread',
    raos: 82.1,
    tier: 'S',
    rank: 2,
    expectedReturn: 18.2,
    maxLoss: -380,
    probabilityOfProfit: 0.68,
    liquidityScore: 88,
    timeToExpiry: 35,
    marketFit: 85,
    riskLevel: 'Medium',
    executionReadiness: true,
    reasoning: 'Strong bullish technical setup with oversold RSI and volume confirmation',
    keyMetrics: {
      expectedValue: 142,
      sharpeRatio: 2.1,
      kellyFraction: 0.15,
      riskReward: 2.63
    },
    executionGuidance: {
      optimalTime: '9:30-10:30 AM EST',
      estimatedSlippage: 0.08,
      recommendedSize: 2
    }
  },
  {
    id: '3',
    symbol: 'QQQ',
    strategyName: 'Short Strangle 350/370',
    strategyType: 'Short Strangle',
    raos: 76.8,
    tier: 'A',
    rank: 3,
    expectedReturn: 15.8,
    maxLoss: -850,
    probabilityOfProfit: 0.72,
    liquidityScore: 92,
    timeToExpiry: 21,
    marketFit: 78,
    riskLevel: 'Medium',
    executionReadiness: false,
    reasoning: 'Elevated IV in range-bound market, but close to resistance level',
    keyMetrics: {
      expectedValue: 125,
      sharpeRatio: 1.8,
      kellyFraction: 0.12,
      riskReward: 1.85
    },
    executionGuidance: {
      optimalTime: '3:00-4:00 PM EST',
      estimatedSlippage: 0.06,
      recommendedSize: 1
    }
  }
]

const mockScanStatus: ScanStatus = {
  isScanning: false,
  lastScanTime: new Date(Date.now() - 5 * 60 * 1000),
  symbolsScanned: 1247,
  opportunitiesFound: 23,
  errors: []
}

export default function OpportunitiesScanner({
  opportunities = mockOpportunities,
  scanStatus = mockScanStatus,
  filters,
  onFilterChange,
  onRefreshScan,
  className
}: OpportunitiesScannerProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<RankedOpportunity | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const filteredOpportunities = opportunities.filter(opp => 
    opp.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.strategyName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S': return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
      case 'A': return 'bg-gradient-to-r from-green-600 to-blue-600 text-white'
      case 'B': return 'bg-blue-500 text-white'
      case 'C': return 'bg-yellow-500 text-white'
      case 'D': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'High': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Scanner Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-6 w-6" />
                <span>Opportunities Scanner</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Continuously scanning {scanStatus.symbolsScanned} securities for high-quality opportunities
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="ghost" 
                size="sm"
                onClick={onRefreshScan}
                disabled={scanStatus.isScanning}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", scanStatus.isScanning && "animate-spin")} />
                {scanStatus.isScanning ? 'Scanning...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Status */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search symbols or strategies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span>Found: {filteredOpportunities.length} opportunities</span>
              <span>•</span>
              <span>Last scan: {scanStatus.lastScanTime.toLocaleTimeString()}</span>
              {scanStatus.isScanning && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Scan Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {opportunities.filter(opp => opp.tier === 'S').length}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">S-Grade (Exceptional)</div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {opportunities.filter(opp => opp.tier === 'A').length}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">A-Grade (Strong)</div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {opportunities.filter(opp => opp.executionReadiness).length}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Ready to Execute</div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ${opportunities.reduce((sum, opp) => sum + opp.expectedReturn, 0).toFixed(0)}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Total Expected Return</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredOpportunities.map((opportunity, index) => (
          <motion.div
            key={opportunity.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg",
                selectedOpportunity?.id === opportunity.id && "ring-2 ring-blue-500"
              )}
              onClick={() => setSelectedOpportunity(
                selectedOpportunity?.id === opportunity.id ? null : opportunity
              )}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={cn("px-3 py-1 rounded-full text-sm font-bold", getTierColor(opportunity.tier))}>
                      {opportunity.tier}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {opportunity.symbol}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {opportunity.strategyName}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {opportunity.raos.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">RAOS</div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {(opportunity.probabilityOfProfit * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">Prob of Profit</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      ${Math.abs(opportunity.expectedReturn).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Expected Return</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={cn("text-lg font-bold", getRiskColor(opportunity.riskLevel).split(' ')[0])}>
                      ${Math.abs(opportunity.maxLoss).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">Max Risk</div>
                  </div>
                </div>

                {/* Status Indicators */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {opportunity.executionReadiness ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-600" />
                      )}
                      <span className="text-xs text-gray-600">
                        {opportunity.executionReadiness ? 'Ready' : 'Preparing'}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <div className={cn("w-2 h-2 rounded-full",
                        opportunity.liquidityScore >= 80 ? 'bg-green-500' :
                        opportunity.liquidityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      )} />
                      <span className="text-xs text-gray-600">
                        Liquidity: {opportunity.liquidityScore.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  
                  <span className={cn("px-2 py-1 rounded text-xs font-medium", getRiskColor(opportunity.riskLevel))}>
                    {opportunity.riskLevel} Risk
                  </span>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedOpportunity?.id === opportunity.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 pt-4 mt-4"
                    >
                      <div className="space-y-4">
                        {/* Reasoning */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <h5 className="font-medium text-blue-900 dark:text-blue-200 mb-1">
                            Why This Opportunity?
                          </h5>
                          <p className="text-sm text-blue-800 dark:text-blue-300">
                            {opportunity.reasoning}
                          </p>
                        </div>

                        {/* Advanced Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">Risk Metrics</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Sharpe Ratio:</span>
                                <span className="font-medium">{opportunity.keyMetrics.sharpeRatio.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Kelly %:</span>
                                <span className="font-medium">{(opportunity.keyMetrics.kellyFraction * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Risk/Reward:</span>
                                <span className="font-medium">{opportunity.keyMetrics.riskReward.toFixed(2)}:1</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">Execution</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Best Time:</span>
                                <span className="font-medium">{opportunity.executionGuidance.optimalTime}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Size:</span>
                                <span className="font-medium">{opportunity.executionGuidance.recommendedSize} contracts</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Est. Slippage:</span>
                                <span className="font-medium">${opportunity.executionGuidance.estimatedSlippage.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <Button className="flex-1" size="sm">
                            <Target className="h-4 w-4 mr-2" />
                            Execute Strategy
                          </Button>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            Add to Watchlist
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Customize
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* No Opportunities State */}
      {filteredOpportunities.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Opportunities Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm 
                ? `No opportunities match "${searchTerm}". Try adjusting your search or filters.`
                : 'No opportunities currently meet your criteria. Consider adjusting filters or market conditions may not be favorable.'
              }
            </p>
            <div className="flex justify-center space-x-3">
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Clear Search
              </Button>
              <Button onClick={onRefreshScan}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Scan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Minimum RAOS
                    </label>
                    <Input
                      type="number"
                      value={filters.minRAOS}
                      onChange={(e) => onFilterChange({...filters, minRAOS: Number(e.target.value)})}
                      min={0}
                      max={100}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Risk ($)
                    </label>
                    <Input
                      type="number"
                      value={filters.maxRisk}
                      onChange={(e) => onFilterChange({...filters, maxRisk: Number(e.target.value)})}
                      min={0}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Min Liquidity Score
                    </label>
                    <Input
                      type="number"
                      value={filters.minLiquidity}
                      onChange={(e) => onFilterChange({...filters, minLiquidity: Number(e.target.value)})}
                      min={0}
                      max={100}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Days to Expiry
                    </label>
                    <Input
                      type="number"
                      value={filters.maxDaysToExpiry}
                      onChange={(e) => onFilterChange({...filters, maxDaysToExpiry: Number(e.target.value)})}
                      min={1}
                      max={365}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Strategy Types
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Iron Condor', 'Bull Call Spread', 'Long Call', 'Short Strangle', 'Calendar Spread'].map(type => (
                        <label key={type} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.strategyTypes.includes(type)}
                            onChange={(e) => {
                              const newTypes = e.target.checked
                                ? [...filters.strategyTypes, type]
                                : filters.strategyTypes.filter(t => t !== type)
                              onFilterChange({...filters, strategyTypes: newTypes})
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => onFilterChange({
                      minRAOS: 60,
                      maxRisk: 1000,
                      minLiquidity: 50,
                      maxDaysToExpiry: 45,
                      strategyTypes: [],
                      tiers: [],
                      requireExecutionReady: false
                    })}
                  >
                    Reset Filters
                  </Button>
                  <Button onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Avg Success Rate</p>
                <p className="text-3xl font-bold">
                  {(opportunities.reduce((sum, opp) => sum + opp.probabilityOfProfit, 0) / opportunities.length * 100).toFixed(0)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Avg Liquidity</p>
                <p className="text-3xl font-bold">
                  {(opportunities.reduce((sum, opp) => sum + opp.liquidityScore, 0) / opportunities.length).toFixed(0)}
                </p>
              </div>
              <Zap className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Avg Time Frame</p>
                <p className="text-3xl font-bold">
                  {Math.round(opportunities.reduce((sum, opp) => sum + opp.timeToExpiry, 0) / opportunities.length)}d
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Total Capital</p>
                <p className="text-3xl font-bold">
                  ${(opportunities.reduce((sum, opp) => sum + Math.abs(opp.maxLoss), 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scanner Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn("w-3 h-3 rounded-full", 
                scanStatus.isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              )} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Scanner Status: {scanStatus.isScanning ? 'Active' : 'Idle'} • 
                Last updated {Math.round((Date.now() - scanStatus.lastScanTime.getTime()) / (1000 * 60))} minutes ago
              </span>
            </div>
            
            {scanStatus.errors.length > 0 && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{scanStatus.errors.length} errors</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}