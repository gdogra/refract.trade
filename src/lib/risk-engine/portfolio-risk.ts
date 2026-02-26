/**
 * Portfolio Risk Engine
 * Calculates portfolio-level risk metrics and generates alerts
 */

import { calculatePortfolioGreeks, Greeks, GreeksInput, calculateGreeks, getTimeToExpiry } from '@/lib/greeks'
import { getDataService } from '@/lib/data-layer/data-service'

export interface Position {
  id: string
  userId: string
  symbol: string
  type: 'call' | 'put' | 'stock'
  strike?: number
  expiry?: string
  quantity: number
  entryPrice: number
  currentPrice?: number
  createdAt: Date
}

export interface PortfolioRiskMetrics {
  // Core Greeks
  netDelta: number
  netGamma: number
  netTheta: number
  netVega: number
  netRho: number
  
  // Portfolio metrics
  totalValue: number
  totalCost: number
  unrealizedPnL: number
  portfolioBeta: number
  
  // Risk metrics
  maxDrawdown: number
  portfolioVolatility: number
  riskScore: number // 0-100
  concentration: ConcentrationRisk[]
  
  // Time-based risks
  expirationRisk: ExpirationRisk[]
  thetaDecay: ThetaDecayProjection[]
  
  // Market risks
  deltaExposure: DeltaExposure
  gammaRisk: GammaRisk
  vegaRisk: VegaRisk
  
  // Alerts
  alerts: RiskAlert[]
  
  // Metadata
  lastUpdated: Date
  positionCount: number
  calculationTime: number
}

export interface ConcentrationRisk {
  symbol: string
  exposure: number
  percentage: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ExpirationRisk {
  expiry: string
  daysToExpiry: number
  positionCount: number
  netDelta: number
  netGamma: number
  netTheta: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface ThetaDecayProjection {
  date: string
  projectedDecay: number
  cumulativeDecay: number
}

export interface DeltaExposure {
  totalDelta: number
  marketDirection: 'bullish' | 'bearish' | 'neutral'
  hedgeRatio: number
  requiredHedge: number
}

export interface GammaRisk {
  totalGamma: number
  acceleration: number // How fast delta changes
  riskLevel: 'low' | 'medium' | 'high'
  stressTestResults: { priceMove: number; deltaChange: number }[]
}

export interface VegaRisk {
  totalVega: number
  volSensitivity: number
  impliedVolatility: number
  riskLevel: 'low' | 'medium' | 'high'
}

export interface RiskAlert {
  id: string
  type: 'concentration' | 'expiration' | 'greeks' | 'liquidity' | 'margin'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  symbol?: string
  expiry?: string
  recommendation?: string
  timestamp: Date
}

class PortfolioRiskEngine {
  private dataService = getDataService()
  
  async calculateRisk(positions: Position[]): Promise<PortfolioRiskMetrics> {
    const startTime = Date.now()
    
    if (positions?.length || 0 === 0) {
      return this.getEmptyRiskMetrics(startTime)
    }

    // Enrich positions with current market data
    const enrichedPositions = await this.enrichPositions(positions)
    
    // Calculate core metrics
    const portfolioGreeks = this.calculatePortfolioGreeks(enrichedPositions)
    const portfolioMetrics = this.calculatePortfolioMetrics(enrichedPositions)
    const riskMetrics = this.calculateRiskMetrics(enrichedPositions)
    const alerts = this.generateRiskAlerts(enrichedPositions, portfolioGreeks, riskMetrics)

    return {
      // Core Greeks
      netDelta: portfolioGreeks.netDelta,
      netGamma: portfolioGreeks.netGamma,
      netTheta: portfolioGreeks.netTheta,
      netVega: portfolioGreeks.netVega,
      netRho: portfolioGreeks.netRho,
      
      // Portfolio metrics
      totalValue: portfolioMetrics.totalValue,
      totalCost: portfolioMetrics.totalCost,
      unrealizedPnL: portfolioMetrics.unrealizedPnL,
      portfolioBeta: portfolioGreeks.portfolioBeta,
      
      // Risk metrics
      maxDrawdown: riskMetrics.maxDrawdown,
      portfolioVolatility: riskMetrics.portfolioVolatility,
      riskScore: this.calculateRiskScore(portfolioGreeks, riskMetrics),
      concentration: this.calculateConcentrationRisk(enrichedPositions),
      
      // Time-based risks
      expirationRisk: this.calculateExpirationRisk(enrichedPositions),
      thetaDecay: this.projectThetaDecay(enrichedPositions),
      
      // Market risks
      deltaExposure: this.calculateDeltaExposure(portfolioGreeks),
      gammaRisk: this.calculateGammaRisk(enrichedPositions, portfolioGreeks),
      vegaRisk: this.calculateVegaRisk(enrichedPositions, portfolioGreeks),
      
      // Alerts
      alerts,
      
      // Metadata
      lastUpdated: new Date(),
      positionCount: positions?.length || 0,
      calculationTime: Date.now() - startTime
    }
  }

  private async enrichPositions(positions: Position[]): Promise<(Position & { greeks?: Greeks; impliedVol?: number })[]> {
    const uniqueSymbols = Array.from(new Set(positions.map(p => p.symbol)))
    const quotes = await this.dataService.batchQuotes(uniqueSymbols, true)
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]))

