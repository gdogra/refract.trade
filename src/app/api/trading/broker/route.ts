import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectBroker, sendOrderToBroker, getBrokerConnections } from '@/lib/brokers/brokerConnector'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const connections = await getBrokerConnections(session.user.id)
    return NextResponse.json({ connections })
  } catch (error) {
    console.error('Get broker connections error:', error)
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
    const { action, ...data } = body

    switch (action) {
      case 'connect':
        const { broker, apiKey, apiSecret, accountId } = data
        const connection = await connectBroker(session.user.id, {
          broker,
          apiKey,
          apiSecret,
          accountId
        })
        return NextResponse.json({ connection })

      case 'send_order':
        const { broker: orderBroker, order } = data
        const result = await sendOrderToBroker(session.user.id, orderBroker, order)
        return NextResponse.json({ result })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Broker API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}