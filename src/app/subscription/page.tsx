import { Metadata } from 'next'
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus'
import ReferralDashboard from '@/components/subscription/ReferralDashboard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const metadata: Metadata = {
  title: 'Subscription & Billing - Refract.trade',
  description: 'Manage your Refract subscription, billing, and referrals'
}

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription & Billing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, billing information, and referral program.
          </p>
        </div>
        
        <Tabs defaultValue="subscription" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscription">
            <SubscriptionStatus />
          </TabsContent>
          
          <TabsContent value="referrals">
            <ReferralDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}