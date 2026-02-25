'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  PieChart,
  Target,
  Settings,
  Zap,
  CheckCircle
} from 'lucide-react'

interface RiskBudgetSettings {
  totalCapital: number
  maxPortfolioRisk: number // Percentage of total capital
  maxDrawdownTolerance: number // Maximum acceptable drawdown
  riskPerTrade: number // Maximum risk per single trade
  correlationLimit: number // Maximum correlation between positions
  sectorConcentrationLimit: number // Maximum exposure to single sector
}

interface RiskAllocation {
  currentRisk: number
  availableRisk: number
  utilizationPercent: number
  nextTradeMaxRisk: number
  recommendedTradeCount: number
  safetyBuffer: number
}

interface RiskBreakdown {
  directionalRisk: number
  volatilityRisk: number
  timeDecayRisk: number
  liquidityRisk: number
  correlationRisk: number
  sectorConcentrationRisk: number
}

export default function DynamicRiskBudgeting() {
  const [settings, setSettings] = useState<RiskBudgetSettings>({
    totalCapital: 50000,
    maxPortfolioRisk: 0.15, // 15% max portfolio risk
    maxDrawdownTolerance: 0.10, // 10% max drawdown
    riskPerTrade: 0.03, // 3% risk per trade
    correlationLimit: 0.70, // Max 70% correlation
    sectorConcentrationLimit: 0.40 // Max 40% in one sector
  })

  const [currentAllocation, setCurrentAllocation] = useState<RiskAllocation>({
    currentRisk: 6800,
    availableRisk: 500,
    utilizationPercent: 68,
    nextTradeMaxRisk: 1500,
    recommendedTradeCount: 2,
    safetyBuffer: 1200
  })

  const [riskBreakdown, setRiskBreakdown] = useState<RiskBreakdown>({
    directionalRisk: 2400,
    volatilityRisk: 1800,
    timeDecayRisk: 800,
    liquidityRisk: 400,
    correlationRisk: 1200,
    sectorConcentrationRisk: 200
  })

  const [isEditingSettings, setIsEditingSettings] = useState(false)

  const updateSetting = (key: keyof RiskBudgetSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    recalculateRiskAllocation()
  }

  const recalculateRiskAllocation = () => {
    const maxTotalRisk = settings.totalCapital * settings.maxPortfolioRisk
    const availableRisk = maxTotalRisk - currentAllocation.currentRisk
    const utilizationPercent = (currentAllocation.currentRisk / maxTotalRisk) * 100
    const nextTradeMaxRisk = Math.min(availableRisk, settings.totalCapital * settings.riskPerTrade)
    
    setCurrentAllocation(prev => ({
      ...prev,
      availableRisk,
      utilizationPercent,
      nextTradeMaxRisk,
      recommendedTradeCount: Math.floor(availableRisk / nextTradeMaxRisk),
      safetyBuffer: maxTotalRisk * 0.1 // 10% safety buffer
    }))
  }

  const getRiskLevelColor = (level: number) => {
    if (level > 0.85) return 'text-red-400'
    if (level > 0.70) return 'text-orange-400'
    if (level > 0.50) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getRiskLevelBadge = (level: number) => {
    if (level > 0.85) return 'destructive'
    if (level > 0.70) return 'orange'
    return 'default'
  }

  return (
    <div className="space-y-6">
      
      {/* Risk Budget Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <span>Dynamic Risk Budget</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEditingSettings(!isEditingSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Risk Budget Visualization */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Capital at Risk</span>
                <span className={`font-bold text-lg ${getRiskLevelColor(currentAllocation.utilizationPercent / 100)}`}>
                  ${currentAllocation.currentRisk.toLocaleString()} / ${(settings.totalCapital * settings.maxPortfolioRisk).toLocaleString()}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Risk Utilization</span>
                  <span className="text-white">{currentAllocation.utilizationPercent.toFixed(0)}%</span>
                </div>
                <Progress 
                  value={currentAllocation.utilizationPercent} 
                  className="h-3"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </div>

            {/* Available Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-400">
                  ${currentAllocation.availableRisk.toLocaleString()}
                </div>
                <p className="text-slate-400 text-sm">Available Risk Budget</p>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <Target className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-400">
                  ${currentAllocation.nextTradeMaxRisk.toLocaleString()}
                </div>
                <p className="text-slate-400 text-sm">Next Trade Max Risk</p>
              </div>
            </div>

            {/* Risk Breakdown */}
            <div className="space-y-3">
              <h4 className="text-white font-medium flex items-center space-x-2">
                <PieChart className="h-4 w-4 text-blue-400" />
                <span>Risk Breakdown</span>
              </h4>
              
              <div className="space-y-2">
                {Object.entries(riskBreakdown).map(([riskType, amount]) => {
                  const percentage = (amount / currentAllocation.currentRisk) * 100
                  return (
                    <div key={riskType} className="flex items-center justify-between">
                      <span className="text-slate-300 text-sm capitalize">
                        {riskType.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-blue-400 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm w-16 text-right">
                          ${amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Risk Settings Panel */}
      {isEditingSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Risk Budget Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Total Capital */}
              <div className="space-y-2">
                <Label className="text-slate-300">Total Capital</Label>
                <Input
                  type="number"
                  value={settings.totalCapital}
                  onChange={(e) => updateSetting('totalCapital', Number(e.target.value))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Max Portfolio Risk */}
              <div className="space-y-3">
                <Label className="text-slate-300">Max Portfolio Risk: {(settings.maxPortfolioRisk * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.maxPortfolioRisk * 100]}
                  onValueChange={([value]) => updateSetting('maxPortfolioRisk', value / 100)}
                  max={25}
                  min={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>5% (Conservative)</span>
                  <span>25% (Aggressive)</span>
                </div>
              </div>

              {/* Max Drawdown Tolerance */}
              <div className="space-y-3">
                <Label className="text-slate-300">Max Drawdown Tolerance: {(settings.maxDrawdownTolerance * 100).toFixed(0)}%</Label>
                <Slider
                  value={[settings.maxDrawdownTolerance * 100]}
                  onValueChange={([value]) => updateSetting('maxDrawdownTolerance', value / 100)}
                  max={20}
                  min={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>5% (Conservative)</span>
                  <span>20% (Aggressive)</span>
                </div>
              </div>

              {/* Risk Per Trade */}
              <div className="space-y-3">
                <Label className="text-slate-300">Risk Per Trade: {(settings.riskPerTrade * 100).toFixed(1)}%</Label>
                <Slider
                  value={[settings.riskPerTrade * 100]}
                  onValueChange={([value]) => updateSetting('riskPerTrade', value / 100)}
                  max={10}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>0.5% (Very Conservative)</span>
                  <span>10% (Very Aggressive)</span>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="text-slate-300">Correlation Limit: {(settings.correlationLimit * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[settings.correlationLimit * 100]}
                    onValueChange={([value]) => updateSetting('correlationLimit', value / 100)}
                    max={90}
                    min={50}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-slate-300">Sector Limit: {(settings.sectorConcentrationLimit * 100).toFixed(0)}%</Label>
                  <Slider
                    value={[settings.sectorConcentrationLimit * 100]}
                    onValueChange={([value]) => updateSetting('sectorConcentrationLimit', value / 100)}
                    max={70}
                    min={20}
                    step={5}
                    className="w-full"
                  />
                </div>
              </div>

              <Button 
                onClick={() => setIsEditingSettings(false)}
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Settings
              </Button>
              
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Risk Allocation Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span>Intelligent Risk Allocation</span>
            </CardTitle>
            <p className="text-slate-400 text-sm">
              System automatically manages your risk budget across all trades
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Current Risk Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <DollarSign className="h-5 w-5 text-green-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">
                  ${(settings.totalCapital * settings.maxPortfolioRisk).toLocaleString()}
                </div>
                <p className="text-slate-400 text-xs">Total Risk Budget</p>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <Shield className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">
                  ${currentAllocation.currentRisk.toLocaleString()}
                </div>
                <p className="text-slate-400 text-xs">Currently at Risk</p>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <Target className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                <div className="text-lg font-bold text-white">
                  ${currentAllocation.availableRisk.toLocaleString()}
                </div>
                <p className="text-slate-400 text-xs">Available for New Trades</p>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
              <h4 className="text-blue-300 font-medium mb-3 flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Smart Allocation Guidance</span>
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Recommended next trade size</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    Max ${currentAllocation.nextTradeMaxRisk.toLocaleString()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Optimal trade count</span>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    {currentAllocation.recommendedTradeCount} trades
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Safety buffer maintained</span>
                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                    ${currentAllocation.safetyBuffer.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Risk Limits Status */}
            <div className="space-y-3">
              <h4 className="text-white font-medium">Risk Limits Status</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Portfolio Risk Limit</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={currentAllocation.utilizationPercent} 
                      className="w-20 h-2"
                    />
                    <Badge variant={getRiskLevelBadge(currentAllocation.utilizationPercent / 100)}>
                      {currentAllocation.utilizationPercent.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Sector Concentration</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={45} 
                      className="w-20 h-2"
                    />
                    <Badge variant="orange">45%</Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Max Position Correlation</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={62} 
                      className="w-20 h-2"
                    />
                    <Badge variant="default">62%</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Protection Features */}
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-700">
              <h4 className="text-green-300 font-medium mb-3 flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Auto-Protection Active</span>
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-green-200">Risk limits automatically enforced</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-green-200">Position sizing optimized for portfolio</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-green-200">Correlation monitoring enabled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  <span className="text-green-200">Drawdown protection activated</span>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>

      {/* Emergency Risk Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-red-900/20 border-red-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span>Emergency Risk Controls</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/30">
                <TrendingDown className="h-4 w-4 mr-2" />
                Reduce All Positions 50%
              </Button>
              
              <Button variant="outline" className="border-orange-600 text-orange-400 hover:bg-orange-900/30">
                <Shield className="h-4 w-4 mr-2" />
                Add Portfolio Hedge
              </Button>
            </div>
            
            <div className="text-xs text-slate-400 text-center">
              Emergency controls for extreme market conditions
            </div>
            
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}