    return positions.map(position => {
      const quote = quoteMap.get(position.symbol)
      const enrichedPosition = {
        ...position,
        currentPrice: quote?.price || position.entryPrice
      }

      // Calculate Greeks for options
      if (position.type !== 'stock' && position.strike && position.expiry) {
        const timeToExpiry = getTimeToExpiry(position.expiry)
        
        if (timeToExpiry > 0) {
          // Prepare input for Greeks calculation
          const inputForGreeks: GreeksInput = {
            spotPrice: enrichedPosition.currentPrice,
            strike: position.strike,
            timeToExpiry: timeToExpiry,
            riskFreeRate: 0.05,
            volatility: 0.25 // Default IV, should be fetched from market
          }

          // Calculate and assign Greeks
          const calculatedGreeks = calculateGreeks(inputForGreeks, position.type === 'call')
          ;(enrichedPosition as any).greeks = calculatedGreeks
          ;(enrichedPosition as any).impliedVol = inputForGreeks.volatility
        }
      }

      return enrichedPosition
    })
  }

  private calculatePortfolioGreeks(positions: Array<Position & { greeks?: Greeks; impliedVol?: number }>): any {
    const optionsPositions = positions.filter(p => p.type !== 'stock' && p.greeks)
    
    if (optionsPositions?.length || 0 === 0) {
      return {
        netDelta: 0,
        netGamma: 0,
        netTheta: 0,
        netVega: 0,
        netRho: 0,
        portfolioBeta: 0
      }
    }

    let netDelta = 0
    let netGamma = 0
    let netTheta = 0
    let netVega = 0
    let netRho = 0

    optionsPositions.forEach(position => {
      if (position.greeks) {
        const multiplier = position.quantity * 100 // Standard options multiplier
        netDelta += position.greeks.delta * multiplier
        netGamma += position.greeks.gamma * multiplier
        netTheta += position.greeks.theta * multiplier
        netVega += position.greeks.vega * multiplier
        netRho += position.greeks.rho * multiplier
      }
    })

    // Add stock delta (1.0 per share)
    const stockPositions = positions.filter(p => p.type === 'stock')
    stockPositions.forEach(position => {
      netDelta += position.quantity
    })

    return {
      netDelta: Number(netDelta.toFixed(2)),
      netGamma: Number(netGamma.toFixed(4)),
      netTheta: Number(netTheta.toFixed(2)),
      netVega: Number(netVega.toFixed(2)),
      netRho: Number(netRho.toFixed(2)),
      portfolioBeta: Number((netDelta / 10000).toFixed(2)) // Rough approximation
    }
  }

  private calculatePortfolioMetrics(positions: any[]): any {
    let totalValue = 0
    let totalCost = 0

    positions.forEach(position => {
      const positionValue = position.currentPrice * position.quantity * (position.type === 'stock' ? 1 : 100)
      const positionCost = position.entryPrice * position.quantity * (position.type === 'stock' ? 1 : 100)
      
      totalValue += positionValue
      totalCost += positionCost
    })

    return {
      totalValue: Number(totalValue.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
      unrealizedPnL: Number((totalValue - totalCost).toFixed(2))
    }
  }

  private calculateRiskMetrics(positions: any[]): any {
    // Simplified risk calculations - would be more sophisticated in production
    const returns = [] // Would calculate from historical position values
    
    return {
      maxDrawdown: 0, // Would need historical data
      portfolioVolatility: 0.15 // Placeholder
    }
  }

  private calculateRiskScore(portfolioGreeks: any, riskMetrics: any): number {
    // Risk score 0-100 based on various factors
    let score = 0

    // Delta risk (market direction risk)
    const deltaRisk = Math.min(Math.abs(portfolioGreeks.netDelta) / 1000, 50)
    score += deltaRisk

    // Gamma risk (acceleration risk)
    const gammaRisk = Math.min(Math.abs(portfolioGreeks.netGamma) * 100, 30)
    score += gammaRisk

    // Theta risk (time decay)
    const thetaRisk = Math.min(Math.abs(portfolioGreeks.netTheta) / 10, 20)
    score += thetaRisk

    return Math.min(Math.round(score), 100)
  }

  private calculateConcentrationRisk(positions: any[]): ConcentrationRisk[] {
    const symbolExposure = new Map<string, number>()
    const totalValue = positions.reduce((sum, p) => sum + Math.abs(p.currentPrice * p.quantity), 0)

    positions.forEach(position => {
      const exposure = Math.abs(position.currentPrice * position.quantity * (position.type === 'stock' ? 1 : 100))
      symbolExposure.set(position.symbol, (symbolExposure.get(position.symbol) || 0) + exposure)
    })

    return Array.from(symbolExposure.entries()).map(([symbol, exposure]) => {
      const percentage = (exposure / totalValue) * 100
      
      return {
        symbol,
        exposure: Number(exposure.toFixed(2)),
        percentage: Number(percentage.toFixed(1)),
        riskLevel: (percentage > 25 ? 'high' : percentage > 15 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      }
    }).sort((a, b) => b.exposure - a.exposure)
  }

  private calculateExpirationRisk(positions: any[]): ExpirationRisk[] {
    const expiryGroups = new Map<string, any[]>()
    
    positions.filter(p => p.expiry).forEach(position => {
      const expiry = position.expiry!
      if (!expiryGroups.has(expiry)) {
        expiryGroups.set(expiry, [])
      }
      expiryGroups.get(expiry)!.push(position)
    })

    return Array.from(expiryGroups.entries()).map(([expiry, positions]) => {
      const daysToExpiry = Math.ceil((new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      let netDelta = 0
      let netGamma = 0
      let netTheta = 0

      positions.forEach(p => {
        if (p.greeks) {
          const multiplier = p.quantity * 100
          netDelta += p.greeks.delta * multiplier
          netGamma += p.greeks.gamma * multiplier
          netTheta += p.greeks.theta * multiplier
        }
      })

      return {
        expiry,
        daysToExpiry,
        positionCount: positions?.length || 0,
        netDelta: Number(netDelta.toFixed(2)),
        netGamma: Number(netGamma.toFixed(4)),
        netTheta: Number(netTheta.toFixed(2)),
        riskLevel: (daysToExpiry < 7 ? 'high' : daysToExpiry < 30 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      }
    }).sort((a, b) => a.daysToExpiry - b.daysToExpiry)
  }

  private projectThetaDecay(positions: any[]): ThetaDecayProjection[] {
    const projections: ThetaDecayProjection[] = []
    let cumulativeDecay = 0

    // Project theta decay for next 30 days
    for (let days = 1; days <= 30; days++) {
      let dailyDecay = 0
      
      positions.filter(p => p.greeks && p.expiry).forEach(position => {
        const expiryDate = new Date(position.expiry!)
        const projectionDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
        
        if (projectionDate < expiryDate) {
          dailyDecay += position.greeks.theta * position.quantity * 100
        }
      })

      cumulativeDecay += dailyDecay
      
      projections.push({
        date: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        projectedDecay: Number(dailyDecay.toFixed(2)),
        cumulativeDecay: Number(cumulativeDecay.toFixed(2))
      })
    }

    return projections
  }

  private calculateDeltaExposure(portfolioGreeks: any): DeltaExposure {
    const delta = portfolioGreeks.netDelta
    
    return {
      totalDelta: delta,
      marketDirection: delta > 100 ? 'bullish' : delta < -100 ? 'bearish' : 'neutral',
      hedgeRatio: Math.abs(delta) / 10000,
      requiredHedge: Math.abs(delta)
    }
  }

  private calculateGammaRisk(positions: any[], portfolioGreeks: any): GammaRisk {
    const gamma = portfolioGreeks.netGamma
    const riskLevel = Math.abs(gamma) > 1 ? 'high' : Math.abs(gamma) > 0.5 ? 'medium' : 'low'
    
    // Stress test: calculate delta changes for various price moves
    const stressTestResults = [-10, -5, -2, 2, 5, 10].map(priceMove => ({
      priceMove,
      deltaChange: gamma * priceMove
    }))

    return {
      totalGamma: gamma,
      acceleration: Math.abs(gamma),
      riskLevel,
      stressTestResults
    }
  }

  private calculateVegaRisk(positions: any[], portfolioGreeks: any): VegaRisk {
    const vega = portfolioGreeks.netVega
    const avgIV = positions.filter(p => p.impliedVol).reduce((sum, p) => sum + p.impliedVol, 0) / 
                  positions.filter(p => p.impliedVol)?.length || 0 || 0.25

    return {
      totalVega: vega,
      volSensitivity: Math.abs(vega),
      impliedVolatility: avgIV,
      riskLevel: Math.abs(vega) > 500 ? 'high' : Math.abs(vega) > 200 ? 'medium' : 'low'
    }
  }

  private generateRiskAlerts(positions: any[], portfolioGreeks: any, riskMetrics: any): RiskAlert[] {
    const alerts: RiskAlert[] = []
    const now = new Date()

    // Concentration risk alerts
    const concentrationRisks = this.calculateConcentrationRisk(positions)
    concentrationRisks.forEach(risk => {
      if (risk.riskLevel === 'high') {
        alerts.push({
          id: `concentration_${risk.symbol}_${now.getTime()}`,
          type: 'concentration',
          severity: 'warning',
          title: 'High Concentration Risk',
          message: `${risk.percentage.toFixed(1)}% of portfolio concentrated in ${risk.symbol}`,
          symbol: risk.symbol,
          recommendation: 'Consider diversifying or hedging this position',
          timestamp: now
        })
      }
    })

    // Expiration risk alerts
    const expirationRisks = this.calculateExpirationRisk(positions)
    expirationRisks.forEach(risk => {
      if (risk.daysToExpiry < 7 && risk.positionCount > 0) {
        alerts.push({
          id: `expiration_${risk.expiry}_${now.getTime()}`,
          type: 'expiration',
          severity: risk.daysToExpiry < 3 ? 'critical' : 'warning',
          title: 'Approaching Expiration',
          message: `${risk.positionCount} position(s) expire in ${risk.daysToExpiry} days`,
          expiry: risk.expiry,
          recommendation: 'Review positions for closing, rolling, or exercise decisions',
          timestamp: now
        })
      }
    })

    // Greeks risk alerts
    if (Math.abs(portfolioGreeks.netDelta) > 1000) {
      alerts.push({
        id: `delta_${now.getTime()}`,
        type: 'greeks',
        severity: 'warning',
        title: 'High Delta Exposure',
        message: `Portfolio delta: ${portfolioGreeks.netDelta}`,
        recommendation: 'Consider hedging directional risk',
        timestamp: now
      })
    }

    if (Math.abs(portfolioGreeks.netTheta) > 100) {
      alerts.push({
        id: `theta_${now.getTime()}`,
        type: 'greeks',
        severity: 'info',
        title: 'High Time Decay',
        message: `Daily theta decay: $${Math.abs(portfolioGreeks.netTheta).toFixed(2)}`,
        recommendation: 'Monitor time decay impact on portfolio value',
        timestamp: now
      })
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 3, warning: 2, info: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  private getEmptyRiskMetrics(startTime: number): PortfolioRiskMetrics {
    return {
      netDelta: 0,
      netGamma: 0,
      netTheta: 0,
      netVega: 0,
      netRho: 0,
      totalValue: 0,
      totalCost: 0,
      unrealizedPnL: 0,
      portfolioBeta: 0,
      maxDrawdown: 0,
      portfolioVolatility: 0,
      riskScore: 0,
      concentration: [],
      expirationRisk: [],
      thetaDecay: [],
      deltaExposure: {
        totalDelta: 0,
        marketDirection: 'neutral',
        hedgeRatio: 0,
        requiredHedge: 0
      },
      gammaRisk: {
        totalGamma: 0,
        acceleration: 0,
        riskLevel: 'low',
        stressTestResults: []
      },
      vegaRisk: {
        totalVega: 0,
        volSensitivity: 0,
        impliedVolatility: 0,
        riskLevel: 'low'
      },
      alerts: [],
      lastUpdated: new Date(),
      positionCount: 0,
      calculationTime: Date.now() - startTime
    }
  }
}

// Singleton instance
let riskEngine: PortfolioRiskEngine | null = null

export function getPortfolioRiskEngine(): PortfolioRiskEngine {
  if (!riskEngine) {
    riskEngine = new PortfolioRiskEngine()
  }
  return riskEngine
}

export { PortfolioRiskEngine }