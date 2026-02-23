import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export function useReferral() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  useEffect(() => {
    const referralCode = searchParams.get('ref')
    
    if (referralCode && session?.user?.id) {
      // Process referral after user signs in
      processReferral(referralCode, session.user.id)
    }
  }, [session, searchParams])

  const processReferral = async (referralCode: string, userId: string) => {
    try {
      const response = await fetch('/api/referrals/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referralCode,
          newUserId: userId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Show success notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50'
        notification.innerHTML = `
          <div class="flex items-center space-x-2">
            <span>🎉</span>
            <span>Referral applied! You both get a free month!</span>
          </div>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 5000)
        
        // Remove referral code from URL
        const url = new URL(window.location.href)
        url.searchParams.delete('ref')
        window.history.replaceState({}, '', url.toString())
      }
    } catch (error) {
      console.error('Failed to process referral:', error)
    }
  }

  return {
    referralCode: searchParams.get('ref'),
    processReferral
  }
}