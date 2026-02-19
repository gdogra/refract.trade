import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TradingRulesEngine } from '@/lib/rules/tradingRulesEngine'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rules = await TradingRulesEngine.getUserRules(session.user.id)
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Get rules error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, ruleType, condition, action, priority = 0 } = body

    if (!name || !ruleType || !condition || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const rule = await TradingRulesEngine.createRule(
      session.user.id,
      name,
      ruleType,
      condition,
      action,
      priority
    )

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Create rule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { ruleId, ...updates } = body

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })
    }

    const rule = await TradingRulesEngine.updateRule(ruleId, updates)
    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Update rule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 })
    }

    await TradingRulesEngine.deleteRule(ruleId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete rule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}