import { NextRequest, NextResponse } from 'next/server'
import { ReferralManager } from '@/lib/referrals'

// POST - Process a referral signup
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referralCode, userId } = body

    if (!referralCode || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Referral code and user ID are required'
      }, { status: 400 })
    }

    const result = await ReferralManager.processReferralSignup(referralCode, userId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        referrerTrialExtension: result.referrerTrialExtension,
        newUserTrialDays: result.newUserTrialDays,
        message: 'Referral processed successfully!'
      }
    })

  } catch (error) {
    console.error('Error processing referral signup:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process referral signup'
    }, { status: 500 })
  }
}