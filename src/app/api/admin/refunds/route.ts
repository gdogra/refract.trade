import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch refund history
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
    
    // Get refund history from admin actions
    const refunds = await prisma.adminAction.findMany({
      where: {
        action: 'refund_issued'
      },
      include: {
        admin: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    const formattedRefunds = refunds.map(refund => {
      // Safely cast details to an object with optional properties
      const details = refund.details as { userId?: string; userEmail?: string; status?: string } | null
      
      return {
        id: refund.id,
        amount: refund.refundAmount,
        reason: refund.refundReason,
        userId: details?.userId,
        userEmail: details?.userEmail,
        adminName: refund.admin.name,
        adminEmail: refund.admin.email,
        createdAt: refund.createdAt,
        status: details?.status || 'completed'
      }
    })
    
    // Calculate stats
    const totalRefunded = refunds.reduce((sum, refund) => 
      sum + Number(refund.refundAmount || 0), 0
    )
    
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    
    const monthlyRefunds = refunds.filter(refund => 
      refund.createdAt >= monthStart
    )
    
    const monthlyTotal = monthlyRefunds.reduce((sum, refund) => 
      sum + Number(refund.refundAmount || 0), 0
    )
    
    return NextResponse.json({
      success: true,
      data: {
        refunds: formattedRefunds,
        stats: {
          totalRefunded,
          monthlyTotal,
          totalCount: refunds.length,
          monthlyCount: monthlyRefunds.length
        }
      }
    })
    
  } catch (error) {
    console.error('Admin refunds fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch refunds'
    }, { status: 500 })
  }
}

// POST - Process a refund
export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    const { userId, amount, reason, paymentMethod } = body
    
    if (!userId || !amount || !reason) {
      return NextResponse.json({
        success: false,
        error: 'User ID, amount, and reason are required'
      }, { status: 400 })
    }

    // Get admin user ID for logging
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      }, { status: 404 })
    }
    
    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Refund amount must be positive'
      }, { status: 400 })
    }
    
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true 
      }
    })
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }
    
    // In a real implementation, you would integrate with payment processors here
    // For now, we'll simulate the refund process
    
    const refundId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Process refund based on payment method
    let refundResult
    try {
      refundResult = await processRefundWithProvider({
        userId,
        amount,
        reason,
        paymentMethod,
        refundId
      })
    } catch (error) {
      console.error('Refund processing error:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to process refund with payment provider'
      }, { status: 500 })
    }
    
    // Log the refund action
    const adminAction = await prisma.adminAction.create({
      data: {
        adminId: adminUser.id,
        action: 'refund_issued',
        refundAmount: amount,
        refundReason: reason,
        details: {
          userId,
          userEmail: user.email,
          userName: user.name,
          paymentMethod,
          refundId,
          status: refundResult.status,
          providerResponse: refundResult.providerResponse
        }
      }
    })
    
    // Create notification for user
    try {
      const { createRefundProcessedNotification } = await import('@/lib/notifications')
      await createRefundProcessedNotification({
        userId,
        amount,
        reason,
        refundId,
        estimatedArrival: refundResult.estimatedArrival
      })
    } catch (error) {
      console.error('Failed to create refund notification:', error)
      // Don't fail the refund if notification fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        refundId,
        amount,
        status: refundResult.status,
        estimatedArrival: refundResult.estimatedArrival,
        adminActionId: adminAction.id
      }
    })
    
  } catch (error) {
    console.error('Admin refund processing error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process refund'
    }, { status: 500 })
  }
}

// Helper function to process refunds with payment providers
async function processRefundWithProvider(refundData: {
  userId: string
  amount: number
  reason: string
  paymentMethod?: string
  refundId: string
}) {
  // In a real implementation, integrate with:
  // - Stripe: stripe.refunds.create()
  // - PayPal: paypal.payments.refund()
  // - Square: square.refunds.refundPayment()
  // - etc.
  
  // For demonstration, we'll simulate different scenarios
  const { amount, reason, paymentMethod = 'stripe' } = refundData
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Simulate different refund scenarios
  if (amount > 10000) {
    throw new Error('Refund amount exceeds maximum limit')
  }
  
  // Mock successful refund
  const estimatedArrival = new Date()
  estimatedArrival.setDate(estimatedArrival.getDate() + (paymentMethod === 'paypal' ? 1 : 5))
  
  return {
    status: 'success',
    estimatedArrival: estimatedArrival.toISOString(),
    providerResponse: {
      provider: paymentMethod,
      transactionId: `${paymentMethod}_${Date.now()}`,
      message: 'Refund processed successfully'
    }
  }
}

// PATCH - Update refund status (for tracking purposes)
export async function PATCH(request: NextRequest) {
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
    
    const body = await request.json()
    const { adminActionId, status, notes } = body
    
    if (!adminActionId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Admin action ID and status are required'
      }, { status: 400 })
    }

    // Get admin user ID for logging
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!adminUser) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      }, { status: 404 })
    }
    
    // Update the admin action with new status
    const updatedAction = await prisma.adminAction.update({
      where: { 
        id: adminActionId,
        action: 'refund_issued' // Ensure we're only updating refund actions
      },
      data: {
        details: {
          ...await prisma.adminAction.findUnique({
            where: { id: adminActionId },
            select: { details: true }
          }).then(action => (action?.details as Record<string, any>) || {}),
          status,
          notes,
          updatedAt: new Date().toISOString(),
          updatedBy: adminUser.id
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: updatedAction
    })
    
  } catch (error) {
    console.error('Refund status update error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update refund status'
    }, { status: 500 })
  }
}