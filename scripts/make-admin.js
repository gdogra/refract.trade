// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function makeUserAdmin(email) {
  try {
    console.log(`Setting up admin user: ${email}`)
    
    // Find existing user
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    let user
    
    if (findError && findError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw findError
    }
    
    if (!existingUser) {
      // Create the user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          name: 'Admin User',
          is_admin: true,
          subscription_tier: 'elite',
          email_verified: true
        })
        .select()
        .single()
      
      if (createError) throw createError
      
      user = newUser
      console.log(`✅ Created new admin user: ${email}`)
    } else {
      // Update existing user to be admin
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ 
          is_admin: true,
          subscription_tier: 'elite' 
        })
        .eq('email', email)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      user = updatedUser
      console.log(`✅ Updated existing user to admin: ${email}`)
    }
    
    // Log the admin action
    const { error: actionError } = await supabase
      .from('admin_actions')
      .insert({
        admin_id: user.id,
        action: 'admin_privilege_granted',
        details: {
          email,
          grantedBy: 'system',
          timestamp: new Date().toISOString()
        }
      })
    
    if (actionError) {
      console.warn('⚠️ Could not log admin action:', actionError.message)
    }
    
    console.log(`✅ Admin privileges granted successfully`)
    console.log(`User ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Name: ${user.name}`)
    console.log(`Is Admin: ${user.is_admin}`)
    console.log(`Subscription Tier: ${user.subscription_tier}`)
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error)
    throw error
  }
}

// Run the script
const adminEmail = 'gdogra@gmail.com'
makeUserAdmin(adminEmail)
  .then(() => {
    console.log('🎉 Admin setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Admin setup failed:', error)
    process.exit(1)
  })