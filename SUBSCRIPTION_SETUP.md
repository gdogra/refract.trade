# Subscription & Payment System Setup

This document outlines the new subscription system that replaces the old SaaS tiers with a simplified 30-day trial + $39.99/month premium model.

## Overview

### New Subscription Model
- **30-day free trial**: Full access to all premium features
- **Premium subscription**: $39.99/month after trial
- **Referral program**: Both referrer and referee get 1 month free
- **No credit card required** for trial signup

### Key Features
- Stripe integration for secure payment processing  
- Automatic trial management and conversion
- Referral tracking and rewards system
- Subscription management dashboard
- Webhook handling for billing events

## Setup Instructions

### 1. Stripe Configuration

#### Create Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. Get your API keys from the Developers section

#### Create Product and Price
1. In Stripe Dashboard, go to Products
2. Create a new product: "Refract Premium"
3. Add a recurring price: $39.99/month
4. Copy the Price ID (starts with `price_...`)

#### Set up Webhook Endpoint
1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Payment Processing
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID="price_..."  # The monthly price you created
```

### 3. Database Schema Updates

The new subscription system requires these database changes:

```sql
-- Update users table
ALTER TABLE users ADD COLUMN trial_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN trial_end_date TIMESTAMP;
ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'trial';
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN referral_code VARCHAR(50);

-- Create referral tracking table
CREATE TABLE referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id INTEGER REFERENCES users(id),
  referred_user_id INTEGER REFERENCES users(id),
  referral_code VARCHAR(50) NOT NULL,
  reward_granted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create subscription events table
CREATE TABLE subscription_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_type VARCHAR(100) NOT NULL,
  stripe_event_id VARCHAR(255),
  event_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Code Integration

#### Key Components Created

**Payment Processing**
- `/src/lib/payments.ts` - Stripe integration and payment processing
- `/src/app/api/payments/` - API routes for payments and webhooks

**Subscription Management**  
- `/src/lib/subscription.ts` - Updated subscription types and management
- `/src/components/subscription/` - UI components for subscription management

**Referral System**
- `/src/app/api/referrals/` - Referral processing API
- `/src/components/subscription/ReferralDashboard.tsx` - Referral management UI

#### Updated Pages
- `/src/app/upgrade/page.tsx` - New trial signup flow
- `/src/app/subscription/page.tsx` - Subscription management
- `/src/app/referral/page.tsx` - Referral dashboard

### 5. Testing

#### Test the Trial Flow
1. Navigate to `/upgrade`
2. Click "Start Free 30-Day Trial"  
3. Verify trial starts without payment
4. Check trial countdown and features access

#### Test Payment Flow
1. From trial status, click "Upgrade to Premium"
2. Use Stripe test card: `4242 4242 4242 4242`
3. Verify subscription creation in Stripe Dashboard
4. Test webhook events are processed

#### Test Referral System
1. Get referral code from `/referral` page
2. Sign up new user with referral code
3. Verify both users get bonus month
4. Check referral stats update

### 6. Production Deployment

#### Stripe Live Mode
1. Switch to live API keys in production
2. Update webhook endpoint to production URL
3. Test with real payment methods

#### Database Migration
1. Run schema updates on production database
2. Migrate existing users to new tier system:
   ```sql
   -- Convert existing tiers to new system
   UPDATE users SET 
     subscription_status = CASE
       WHEN subscription_tier = 'free' THEN 'trial'
       WHEN subscription_tier IN ('pro', 'elite', 'enterprise') THEN 'active'
     END,
     trial_start_date = created_at,
     trial_end_date = created_at + INTERVAL '30 days'
   WHERE subscription_status IS NULL;
   ```

## Usage Examples

### Check User's Subscription Status

```typescript
import { SubscriptionManager } from '@/lib/subscription'

// Check if user can access a feature
const canAccess = SubscriptionManager.canAccess(userTier, 'realTimeData')

// Get usage limits
const scanLimit = SubscriptionManager.getUsageLimit(userTier, 'scanLimit')
```

### Process a Payment

```typescript
import { PaymentProcessor } from '@/lib/payments'

// Create customer and subscription
const result = await PaymentProcessor.createSubscription(
  customerId,
  paymentMethodId,
  userId
)
```

### Handle Referrals

```typescript
import { ReferralManager } from '@/lib/subscription'

// Generate referral code
const code = await ReferralManager.generateReferralCode(userId)

// Process referral
const success = await ReferralManager.processReferral(code, newUserId)
```

## Monitoring & Analytics

### Key Metrics to Track
- Trial signup rate
- Trial-to-paid conversion rate  
- Monthly recurring revenue (MRR)
- Referral program effectiveness
- Churn rate and reasons

### Stripe Dashboard Metrics
- Customer lifetime value
- Payment success rates
- Failed payment recovery
- Subscription growth trends

## Security Considerations

### Payment Security
- All payment data is handled by Stripe (PCI compliant)
- Never store credit card information
- Validate webhook signatures
- Use HTTPS for all payment endpoints

### Data Protection
- Encrypt sensitive customer data
- Implement proper access controls
- Regular security audits
- GDPR compliance for EU users

## Troubleshooting

### Common Issues

**Webhook Not Processing**
- Check webhook URL is publicly accessible
- Verify webhook secret matches
- Check server logs for errors

**Payment Failures**
- Test with Stripe test cards first
- Check card validation logic
- Verify 3D Secure handling

**Trial Not Starting**
- Check database permissions
- Verify trial duration settings
- Test user creation flow

**Referral Rewards Not Applied**
- Check referral code validation
- Verify database transactions
- Test reward calculation logic

## Support

For issues with the subscription system:
1. Check server logs and Stripe Dashboard
2. Review webhook event history  
3. Test with Stripe's testing tools
4. Contact Stripe support for payment issues

## Migration Notes

### From Old Tier System
The old tier system (`free`, `pro`, `elite`, `enterprise`) has been simplified to:
- `trial` - 30-day free trial with full features
- `premium` - $39.99/month with all features

All existing premium users should be migrated to the new `premium` tier with their current billing intact.

### Feature Access
In the new system, both trial and premium users have access to all features. The only difference is:
- Trial users have a 30-day time limit
- Premium users have unlimited access

This simplifies the codebase and provides a better user experience during the trial period.