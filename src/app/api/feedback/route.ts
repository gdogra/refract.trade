import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

// Lazy initialize Prisma to handle connection issues gracefully
let prisma: PrismaClient | null = null

function getPrismaClient(): PrismaClient {
  if (!prisma) {
    try {
      prisma = new PrismaClient({
        log: ['error'],
        errorFormat: 'minimal',
      })
    } catch (error) {
      console.error('Failed to initialize Prisma client:', error)
      throw new Error('Database initialization failed')
    }
  }
  return prisma
}

export async function POST(request: NextRequest) {
  try {
    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured, using fallback feedback system')
      return await handleFallbackFeedback(request)
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
    
    let feedback: any;
    
    try {
      // Get Prisma client with error handling
      const client = getPrismaClient()

      // Test database connection
      await client.$queryRaw`SELECT 1`
      
      // Create feedback record
      feedback = await client.feedback.create({
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
    } catch (dbError) {
      console.error('Database operation failed, using fallback:', dbError)
      return await handleFallbackFeedback(request)
    }
    
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
    
    // Get Prisma client with error handling
    const client = getPrismaClient()
    
    // Get user's feedback history
    const feedback = await client.feedback.findMany({
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
  const client = getPrismaClient()
  const adminUsers = await client.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true }
  })
  
  // In production, send email/Slack notifications
  console.log(`New ${feedback.category} feedback received:`, {
    id: feedback.id,
    subject: feedback.subject,
    priority: feedback.priority,
    from: feedback.email,
    adminCount: adminUsers?.length || 0
  })
  
  // TODO: Implement email notifications to admins
  // await sendEmailToAdmins({
  //   subject: `New ${feedback.category} feedback: ${feedback.subject}`,
  //   template: 'admin-feedback-notification',
  //   data: feedback
  // })
}

// Fallback feedback system when database is unavailable
async function handleFallbackFeedback(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession()
    
    // Parse FormData
    const formData = await request.formData()
    
    const category = formData.get('category') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const priority = formData.get('priority') as string
    
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
    
    // Create fallback feedback ID
    const fallbackId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Log feedback to console (in production, this could go to external service)
    const fallbackFeedback = {
      id: fallbackId,
      userId: session?.user?.id || null,
      email: session?.user?.email || email,
      name: session?.user?.name || name,
      category,
      subject,
      message,
      priority,
      userAgent: request.headers.get('user-agent'),
      url: formData.get('systemInfo') ? JSON.parse(formData.get('systemInfo') as string)?.url : null,
      timestamp: new Date().toISOString(),
      source: 'fallback_system'
    }
    
    console.log('FALLBACK FEEDBACK RECEIVED:', JSON.stringify(fallbackFeedback, null, 2))
    
    // In production, you could:
    // - Send to external logging service (e.g., Sentry, LogRocket)
    // - Send directly to admin email
    // - Store in external service (e.g., Airtable, Google Sheets)
    // - Queue for retry when database is back online
    
    try {
      // Attempt to send notification to admins via external service
      await notifyAdminsViaFallback(fallbackFeedback)
    } catch (notificationError) {
      console.error('Fallback notification failed:', notificationError)
      // Don't fail the request if notification fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: fallbackId,
        message: 'Feedback received and logged. Our team will review it shortly.',
        note: 'Feedback system is temporarily using backup logging.'
      }
    })
    
  } catch (error) {
    console.error('Fallback feedback system error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Unable to process feedback at this time. Please try again later.'
    }, { status: 503 })
  }
}

// Fallback notification system
async function notifyAdminsViaFallback(feedback: any) {
  // In production, implement one or more of these:
  
  // 1. Email directly via external service (e.g., SendGrid, Resend)
  // 2. Slack webhook
  // 3. External logging service
  // 4. Admin dashboard API
  
  console.log(`🚨 ADMIN ALERT: New ${feedback.category} feedback received:`, {
    id: feedback.id,
    subject: feedback.subject,
    priority: feedback.priority,
    from: feedback.email,
    timestamp: feedback.timestamp
  })
  
  // TODO: Implement actual external notification
  // Example Slack webhook:
  // await fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     text: `New ${feedback.category} feedback: ${feedback.subject}`,
  //     blocks: [...]
  //   })
  // })
}