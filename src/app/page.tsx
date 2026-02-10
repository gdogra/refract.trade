import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LandingPage from '@/components/landing/LandingPage'

export const dynamic = 'force-dynamic'

export default async function Home() {
  try {
    let session = null
    
    try {
      session = await getServerSession(authOptions)
    } catch (authError) {
      // Auth not configured or failed - show landing page
      session = null
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