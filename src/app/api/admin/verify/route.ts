import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Check if user is admin (hardcoded for now)
    const isAdmin = session.user.email === 'gdogra@gmail.com'
    
    if (!isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        email: session.user.email,
        name: session.user.name,
        isAdmin: true
      }
    })
    
  } catch (error) {
    console.error('Admin verification error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Verification failed'
    }, { status: 500 })
  }
}