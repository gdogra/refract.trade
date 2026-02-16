import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Refract.trade - Next-Generation Options Trading',
  description: 'Revolutionary options trading platform with predictive AI, risk visualization, and tax optimization',
  keywords: ['options trading', 'AI trading', 'risk management', 'tax optimization'],
  authors: [{ name: 'Refract.trade Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#667eea',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <Navigation />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}