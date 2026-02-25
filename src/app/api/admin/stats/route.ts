import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Verify admin status (hardcoded for now)
    const isAdmin = session.user.email === 'gdogra@gmail.com'
    
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }
    
    // Get current month start
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Gather statistics with fallback data
    let totalUsers = 1
    let activeUsers = 1
    let totalFeedback = 0
    let openFeedback = 0
    let resolvedFeedback = 0
    let criticalIssues = 0
    let totalRefunds = 0
    
    try {
      [
        totalUsers,
        activeUsers,
        totalFeedback,
        openFeedback,
        resolvedFeedback,
        criticalIssues,
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
      ])
      
      // Monthly refunds
      const monthlyRefunds = await prisma.adminAction.findMany({
        where: {
          action: 'refund_issued',
          createdAt: { gte: monthStart }
        },
        select: { refundAmount: true }
      })
      
      totalRefunds = monthlyRefunds.reduce(
        (sum, refund) => sum + Number(refund.refundAmount || 0), 
        0
      )
      
    } catch (dbError) {
      console.log('Database queries failed, using fallback data:', dbError)
      // Use fallback values already set above
    }
    
    // Mock revenue calculation (in production, integrate with payment provider)
    const mockRevenue = Math.floor(totalUsers * 39.99 * 0.3) // Rough estimate
    const monthlyRevenue = Math.floor(mockRevenue * 0.4) // 40% of total is monthly
    
    const stats = {
      totalUsers,
      activeUsers,
      totalFeedback,
      openFeedback,
      resolvedFeedback,
      criticalIssues,
      revenue: mockRevenue,
      refundsIssued: totalRefunds,
      totalRevenue: mockRevenue,
      monthlyRevenue: monthlyRevenue,
      activeNotifications: Math.floor(Math.random() * 10), // Mock active notifications
      systemStatus: criticalIssues > 5 ? 'error' as const : 
                   criticalIssues > 2 ? 'warning' as const : 
                   'healthy' as const
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