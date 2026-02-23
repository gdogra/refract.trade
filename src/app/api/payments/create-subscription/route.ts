import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PaymentProcessor } from '@/lib/payments'

export async function POST(req: NextRequest) {
  try {
    // Get user info from session
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const email = session.user.email!
    const name = session.user.name || 'User'
    
    const { paymentMethodId } = await req.json()
    
    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }
    
    // Create or get customer
    const { customerId, error: customerError } = await PaymentProcessor.createCustomer(
      email, 
      name, 
      userId
    )
    
    if (customerError) {
      return NextResponse.json(
        { error: customerError },
        { status: 500 }
      )
    }
    
    // Create subscription
    const result = await PaymentProcessor.createSubscription(
      customerId,
      paymentMethodId,
      userId
    )
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
    
    // Update user subscription status in database
    console.log(`Created subscription for user ${userId}`)
    // TODO: Update Supabase user record with subscription info
    
    return NextResponse.json({
      subscriptionId: result.subscriptionId,
      customerId: result.customerId
    })
  } catch (error: any) {
    console.error('Subscription creation failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}