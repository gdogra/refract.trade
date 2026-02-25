import { NextRequest, NextResponse } from 'next/server'
import { signIn } from 'next-auth/react'

// Custom Google OAuth endpoint that handles referral codes
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const referralCode = searchParams.get('ref')
  
  // Store referral code in session/cookie for later use
  const response = NextResponse.redirect('/api/auth/signin/google')
  
  if (referralCode) {
    // Store referral code in a secure cookie for 1 hour
    response.cookies.set('pending-referral', referralCode, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      sameSite: 'lax'
    })
  }
  
  return response
}