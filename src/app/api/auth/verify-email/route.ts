import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Direct fetch to Supabase REST API
    const supabaseUrl = 'https://pfeikjkqqotksxwijcwh.supabase.co'
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWlramtxcW90a3N4d2lqY3doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2Njk4OSwiZXhwIjoyMDg2MjQyOTg5fQ.n4cv1s6tqumaLEOOJ2tg7eyowzkjx9TfoNpSrSlAW3s'
    
    // Find user with this token
    const response = await fetch(`${supabaseUrl}/rest/v1/users?verification_token=eq.${token}&select=id,email,email_verified,verification_expires`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    })

    const users = await response.json()
    
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

    const user = users[0]

    // Check if token is expired
    if (new Date() > new Date(user.verification_expires)) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json(
        { message: 'Email already verified', verified: true },
        { status: 200 }
      )
    }

    // Update user as verified
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email_verified: true,
        verification_token: null,
        verification_expires: null
      })
    })

    if (!updateResponse.ok) {
      throw new Error('Failed to update user verification status')
    }

    return NextResponse.json(
      { 
        message: 'Email verified successfully! You can now sign in.',
        verified: true 
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}