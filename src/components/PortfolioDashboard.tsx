'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ArrowUpDown,
  AlertTriangle,
  Target
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import AddPositionForm, { type NewPositionData } from './AddPositionForm'
import { calculateGreeks, getTimeToExpiry, type GreeksInput } from '@/lib/greeks'
import { 
  formatCurrency, 
  formatPercentage, 
  getDaysToExpiry, 
  getMoneyness, 
  getPnLColor, 
  getGreekColor,
  getRiskLevel,
  getRiskColor,
  cn
} from '@/lib/utils'
import { toast } from 'react-hot-toast'

// Mock position data - replace with real data from API/database
interface Position {
  id: string
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: Date
  quantity: number
  entryPrice: number
  currentPrice: number
  entryDate: Date
  notes?: string
  tags: string[]
  unrealizedPnl: number
  totalValue: number
  daysToExpiry: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
  }
}

// Mock data - in real app, this would come from API
const mockPositions: Position[] = [
  {
    id: '1',
    symbol: 'AAPL',
    type: 'call',
    strike: 190,
    expiry: new Date('2024-03-15'),
    quantity: 5,
    entryPrice: 3.50,
    currentPrice: 4.25,
    entryDate: new Date('2024-02-01'),
    tags: ['earnings-play'],
    unrealizedPnl: 375,
    totalValue: 2125,
    daysToExpiry: 28,
    greeks: {
      delta: 0.65,
      gamma: 0.03,
      theta: -12.5,
      vega: 18.2,
      rho: 8.4
    }
  },
  {
    id: '2',
    symbol: 'TSLA',
    type: 'put',
    strike: 240,
    expiry: new Date('2024-03-01'),
    quantity: -3,
    entryPrice: 5.80,
    currentPrice: 4.10,
    entryDate: new Date('2024-01-15'),
    tags: ['hedge', 'short-vol'],
    unrealizedPnl: 510,
    totalValue: -1230,
    daysToExpiry: 14,
    greeks: {
      delta: -0.42,
      gamma: 0.025,
      theta: -15.8,
      vega: 22.1,
      rho: -6.2
    }
  }
]

type SortField = 'symbol' | 'expiry' | 'pnl' | 'value' | 'delta' | 'theta'
type SortDirection = 'asc' | 'desc'

interface PortfolioDashboardProps {
  className?: string
}

