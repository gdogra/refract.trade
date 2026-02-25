import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ReferralManager } from '@/lib/referrals'

// GET - Get user's referral information and stats
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const stats = await ReferralManager.getReferralStats(session.user.id)
    const trialDaysRemaining = await ReferralManager.getTrialDaysRemaining(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        trialDaysRemaining
      }
    })

  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch referral information'
    }, { status: 500 })
  }
}

// POST - Generate a referral code for the user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Check if user already has a referral code
    let referralCode = await ReferralManager.getUserReferralCode(session.user.id)
    
    if (!referralCode) {
      // Generate new referral code
      referralCode = await ReferralManager.generateReferralCode(session.user.id)
    }

    return NextResponse.json({
      success: true,
      data: {
        referralCode,
        shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/signup?ref=${referralCode}`
      }
    })

  } catch (error) {
    console.error('Error generating referral code:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate referral code'
    }, { status: 500 })
  }
}