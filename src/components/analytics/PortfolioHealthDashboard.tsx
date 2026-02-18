'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Target,
  Eye,
  Activity,
  BarChart3,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface PortfolioHealthProps {
  healthData: PortfolioHealthData
  riskExposure: RiskExposureData
  worstCaseScenarios: WorstCaseScenario[]
  actionableGuidance: ActionableGuidance[]
  onRefresh?: () => void
  className?: string
}

interface PortfolioHealthData {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  healthScore: number
  totalValue: number
  dailyPnL: number
  riskFactors: RiskFactor[]
  opportunities: number
  lastUpdated: Date
}

interface RiskExposureData {
  directionalBias: {
    netDelta: number
    bias: 'strongly_bullish' | 'bullish' | 'neutral' | 'bearish' | 'strongly_bearish'
    sensitivity1Percent: number
  }
  volatilityExposure: {
    netVega: number
    volBias: 'long_vol' | 'short_vol' | 'neutral'
    sensitivity10PercVol: number
  }
  timeDecayPressure: {
    dailyTheta: number
    daysUntilBreakeven: number
  }
  tailRisk: {
    var95: number
    blackSwanExposure: number
  }
}

interface WorstCaseScenario {
  name: string
  description: string
  probability: number
  estimatedLoss: number
  plainEnglish: string
  mitigationActions: string[]
}

interface ActionableGuidance {
  situation: string
  immediateAction: string
  reasoning: string
  timeframe: string
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
  expectedOutcome: string
}

interface RiskFactor {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  impact: string
  recommendation: string
}

