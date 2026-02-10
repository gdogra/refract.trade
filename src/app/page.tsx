import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LandingPage from '@/components/landing/LandingPage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    // Only attempt to get session if auth is properly configured
    const hasAuthConfig = process.env.NEXTAUTH_SECRET && 
                         process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         process.env.SUPABASE_SERVICE_ROLE_KEY

    let session = null
    
    if (hasAuthConfig) {
      try {
        session = await getServerSession(authOptions)
      } catch (authError) {
        console.error('Auth session error:', authError)
        // Continue without session rather than crashing
        session = null
      }
    }

    // If user is authenticated, redirect to dashboard
    if (session) {
      redirect('/dashboard')
    }

    // Show landing page for non-authenticated users or if auth is not configured
    return <LandingPage />
  } catch (error) {
    console.error('Home page error:', error)
    // Show landing page if there's any configuration issue
    return <LandingPage />
  }
}