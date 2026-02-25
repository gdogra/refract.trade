import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST - Setup admin user (one-time setup)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, setupKey } = body
    
    // Simple setup key to prevent unauthorized access
    if (setupKey !== 'refract-admin-setup-2024') {
      return NextResponse.json({
        success: false,
        error: 'Invalid setup key'
      }, { status: 403 })
    }
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }
    
    console.log(`Setting up admin user: ${email}`)
    
    // Use Supabase instead of Prisma for this operation
    const { createSupabaseAdmin } = await import('@/lib/supabase')
    const supabase = createSupabaseAdmin()
    
    // Find user in Supabase
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw new Error(`Database query error: ${error.message}`)
    }
    
    if (!user) {
      // Create the user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          name: 'Admin User',
          email_verified: true,
          subscription_tier: 'basic',
          is_admin: true
        })
        .select()
        .single()
      
      if (createError) {
        throw new Error(`Failed to create user: ${createError.message}`)
      }
      
      user = newUser
      console.log(`✅ Created new admin user: ${email}`)
    } else {
      // Update existing user to be admin
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', user.id)
        .select()
        .single()
      
      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`)
      }
      
      user = updatedUser
      console.log(`✅ Updated existing user to admin: ${email}`)
    }
    
    // Log the admin action in Supabase (skip Prisma for now)
    console.log(`Admin action logged: admin_privilege_granted for ${email}`)
    
    return NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin,
        message: 'Admin privileges granted successfully'
      }
    })
    
  } catch (error) {
    console.error('Admin setup error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to setup admin user'
    }, { status: 500 })
  }
}