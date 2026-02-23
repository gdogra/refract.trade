import { Metadata } from 'next'
import ReferralDashboard from '@/components/subscription/ReferralDashboard'

export const metadata: Metadata = {
  title: 'Referral Program - Refract.trade',
  description: 'Refer friends and earn free months of Refract Premium'
}

export default function ReferralPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Referral Program
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share Refract with friends and both of you get rewarded with free premium access.
          </p>
        </div>
        
        <ReferralDashboard />
      </div>
    </div>
  )
}