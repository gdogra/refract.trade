// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verifyAdminUser(email) {
  try {
    console.log(`Checking admin status for: ${email}`)
    
    // Find the user - first check what columns exist
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`❌ User not found: ${email}`)
        return
      }
      throw error
    }
    
    console.log('✅ User found:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Available columns:`, Object.keys(user))
    console.log('   Full user object:', user)
    
    if (!user.is_admin) {
      console.log('\n🔧 Making user admin...')
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
      
      console.log('✅ User updated to admin!')
      console.log(`   Is Admin: ${updatedUser.is_admin}`)
      console.log(`   Subscription Tier: ${updatedUser.subscription_tier}`)
    } else {
      console.log('✅ User is already an admin!')
    }
    
  } catch (error) {
    console.error('❌ Error verifying admin user:', error)
    throw error
  }
}

// Run the script
const adminEmail = 'gdogra@gmail.com'
verifyAdminUser(adminEmail)
  .then(() => {
    console.log('\n🎉 Admin verification completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Admin verification failed:', error)
    process.exit(1)
  })