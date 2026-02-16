import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

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

    const supabase = createSupabaseAdmin()
    
    // Find user with this token
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, email_verified, verification_expires')
      .eq('verification_token', token)
      .single()
    
    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      )
    }

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
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_expires: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
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
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}