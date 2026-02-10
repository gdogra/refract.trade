import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import DashboardClient from './components/DashboardClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dashboard - Refract.trade',
  description: 'Portfolio overview and risk metrics dashboard',
}

export default async function DashboardPage() {
  try {
    // Check if auth is properly configured
    const hasAuthConfig = process.env.NEXTAUTH_SECRET && 
                         process.env.NEXT_PUBLIC_SUPABASE_URL && 
                         process.env.SUPABASE_SERVICE_ROLE_KEY

    let session = null
    
    if (hasAuthConfig) {
      try {
        session = await getServerSession(authOptions)
      } catch (authError) {
        console.error('Dashboard auth error:', authError)
        session = null
      }
    }
    
    if (!session) {
      redirect('/auth/signin')
    }

    return <DashboardClient />
  } catch (error) {
    console.error('Dashboard page error:', error)
    
    // If there's a configuration error, show a fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Configuration Required
            </h1>
            <p className="text-gray-600 mb-4">
              The application needs to be configured with environment variables.
            </p>
            <a 
              href="/auth/signin" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </a>
          </div>
        </div>
      </div>
    )
  }
}