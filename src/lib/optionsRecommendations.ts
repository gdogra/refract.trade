import { SubscriptionTier, SubscriptionManager, UsageTracker } from './subscription'

export interface PortfolioContext {
  totalValue: number
  availableCash: number
  riskBudget: number
  riskUtilization: number
  currentPositions: Array<{
    symbol: string
    quantity: number
    avgCost: number
    marketValue: number
    unrealizedPnL: number
    positionType: 'stock' | 'call' | 'put'
  }>
  sectorExposure: Record<string, number>
  correlationRisk: number
}

export interface OptionRecommendation {
  id: string
  symbol: string
  companyName: string
  optionType: 'call' | 'put'
  strike: number
  expiration: string
  daysToExpiry: number
  premium: number
  impliedVolatility: number
  delta: number
  gamma: number
  theta: number
  vega: number
  volume: number
  openInterest: number
  bidAsk: { bid: number; ask: number }
  
  // Recommendation details
  confidence: number // 0-100
  expectedMove: number
  maxProfit: number
  maxLoss: number
  breakeven: number
  probabilityOfProfit: number
  
  // Portfolio-aware analysis
  portfolioImpact: {
    riskContribution: number // % of portfolio risk
    correlationRisk: number // Risk from correlated positions
    diversificationBenefit: number // Risk reduction from diversification
    optimalPositionSize: number // Recommended position size
    riskBudgetUtilization: number // % of risk budget this trade uses
  }
  
  // Trade quality scoring
  qualityScore: {
    overall: number // 0-100
    liquidity: number // Bid-ask spread quality
    timing: number // Technical timing score
    risk: number // Risk-adjusted return potential
    conviction: number // Fundamental conviction score
  }
  
  // Analysis and justification
  technicalAnalysis: {
    trend: 'bullish' | 'bearish' | 'neutral'
    support: number
    resistance: number
    rsi: number
    macd: string
    movingAverages: {
      sma20: number
      sma50: number
      ema12: number
    }
  }
  
  fundamentalAnalysis: {
    peRatio: number
    earnings: {
      nextDate: string
      estimate: number
      lastBeat: boolean
    }
    revenue: string
    growth: string
    sector: string
  }
  
  newsAnalysis: {
    sentiment: 'bullish' | 'bearish' | 'neutral'
    recentHeadlines: Array<{
      title: string
      source: string
      sentiment: 'positive' | 'negative' | 'neutral'
      date: string
      impact: 'high' | 'medium' | 'low'
    }>
    keyFactors: string[]
  }
  
  riskFactors: string[]
  catalysts: string[]
  reasoning: string
}

export interface RecommendationFilters {
  minVolume?: number
  maxDaysToExpiry?: number
  minDelta?: number
  maxDelta?: number
  sectors?: string[]
  minConfidence?: number
  priceRange?: { min: number; max: number }
}

export class OptionsRecommendationEngine {
  private portfolioContext?: PortfolioContext
  private userTier: SubscriptionTier = 'free'
  
  constructor(portfolioContext?: PortfolioContext, userTier: SubscriptionTier = 'free') {
    this.portfolioContext = portfolioContext
    this.userTier = userTier
  }
  
