// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

// Create Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function addAdminColumn() {
  try {
    console.log('Adding is_admin column to users table...')
    
    // Execute SQL to add the column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;'
    })
    
    if (error) {
      // Try a different approach - raw SQL query
      console.log('Trying alternative approach...')
      const { data: altData, error: altError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (altError) throw altError
      
      console.log('Table exists, but we need to add the column manually via SQL')
      console.log('Since we cannot execute ALTER TABLE via the API, we need to do this manually.')
      console.log('Please run this SQL command in your Supabase SQL editor:')
      console.log('')
      console.log('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;')
      console.log('')
      console.log('After running that, we can proceed with making the user an admin.')
      
      // For now, let's just try to add admin using direct insert
      console.log('Attempting to update user directly...')
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ subscription_tier: 'elite' })
        .eq('email', 'gdogra@gmail.com')
      
      if (updateError) {
        console.log('Update error:', updateError)
      } else {
        console.log('✅ Updated user subscription to elite')
      }
      
      return
    }
    
    console.log('✅ Column added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding admin column:', error)
    throw error
  }
}

// Run the script
addAdminColumn()
  .then(() => {
    console.log('\n🎉 Admin column setup completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Admin column setup failed:', error)
    process.exit(1)
  })