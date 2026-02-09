import { NextAuthOptions } from 'next-auth'
import { SupabaseAdapter } from '@next-auth/supabase-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { createSupabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
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

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          subscriptionTier: user.subscription_tier,
          profile: user.user_profiles?.[0]
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
    signIn: '/auth/signin',
    signUp: '/auth/signup'
  }
}