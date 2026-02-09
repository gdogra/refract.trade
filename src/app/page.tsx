import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import LandingPage from '@/components/landing/LandingPage'

export default async function Home() {
  const session = await getServerSession(authOptions)

  // If user is authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  // Show landing page for non-authenticated users
  return <LandingPage />
}