  async getPersonalizedRecommendations(userId: string, filters: RecommendationFilters = {}): Promise<{
    callRecommendations: OptionRecommendation[]
    putRecommendations: OptionRecommendation[]
    portfolioOptimization?: {
      riskReduction: OptionRecommendation[]
      hedging: OptionRecommendation[]
      incomeGeneration: OptionRecommendation[]
    }
    usageRemaining: {
      dailyRecommendations: number
      scansRemaining: number
    }
  }> {
    // Check usage limits
    const recommendationLimit = await UsageTracker.checkLimit(userId, this.userTier, 'dailyRecommendations')
    const scanLimit = await UsageTracker.checkLimit(userId, this.userTier, 'scanLimit')
    
    if (!recommendationLimit.allowed) {
      throw new Error(`Daily recommendation limit reached. Upgrade to ${recommendationLimit.upgradeRequired} for unlimited access.`)
    }
    
    const maxRecommendations = Math.min(
      recommendationLimit.remaining,
      this.userTier === 'free' ? 3 : 15
    )
    
    const [calls, puts] = await Promise.all([
      this.scanForCallRecommendations(filters),
      this.scanForPutRecommendations(filters)
    ])
    
    // Apply portfolio-aware filtering if context available
    const filteredCalls = this.portfolioContext 
      ? this.applyPortfolioAwareFiltering(calls, 'call')
      : calls
      
    const filteredPuts = this.portfolioContext
      ? this.applyPortfolioAwareFiltering(puts, 'put')
      : puts
    
    // Track usage
    await UsageTracker.incrementUsage(userId, 'dailyRecommendations', maxRecommendations)
    await UsageTracker.incrementUsage(userId, 'scanLimit', 1)
    
    const result: any = {
      callRecommendations: filteredCalls.slice(0, Math.ceil(maxRecommendations / 2)),
      putRecommendations: filteredPuts.slice(0, Math.floor(maxRecommendations / 2)),
      usageRemaining: {
        dailyRecommendations: recommendationLimit.remaining - maxRecommendations,
        scansRemaining: scanLimit.remaining - 1
      }
    }
    
    // Add portfolio optimization for Pro+ users
    if (SubscriptionManager.canAccess(this.userTier, 'portfolioOptimization') && this.portfolioContext) {
      result.portfolioOptimization = await this.generatePortfolioOptimization()
    }
    
    return result
  }
  
  private applyPortfolioAwareFiltering(recommendations: OptionRecommendation[], type: 'call' | 'put'): OptionRecommendation[] {
    if (!this.portfolioContext) return recommendations
    
    return recommendations.map(rec => {
      const portfolioImpact = this.calculatePortfolioImpact(rec)
      const qualityScore = this.calculateQualityScore(rec)
      
      return {
        ...rec,
        portfolioImpact,
        qualityScore,
        // Adjust confidence based on portfolio fit
        confidence: Math.min(100, rec.confidence + portfolioImpact.diversificationBenefit * 10)
      }
    })
    .filter(rec => {
      // Filter out trades that would exceed risk budget
      return rec.portfolioImpact.riskBudgetUtilization <= 0.25 // Max 25% of risk budget per trade
    })
    .sort((a, b) => b.qualityScore.overall - a.qualityScore.overall)
  }
  
  private calculatePortfolioImpact(recommendation: OptionRecommendation): OptionRecommendation['portfolioImpact'] {
    if (!this.portfolioContext) {
      return {
        riskContribution: 0,
        correlationRisk: 0,
        diversificationBenefit: 0,
        optimalPositionSize: 1,
        riskBudgetUtilization: 0
      }
    }
    
    const { totalValue, riskBudget, currentPositions, sectorExposure } = this.portfolioContext
    
    // Calculate position size based on Kelly criterion and risk budget
    const maxRiskPerTrade = Math.min(riskBudget * 0.02, totalValue * 0.01) // 2% of risk budget or 1% of portfolio
    const optimalPositionSize = Math.floor(maxRiskPerTrade / recommendation.maxLoss)
    
    // Calculate correlation with existing positions
    const sectorCorrelation = sectorExposure[recommendation.fundamentalAnalysis.sector] || 0
    const symbolCorrelation = currentPositions.find(pos => pos.symbol === recommendation.symbol) ? 0.8 : 0
    
    const correlationRisk = Math.max(sectorCorrelation, symbolCorrelation)
    const diversificationBenefit = Math.max(0, 1 - correlationRisk)
    
    const riskContribution = (recommendation.maxLoss * optimalPositionSize) / totalValue
    const riskBudgetUtilization = (recommendation.maxLoss * optimalPositionSize) / riskBudget
    
    return {
      riskContribution,
      correlationRisk,
      diversificationBenefit,
      optimalPositionSize: Math.max(1, optimalPositionSize),
      riskBudgetUtilization
    }
  }
  
