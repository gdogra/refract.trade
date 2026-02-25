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
    const session = await getServerSession(authOptions)
    
    if (!session) {
      redirect('/auth/signin')
    }

    console.log('Dashboard: User session:', { 
      email: session.user.email, 
      isAdmin: session.user.isAdmin 
    })

    // Redirect admin users to admin console
    if (session.user.isAdmin) {
      console.log('Redirecting admin user to /admin')
      redirect('/admin')
    }

    return <DashboardClient />
  } catch (error) {
    console.error('Dashboard page error:', error)
    
    // Show error details for debugging
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-4">
              Dashboard Error
            </h1>
            <p className="text-gray-600 mb-4">
              Error loading dashboard: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
            <div className="space-y-2">
              <a 
                href="/auth/signin" 
                className="block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Sign In Again
              </a>
              <a 
                href="/admin" 
                className="block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
              >
                Try Admin Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }
}