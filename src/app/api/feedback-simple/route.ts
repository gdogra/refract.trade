import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple Feedback API - No Database Dependencies
 * This endpoint provides immediate feedback submission without relying on Prisma/Database
 */

export async function POST(request: NextRequest) {
  try {
    // Parse FormData
    const formData = await request.formData()
    
    const category = formData.get('category') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const priority = formData.get('priority') || 'medium'
    const systemInfoStr = formData.get('systemInfo') as string
    
    // Validate required fields
    if (!category || !subject || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: category, subject, and message are required'
      }, { status: 400 })
    }
    
    if (!email || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email and name are required'
      }, { status: 400 })
    }
    
    // Parse system info
    let systemInfo = null
    try {
      systemInfo = systemInfoStr ? JSON.parse(systemInfoStr) : null
    } catch (e) {
      console.warn('Failed to parse system info:', e)
    }
    
    // Generate unique feedback ID
    const feedbackId = `simple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create feedback object
    const feedback = {
      id: feedbackId,
      email,
      name,
      category,
      subject,
      message,
      priority,
      userAgent: request.headers.get('user-agent'),
      url: systemInfo?.url || request.headers.get('referer'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      timestamp: new Date().toISOString(),
      source: 'simple_api'
    }
    
    // Log feedback (this will appear in Netlify function logs)
    console.log('='.repeat(80))
    console.log('🎯 NEW FEEDBACK RECEIVED:')
    console.log('='.repeat(80))
    console.log(`ID: ${feedback.id}`)
    console.log(`From: ${feedback.name} <${feedback.email}>`)
    console.log(`Category: ${feedback.category}`)
    console.log(`Priority: ${feedback.priority}`)
    console.log(`Subject: ${feedback.subject}`)
    console.log(`Message: ${feedback.message}`)
    console.log(`URL: ${feedback.url}`)
    console.log(`User Agent: ${feedback.userAgent}`)
    console.log(`Timestamp: ${feedback.timestamp}`)
    console.log('='.repeat(80))
    
    // In production, you could also:
    // 1. Send to external logging service
    // 2. Send email directly via SendGrid/Resend
    // 3. Post to Slack webhook
    // 4. Store in external service (Airtable, etc.)
    
    try {
      // Optional: Send to external service
      await sendToExternalService(feedback)
    } catch (externalError) {
      console.error('External service notification failed:', externalError)
      // Don't fail the request if external service fails
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: feedbackId,
        message: 'Thank you for your feedback! We have received your message and will respond soon.',
        timestamp: feedback.timestamp
      }
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    })
    
  } catch (error) {
    console.error('Simple feedback API error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Unable to submit feedback at this time. Please try again later.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Simple Feedback API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      post: '/api/feedback-simple - Submit feedback',
      method: 'POST',
      contentType: 'multipart/form-data',
      requiredFields: ['category', 'subject', 'message', 'email', 'name'],
      optionalFields: ['priority', 'systemInfo']
    }
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

// Optional external service integration
async function sendToExternalService(feedback: any) {
  // Example implementations:
  
  // 1. Slack Webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🎯 New ${feedback.category} feedback: ${feedback.subject}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `New ${feedback.category} Feedback`
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:* ${feedback.name}`
              },
              {
                type: 'mrkdwn',
                text: `*Email:* ${feedback.email}`
              },
              {
                type: 'mrkdwn',
                text: `*Category:* ${feedback.category}`
              },
              {
                type: 'mrkdwn',
                text: `*Priority:* ${feedback.priority}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Subject:* ${feedback.subject}\n\n*Message:*\n${feedback.message}`
            }
          }
        ]
      })
    })
  }
  
  // 2. Email via SendGrid/Resend
  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'feedback@refract.trade',
        to: ['admin@refract.trade'],
        subject: `New ${feedback.category} Feedback: ${feedback.subject}`,
        html: `
          <h2>New Feedback Received</h2>
          <p><strong>From:</strong> ${feedback.name} (${feedback.email})</p>
          <p><strong>Category:</strong> ${feedback.category}</p>
          <p><strong>Priority:</strong> ${feedback.priority}</p>
          <p><strong>Subject:</strong> ${feedback.subject}</p>
          <p><strong>Message:</strong></p>
          <blockquote>${feedback.message}</blockquote>
          <p><strong>Timestamp:</strong> ${feedback.timestamp}</p>
          <p><strong>URL:</strong> ${feedback.url}</p>
        `,
      }),
    })
  }
  
  console.log('✅ External service notifications sent successfully')
}