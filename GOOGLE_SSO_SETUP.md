# Google SSO Integration Setup

This document outlines the Google Single Sign-On (SSO) integration for Refract.trade using NextAuth.js.

## Overview

The Google SSO integration allows users to:
- **Sign in/up with Google** using their existing Google accounts
- **Automatic trial activation** for new Google users
- **Seamless referral processing** during Google sign-up
- **Unified authentication** alongside existing credential-based auth

## Configuration

### Google OAuth Credentials
```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Google Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## Implementation Details

### Authentication Provider Configuration

**File: `src/lib/auth.ts`**
```typescript
providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  }),
  // ... other providers
]
```

### User Creation Flow for Google SSO

When a user signs in with Google for the first time:

1. **User Creation**: New user record is created in Supabase
2. **Trial Activation**: 30-day trial is automatically started
3. **Email Verification**: Google users are pre-verified
4. **Referral Processing**: Referral codes are processed if present
5. **Referral Code Generation**: Unique referral code is generated

```typescript
// In auth callbacks
if (account?.provider === 'google' && !existingUser) {
  // Create user with trial subscription
  const newUser = await supabase.from('users').insert({
    email: user.email,
    name: user.name,
    avatar: user.image,
    email_verified: true,
    subscription_tier: 'trial',
    subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  })
  
  // Start trial and generate referral code
  await TrialManager.startTrial(newUser.id)
  await ReferralManager.generateReferralCode(newUser.id)
}
```

### UI Integration

#### Sign-In Page (`src/app/auth/signin/page.tsx`)
- Added Google sign-in button with Google branding
- Divider between credential and Google authentication
- Proper error handling for both methods

#### Sign-Up Page (`src/app/auth/signup/page.tsx`)
- Google "Start Trial" button
- Referral code preservation during Google sign-up
- Success messaging for referral processing

#### User Menu (`src/components/ui/UserMenu.tsx`)
- Shows user's Google profile information
- Displays subscription status (Trial/Premium)
- Subscription and referral management links

## Features

### 🔐 Dual Authentication
- **Credentials**: Email/password with manual verification
- **Google SSO**: One-click sign-in with Google accounts
- **Unified Sessions**: Same session management for both methods

### 🎯 Automatic Trial Management
- **Instant Activation**: Google users get immediate trial access
- **No Email Verification**: Google accounts are pre-verified
- **Same Feature Access**: Identical trial experience regardless of auth method

### 🎁 Referral Integration
- **URL Preservation**: Referral codes persist through Google sign-in
- **Automatic Processing**: Referral rewards applied immediately
- **Visual Feedback**: Success notifications for successful referrals

### 👤 User Experience
- **Profile Sync**: Google profile data (name, email, avatar) imported
- **Subscription Display**: Current subscription tier shown in UI
- **Seamless Flow**: No disruption to existing user workflows

## Security Features

### Authentication Security
- **JWT Strategy**: Secure token-based session management
- **Google OAuth 2.0**: Industry-standard authentication protocol
- **CSRF Protection**: Built-in NextAuth.js CSRF protection

### Data Protection
- **Supabase Integration**: Secure database storage
- **Environment Variables**: Sensitive credentials in environment
- **Session Validation**: Server-side session validation

## Database Schema

### Users Table Updates
```sql
-- Users table includes Google SSO support
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar TEXT, -- Google profile image
  password VARCHAR(255), -- NULL for Google users
  email_verified BOOLEAN DEFAULT FALSE, -- TRUE for Google users
  subscription_tier VARCHAR(50) DEFAULT 'trial',
  subscription_expiry TIMESTAMP,
  referral_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Authentication Endpoints
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handler
- `POST /api/auth/signin` - Credential sign-in
- `POST /api/auth/signup` - Account creation

### Subscription Endpoints (Updated with Auth)
- `POST /api/payments/create-subscription` - Requires authentication
- `POST /api/payments/cancel-subscription` - Requires authentication
- `GET/POST /api/referrals/process` - Requires authentication

## Usage Examples

### Client-Side Authentication
```typescript
import { signIn, useSession } from 'next-auth/react'

// Google Sign-In
const handleGoogleSignIn = () => {
  signIn('google', { 
    callbackUrl: '/dashboard' 
  })
}

// Check Authentication Status
const { data: session, status } = useSession()
if (session?.user) {
  // User is authenticated
}
```

### Server-Side Authentication
```typescript
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Use session.user.id, session.user.email, etc.
}
```

### Referral Processing
```typescript
// URL with referral: /auth/signup?ref=REFABC123
// Google sign-in preserves referral code
signIn('google', { 
  callbackUrl: `/dashboard?ref=${referralCode}` 
})
```

## Testing

### Development Testing
1. **Google Sign-In**: Test with personal Google account
2. **Trial Creation**: Verify trial is activated for new users
3. **Referral Flow**: Test referral processing with Google sign-up
4. **Session Persistence**: Verify sessions persist across page loads

### Production Testing
1. **Domain Verification**: Ensure redirect URIs match production domain
2. **SSL Certificate**: Verify HTTPS is working properly
3. **Error Handling**: Test various error scenarios
4. **Performance**: Monitor authentication performance

## Troubleshooting

### Common Issues

**"Invalid Client" Error**
- Check Google Client ID and Secret are correct
- Verify redirect URI is properly configured in Google Console

**"Redirect URI Mismatch" Error**  
- Ensure production domain is added to Google Console
- Check for typos in redirect URI configuration

**Session Not Persisting**
- Verify NEXTAUTH_URL environment variable
- Check NEXTAUTH_SECRET is set properly

**Google User Not Created**
- Check Supabase connection and permissions
- Verify database schema matches expectations

### Debug Mode
Enable NextAuth debug mode:
```bash
NEXTAUTH_DEBUG=true
```

### Logs to Monitor
- Google OAuth callback responses
- User creation in Supabase
- Trial activation status
- Referral processing results

## Benefits

### For Users
- **Faster Sign-Up**: One-click registration with Google
- **No Password Management**: No need to remember another password
- **Instant Access**: Immediate trial activation
- **Referral Rewards**: Easy referral code processing

### For Business
- **Higher Conversion**: Reduced signup friction
- **Better User Data**: Rich Google profile information
- **Enhanced Security**: Google's robust authentication
- **Viral Growth**: Streamlined referral processing

## Migration Notes

### Existing Users
- Existing email/password users continue to work normally
- Users can potentially link Google account to existing account (future feature)
- No disruption to current authentication flow

### New Features Enabled
- Social login analytics
- Profile picture display
- Reduced support burden (no password resets for Google users)
- Improved user onboarding experience

This Google SSO integration provides a seamless, secure, and user-friendly authentication experience while maintaining full compatibility with the existing subscription and referral systems.