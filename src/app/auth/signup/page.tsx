'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [verificationUrl, setVerificationUrl] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          referralCode: referralCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      if (data.requiresVerification) {
        setSuccess(true)
        setVerificationUrl(data.verificationUrl) // For testing - remove in production
      } else {
        // Redirect to sign in page
        router.push('/auth/signin?message=Account created successfully')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/refract-logo-light.svg" 
                alt="RefractTrade"
                className="w-10 h-10"
              />
              <div className="text-3xl font-bold text-gray-900">
                RefractTrade
              </div>
            </div>
          </div>
          <CardTitle>Create your account</CardTitle>
          <p className="text-gray-600">Join the future of options trading</p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-gray-900">Check your email!</h3>
                <p className="text-gray-600">
                  We've sent a verification link to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Please check your email and click the verification link to complete your registration.
                </p>
                {/* Development only - remove in production */}
                {verificationUrl && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800 mb-2">Development Mode - Direct verification link:</p>
                    <a 
                      href={verificationUrl} 
                      className="text-blue-600 hover:underline text-sm break-all"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Click to verify email
                    </a>
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  setSuccess(false)
                  setFormData({
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                  })
                  setVerificationUrl('')
                }}
                variant="outline"
                className="w-full"
              >
                Create Another Account
              </Button>
              <div className="text-center">
                <Link href="/auth/signin" className="text-primary-600 hover:underline text-sm">
                  Already verified? Sign in
                </Link>
              </div>
            </div>
          ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
                className="w-full"
                minLength={8}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className="w-full"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Creating account...' : 'Start Free Trial'}
            </Button>
          </form>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                if (referralCode) {
                  window.location.href = `/api/auth/google-signup?ref=${referralCode}`
                } else {
                  signIn('google', { callbackUrl: '/dashboard' })
                }
              }}
              disabled={isLoading}
              className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-4 border border-gray-300 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Start Trial with Google</span>
            </Button>

            {referralCode && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-green-700">
                  🎉 Referral code applied! You'll get an extra month free.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-primary-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
          </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}