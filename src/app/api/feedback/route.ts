import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Check database connection
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'Database configuration required. Please contact support.'
      }, { status: 503 })
    }

    const session = await getServerSession()
    
    // Parse FormData
    const formData = await request.formData()
    
    const category = formData.get('category') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const priority = formData.get('priority') as string
    const systemInfoStr = formData.get('systemInfo') as string
    const screenshot = formData.get('screenshot') as File | null
    
    // Validate required fields
    if (!category || !subject || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    if (!session?.user && (!email || !name)) {
      return NextResponse.json({
        success: false,
        error: 'Email and name required for anonymous feedback'
      }, { status: 400 })
    }
    
    let systemInfo = null
    try {
      systemInfo = systemInfoStr ? JSON.parse(systemInfoStr) : null
    } catch (e) {
      console.warn('Failed to parse system info:', e)
    }
    
    // Handle screenshot upload if present
    let screenshotUrl = null
    if (screenshot) {
      try {
        // In production, upload to S3/CloudStorage
        // For now, we'll just note that a screenshot was provided
        screenshotUrl = `screenshot_${Date.now()}_${screenshot.name}`
        
        // TODO: Implement actual file upload
        // const uploadResult = await uploadToStorage(screenshot)
        // screenshotUrl = uploadResult.url
      } catch (error) {
        console.error('Screenshot upload failed:', error)
      }
    }
    
    // Extract URL from system info
    const url = systemInfo?.url || null
    const userAgent = systemInfo?.userAgent || request.headers.get('user-agent') || null
    
    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        userId: session?.user?.id || null,
        email: session?.user?.email || email,
        name: session?.user?.name || name,
        category,
        subject,
        message,
        priority,
        url,
        userAgent,
        screenshot: screenshotUrl,
        systemInfo,
        status: 'open'
      }
    })
    
    // Send confirmation email to user
    try {
      await sendFeedbackConfirmationEmail(feedback)
    } catch (error) {
      console.error('Failed to send confirmation email:', error)
      // Don't fail the request if email fails
    }
    
    // Send notification to admins (in production, use email/Slack)
    try {
      await notifyAdminsOfNewFeedback(feedback)
    } catch (error) {
      console.error('Failed to notify admins:', error)
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: feedback.id,
        message: 'Feedback submitted successfully'
      }
    })
    
  } catch (error) {
    console.error('Feedback submission error:', error)
    
    // Check if it's a database connection error
    if (error instanceof Error && error.message.includes('database') || error instanceof Error && error.message.includes('connection')) {
      return NextResponse.json({
        success: false,
        error: 'Database temporarily unavailable. Please try again later.'
      }, { status: 503 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to submit feedback'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Get user's feedback history
    const feedback = await prisma.feedback.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email }
        ]
      },
      select: {
        id: true,
        category: true,
        subject: true,
        message: true,
        priority: true,
        status: true,
        adminResponse: true,
        respondedAt: true,
        satisfactionRating: true,
        createdAt: true,
        updatedAt: true,
        admin: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json({
      success: true,
      data: feedback
    })
    
  } catch (error) {
    console.error('Feedback retrieval error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve feedback'
    }, { status: 500 })
  }
}

// Helper function to send feedback confirmation email
async function sendFeedbackConfirmationEmail(feedback: any) {
  const { createFeedbackSubmittedNotification } = await import('@/lib/notifications')
  
  try {
    await createFeedbackSubmittedNotification({
      id: feedback.id,
      userId: feedback.userId,
      userEmail: feedback.email,
      userName: feedback.name,
      category: feedback.category,
      subject: feedback.subject,
      message: feedback.message,
      priority: feedback.priority
    })
    
    console.log(`Feedback confirmation email queued for:`, {
      email: feedback.email,
      feedbackId: feedback.id,
      subject: feedback.subject
    })
  } catch (error) {
    console.error('Failed to create feedback confirmation notification:', error)
    throw error
  }
}

// Helper function to notify admins
async function notifyAdminsOfNewFeedback(feedback: any) {
  const adminUsers = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true }
  })
  
  // In production, send email/Slack notifications
  console.log(`New ${feedback.category} feedback received:`, {
    id: feedback.id,
    subject: feedback.subject,
    priority: feedback.priority,
    from: feedback.email,
    adminCount: adminUsers.length
  })
  
  // TODO: Implement email notifications to admins
  // await sendEmailToAdmins({
  //   subject: `New ${feedback.category} feedback: ${feedback.subject}`,
  //   template: 'admin-feedback-notification',
  //   data: feedback
  // })
}