import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSupabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import crypto from 'crypto'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = signupSchema.parse(body)

    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabase = createSupabaseAdmin()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password: hashedPassword,
        subscription_tier: 'basic',
        email_verified: false,
        verification_token: verificationToken,
        verification_expires: tokenExpiry.toISOString()
      })
      .select()
      .single()

    if (userError) {
      console.error('User creation error:', userError)
      throw userError
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        risk_tolerance: 'moderate',
        experience_level: 'beginner',
        trading_goals: []
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Don't fail the signup if profile creation fails
    }

    // Send verification email (log for now, replace with real email service in production)
    const verificationUrl = `https://refracttrade.netlify.app/auth/verify-email?token=${verificationToken}`
    
    // Log verification URL for testing (replace with actual email sending)
    console.log(`\n=== EMAIL VERIFICATION ===`)
    console.log(`To: ${email}`)
    console.log(`Subject: Verify your Refract.trade account`)
    console.log(`Link: ${verificationUrl}`)
    console.log(`===========================\n`)

    // Remove password and sensitive data from response
    const { password: _, verification_token: __, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: 'Account created! Please check your email to verify your account before signing in.',
        user: userWithoutPassword,
        requiresVerification: true,
        verificationUrl: verificationUrl // Include for testing, remove in production
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Signup error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}