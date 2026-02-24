import Stripe from 'stripe'
import { SubscriptionInfo } from './subscription'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover'
})

export interface PaymentMethodInfo {
  id: string
  type: 'card' | 'bank_account'
  last4: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
}

export interface PaymentResult {
  success: boolean
  error?: string
  subscriptionId?: string
  customerId?: string
  paymentMethodId?: string
}

export class PaymentProcessor {
  
  static async createCustomer(
    email: string, 
    name: string, 
    userId: string
  ): Promise<{ customerId: string; error?: string }> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      })
      
      return { customerId: customer.id }
    } catch (error: any) {
      console.error('Failed to create Stripe customer:', error)
      return { customerId: '', error: error.message }
    }
  }
  
  static async createSubscription(
    customerId: string,
    paymentMethodId: string,
    userId: string
  ): Promise<PaymentResult> {
    try {
      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })
      
      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      })
      
      // Create subscription for $39.99/month
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: process.env.STRIPE_PRICE_ID!, // Create this in Stripe dashboard for $39.99/month
          },
        ],
        default_payment_method: paymentMethodId,
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId
        }
      })
      
      return {
        success: true,
        subscriptionId: subscription.id,
        customerId,
        paymentMethodId
      }
    } catch (error: any) {
      console.error('Failed to create subscription:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  static async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await stripe.subscriptions.cancel(subscriptionId)
      return { success: true }
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error)
      return { success: false, error: error.message }
    }
  }
  
  static async updatePaymentMethod(
    customerId: string,
    newPaymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await stripe.paymentMethods.attach(newPaymentMethodId, {
        customer: customerId,
      })
      
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: newPaymentMethodId,
        },
      })
      
      return { success: true }
    } catch (error: any) {
      console.error('Failed to update payment method:', error)
      return { success: false, error: error.message }
    }
  }
  
  static async getPaymentMethods(customerId: string): Promise<PaymentMethodInfo[]> {
    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      })
      
      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card' as const,
        last4: pm.card?.last4 || '',
        brand: pm.card?.brand,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year
      }))
    } catch (error) {
      console.error('Failed to get payment methods:', error)
      return []
    }
  }
  
  static async getSubscriptionStatus(subscriptionId: string): Promise<{
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
  } | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      
      return {
        status: subscription.status,
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false
      }
    } catch (error) {
      console.error('Failed to get subscription status:', error)
      return null
    }
  }
  
  static async handleWebhook(rawBody: string, signature: string): Promise<void> {
    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
      
      console.log(`Received Stripe webhook: ${event.type}`)
      
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          break
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
          
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
          break
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
          break
          
        default:
          console.log(`Unhandled webhook event type: ${event.type}`)
      }
    } catch (error) {
      console.error('Webhook error:', error)
      throw error
    }
  }
  
  private static async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId
    if (userId) {
      // TODO: Update user subscription in database
      console.log(`Subscription created for user ${userId}: ${subscription.id}`)
    }
  }
  
  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId
    if (userId) {
      // TODO: Update user subscription status in database
      console.log(`Subscription updated for user ${userId}: ${subscription.status}`)
    }
  }
  
  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const userId = subscription.metadata.userId
    if (userId) {
      // TODO: Mark subscription as cancelled in database
      console.log(`Subscription deleted for user ${userId}: ${subscription.id}`)
    }
  }
  
  private static async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment succeeded for invoice: ${invoice.id}`)
    // TODO: Update billing records
  }
  
  private static async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log(`Payment failed for invoice: ${invoice.id}`)
    // TODO: Handle payment failure (retry, notify user, etc.)
  }
}

// Client-side payment helpers
export class ClientPayments {
  
  static async createSetupIntent(customerId: string): Promise<{ clientSecret: string; error?: string }> {
    try {
      const response = await fetch('/api/payments/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { clientSecret: '', error: data.error }
      }
      
      return { clientSecret: data.clientSecret }
    } catch (error: any) {
      return { clientSecret: '', error: error.message }
    }
  }
  
  static async createSubscription(paymentMethodId: string): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethodId }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error }
      }
      
      return {
        success: true,
        subscriptionId: data.subscriptionId,
        customerId: data.customerId
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  static async cancelSubscription(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        return { success: false, error: data.error }
      }
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

// Pricing constants
export const PRICING = {
  MONTHLY_PRICE: 39.99,
  CURRENCY: 'USD',
  TRIAL_DAYS: 30,
  REFERRAL_BONUS_DAYS: 30
} as const