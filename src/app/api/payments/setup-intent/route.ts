import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(req: NextRequest) {
  try {
    const { customerId } = await req.json()
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }
    
    // Create a SetupIntent for saving payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
    })
    
    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
    })
  } catch (error: any) {
    console.error('Setup intent creation failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}