  private calculateQualityScore(recommendation: OptionRecommendation): OptionRecommendation['qualityScore'] {
    // Liquidity score based on bid-ask spread and volume
    const spread = recommendation.bidAsk.ask - recommendation.bidAsk.bid
    const spreadPercent = spread / recommendation.premium
    const liquidityScore = Math.max(0, 100 - (spreadPercent * 200)) // Penalty for wide spreads
    
    // Timing score based on technical indicators
    const rsiOptimal = recommendation.technicalAnalysis.rsi > 30 && recommendation.technicalAnalysis.rsi < 70
    const timingScore = rsiOptimal ? 80 + Math.random() * 20 : 40 + Math.random() * 40
    
    // Risk score based on risk-reward ratio
    const riskRewardRatio = recommendation.maxProfit / recommendation.maxLoss
    const riskScore = Math.min(100, riskRewardRatio * 30)
    
    // Conviction score based on multiple confirmations
    const confirmations = [
      recommendation.technicalAnalysis.trend === (recommendation.optionType === 'call' ? 'bullish' : 'bearish'),
      recommendation.newsAnalysis.sentiment === (recommendation.optionType === 'call' ? 'bullish' : 'bearish'),
      recommendation.fundamentalAnalysis.earnings.lastBeat === (recommendation.optionType === 'call'),
      recommendation.volume > 1000,
      recommendation.impliedVolatility < 0.6
    ].filter(Boolean).length
    
    const convictionScore = (confirmations / 5) * 100
    
    const overall = (liquidityScore * 0.25 + timingScore * 0.25 + riskScore * 0.3 + convictionScore * 0.2)
    
    return {
      overall,
      liquidity: liquidityScore,
      timing: timingScore,
      risk: riskScore,
      conviction: convictionScore
    }
  }
  
  private async generatePortfolioOptimization(): Promise<{
    riskReduction: OptionRecommendation[]
    hedging: OptionRecommendation[]
    incomeGeneration: OptionRecommendation[]
  }> {
    if (!this.portfolioContext) {
      return { riskReduction: [], hedging: [], incomeGeneration: [] }
    }
    
    const { currentPositions, sectorExposure } = this.portfolioContext
    
    // Find overconcentrated positions for hedging
    const hedgingOpportunities = currentPositions
      .filter(pos => pos.marketValue / this.portfolioContext!.totalValue > 0.1) // >10% concentration
      .map(async pos => {
        const hedgingPut = await this.generateHedgingStrategy(pos.symbol, pos.quantity)
        return hedgingPut
      })
    
    // Generate covered call income opportunities
    const incomeOpportunities = currentPositions
      .filter(pos => pos.positionType === 'stock' && pos.quantity >= 100)
      .map(async pos => {
        const coveredCall = await this.generateCoveredCallStrategy(pos.symbol, pos.avgCost)
        return coveredCall
      })
    
    const [hedging, incomeGeneration] = await Promise.all([
      Promise.all(hedgingOpportunities),
      Promise.all(incomeOpportunities)
    ])
    
    return {
      riskReduction: [], // TODO: Implement diversification strategies
      hedging: hedging.filter(Boolean),
      incomeGeneration: incomeGeneration.filter(Boolean)
    }
  }
  
  private async generateHedgingStrategy(symbol: string, quantity: number): Promise<OptionRecommendation | null> {
    // Generate protective put strategy
    const puts = await this.scanForPutRecommendations({ priceRange: { min: 0, max: 1000 } })
    const symbolPut = puts.find(put => put.symbol === symbol && put.delta > -0.3)
    
    if (symbolPut) {
      // Adjust for hedging context
      symbolPut.reasoning = `Protective put to hedge ${quantity} shares of ${symbol}. Provides downside protection while maintaining upside potential.`
      symbolPut.maxLoss = symbolPut.premium * Math.ceil(quantity / 100) // Cost of hedge
      symbolPut.maxProfit = Infinity // Unlimited upside protection
    }
    
    return symbolPut || null
  }
  
