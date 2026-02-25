import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch all feedback for admin
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
    
    // Get all feedback
    const feedback = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        admin: {
          select: {
            name: true
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // Open first
        { priority: 'desc' }, // Critical first
        { createdAt: 'desc' } // Newest first
      ]
    })
    
    return NextResponse.json({
      success: true,
      data: feedback
    })
    
  } catch (error) {
    console.error('Admin feedback fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch feedback'
    }, { status: 500 })
  }
}

// PATCH - Update feedback (status, response, etc.)
export async function PATCH(request: NextRequest) {
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
    
    const body = await request.json()
    const { id, status, adminResponse } = body
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Feedback ID required'
      }, { status: 400 })
    }
    
    // Prepare update data
    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }
    
    if (adminResponse) {
      updateData.adminResponse = adminResponse
      updateData.adminId = session.user.id
      updateData.respondedAt = new Date()
      
      // Auto-set to resolved when response is added
      if (!status) {
        updateData.status = 'resolved'
      }
    }
    
    // Update feedback
    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    })
    
    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: session.user.id,
        action: 'feedback_responded',
        details: {
          feedbackId: id,
          status: updateData.status,
          hasResponse: !!adminResponse
        }
      }
    })
    
    // Send notification to user if response was added
    if (adminResponse && updatedFeedback.user) {
      try {
        await notifyUserOfResponse(updatedFeedback)
      } catch (error) {
        console.error('Failed to notify user:', error)
        // Don't fail the request if notification fails
      }
    }
    
    return NextResponse.json({
      success: true,
      data: updatedFeedback
    })
    
  } catch (error) {
    console.error('Admin feedback update error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update feedback'
    }, { status: 500 })
  }
}

// Helper function to notify user of admin response
async function notifyUserOfResponse(feedback: any) {
  const { createFeedbackResponseNotification } = await import('@/lib/notifications')
  
  try {
    if (feedback.userId) {
      await createFeedbackResponseNotification({
        id: feedback.id,
        userId: feedback.userId,
        userEmail: feedback.user?.email || feedback.email,
        userName: feedback.user?.name || feedback.name,
        category: feedback.category,
        subject: feedback.subject,
        adminResponse: feedback.adminResponse
      })
      
      console.log(`Notification queued for feedback response:`, {
        userId: feedback.userId,
        feedbackId: feedback.id,
        subject: feedback.subject
      })
    } else {
      console.log('Feedback has no userId, skipping notification')
    }
  } catch (error) {
    console.error('Failed to create feedback response notification:', error)
    throw error
  }
}