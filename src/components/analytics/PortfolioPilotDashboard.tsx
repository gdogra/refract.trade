'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Compass, 
  Shield, 
  Target, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Zap,
  BarChart3,
  DollarSign
} from 'lucide-react'

// Import our AI Portfolio Pilot components
import AIPortfolioPilot from './AIPortfolioPilot'
import DynamicRiskBudgeting from './DynamicRiskBudgeting'
import WhatCouldHurtYou from './WhatCouldHurtYou'

interface DashboardMetrics {
  portfolioValue: number
  todaysPnL: number
  riskUtilization: number
  qualityScore: string
  activeAlerts: number
  opportunitiesFound: number
  protectionStatus: 'active' | 'inactive'
}

export default function PortfolioPilotDashboard() {
  const [activeTab, setActiveTab] = useState('pilot')
  const [metrics] = useState<DashboardMetrics>({
    portfolioValue: 82350,
    todaysPnL: 485,
    riskUtilization: 68,
    qualityScore: 'AAA',
    activeAlerts: 2,
    opportunitiesFound: 7,
    protectionStatus: 'active'
  })

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut'
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Hero Header */}
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center space-y-6"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <Brain className="h-12 w-12 text-blue-400" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                AI Portfolio Pilot
              </h1>
              <Compass className="h-12 w-12 text-blue-400" />
            </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-2xl text-slate-300 mb-4">
                "Tell me what to trade, how big, when to exit, and how it fits my portfolio."
              </p>
              <div className="flex items-center justify-center space-x-8 text-slate-400">
                <div className="flex items-center space-x-2">
                  <Compass className="h-5 w-5 text-blue-400" />
                  <span>🧭 Waze for derivatives trading</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-400" />
                  <span>✈️ Autopilot, not steering wheel</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  <span>🛡️ Safety-first alpha engine</span>
                </div>
              </div>
            </div>
          </div>

          {/* Portfolio Status Bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-w-4xl mx-auto">
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center"
            >
              <DollarSign className="h-5 w-5 text-green-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">${metrics.portfolioValue.toLocaleString()}</div>
              <p className="text-slate-400 text-xs">Portfolio Value</p>
            </motion.div>
            
            <motion.div
              custom={1}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center"
            >
              <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-400">+${metrics.todaysPnL}</div>
              <p className="text-slate-400 text-xs">Today's P&L</p>
            </motion.div>
            
            <motion.div
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center"
            >
              <BarChart3 className="h-5 w-5 text-orange-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">{metrics.riskUtilization}%</div>
              <p className="text-slate-400 text-xs">Risk Utilized</p>
            </motion.div>
            
            <motion.div
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center"
            >
              <Target className="h-5 w-5 text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-400">{metrics.qualityScore}</div>
              <p className="text-slate-400 text-xs">Quality Score</p>
            </motion.div>
            
            <motion.div
              custom={4}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center"
            >
              <AlertTriangle className="h-5 w-5 text-yellow-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-yellow-400">{metrics.activeAlerts}</div>
              <p className="text-slate-400 text-xs">Active Alerts</p>
            </motion.div>
            
            <motion.div
              custom={5}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 text-center"
            >
              <Shield className={`h-5 w-5 ${metrics.protectionStatus === 'active' ? 'text-green-400' : 'text-red-400'} mx-auto mb-2`} />
              <div className={`text-lg font-bold ${metrics.protectionStatus === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.protectionStatus === 'active' ? 'ON' : 'OFF'}
              </div>
              <p className="text-slate-400 text-xs">Auto-Protection</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5 bg-slate-700/50 mb-6">
                  <TabsTrigger 
                    value="pilot" 
                    className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    🤖 AI Pilot
                  </TabsTrigger>
                  <TabsTrigger 
                    value="threats"
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  >
                    ⚠️ Threats
                  </TabsTrigger>
                  <TabsTrigger 
                    value="risk"
                    className="data-[state=active]:bg-orange-600 data-[state=active]:text-white"
                  >
                    🛡️ Risk Budget
                  </TabsTrigger>
                  <TabsTrigger 
                    value="positions"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                  >
                    📊 Positions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="health"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    💚 Health
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pilot" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <AIPortfolioPilot />
                  </motion.div>
                </TabsContent>

                <TabsContent value="threats" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <WhatCouldHurtYou />
                  </motion.div>
                </TabsContent>

                <TabsContent value="risk" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <DynamicRiskBudgeting />
                  </motion.div>
                </TabsContent>

                <TabsContent value="positions" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="text-center p-8 text-slate-400">
                      📊 Position Management Dashboard - Coming Soon
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="health" className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="text-center p-8 text-slate-400">
                      💚 Portfolio Health Dashboard - Coming Soon
                    </div>
                  </motion.div>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Differentiators Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <Card className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-blue-900/20 border-blue-700">
            <CardHeader>
              <CardTitle className="text-white text-center">
                🏆 Autonomous Risk-Managed Trading OS
              </CardTitle>
              <p className="text-slate-300 text-center">
                How we beat Robinhood & Webull on features that actually matter
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="space-y-4 text-center">
                  <Shield className="h-8 w-8 text-green-400 mx-auto" />
                  <h3 className="text-white font-bold">TRUE Risk-First Design</h3>
                  <p className="text-slate-300 text-sm">
                    Shows "Capital at Risk" instead of buying power. 
                    This reframes decisions dramatically.
                  </p>
                  <Badge variant="outline" className="text-green-400 border-green-400">
                    vs. Robinhood: Buying Power
                  </Badge>
                </div>

                <div className="space-y-4 text-center">
                  <Brain className="h-8 w-8 text-blue-400 mx-auto" />
                  <h3 className="text-white font-bold">Portfolio Context Awareness</h3>
                  <p className="text-slate-300 text-sm">
                    Treats trades as a system, not independent bets. 
                    Considers correlations, concentration, and balance.
                  </p>
                  <Badge variant="outline" className="text-blue-400 border-blue-400">
                    vs. Others: Isolated Trades
                  </Badge>
                </div>

                <div className="space-y-4 text-center">
                  <Target className="h-8 w-8 text-purple-400 mx-auto" />
                  <h3 className="text-white font-bold">Entry & Exit Intelligence</h3>
                  <p className="text-slate-300 text-sm">
                    Guides through Hold, Adjust, Close, Roll, Hedge. 
                    Platforms stop at "Buy" - we continue to profit.
                  </p>
                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                    vs. Others: Execution Only
                  </Badge>
                </div>
              </div>

              {/* Unique Value Props */}
              <div className="mt-8 pt-8 border-t border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <h4 className="text-orange-300 font-bold mb-3 flex items-center space-x-2">
                      <Zap className="h-5 w-5" />
                      <span>Risk Budget Mode</span>
                    </h4>
                    <p className="text-slate-200 text-sm mb-2">
                      User: "I can risk $500 this week."
                    </p>
                    <p className="text-slate-200 text-sm">
                      System: Handles everything else intelligently.
                    </p>
                    <Badge variant="outline" className="mt-2 text-orange-400 border-orange-400">
                      Massive Differentiator
                    </Badge>
                  </div>

                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <h4 className="text-red-300 font-bold mb-3 flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5" />
                      <span>"What Could Hurt You Most"</span>
                    </h4>
                    <p className="text-slate-200 text-sm mb-2">
                      Killer UX: Shows exact scenarios and costs.
                    </p>
                    <p className="text-slate-200 text-sm">
                      This is insanely valuable and unique.
                    </p>
                    <Badge variant="outline" className="mt-2 text-red-400 border-red-400">
                      Unicorn Feature
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Live Status Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <Activity className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-green-400">MONITORING ACTIVE</div>
              <p className="text-slate-400 text-xs">Continuous risk surveillance</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <Shield className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-blue-400">PROTECTION ON</div>
              <p className="text-slate-400 text-xs">Auto-risk management enabled</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <Brain className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-purple-400">AI ADVISOR</div>
              <p className="text-slate-400 text-xs">Portfolio-aware recommendations</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-yellow-400">{metrics.opportunitiesFound} OPPORTUNITIES</div>
              <p className="text-slate-400 text-xs">High-quality setups found</p>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}