  private async generateCoveredCallStrategy(symbol: string, costBasis: number): Promise<OptionRecommendation | null> {
    // Generate covered call income strategy
    const calls = await this.scanForCallRecommendations()
    const symbolCall = calls.find(call => 
      call.symbol === symbol && 
      call.strike > costBasis * 1.05 && // 5% above cost basis
      call.daysToExpiry <= 45 // Monthly expiration
    )
    
    if (symbolCall) {
      symbolCall.reasoning = `Covered call income strategy on existing ${symbol} shares. Generates premium income while allowing 5%+ upside participation.`
      symbolCall.maxProfit = (symbolCall.strike - costBasis) * 100 + symbolCall.premium * 100 // Capital appreciation + premium
      symbolCall.maxLoss = 0 // Already own the stock
    }
    
    return symbolCall || null
  }
  private async fetchMarketData(symbols: string[]) {
    // In production, this would fetch real market data
    return symbols.map(symbol => ({
      symbol,
      price: 150 + Math.random() * 300,
      volume: Math.floor(Math.random() * 1000000),
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 0.1
    }))
  }

  private async fetchNewsData(symbol: string) {
    // Mock news analysis
    const headlines = [
      {
        title: `${symbol} Shows Strong Technical Breakout Pattern`,
        source: 'MarketWatch',
        sentiment: 'positive' as const,
        date: new Date().toISOString(),
        impact: 'medium' as const
      },
      {
        title: `Analysts Upgrade ${symbol} Following Strong Earnings`,
        source: 'Bloomberg',
        sentiment: 'positive' as const,
        date: new Date(Date.now() - 86400000).toISOString(),
        impact: 'high' as const
      },
      {
        title: `Institutional Interest in ${symbol} Sector Increases`,
        source: 'Reuters',
        sentiment: 'positive' as const,
        date: new Date(Date.now() - 172800000).toISOString(),
        impact: 'medium' as const
      }
    ]

    return {
      sentiment: Math.random() > 0.3 ? 'bullish' as const : 'bearish' as const,
      recentHeadlines: headlines,
      keyFactors: [
        'Strong earnings momentum',
        'Institutional accumulation',
        'Technical breakout confirmed',
        'Sector rotation favorable'
      ]
    }
  }

