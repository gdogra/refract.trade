import { NextAuthOptions, User, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createSupabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'

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
          // Environment variables validated in createSupabaseAdmin

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