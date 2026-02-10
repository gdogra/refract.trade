import { NextAuthOptions, User, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createSupabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'

// Environment variable validation
const requiredEnvVars = {
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
}

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.warn('Missing environment variables for auth:', missingVars)
}

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
          // Check if required environment variables are available
          if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('Supabase environment variables not configured for auth')
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
            console.error('User not found or no password:', error?.message)
            return null
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
    async jwt({ token, user }) {
      if (user) {
        token.subscriptionTier = user.subscriptionTier
        token.profile = user.profile
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
    signIn: '/auth/signin'
  }
}