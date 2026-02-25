'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Star,
  Target,
  AlertCircle,
  Zap,
  Eye,
  Volume2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TooltipProvider, TooltipRoot as Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

interface TradeOpportunity {
  id: string
  symbol: string
  companyName: string
  type: 'call' | 'put'
  strategy: string
  inPortfolio: boolean
  
  // Option details
  strike: number
  expiration: string
  daysToExpiry: number
  
  // Underlying price
  currentPrice: number
  
  // Pricing
  bid: number
  ask: number
  last: number
  midpoint: number
  
  // Volume & Interest
  volume: number
  openInterest: number
  
  // Greeks
  delta: number
  gamma: number
  theta: number
  vega: number
  
  // Analysis
  impliedVolatility: number
  probabilityOfProfit: number
  maxProfit: number
  maxLoss: number
  riskRewardRatio: number
  
  // Scoring
  opportunityScore: number
  liquidityScore: number
  timingScore: number
  
  // Reasoning
  reasoning: string
  catalysts: string[]
  risks: string[]
  sources: string[]
}

interface FilterCriteria {
  minBid?: number
  maxAsk?: number
  minVolume?: number
  minOpenInterest?: number
  minDelta?: number
  maxDelta?: number
  strategyType?: string
  portfolioOnly?: boolean
}