export default function PortfolioDashboard({ className }: PortfolioDashboardProps) {
  const [positions, setPositions] = useState<Position[]>(mockPositions)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('expiry')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'calls' | 'puts' | 'expiring'>('all')
  const [showAddForm, setShowAddForm] = useState(false)

  // Portfolio summary calculations
  const portfolioSummary = useMemo(() => {
    const totalPositions = positions?.length || 0
    const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0)
    const totalValue = positions.reduce((sum, pos) => sum + Math.abs(pos.totalValue), 0)
    const totalDelta = positions.reduce((sum, pos) => sum + (pos.greeks.delta * pos.quantity * 100), 0)
    const totalGamma = positions.reduce((sum, pos) => sum + (pos.greeks.gamma * pos.quantity * 100), 0)
    const totalTheta = positions.reduce((sum, pos) => sum + (pos.greeks.theta * pos.quantity), 0)
    const totalVega = positions.reduce((sum, pos) => sum + (pos.greeks.vega * pos.quantity), 0)
    
    const expiringCount = positions.filter(pos => pos.daysToExpiry <= 7)?.length || 0

    return {
      totalPositions,
      totalPnL,
      totalValue,
      totalDelta,
      totalGamma,
      totalTheta,
      totalVega,
      expiringCount,
      pnlPercentage: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0
    }
  }, [positions])

  // Filter and sort positions
  const filteredAndSortedPositions = useMemo(() => {
    let filtered = positions

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(pos => 
        pos.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pos.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply type filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'calls') {
        filtered = filtered.filter(pos => pos.type === 'call')
      } else if (selectedFilter === 'puts') {
        filtered = filtered.filter(pos => pos.type === 'put')
      } else if (selectedFilter === 'expiring') {
        filtered = filtered.filter(pos => pos.daysToExpiry <= 7)
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortField) {
        case 'symbol':
          aVal = a.symbol
          bVal = b.symbol
          break
        case 'expiry':
          aVal = a.daysToExpiry
          bVal = b.daysToExpiry
          break
        case 'pnl':
          aVal = a.unrealizedPnl
          bVal = b.unrealizedPnl
          break
        case 'value':
          aVal = Math.abs(a.totalValue)
          bVal = Math.abs(b.totalValue)
          break
        case 'delta':
          aVal = Math.abs(a.greeks.delta)
          bVal = Math.abs(b.greeks.delta)
          break
        case 'theta':
          aVal = a.greeks.theta
          bVal = b.greeks.theta
          break
        default:
          return 0
      }

      if (typeof aVal === 'string') {
        const comparison = aVal.localeCompare(bVal)
        return sortDirection === 'asc' ? comparison : -comparison
      } else {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
    })

    return filtered
  }, [positions, searchTerm, selectedFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleAddPosition = async (positionData: NewPositionData) => {
    try {
      // In real app, this would be an API call
      const newPosition: Position = {
        id: Date.now().toString(),
        symbol: positionData.symbol,
        type: positionData.type,
        strike: positionData.strike,
        expiry: new Date(positionData.expiry),
        quantity: positionData.quantity,
        entryPrice: positionData.entryPrice,
        currentPrice: positionData.entryPrice, // Mock current price
        entryDate: new Date(positionData.entryDate),
        notes: positionData.notes,
        tags: positionData.tags,
        unrealizedPnl: 0, // Will be calculated
        totalValue: positionData.entryPrice * positionData.quantity * 100,
        daysToExpiry: getDaysToExpiry(new Date(positionData.expiry)),
        greeks: {
          delta: 0.5,
          gamma: 0.02,
          theta: -10,
          vega: 15,
          rho: 5
        }
      }

      setPositions(prev => [...prev, newPosition])
      toast.success('Position added successfully!')
    } catch (error) {
      console.error('Failed to add position:', error)
      throw error
    }
  }

  const getSortIcon = (field: SortField) => (
    <ArrowUpDown 
      className={cn(
        "h-4 w-4 ml-1 opacity-50 hover:opacity-100 transition-opacity",
        sortField === field && "opacity-100"
      )} 
    />
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Positions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Positions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {portfolioSummary.totalPositions}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total P&L */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total P&L
                </p>
                <p className={cn("text-2xl font-bold", getPnLColor(portfolioSummary.totalPnL))}>
                  {formatCurrency(portfolioSummary.totalPnL)}
                </p>
                <p className={cn("text-sm", getPnLColor(portfolioSummary.pnlPercentage))}>
                  {formatPercentage(portfolioSummary.pnlPercentage)}
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                portfolioSummary.totalPnL >= 0 
                  ? "bg-green-100 dark:bg-green-900/20" 
                  : "bg-red-100 dark:bg-red-900/20"
              )}>
                {portfolioSummary.totalPnL >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Delta */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Portfolio Delta
                </p>
                <p className={cn("text-2xl font-bold", getGreekColor('delta', portfolioSummary.totalDelta))}>
                  {portfolioSummary.totalDelta.toFixed(0)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Directional exposure
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Theta */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Daily Theta
                </p>
                <p className={cn("text-2xl font-bold", getGreekColor('theta', portfolioSummary.totalTheta))}>
                  {formatCurrency(portfolioSummary.totalTheta)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Time decay per day
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Positions</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage your options positions
              </p>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Position</span>
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by symbol or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'calls', label: 'Calls' },
                { key: 'puts', label: 'Puts' },
                { key: 'expiring', label: 'Expiring Soon' }
              ].map(filter => (
                <Button
                  key={filter.key}
                  variant={selectedFilter === filter.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.key as any)}
                >
                  {filter.label}
                  {filter.key === 'expiring' && portfolioSummary.expiringCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {portfolioSummary.expiringCount}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Positions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => handleSort('symbol')}
                  >
                    <div className="flex items-center">
                      Symbol
                      {getSortIcon('symbol')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Strike
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => handleSort('expiry')}
                  >
                    <div className="flex items-center">
                      Expiry
                      {getSortIcon('expiry')}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Qty
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => handleSort('pnl')}
                  >
                    <div className="flex items-center justify-end">
                      P&L
                      {getSortIcon('pnl')}
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => handleSort('delta')}
                  >
                    <div className="flex items-center justify-end">
                      Delta
                      {getSortIcon('delta')}
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white"
                    onClick={() => handleSort('theta')}
                  >
                    <div className="flex items-center justify-end">
                      Theta
                      {getSortIcon('theta')}
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedPositions.map((position) => {
                  const currentPrice = 185 // Mock current price
                  const moneyness = getMoneyness(position.type, position.strike, currentPrice)
                  
                  return (
                    <motion.tr
                      key={position.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {position.symbol}
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            moneyness === 'ITM' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                            moneyness === 'ATM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          )}>
                            {moneyness}
                          </span>
                        </div>
                        {position.tags?.length || 0 > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {position.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400"
                              >
                                {tag}
                              </span>
                            ))}
                            {position.tags?.length || 0 > 2 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{position.tags?.length || 0 - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {position.type === 'call' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={cn(
                            "font-medium",
                            position.type === 'call' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {position.type.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-900 dark:text-white">
                        ${position.strike.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <span className="text-gray-900 dark:text-white">
                            {position.expiry.toLocaleDateString()}
                          </span>
                          <div className={cn(
                            "text-xs mt-1",
                            position.daysToExpiry <= 7 ? 'text-red-600' :
                            position.daysToExpiry <= 30 ? 'text-yellow-600' :
                            'text-gray-500'
                          )}>
                            {position.daysToExpiry}d to expiry
                            {position.daysToExpiry <= 7 && (
                              <AlertTriangle className="h-3 w-3 inline ml-1" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "font-medium",
                          position.quantity > 0 ? 'text-green-600' : 'text-red-600'
                        )}>
                          {position.quantity > 0 ? '+' : ''}{position.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className={cn("font-semibold", getPnLColor(position.unrealizedPnl))}>
                          {formatCurrency(position.unrealizedPnl)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatCurrency(Math.abs(position.totalValue))} value
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn(
                          "font-mono font-medium",
                          getGreekColor('delta', position.greeks.delta)
                        )}>
                          {position.greeks.delta.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn(
                          "font-mono font-medium",
                          getGreekColor('theta', position.greeks.theta)
                        )}>
                          {position.greeks.theta.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
            
            {(filteredAndSortedPositions?.length || 0) === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {searchTerm || selectedFilter !== 'all' ? 'No positions match your filters' : 'No positions yet'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                  {searchTerm || selectedFilter !== 'all' ? 'Try adjusting your search or filters' : 'Add your first position to get started'}
                </p>
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Position
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Position Modal */}
      <AddPositionForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddPosition}
      />
    </div>
  )
}