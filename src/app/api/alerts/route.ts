import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSmartAlert, getActiveAlerts } from '@/lib/alerts/smartAlertGenerator'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const onlyActive = searchParams.get('active') === 'true'

    const alerts = await getActiveAlerts(session.user.id!, { category: category || undefined, onlyActive })
    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Get alerts error:', error)
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
    const { type, priority, title, body: alertBody, contextData, actionButtons } = body

    if (!type || !priority || !title || !alertBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const alert = await createSmartAlert({
      userId: session.user.id!,
      type,
      data: {
        title,
        body: alertBody,
        priority,
        contextData: contextData || {},
        actionButtons: actionButtons || []
      }
    })

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Create alert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}