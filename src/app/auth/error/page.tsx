'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'There was an issue creating your account. This could be due to email verification requirements or account setup issues.',
          suggestion: 'Please try signing up with email and password, or contact support if the issue persists.'
        }
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There was a configuration issue with the authentication system.',
          suggestion: 'Please contact support to resolve this issue.'
        }
      case 'Verification':
        return {
          title: 'Email Verification Required',
          message: 'Your email address needs to be verified before you can sign in.',
          suggestion: 'Please check your email and click the verification link.'
        }
      case 'OAuthSignin':
        return {
          title: 'OAuth Sign-in Error',
          message: 'There was an error during the Google sign-in process.',
          suggestion: 'Please try again or use email and password to sign up.'
        }
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          suggestion: 'Please try again or contact support if the issue persists.'
        }
    }
  }

  const { title, message, suggestion } = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl text-red-600">⚠️</span>
            </div>
          </div>
          <CardTitle className="text-red-600">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">{message}</p>
          <p className="text-sm text-gray-500 text-center">{suggestion}</p>
          
          {error === 'AccessDenied' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Debug Information</h4>
              <p className="text-xs text-yellow-700">
                Error Code: {error}
                <br />
                This typically means the user creation process failed during Google sign-up.
              </p>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/signup">Try Email Sign-up</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/signin">Back to Sign In</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}