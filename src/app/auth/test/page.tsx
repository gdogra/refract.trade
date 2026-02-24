'use client'

import { useSession, getProviders, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function AuthTest() {
  const { data: session, status } = useSession()
  const [providers, setProviders] = useState<any>(null)
  const [baseUrl, setBaseUrl] = useState<string>('Server-side')
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    getProviders().then(setProviders)
    setBaseUrl(window.location.origin)
    
    // Fetch debug info
    fetch('/api/debug/env', {
      headers: {
        'x-debug-auth': 'refract-debug-2024'
      }
    })
    .then(r => r.json())
    .then(setDebugInfo)
    .catch(err => console.error('Debug fetch error:', err))
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">NextAuth Debug Page</h1>
      
      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Session Status</h2>
          <p>Status: {status}</p>
          <pre className="mt-2 bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Available Providers</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(providers, null, 2)}
          </pre>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Environment Check</h2>
          <p>Base URL: {baseUrl}</p>
          <p>NextAuth URL: {process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set'}</p>
          <p>Environment: {process.env.NODE_ENV || 'unknown'}</p>
          <p>Vercel: {process.env.VERCEL ? 'Yes' : 'No'}</p>
          <p>Netlify: {process.env.NETLIFY ? 'Yes' : 'No'}</p>
        </div>

        {debugInfo && (
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Server Environment Debug</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Test Sign-In</h2>
          <button 
            onClick={() => {
              console.log('Testing Google sign-in...')
              signIn('google')
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Test Google Sign-In
          </button>
          
          <button 
            onClick={async () => {
              console.log('Testing providers fetch...')
              const providers = await getProviders()
              console.log('Fetched providers:', providers)
            }}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Refresh Providers
          </button>
        </div>
      </div>
    </div>
  )
}