export default function PortfolioHealthDashboard({
  healthData,
  riskExposure,
  worstCaseScenarios,
  actionableGuidance,
  onRefresh,
  className
}: PortfolioHealthProps) {
  const [selectedScenario, setSelectedScenario] = useState<WorstCaseScenario | null>(null)
  const [showAllGuidance, setShowAllGuidance] = useState(false)

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-600 bg-green-100 border-green-200'
      case 'good': return 'text-blue-600 bg-blue-100 border-blue-200'
      case 'fair': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'poor': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent': return <CheckCircle className="h-6 w-6" />
      case 'good': return <CheckCircle className="h-6 w-6" />
      case 'fair': return <AlertCircle className="h-6 w-6" />
      case 'poor': return <AlertTriangle className="h-6 w-6" />
      case 'critical': return <XCircle className="h-6 w-6" />
      default: return <Activity className="h-6 w-6" />
    }
  }

  const getBiasColor = (bias: string) => {
    switch (bias) {
      case 'strongly_bullish': return 'text-green-700 bg-green-100'
      case 'bullish': return 'text-green-600 bg-green-50'
      case 'neutral': return 'text-gray-600 bg-gray-100'
      case 'bearish': return 'text-red-600 bg-red-50'
      case 'strongly_bearish': return 'text-red-700 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const criticalGuidance = actionableGuidance.filter(g => g.riskLevel === 'Critical' || g.riskLevel === 'High')
  const displayedGuidance = showAllGuidance ? actionableGuidance : criticalGuidance.slice(0, 3)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Portfolio Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Overall Health */}
        <Card className={cn("border-2", getHealthColor(healthData.overallHealth))}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-80">Portfolio Health</p>
                <p className="text-2xl font-bold capitalize">{healthData.overallHealth}</p>
                <p className="text-sm opacity-70 mt-1">{healthData.healthScore}/100</p>
              </div>
              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", 
                getHealthColor(healthData.overallHealth))}>
                {getHealthIcon(healthData.overallHealth)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Value */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold">${healthData.totalValue.toLocaleString()}</p>
                <p className={cn("text-sm mt-1", 
                  healthData.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  {healthData.dailyPnL >= 0 ? '+' : ''}${healthData.dailyPnL.toFixed(0)} today
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Risk Factors</p>
                <p className="text-2xl font-bold">{healthData.riskFactors.length}</p>
                <p className="text-sm mt-1 text-gray-500">
                  {healthData.riskFactors.filter(rf => rf.severity === 'critical' || rf.severity === 'high').length} high/critical
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Opportunities</p>
                <p className="text-2xl font-bold text-green-600">{healthData.opportunities}</p>
                <p className="text-sm mt-1 text-gray-500">High-grade available</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Exposure Map */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>🛡️ Risk Exposure Map</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time view of your portfolio's key risk factors
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Directional Bias */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Directional Bias</h4>
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              
              <div className="space-y-2">
                <div className={cn("px-3 py-1 rounded-full text-sm font-medium inline-block", 
                  getBiasColor(riskExposure.directionalBias.bias))}>
                  {riskExposure.directionalBias.bias.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Net Delta: {riskExposure.directionalBias.netDelta.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  1% move = ${riskExposure.directionalBias.sensitivity1Percent.toFixed(0)} P&L
                </div>
              </div>
            </div>

            {/* Volatility Exposure */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Volatility Exposure</h4>
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              
              <div className="space-y-2">
                <div className={cn("px-3 py-1 rounded-full text-sm font-medium inline-block",
                  riskExposure.volatilityExposure.volBias === 'long_vol' ? 'text-green-600 bg-green-100' :
                  riskExposure.volatilityExposure.volBias === 'short_vol' ? 'text-red-600 bg-red-100' :
                  'text-gray-600 bg-gray-100'
                )}>
                  {riskExposure.volatilityExposure.volBias.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Net Vega: {riskExposure.volatilityExposure.netVega.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  10% vol change = ${riskExposure.volatilityExposure.sensitivity10PercVol.toFixed(0)} P&L
                </div>
              </div>
            </div>

            {/* Time Decay */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Time Decay</h4>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              
              <div className="space-y-2">
                <div className={cn("px-3 py-1 rounded-full text-sm font-medium inline-block",
                  riskExposure.timeDecayPressure.dailyTheta < -50 ? 'text-red-600 bg-red-100' :
                  riskExposure.timeDecayPressure.dailyTheta < 0 ? 'text-yellow-600 bg-yellow-100' :
                  'text-green-600 bg-green-100'
                )}>
                  {riskExposure.timeDecayPressure.dailyTheta < -50 ? 'High' :
                   riskExposure.timeDecayPressure.dailyTheta < 0 ? 'Medium' : 'Low'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Daily Theta: ${riskExposure.timeDecayPressure.dailyTheta.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  Breakeven: {riskExposure.timeDecayPressure.daysUntilBreakeven} days
                </div>
              </div>
            </div>

            {/* Tail Risk */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Tail Risk</h4>
                <Activity className="h-5 w-5 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <div className={cn("px-3 py-1 rounded-full text-sm font-medium inline-block",
                  Math.abs(riskExposure.tailRisk.var95) > 5000 ? 'text-red-600 bg-red-100' :
                  Math.abs(riskExposure.tailRisk.var95) > 2000 ? 'text-yellow-600 bg-yellow-100' :
                  'text-green-600 bg-green-100'
                )}>
                  {Math.abs(riskExposure.tailRisk.var95) > 5000 ? 'High' :
                   Math.abs(riskExposure.tailRisk.var95) > 2000 ? 'Medium' : 'Low'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  95% VaR: ${riskExposure.tailRisk.var95.toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">
                  Black swan: ${riskExposure.tailRisk.blackSwanExposure.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What Could Hurt You Most Right Now */}
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔥 What Could Hurt You Most Right Now?</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {worstCaseScenarios.map((scenario, index) => (
              <motion.div
                key={scenario.name}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                  selectedScenario?.name === scenario.name ? "ring-2 ring-orange-500 border-orange-300" : "border-gray-200"
                )}
                onClick={() => setSelectedScenario(selectedScenario?.name === scenario.name ? null : scenario)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{scenario.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      ${Math.abs(scenario.estimatedLoss).toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {(scenario.probability * 100).toFixed(1)}% prob
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedScenario?.name === scenario.name && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 pt-3 mt-3"
                    >
                      <div className="space-y-3">
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                          <h5 className="font-medium text-orange-900 dark:text-orange-200 mb-2">
                            Plain English Impact:
                          </h5>
                          <p className="text-sm text-orange-800 dark:text-orange-300">
                            {scenario.plainEnglish}
                          </p>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                            What You Can Do:
                          </h5>
                          <ul className="space-y-1">
                            {scenario.mitigationActions.map((action, i) => (
                              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actionable Guidance */}
      {displayedGuidance.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Immediate Actions Required</span>
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {criticalGuidance.length} critical actions • Updated {healthData.lastUpdated.toLocaleTimeString()}
                </p>
              </div>
              {actionableGuidance.length > displayedGuidance.length && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllGuidance(!showAllGuidance)}
                >
                  {showAllGuidance ? 'Show Less' : `Show All (${actionableGuidance.length})`}
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {displayedGuidance.map((guidance, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-l-4",
                    guidance.riskLevel === 'Critical' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                    guidance.riskLevel === 'High' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' :
                    guidance.riskLevel === 'Medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                    'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  )}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {guidance.immediateAction}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {guidance.situation}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={cn("px-2 py-1 rounded text-xs font-medium",
                        guidance.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                        guidance.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' :
                        guidance.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      )}>
                        {guidance.riskLevel}
                      </span>
                      <span className="text-xs text-gray-500">{guidance.timeframe}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Why:</span>
                      <p className="text-gray-600 dark:text-gray-400">{guidance.reasoning}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Expected Result:</span>
                      <p className="text-gray-600 dark:text-gray-400">{guidance.expectedOutcome}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors Detail */}
      {healthData.riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Factors Breakdown</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {healthData.riskFactors.map((factor, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "p-4 rounded-lg border-l-4",
                    factor.severity === 'critical' ? 'border-red-500 bg-red-50' :
                    factor.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                    factor.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-gray-500 bg-gray-50'
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{factor.type.replace('_', ' ')}</h4>
                        <span className={cn("px-2 py-1 rounded text-xs font-medium capitalize",
                          factor.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          factor.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          factor.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {factor.severity}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">{factor.description}</p>
                      <p className="text-sm text-gray-600 mb-2">{factor.impact}</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Recommendation:</span>
                        <Button variant="outline" size="sm" className="ml-4">
                          Apply Fix
                        </Button>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">{factor.recommendation}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">High-Quality Opportunities</h3>
            <p className="text-3xl font-bold text-green-600 mb-2">{healthData.opportunities}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              S-grade and A-grade setups available for entry
            </p>
            <Button className="w-full mt-4" size="sm">
              View Opportunities
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Risk Management</h3>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {healthData.riskFactors.filter(rf => rf.severity === 'critical' || rf.severity === 'high').length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              High-priority risk factors requiring attention
            </p>
            <Button variant="outline" className="w-full mt-4" size="sm">
              Review Risks
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 mx-auto bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Active Monitoring</h3>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {Math.round((Date.now() - healthData.lastUpdated.getTime()) / (1000 * 60))}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Minutes since last update • Real-time tracking active
            </p>
            <Button variant="outline" className="w-full mt-4" size="sm">
              Monitoring Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}