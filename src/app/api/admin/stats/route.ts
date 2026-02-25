import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
    
    // Get current month start
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Gather statistics
    const [
      totalUsers,
      activeUsers,
      totalFeedback,
      openFeedback,
      resolvedFeedback,
      criticalIssues,
      monthlyRefunds
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users (logged in within 30 days)
      prisma.user.count({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Total feedback
      prisma.feedback.count(),
      
      // Open feedback
      prisma.feedback.count({
        where: { status: 'open' }
      }),
      
      // Resolved feedback
      prisma.feedback.count({
        where: { status: 'resolved' }
      }),
      
      // Critical issues (high/critical priority open feedback)
      prisma.feedback.count({
        where: {
          priority: { in: ['high', 'critical'] },
          status: { in: ['open', 'in_progress'] }
        }
      }),
      
      // Monthly refunds
      prisma.adminAction.findMany({
        where: {
          action: 'refund_issued',
          createdAt: { gte: monthStart }
        },
        select: { refundAmount: true }
      })
    ])
    
    const totalRefunds = monthlyRefunds.reduce(
      (sum, refund) => sum + Number(refund.refundAmount || 0), 
      0
    )
    
    // Mock revenue calculation (in production, integrate with payment provider)
    const mockRevenue = Math.floor(totalUsers * 39.99 * 0.3) // Rough estimate
    
    const stats = {
      totalUsers,
      activeUsers,
      totalFeedback,
      openFeedback,
      resolvedFeedback,
      criticalIssues,
      revenue: mockRevenue,
      refundsIssued: totalRefunds
    }
    
    return NextResponse.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    console.error('Admin stats error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load stats'
    }, { status: 500 })
  }
}