import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OptionsRecommendationEngine, RecommendationFilters } from '@/lib/optionsRecommendations'
import { RiskBudgetManager } from '@/lib/riskBudgeting'
import { SubscriptionManager, UsageTracker } from '@/lib/subscription'
import { z } from 'zod'

const RecommendationRequestSchema = z.object({
  filters: z.object({
    minVolume: z.number().optional(),
    maxDaysToExpiry: z.number().optional(),
    minDelta: z.number().optional(),
    maxDelta: z.number().optional(),
    sectors: z.array(z.string()).optional(),
    minConfidence: z.number().optional(),
    priceRange: z.object({
      min: z.number(),
      max: z.number()
    }).optional()
  }).optional(),
  includePortfolioOptimization: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userTier = (session.user as any).subscriptionTier || 'free'
    
    // Parse filters from query params
    const filters: RecommendationFilters = {}
    if (searchParams.get('minVolume')) {
      filters.minVolume = parseInt(searchParams.get('minVolume')!)
    }
    if (searchParams.get('maxDaysToExpiry')) {
      filters.maxDaysToExpiry = parseInt(searchParams.get('maxDaysToExpiry')!)
    }
    if (searchParams.get('sectors')) {
      filters.sectors = searchParams.get('sectors')!.split(',')
    }

    // Check usage limits
    const usageCheck = await UsageTracker.checkLimit(session.user.id, userTier, 'dailyRecommendations')
    
    if (!usageCheck.allowed) {
      return NextResponse.json({
        error: 'Daily recommendation limit exceeded',
        upgradeRequired: usageCheck.upgradeRequired,
        message: `Upgrade to ${usageCheck.upgradeRequired} for unlimited recommendations`
      }, { status: 429 })
    }

    // Get user's portfolio context (mock for now)
    const portfolioContext = {
      totalValue: 125000,
      availableCash: 25000,
      riskBudget: 6250, // 5% of portfolio
      riskUtilization: 0.68,
      currentPositions: [
        {
          symbol: 'AAPL',
          quantity: 100,
          avgCost: 150,
          marketValue: 17500,
          unrealizedPnL: 2500,
          positionType: 'stock' as const
        },
        {
          symbol: 'NVDA',
          quantity: 50,
          avgCost: 140,
          marketValue: 8500,
          unrealizedPnL: 1500,
          positionType: 'stock' as const
        }
      ],
      sectorExposure: {
        'Technology': 0.6,
        'Healthcare': 0.2,
        'Finance': 0.15,
        'Energy': 0.05
      },
      correlationRisk: 0.35
    }

    // Initialize recommendation engine with portfolio context
    const engine = new OptionsRecommendationEngine(portfolioContext, userTier)
    
    // Get personalized recommendations
    const recommendations = await engine.getPersonalizedRecommendations(session.user.id, filters)
    
    // Add risk budgeting analysis for Pro+ users
    let riskAnalysis = undefined
    if (SubscriptionManager.canAccess(userTier, 'riskMonitoring')) {
      const riskManager = new RiskBudgetManager(portfolioContext, 'moderate')
      riskAnalysis = {
        riskBudget: riskManager.calculateRiskBudget(),
        riskMetrics: riskManager.generateRiskMetrics()
      }
    }

    // Track successful recommendation generation
    await UsageTracker.incrementUsage(session.user.id, 'recommendations')

    return NextResponse.json({
      success: true,
      data: {
        ...recommendations,
        riskAnalysis,
        disclaimer: "This information is for educational purposes only and does not constitute financial advice. Options trading involves substantial risk and is not suitable for all investors.",
        userTier,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Recommendations API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to generate recommendations at this time'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedInput = RecommendationRequestSchema.parse(body)
    
    const userTier = (session.user as any).subscriptionTier || 'free'
    
    // Check if user can access custom scans
    if (!SubscriptionManager.canAccess(userTier, 'scanLimit')) {
      return NextResponse.json({
        error: 'Custom scans require Pro subscription',
        upgradeRequired: 'pro'
      }, { status: 403 })
    }

    const scanUsage = await UsageTracker.checkLimit(session.user.id, userTier, 'scanLimit')
    
    if (!scanUsage.allowed) {
      return NextResponse.json({
        error: 'Daily scan limit exceeded',
        upgradeRequired: scanUsage.upgradeRequired
      }, { status: 429 })
    }

    // Process custom recommendation request
    const portfolioContext = {
      // Mock portfolio context - in production, fetch from database
      totalValue: 125000,
      availableCash: 25000,
      riskBudget: 6250,
      riskUtilization: 0.68,
      currentPositions: [],
      sectorExposure: {},
      correlationRisk: 0.2
    }

    const engine = new OptionsRecommendationEngine(portfolioContext, userTier)
    const recommendations = await engine.getPersonalizedRecommendations(
      session.user.id,
      validatedInput.filters
    )

    // Track scan usage
    await UsageTracker.incrementUsage(session.user.id, 'api_requests')

    return NextResponse.json({
      success: true,
      data: {
        ...recommendations,
        scanType: 'custom',
        filters: validatedInput.filters,
        disclaimer: "This information is for educational purposes only and does not constitute financial advice.",
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Custom recommendations API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Unable to process custom recommendation request'
      },
      { status: 500 }
    )
  }
}

// Usage analytics endpoint
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { action, metadata } = await request.json()
    
    // Track user interactions for compliance and product analytics
    const complianceLog = {
      userId: session.user.id,
      action,
      timestamp: new Date(),
      metadata: metadata || {},
      disclaimerShown: true,
      riskWarningShown: metadata?.riskLevel === 'high'
    }
    
    // In production: Save to compliance database
    console.log('Compliance log:', complianceLog)
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Usage tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    )
  }
}