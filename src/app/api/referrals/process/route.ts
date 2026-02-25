import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ReferralManager } from '@/lib/subscription'

export async function POST(req: NextRequest) {
  try {
    const { referralCode, newUserId } = await req.json()
    
    if (!referralCode || !newUserId) {
      return NextResponse.json(
        { error: 'Referral code and user ID are required' },
        { status: 400 }
      )
    }
    
    const success = await ReferralManager.processReferral(referralCode, newUserId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Referral processed successfully! Both you and your referrer receive a free month.' 
    })
  } catch (error: any) {
    console.error('Referral processing failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get user from session
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    
    const stats = await ReferralManager.getReferralStats(userId)
    const referralCode = await ReferralManager.generateReferralCode(userId)
    
    return NextResponse.json({
      referralCode,
      totalReferrals: stats.totalReferrals,
      totalRewards: stats.totalTrialDaysEarned
    })
  } catch (error: any) {
    console.error('Failed to get referral stats:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}