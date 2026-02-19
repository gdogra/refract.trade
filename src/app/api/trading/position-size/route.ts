import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculatePositionSize } from '@/lib/sizing/positionSizer'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { symbol, type, strike, expiration, optionPrice, strategy, maxLoss } = body

    if (!symbol || !type || !strike || !expiration || !optionPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await calculatePositionSize({
      userId: session.user.id,
      symbol,
      type,
      strike: parseFloat(strike),
      expiration,
      optionPrice: parseFloat(optionPrice),
      strategy,
      maxLoss: maxLoss ? parseFloat(maxLoss) : undefined
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Position sizing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}