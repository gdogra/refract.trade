import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG ENDPOINT ===')
    
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV
    }
    
    console.log('Environment variables:', envVars)
    
    // Test Supabase connection
    let supabaseTest = 'Not tested'
    try {
      const supabase = createSupabaseAdmin()
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        supabaseTest = `Error: ${error.message}`
      } else {
        supabaseTest = `Success: ${data} users`
      }
    } catch (err: any) {
      supabaseTest = `Exception: ${err.message}`
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      supabaseConnection: supabaseTest,
      message: 'Debug information'
    })
  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}