export function DailyTradeOpportunities() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterCriteria>({})
  const [sortBy, setSortBy] = useState<keyof TradeOpportunity>('opportunityScore')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const { data: apiResponse, isLoading, error } = useQuery<{data: TradeOpportunity[], portfolioCount: number, marketCount: number}>({
    queryKey: ['daily-trade-opportunities'],
    queryFn: async () => {
      const response = await fetch('/api/trading/daily-opportunities')
      if (!response.ok) {
        throw new Error('Failed to fetch trade opportunities')
      }
      const result = await response.json()
      return result
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000 // Consider stale after 2 minutes
  })

  const opportunities = apiResponse?.data || []

  const filteredAndSortedOpportunities = useMemo(() => {
    if (!opportunities || !Array.isArray(opportunities)) return []
    
    let filtered = opportunities.filter(opp => {
      if (filters.portfolioOnly && !opp.inPortfolio) return false
      if (filters.minBid && opp.bid < filters.minBid) return false
      if (filters.maxAsk && opp.ask > filters.maxAsk) return false
      if (filters.minVolume && opp.volume < filters.minVolume) return false
      if (filters.minOpenInterest && opp.openInterest < filters.minOpenInterest) return false
      if (filters.minDelta && Math.abs(opp.delta) < filters.minDelta) return false
      if (filters.maxDelta && Math.abs(opp.delta) > filters.maxDelta) return false
      if (filters.strategyType && opp.strategy !== filters.strategyType) return false
      
      return true
    })
    
    // Sort portfolio opportunities first, then by selected criteria
    filtered.sort((a, b) => {
      // Portfolio stocks always come first
      if (a.inPortfolio && !b.inPortfolio) return -1
      if (!a.inPortfolio && b.inPortfolio) return 1
      
      // Then sort by selected criteria
      const aValue = a[sortBy]
      const bValue = b[sortBy]
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'desc' ? bValue - aValue : aValue - bValue
      }
      
      return 0
    })
    
    return filtered
  }, [opportunities, filters, sortBy, sortDirection])

  const portfolioCount = filteredAndSortedOpportunities.filter(o => o.inPortfolio).length
  const marketCount = filteredAndSortedOpportunities.filter(o => !o.inPortfolio).length

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Failed to Load Trade Opportunities
          </CardTitle>
          <CardDescription className="text-red-600">
            Unable to fetch daily trade opportunities. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              <Zap className="h-5 w-5 text-yellow-500" />
              Daily Trade Opportunities
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            {!isLoading && opportunities && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {portfolioCount} Portfolio
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {marketCount} Market
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
        
        <CardDescription>
          AI-powered analysis of the most attractive options trades based on your portfolio and market conditions
        </CardDescription>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 space-y-4">
              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border rounded-lg p-4 bg-gray-50 space-y-4"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Min Bid</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={filters.minBid || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            minBid: e.target.value ? parseFloat(e.target.value) : undefined
                          }))}
                          className="h-8"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Max Ask</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="100.00"
                          value={filters.maxAsk || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            maxAsk: e.target.value ? parseFloat(e.target.value) : undefined
                          }))}
                          className="h-8"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Min Volume</label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={filters.minVolume || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            minVolume: e.target.value ? parseInt(e.target.value) : undefined
                          }))}
                          className="h-8"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Min OI</label>
                        <Input
                          type="number"
                          placeholder="50"
                          value={filters.minOpenInterest || ''}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            minOpenInterest: e.target.value ? parseInt(e.target.value) : undefined
                          }))}
                          className="h-8"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Strategy</label>
                        <Select
                          value={filters.strategyType || 'all'}
                          onValueChange={(value) => setFilters(prev => ({
                            ...prev,
                            strategyType: value === 'all' ? undefined : value
                          }))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Strategies</SelectItem>
                            <SelectItem value="Covered Call">Covered Call</SelectItem>
                            <SelectItem value="Cash Secured Put">Cash Secured Put</SelectItem>
                            <SelectItem value="Bull Call Spread">Bull Call Spread</SelectItem>
                            <SelectItem value="Bear Put Spread">Bear Put Spread</SelectItem>
                            <SelectItem value="Iron Condor">Iron Condor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Delta Range</label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.2"
                            value={filters.minDelta || ''}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              minDelta: e.target.value ? parseFloat(e.target.value) : undefined
                            }))}
                            className="h-8"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.8"
                            value={filters.maxDelta || ''}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              maxDelta: e.target.value ? parseFloat(e.target.value) : undefined
                            }))}
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilters({})}
                          className="h-8"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sort Controls */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Sort by:</span>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as keyof TradeOpportunity)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opportunityScore">Opportunity Score</SelectItem>
                    <SelectItem value="bid">Bid Price</SelectItem>
                    <SelectItem value="ask">Ask Price</SelectItem>
                    <SelectItem value="last">Last Price</SelectItem>
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="openInterest">Open Interest</SelectItem>
                    <SelectItem value="delta">Delta</SelectItem>
                    <SelectItem value="probabilityOfProfit">Profit Probability</SelectItem>
                    <SelectItem value="riskRewardRatio">Risk/Reward</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                >
                  {sortDirection === 'desc' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                </Button>
              </div>

              {/* Table */}
              <div className="rounded-lg border overflow-hidden">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p className="text-gray-600">Analyzing market opportunities...</p>
                  </div>
                ) : filteredAndSortedOpportunities.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No opportunities found matching your criteria.</p>
                  </div>
                ) : (
                  <OpportunitiesTable opportunities={filteredAndSortedOpportunities} />
                )}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function OpportunitiesTable({ opportunities }: { opportunities: TradeOpportunity[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr className="text-xs text-gray-600">
            <th className="px-3 py-2 text-left font-medium">Symbol</th>
            <th className="px-3 py-2 text-left font-medium">Strategy</th>
            <th className="px-3 py-2 text-right font-medium">Bid/Ask/Last</th>
            <th className="px-3 py-2 text-right font-medium">Strike</th>
            <th className="px-3 py-2 text-right font-medium">Vol/OI</th>
            <th className="px-3 py-2 text-right font-medium">Greeks</th>
            <th className="px-3 py-2 text-right font-medium">Score</th>
            <th className="px-3 py-2 text-center font-medium">Details</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity, index) => (
            <OpportunityRow key={opportunity.id} opportunity={opportunity} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OpportunityRow({ opportunity, index }: { opportunity: TradeOpportunity; index: number }) {
  const [showDetails, setShowDetails] = useState(false)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-green-600 bg-green-50'
      case 'put': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="border-b hover:bg-gray-50 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            {opportunity.inPortfolio && <Star className="h-3 w-3 text-yellow-500" />}
            <div>
              <div className="font-medium text-sm">{opportunity.symbol}</div>
              <div className="text-xs text-gray-500 truncate max-w-20">{opportunity.companyName}</div>
              <div className="text-xs text-blue-600 font-medium">${opportunity.currentPrice?.toFixed(2) || 'N/A'}</div>
            </div>
          </div>
        </td>
        
        <td className="px-3 py-2">
          <div className="flex flex-col gap-1">
            <Badge className={`text-xs px-1 py-0 ${getTypeColor(opportunity.type)}`}>
              {opportunity.type.toUpperCase()}
            </Badge>
            <div className="text-xs text-gray-600">{opportunity.strategy}</div>
          </div>
        </td>
        
        <td className="px-3 py-2 text-right">
          <div className="text-sm space-y-0.5">
            <div className="text-green-600">${opportunity.bid}</div>
            <div className="text-red-600">${opportunity.ask}</div>
            <div className="font-medium">${opportunity.last}</div>
          </div>
        </td>
        
        <td className="px-3 py-2 text-right">
          <div className="text-sm">
            <div className="font-medium">${opportunity.strike}</div>
            <div className="text-xs text-gray-500">{opportunity.daysToExpiry}d</div>
          </div>
        </td>
        
        <td className="px-3 py-2 text-right">
          <div className="text-sm space-y-0.5">
            <div className="flex items-center justify-end gap-1">
              <Volume2 className="h-3 w-3 text-gray-400" />
              {opportunity.volume.toLocaleString()}
            </div>
            <div className="flex items-center justify-end gap-1">
              <Eye className="h-3 w-3 text-gray-400" />
              {opportunity.openInterest.toLocaleString()}
            </div>
          </div>
        </td>
        
        <td className="px-3 py-2 text-right">
          <TooltipProvider>
            <div className="text-xs space-y-0.5">
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex justify-between">
                    <span>Δ:</span>
                    <span>{opportunity.delta.toFixed(3)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delta: Price sensitivity to underlying movement</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex justify-between">
                    <span>Θ:</span>
                    <span>{opportunity.theta.toFixed(3)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Theta: Time decay per day</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </td>
        
        <td className="px-3 py-2 text-right">
          <div className="flex flex-col items-end gap-1">
            <div className={`text-sm font-bold ${
              opportunity.opportunityScore >= 80 ? 'text-green-600' :
              opportunity.opportunityScore >= 60 ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {opportunity.opportunityScore}
            </div>
            <div className="text-xs text-gray-500">
              {(opportunity.probabilityOfProfit || 0).toFixed(0)}% PoP
            </div>
          </div>
        </td>
        
        <td className="px-3 py-2 text-center">
          <Button variant="ghost" size="sm">
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <Info className="h-4 w-4" />}
          </Button>
        </td>
      </motion.tr>

      {/* Details Row */}
      <AnimatePresence>
        {showDetails && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50"
          >
            <td colSpan={8} className="px-3 py-4">
              <OpportunityDetails opportunity={opportunity} />
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  )
}

function OpportunityDetails({ opportunity }: { opportunity: TradeOpportunity }) {
  return (
    <div className="space-y-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <h4 className="font-medium text-sm mb-2">Risk/Reward</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Max Profit:</span>
              <span className="text-green-600 font-medium">${opportunity.maxProfit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Loss:</span>
              <span className="text-red-600 font-medium">${opportunity.maxLoss}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Risk/Reward:</span>
              <span className="font-medium">{opportunity.riskRewardRatio.toFixed(2)}:1</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-sm mb-2">Greeks</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Delta:</span>
              <span className="font-medium">{opportunity.delta.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Gamma:</span>
              <span className="font-medium">{opportunity.gamma.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Vega:</span>
              <span className="font-medium">{opportunity.vega.toFixed(3)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-sm mb-2">Volatility</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">IV:</span>
              <span className="font-medium">{(opportunity.impliedVolatility * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Liquidity:</span>
              <span className={`font-medium ${
                opportunity.liquidityScore >= 80 ? 'text-green-600' : 
                opportunity.liquidityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {opportunity.liquidityScore}/100
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-sm mb-2">Timing</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Expiration:</span>
              <span className="font-medium">{opportunity.expiration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Timing Score:</span>
              <span className={`font-medium ${
                opportunity.timingScore >= 80 ? 'text-green-600' : 
                opportunity.timingScore >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {opportunity.timingScore}/100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div>
        <h4 className="font-medium text-sm mb-2">Analysis & Reasoning</h4>
        <p className="text-sm text-gray-700 mb-3">{opportunity.reasoning}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-sm text-green-700 mb-1">Catalysts</h5>
            <ul className="text-sm text-gray-600 space-y-0.5">
              {opportunity.catalysts.map((catalyst, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">•</span>
                  {catalyst}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-sm text-red-700 mb-1">Risk Factors</h5>
            <ul className="text-sm text-gray-600 space-y-0.5">
              {opportunity.risks.map((risk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Sources */}
      <div>
        <h4 className="font-medium text-sm mb-2">Sources & References</h4>
        <div className="flex flex-wrap gap-2">
          {opportunity.sources.map((source, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {source}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DailyTradeOpportunities