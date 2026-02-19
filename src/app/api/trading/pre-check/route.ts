import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runPreTradeCheck } from '@/lib/safety/preTradeChecker'
import { TradingRulesEngine } from '@/lib/rules/tradingRulesEngine'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { symbol, type, strike, expiration, quantity, action, strategy } = body

    if (!symbol || !type || !strike || !expiration || !quantity || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const safetyResult = await runPreTradeCheck({
      userId: session.user.id,
      symbol,
      type,
      strike: parseFloat(strike),
      expiration,
      quantity: parseInt(quantity),
      action,
      strategy
    })

    const rulesResult = await TradingRulesEngine.evaluateAllRules({
      userId: session.user.id,
      symbol,
      type,
      strike: parseFloat(strike),
      expiration,
      quantity: parseInt(quantity),
      action,
      strategy
    })

    const combinedResult = {
      safetyCheck: safetyResult,
      rulesCheck: rulesResult,
      canProceed: safetyResult.canProceed && rulesResult.canProceed,
      allWarnings: [...safetyResult.warnings, ...rulesResult.warnings.map(w => w.message)],
      allBlockers: [...safetyResult.blockers, ...rulesResult.blockers.map(b => b.message)]
    }

    return NextResponse.json(combinedResult)
  } catch (error) {
    console.error('Pre-trade check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}