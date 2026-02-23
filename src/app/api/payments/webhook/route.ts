import { NextRequest, NextResponse } from 'next/server'
import { PaymentProcessor } from '@/lib/payments'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }
    
    await PaymentProcessor.handleWebhook(rawBody, signature)
    
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}