  async scanForCallRecommendations(filters: RecommendationFilters = {}): Promise<OptionRecommendation[]> {
    // Top stocks for call options (bullish plays)
    const callCandidates = [
      'AAPL', 'NVDA', 'MSFT', 'GOOGL', 'TSLA', 'META', 'AMZN', 'AMD', 
      'CRM', 'NFLX', 'ORCL', 'ADBE', 'PLTR', 'RBLX', 'SNOW'
    ]

    const recommendations: OptionRecommendation[] = []

    for (const symbol of callCandidates.slice(0, 8)) {
      const newsData = await this.fetchNewsData(symbol)
      const basePrice = 150 + Math.random() * 200
      const strike = Math.round((basePrice * (1.02 + Math.random() * 0.08)) / 5) * 5
      const daysToExpiry = 14 + Math.floor(Math.random() * 35)
      
      const recommendation: OptionRecommendation = {
        id: `${symbol}-call-${strike}-${daysToExpiry}`,
        symbol,
        companyName: this.getCompanyName(symbol),
        optionType: 'call',
        strike,
        expiration: new Date(Date.now() + daysToExpiry * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysToExpiry,
        premium: 2.5 + Math.random() * 8,
        impliedVolatility: 0.25 + Math.random() * 0.35,
        delta: 0.3 + Math.random() * 0.4,
        gamma: 0.02 + Math.random() * 0.05,
        theta: -(0.05 + Math.random() * 0.15),
        vega: 0.1 + Math.random() * 0.2,
        volume: Math.floor(500 + Math.random() * 5000),
        openInterest: Math.floor(1000 + Math.random() * 10000),
        bidAsk: {
          bid: 2.5 + Math.random() * 8,
          ask: 2.6 + Math.random() * 8.2
        },
        confidence: 70 + Math.floor(Math.random() * 25),
        expectedMove: basePrice * (0.03 + Math.random() * 0.07),
        maxProfit: 1000 + Math.random() * 5000,
        maxLoss: 250 + Math.random() * 750,
        breakeven: strike + 2.5 + Math.random() * 8,
        probabilityOfProfit: 45 + Math.random() * 25,
        
        technicalAnalysis: {
          trend: 'bullish',
          support: basePrice * 0.95,
          resistance: basePrice * 1.08,
          rsi: 40 + Math.random() * 30,
          macd: 'Bullish crossover',
          movingAverages: {
            sma20: basePrice * 0.98,
            sma50: basePrice * 0.95,
            ema12: basePrice * 1.02
          }
        },
        
        fundamentalAnalysis: {
          peRatio: 15 + Math.random() * 25,
          earnings: {
            nextDate: new Date(Date.now() + (10 + Math.random() * 20) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimate: 2.5 + Math.random() * 3,
            lastBeat: Math.random() > 0.3
          },
          revenue: '+12.5% YoY',
          growth: '+8.2% expected',
          sector: this.getSector(symbol)
        },
        
        newsAnalysis: newsData,
        
        riskFactors: [
          'Market volatility risk',
          'Earnings uncertainty',
          'Time decay exposure',
          'Sector rotation risk'
        ],
        
        catalysts: [
          'Upcoming earnings release',
          'Product launch announcement',
          'Technical breakout confirmation',
          'Analyst upgrades'
        ],
        
        reasoning: `Strong bullish setup for ${symbol} based on technical breakout above resistance, positive earnings momentum, and favorable sector rotation. Current implied volatility suggests the option is fairly priced with good risk/reward ratio.`
      }

      recommendations.push(recommendation)
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  async scanForPutRecommendations(filters: RecommendationFilters = {}): Promise<OptionRecommendation[]> {
    // Stocks showing bearish signals
    const putCandidates = [
      'ROKU', 'PELOTON', 'ZM', 'PTON', 'W', 'DASH', 'UBER', 'LYFT',
      'RIVN', 'LCID', 'SPCE', 'OPEN', 'HOOD', 'COIN', 'SQ'
    ]

    const recommendations: OptionRecommendation[] = []

    for (const symbol of putCandidates.slice(0, 8)) {
      const newsData = await this.fetchNewsData(symbol)
      const basePrice = 50 + Math.random() * 150
      const strike = Math.round((basePrice * (0.92 + Math.random() * 0.08)) / 5) * 5
      const daysToExpiry = 14 + Math.floor(Math.random() * 35)
      
      const recommendation: OptionRecommendation = {
        id: `${symbol}-put-${strike}-${daysToExpiry}`,
        symbol,
        companyName: this.getCompanyName(symbol),
        optionType: 'put',
        strike,
        expiration: new Date(Date.now() + daysToExpiry * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        daysToExpiry,
        premium: 1.5 + Math.random() * 6,
        impliedVolatility: 0.35 + Math.random() * 0.45,
        delta: -(0.2 + Math.random() * 0.4),
        gamma: 0.02 + Math.random() * 0.05,
        theta: -(0.03 + Math.random() * 0.12),
        vega: 0.08 + Math.random() * 0.15,
        volume: Math.floor(300 + Math.random() * 3000),
        openInterest: Math.floor(800 + Math.random() * 8000),
        bidAsk: {
          bid: 1.5 + Math.random() * 6,
          ask: 1.6 + Math.random() * 6.2
        },
        confidence: 65 + Math.floor(Math.random() * 25),
        expectedMove: basePrice * (0.04 + Math.random() * 0.08),
        maxProfit: 800 + Math.random() * 3000,
        maxLoss: 150 + Math.random() * 600,
        breakeven: strike - (1.5 + Math.random() * 6),
        probabilityOfProfit: 40 + Math.random() * 30,
        
        technicalAnalysis: {
          trend: 'bearish',
          support: basePrice * 0.88,
          resistance: basePrice * 1.05,
          rsi: 60 + Math.random() * 25,
          macd: 'Bearish divergence',
          movingAverages: {
            sma20: basePrice * 1.03,
            sma50: basePrice * 1.06,
            ema12: basePrice * 0.97
          }
        },
        
        fundamentalAnalysis: {
          peRatio: 25 + Math.random() * 35,
          earnings: {
            nextDate: new Date(Date.now() + (15 + Math.random() * 25) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimate: 1.2 + Math.random() * 2,
            lastBeat: Math.random() < 0.4
          },
          revenue: '-5.2% YoY',
          growth: '-2.1% expected',
          sector: this.getSector(symbol)
        },
        
        newsAnalysis: {
          sentiment: 'bearish',
          recentHeadlines: [
            {
              title: `${symbol} Faces Headwinds in Current Market Environment`,
              source: 'Financial Times',
              sentiment: 'negative',
              date: new Date().toISOString(),
              impact: 'high'
            },
            {
              title: `Analysts Express Concern Over ${symbol} Growth Prospects`,
              source: 'CNBC',
              sentiment: 'negative',
              date: new Date(Date.now() - 86400000).toISOString(),
              impact: 'medium'
            }
          ],
          keyFactors: [
            'Slowing growth momentum',
            'Increased competition',
            'Margin pressure concerns',
            'Regulatory headwinds'
          ]
        },
        
        riskFactors: [
          'Limited downside protection',
          'Time decay risk',
          'Assignment risk near expiry',
          'Volatility crush post-earnings'
        ],
        
        catalysts: [
          'Earnings disappointment risk',
          'Sector weakness',
          'Technical breakdown below support',
          'Analyst downgrades'
        ],
        
        reasoning: `Bearish setup for ${symbol} based on technical breakdown below moving averages, fundamental concerns about growth trajectory, and negative sentiment shift. High implied volatility provides attractive premium for put buyers.`
      }

      recommendations.push(recommendation)
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  private getCompanyName(symbol: string): string {
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'NVDA': 'NVIDIA Corporation',
      'MSFT': 'Microsoft Corporation',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla Inc.',
      'META': 'Meta Platforms Inc.',
      'AMZN': 'Amazon.com Inc.',
      'AMD': 'Advanced Micro Devices',
      'CRM': 'Salesforce Inc.',
      'NFLX': 'Netflix Inc.',
      'ORCL': 'Oracle Corporation',
      'ADBE': 'Adobe Inc.',
      'PLTR': 'Palantir Technologies',
      'RBLX': 'Roblox Corporation',
      'SNOW': 'Snowflake Inc.',
      'ROKU': 'Roku Inc.',
      'PELOTON': 'Peloton Interactive',
      'ZM': 'Zoom Video Communications',
      'PTON': 'Peloton Interactive',
      'W': 'Wayfair Inc.',
      'DASH': 'DoorDash Inc.',
      'UBER': 'Uber Technologies',
      'LYFT': 'Lyft Inc.',
      'RIVN': 'Rivian Automotive',
      'LCID': 'Lucid Group',
      'SPCE': 'Virgin Galactic',
      'OPEN': 'Opendoor Technologies',
      'HOOD': 'Robinhood Markets',
      'COIN': 'Coinbase Global',
      'SQ': 'Block Inc.'
    }
    
    return names[symbol] || `${symbol} Corporation`
  }

  private getSector(symbol: string): string {
    const sectors: Record<string, string> = {
      'AAPL': 'Technology',
      'NVDA': 'Technology', 
      'MSFT': 'Technology',
      'GOOGL': 'Technology',
      'TSLA': 'Automotive',
      'META': 'Technology',
      'AMZN': 'E-commerce',
      'AMD': 'Technology',
      'CRM': 'Software',
      'NFLX': 'Entertainment',
      'ROKU': 'Entertainment',
      'ZM': 'Technology',
      'DASH': 'Consumer Services',
      'UBER': 'Transportation',
      'RIVN': 'Automotive',
      'COIN': 'Financial Services'
    }
    
    return sectors[symbol] || 'Technology'
  }
}