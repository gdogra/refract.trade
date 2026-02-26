'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AlertTriangle, 
  TrendingDown, 
  Zap, 
  Shield, 
  Clock,
  Target,
  DollarSign,
  Activity,
  ArrowDown,
  BarChart3,
  Brain,
  Eye,
  AlertCircle
} from 'lucide-react'
import { AdverseScenario, WorstCaseAnalysisEngine, ScenarioImpactVisualizer } from '@/lib/analytics/whatCouldHurtYou'

interface ThreatLevel {
  level: 'minimal' | 'moderate' | 'serious' | 'critical'
  color: string
  description: string
}

export default function WhatCouldHurtYou() {
  const [scenarios, setScenarios] = useState<AdverseScenario[]>([])
  const [selectedScenario, setSelectedScenario] = useState<AdverseScenario | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>({
    level: 'moderate',
    color: 'orange',
    description: 'Some risks present but manageable'
  })

  useEffect(() => {
    loadScenarios()
  }, [])

  const loadScenarios = async () => {
    setIsLoading(true)
    
    // Mock portfolio context
    const portfolioContext = {
      totalCapital: 50000,
      positions: [
        {
          symbol: 'AAPL',
          strategy: 'Iron Condor',
          risk: 2500,
          marketValue: 2400,
          sector: 'technology',
          daysInTrade: 12
        },
        {
          symbol: 'NVDA',
          strategy: 'Put Credit Spread',
          risk: 1500,
          marketValue: 1320,
          sector: 'technology',
          daysInTrade: 8
        }
      ],
      sectorExposures: { technology: 0.62, financials: 0.20, energy: 0.18 }
    }

    const marketConditions = {
      vixLevel: 18,
      trend: 'neutral',
      volatilityRegime: 'normal'
    }

    const engine = new WorstCaseAnalysisEngine()
    const analysisResults = await engine.analyzeWorstCaseScenarios(portfolioContext, marketConditions)
    
    setScenarios(analysisResults)
    setSelectedScenario(analysisResults[0])
    setThreatLevel(calculateOverallThreatLevel(analysisResults))
    setIsLoading(false)
  }

  const calculateOverallThreatLevel = (scenarios: AdverseScenario[]): ThreatLevel => {
    const maxLoss = Math.max(...scenarios.map(s => s.potentialLoss))
    const highProbabilityLoss = scenarios
      .filter(s => s.probability > 0.15)
      .reduce((max, s) => Math.max(max, s.potentialLoss), 0)

    if (maxLoss > 15000 || highProbabilityLoss > 8000) {
      return { level: 'critical', color: 'red', description: 'Significant threats require immediate attention' }
    }
    if (maxLoss > 8000 || highProbabilityLoss > 4000) {
      return { level: 'serious', color: 'orange', description: 'Material risks present - consider protective measures' }
    }
    if (maxLoss > 3000) {
      return { level: 'moderate', color: 'yellow', description: 'Some risks present but manageable' }
    }
    return { level: 'minimal', color: 'green', description: 'Low risk environment - portfolio well protected' }
  }

  const getThreatColorClasses = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'border-red-500 bg-red-900/20'
      case 'high': return 'border-orange-500 bg-orange-900/20'
      case 'medium': return 'border-yellow-500 bg-yellow-900/20'
      default: return 'border-blue-500 bg-blue-900/20'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="h-32 bg-slate-700 rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Header with Overall Threat Assessment */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className={`border-2 ${getThreatColorClasses(threatLevel.level)} bg-gradient-to-r from-slate-800 to-slate-700`}>
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className={`h-6 w-6 text-${threatLevel.color}-400`} />
                <span>What Could Hurt You Most Right Now?</span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-${threatLevel.color}-400 border-${threatLevel.color}-400 text-lg px-4 py-1`}
              >
                {threatLevel.level.toUpperCase()}
              </Badge>
            </CardTitle>
            <p className="text-slate-300">{threatLevel.description}</p>
          </CardHeader>
          <CardContent>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <TrendingDown className="h-5 w-5 text-red-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-red-400">
                  ${Math.max(...scenarios.map(s => s.potentialLoss)).toLocaleString()}
                </div>
                <p className="text-slate-400 text-sm">Max Loss Scenario</p>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <Activity className="h-5 w-5 text-orange-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-orange-400">
                  {scenarios?.length || 0 > 0 && scenarios.some(s => s.probability != null) 
                    ? (Math.max(...scenarios.map(s => s.probability || 0)) * 100).toFixed(0)
                    : '0'
                  }%
                </div>
                <p className="text-slate-400 text-sm">Highest Probability</p>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <Shield className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-blue-400">
                  ${Math.min(...scenarios.map(s => s.mitigation.cost)).toLocaleString()}
                </div>
                <p className="text-slate-400 text-sm">Cheapest Protection</p>
              </div>
              
              <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                <Clock className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-purple-400">
                  {scenarios.filter(s => s.urgency === 'critical' || s.urgency === 'high')?.length || 0}
                </div>
                <p className="text-slate-400 text-sm">Urgent Threats</p>
              </div>
            </div>

            {/* Most Dangerous Scenario Spotlight */}
            {selectedScenario && (
              <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 p-6 rounded-lg border border-red-700">
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{selectedScenario.name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-red-400 border-red-400">
                        {selectedScenario.urgency.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-orange-400 border-orange-400">
                        {((selectedScenario.probability || 0) * 100).toFixed(0)}% chance
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-lg">
                    <p className="text-slate-200 leading-relaxed">
                      {selectedScenario.plainEnglishExplanation}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="text-red-300 font-medium">💥 Impact Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Potential Loss</span>
                          <span className="text-red-400 font-bold">${selectedScenario.potentialLoss.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Portfolio Impact</span>
                          <span className="text-red-400 font-bold">{(selectedScenario.impactAnalysis?.portfolioLossPercent || 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Recovery Time</span>
                          <span className="text-orange-400">{selectedScenario.impactAnalysis.timeToRecover}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-blue-300 font-medium">🛡️ Protection Strategy</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Protection Cost</span>
                          <span className="text-blue-400 font-bold">${selectedScenario.mitigation.cost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Risk Reduction</span>
                          <span className="text-green-400 font-bold">{((selectedScenario.mitigation?.riskReduction || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-sm">Time to Implement</span>
                          <span className="text-blue-400">{selectedScenario.mitigation.timeToImplement}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
                    <h5 className="text-blue-300 font-medium mb-2">💡 Recommended Protection</h5>
                    <p className="text-blue-200 mb-3">{selectedScenario.mitigation.primary.description}</p>
                    <div className="flex space-x-3">
                      <Button 
                        onClick={() => {
                          alert(`Implementing ${selectedScenario.mitigation.primary.action}\nCost: $${selectedScenario.mitigation.cost.toLocaleString()}\nThis would connect to your broker to execute the protection strategy.`)
                        }}
                      >
                        Implement Protection ($${selectedScenario.mitigation.cost.toLocaleString()})
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-blue-600 text-blue-300"
                        onClick={() => {
                          alert(`Alternative Strategy: ${selectedScenario.mitigation.alternative.action}\nCost: $${selectedScenario.mitigation.alternative.cost.toLocaleString()}\n${selectedScenario.mitigation.alternative.description}`)
                        }}
                      >
                        Alternative: {selectedScenario.mitigation.alternative.action}
                      </Button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </motion.div>

      {/* All Scenarios Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Eye className="h-5 w-5 text-blue-400" />
              <span>Complete Threat Analysis</span>
            </CardTitle>
            <p className="text-slate-400 text-sm">
              Comprehensive analysis of everything that could impact your portfolio
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scenarios.map((scenario, index) => (
                <motion.div
                  key={scenario.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedScenario?.id === scenario.id 
                      ? getThreatColorClasses(scenario.urgency) + ' ring-2 ring-blue-400' 
                      : 'border-slate-600 bg-slate-700/30 hover:bg-slate-700/50'
                  }`}
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          scenario.urgency === 'critical' ? 'text-red-400' :
                          scenario.urgency === 'high' ? 'text-orange-400' :
                          scenario.urgency === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                        }`} />
                        <h4 className="text-white font-medium">{scenario.name}</h4>
                        <Badge 
                          variant="outline" 
                          className={
                            scenario.urgency === 'critical' ? 'text-red-400 border-red-400' :
                            scenario.urgency === 'high' ? 'text-orange-400 border-orange-400' :
                            scenario.urgency === 'medium' ? 'text-yellow-400 border-yellow-400' : 
                            'text-blue-400 border-blue-400'
                          }
                        >
                          {scenario.urgency}
                        </Badge>
                      </div>
                      
                      <p className="text-slate-300 text-sm">{scenario.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="h-4 w-4 text-red-400" />
                          <span className="text-red-400 font-medium">${scenario.potentialLoss.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Activity className="h-4 w-4 text-orange-400" />
                          <span className="text-orange-400">{((scenario.probability || 0) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-400">{scenario.timeframe}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-red-400">
                        ${scenario.potentialLoss.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        {(scenario.impactAnalysis?.portfolioLossPercent || 0).toFixed(1)}% of portfolio
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-blue-600 text-blue-300 hover:bg-blue-900/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          alert(`Quick Protection for ${scenario.name}\nCost: $${scenario.mitigation.cost.toLocaleString()}\nStrategy: ${scenario.mitigation.primary.action}`)
                        }}
                      >
                        Protect (${scenario.mitigation.cost.toLocaleString()})
                      </Button>
                    </div>
                  </div>

                  {/* Affected Positions */}
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-400 text-sm">Affected Positions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {scenario.affectedPositions.map((position) => (
                        <Badge 
                          key={`${position.symbol}-${position.strategy}`}
                          variant="outline" 
                          className="text-xs"
                        >
                          {position.symbol} ({position.strategy}) -${((position.lossPercent || 0) * 100).toFixed(0)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cascading Effects Analysis */}
      {selectedScenario && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span>Cascading Effects</span>
              </CardTitle>
              <p className="text-slate-400 text-sm">
                How {selectedScenario.name} could spiral into bigger problems
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedScenario.impactAnalysis.cascadingEffects.map((effect, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg"
                  >
                    <ArrowDown className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <span className="text-slate-200">{effect}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Protection Strategy Comparison */}
      {selectedScenario && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-400" />
                <span>Protection Strategy Comparison</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Primary Protection */}
                <div className="space-y-4">
                  <h4 className="text-green-300 font-medium text-lg">✅ Recommended Protection</h4>
                  
                  <div className="bg-green-900/30 p-4 rounded-lg border border-green-700">
                    <h5 className="text-green-200 font-medium mb-2">{selectedScenario.mitigation.primary.action}</h5>
                    <p className="text-green-100 text-sm mb-3">{selectedScenario.mitigation.primary.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Cost</span>
                        <span className="text-white font-medium">${selectedScenario.mitigation.primary.cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Risk Reduction</span>
                        <span className="text-green-400 font-medium">{((selectedScenario.mitigation?.primary?.riskReduction || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Effectiveness</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={selectedScenario.mitigation.effectiveness * 100} className="w-16 h-2" />
                          <span className="text-green-400 text-sm">{((selectedScenario.mitigation?.effectiveness || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      alert(`Implementing Primary Protection Strategy:\n\n${selectedScenario.mitigation?.primary?.action || 'N/A'}\n\nCost: $${(selectedScenario.mitigation?.primary?.cost || 0).toLocaleString()}\nRisk Reduction: ${((selectedScenario.mitigation?.primary?.riskReduction || 0) * 100).toFixed(0)}%\n\n${selectedScenario.mitigation?.primary?.description || 'N/A'}\n\nThis would connect to your broker to execute the trades.`)
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Implement Protection
                  </Button>
                </div>

                {/* Alternative Protection */}
                <div className="space-y-4">
                  <h4 className="text-blue-300 font-medium text-lg">🔄 Alternative Option</h4>
                  
                  <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700">
                    <h5 className="text-blue-200 font-medium mb-2">{selectedScenario.mitigation.alternative.action}</h5>
                    <p className="text-blue-100 text-sm mb-3">{selectedScenario.mitigation.alternative.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Cost</span>
                        <span className="text-white font-medium">${selectedScenario.mitigation.alternative.cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Risk Reduction</span>
                        <span className="text-blue-400 font-medium">{((selectedScenario.mitigation?.alternative?.riskReduction || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 text-sm">Trade-off</span>
                        <span className="text-slate-300 text-sm">
                          {selectedScenario.mitigation.alternative.cost < selectedScenario.mitigation.primary.cost ? 'Cheaper but less effective' : 'More expensive but flexible'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full border-blue-600 text-blue-300 hover:bg-blue-900/30"
                    onClick={() => {
                      alert(`Alternative Protection Strategy:\n\n${selectedScenario.mitigation?.alternative?.action || 'N/A'}\n\nCost: $${(selectedScenario.mitigation?.alternative?.cost || 0).toLocaleString()}\nRisk Reduction: ${((selectedScenario.mitigation?.alternative?.riskReduction || 0) * 100).toFixed(0)}%\n\n${selectedScenario.mitigation?.alternative?.description || 'N/A'}`)
                    }}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Consider Alternative
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* If You Do Nothing... */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Clock className="h-5 w-5 text-purple-400" />
              <span>If You Do Nothing...</span>
            </CardTitle>
            <p className="text-slate-300 text-sm">
              Here's what happens to your portfolio if you don't take action
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Expected Outcome */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="text-purple-300 font-medium mb-2 flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Most Likely Outcome</span>
                </h4>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-white">-$2,800</div>
                  <p className="text-slate-400 text-sm">Expected loss from top 3 scenarios</p>
                  <p className="text-slate-300 text-sm">
                    Your tech concentration creates vulnerability to sector rotation
                  </p>
                </div>
              </div>

              {/* Time Factor */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="text-orange-300 font-medium mb-2 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Time Factor</span>
                </h4>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-orange-400">14 days</div>
                  <p className="text-slate-400 text-sm">Average time to scenario realization</p>
                  <p className="text-slate-300 text-sm">
                    Delaying protection increases both probability and impact
                  </p>
                </div>
              </div>

              {/* Opportunity Cost */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <h4 className="text-blue-300 font-medium mb-2 flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Opportunity Cost</span>
                </h4>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-400">$3,200</div>
                  <p className="text-slate-400 text-sm">Unused risk budget missing opportunities</p>
                  <p className="text-slate-300 text-sm">
                    Conservative positioning limits profit potential
                  </p>
                </div>
              </div>
            </div>

            {/* Action Timeline */}
            <div className="bg-slate-700/30 p-4 rounded-lg">
              <h4 className="text-white font-medium mb-3">📅 Action Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-red-900/30 rounded border border-red-700">
                  <span className="text-red-300">Next 2 days: VIX mean reversion likely</span>
                  <Badge variant="outline" className="text-red-400 border-red-400 text-xs">Action window</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-900/30 rounded border border-orange-700">
                  <span className="text-orange-300">5-7 days: Earnings season impacts emerge</span>
                  <Badge variant="outline" className="text-orange-400 border-orange-400 text-xs">Monitor closely</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-900/30 rounded border border-blue-700">
                  <span className="text-blue-300">2+ weeks: Seasonal patterns shift risk profile</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">Plan ahead</Badge>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Button 
          className="bg-green-600 hover:bg-green-700 h-12"
          onClick={() => {
            alert('Portfolio Protection Suite\n\nThis would open a comprehensive protection wizard allowing you to:\n\n• Apply hedge strategies across your entire portfolio\n• Set automated stop-loss levels\n• Configure position size limits\n• Enable real-time risk monitoring\n\nConnecting to broker integration...')
          }}
        >
          <Shield className="h-5 w-5 mr-2" />
          Protect Portfolio Now
        </Button>
        
        <Button 
          variant="outline" 
          className="border-blue-600 text-blue-300 h-12"
          onClick={() => {
            alert('Advanced Risk Analysis\n\nGenerating detailed report including:\n\n• Monte Carlo simulations\n• Stress test scenarios\n• Correlation breakdowns\n• Volatility forecasts\n• Tail risk analysis\n\nThis would generate a comprehensive PDF report.')
          }}
        >
          <Brain className="h-5 w-5 mr-2" />
          Get Detailed Analysis
        </Button>
        
        <Button 
          variant="outline" 
          className="border-purple-600 text-purple-300 h-12"
          onClick={() => {
            alert('Risk Alert Configuration\n\nSet up automated alerts for:\n\n• Portfolio loss thresholds\n• VIX spike notifications\n• Individual position alerts\n• Market regime changes\n• Earnings announcements\n\nAlerts can be sent via email, SMS, or push notifications.')
          }}
        >
          <AlertCircle className="h-5 w-5 mr-2" />
          Set Risk Alerts
        </Button>
      </motion.div>

    </div>
  )
}