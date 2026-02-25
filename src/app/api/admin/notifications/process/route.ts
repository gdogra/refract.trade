import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { processNotificationQueue } from '@/lib/notifications'

const prisma = new PrismaClient()

// POST - Process notification queue
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Verify admin status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })
    
    if (!user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }
    
    // Process the notification queue
    const result = await processNotificationQueue()
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('Notification processing error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process notifications'
    }, { status: 500 })
  }
}

// GET - Get notification queue status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Verify admin status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })
    
    if (!user?.isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }
    
    // Get notification queue statistics
    const [pending, sent, failed, total] = await Promise.all([
      prisma.smartNotification.count({
        where: { status: 'pending' }
      }),
      prisma.smartNotification.count({
        where: { status: 'sent' }
      }),
      prisma.smartNotification.count({
        where: { status: 'failed' }
      }),
      prisma.smartNotification.count()
    ])
    
    // Get recent notifications
    const recentNotifications = await prisma.smartNotification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          pending,
          sent,
          failed,
          total
        },
        recentNotifications
      }
    })
    
  } catch (error) {
    console.error('Notification status error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get notification status'
    }, { status: 500 })
  }
}