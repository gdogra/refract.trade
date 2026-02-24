import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Debug logging
console.log('NextAuth route loaded')
console.log('Google Client ID exists:', !!process.env.GOOGLE_CLIENT_ID)
console.log('Google Client Secret exists:', !!process.env.GOOGLE_CLIENT_SECRET)
console.log('NextAuth Secret exists:', !!process.env.NEXTAUTH_SECRET)
console.log('NextAuth URL:', process.env.NEXTAUTH_URL)

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }