import { NextAuthOptions, User, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { createSupabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'
import { TrialManager, ReferralManager } from './subscription'

// Note: Environment variables are validated at runtime during auth operations

declare module 'next-auth' {
  interface User {
    subscriptionTier?: string
    profile?: any
  }
  
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      subscriptionTier?: string
      profile?: any
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    subscriptionTier?: string
    profile?: any
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-dev-only-change-in-production',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Check if we're in a build environment
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn('Skipping auth during build process - environment variables not available')
            return null
          }

          const supabase = createSupabaseAdmin()
          
          // Get user from Supabase
          const { data: user, error } = await supabase
            .from('users')
            .select(`
              *,
              user_profiles(*)
            `)
            .eq('email', credentials.email)
            .single()

          if (error || !user || !user.password) {
            return null
          }

          // Check if email is verified
          if (!user.email_verified) {
            throw new Error('Please verify your email before signing in')
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.error('Invalid password for user:', credentials.email)
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            subscriptionTier: user.subscription_tier,
            profile: user.user_profiles?.[0]
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if we're in a build environment
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn('Skipping Google sign-in during build process - environment variables not available')
            return true
          }

          const supabase = createSupabaseAdmin()
          
          // Check if user already exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single()
          
          if (!existingUser) {
            // Create new user for Google SSO
            const { data: newUser, error } = await supabase
              .from('users')
              .insert({
                email: user.email,
                name: user.name,
                avatar: user.image,
                email_verified: true, // Google users are pre-verified
                subscription_tier: 'basic',
                subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
              })
              .select()
              .single()
            
            if (error) {
              console.error('Error creating Google user:', error)
              return false
            }
            
            // Start trial and check for referrals
            if (newUser) {
              try {
                await TrialManager.startTrial(newUser.id)
              } catch (error) {
                console.error('Failed to start trial:', error)
                // Don't fail the sign-in process for trial setup issues
              }
              
              // Generate referral code for new user
              try {
                await ReferralManager.generateReferralCode(newUser.id)
              } catch (error) {
                console.error('Failed to generate referral code:', error)
                // Don't fail the sign-in process for referral setup issues
              }
            }
          }
          
          return true
        } catch (error) {
          console.error('Google sign-in error:', error)
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            userEmail: user.email
          })
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.subscriptionTier = user.subscriptionTier
        token.profile = user.profile
        
        // For Google users, fetch subscription info from database
        if (account?.provider === 'google') {
          try {
            // Check if we're in a build environment
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
              console.warn('Skipping JWT callback during build process - environment variables not available')
              return token
            }

            const supabase = createSupabaseAdmin()
            const { data: userData } = await supabase
              .from('users')
              .select('subscription_tier, subscription_expiry')
              .eq('email', user.email)
              .single()
            
            if (userData) {
              token.subscriptionTier = userData.subscription_tier
            }
          } catch (error) {
            console.error('Error fetching user data for token:', error)
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.subscriptionTier = token.subscriptionTier
        session.user.profile = token.profile
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  debug: process.env.NODE_ENV === 'development'
}