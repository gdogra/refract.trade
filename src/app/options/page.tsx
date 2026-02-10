import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OptionsChainClient from './components/OptionsChainClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Options Chain Explorer - Refract.trade',
  description: 'Real-time options chain analysis and trading tools',
}

export default async function OptionsChainPage() {
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
        console.error('Options page auth error:', authError)
        session = null
      }
    }
    
    if (!session) {
      redirect('/auth/signin')
    }

    return <OptionsChainClient />
  } catch (error) {
    console.error('Options page error:', error)
    
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