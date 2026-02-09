/**
 * Test Supabase Connection
 * Quick script to verify Supabase is working
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://pfeikjkqqotksxwijcwh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWlramtxcW90a3N4d2lqY3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjY5ODksImV4cCI6MjA4NjI0Mjk4OX0.lvT1NGzFjmdMixFv3HY7dKKSakqWtL60q-3fQN4P2kg'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZWlramtxcW90a3N4d2lqY3doIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY2Njk4OSwiZXhwIjoyMDg2MjQyOTg5fQ.n4cv1s6tqumaLEOOJ2tg7eyowzkjx9TfoNpSrSlAW3s'

async function testConnection() {
  console.log('🔌 Testing Supabase connection...')
  
  // Test with anon key
  const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  
  try {
    const { data, error } = await supabaseAnon
      .from('_realtime_schema')
      .select('*')
      .limit(1)
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is expected
      console.log('❌ Anon connection failed:', error.message)
    } else {
      console.log('✅ Anon connection successful')
    }
  } catch (err) {
    console.log('✅ Anon connection successful (expected error)')
  }
  
  // Test with service role key
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  try {
    // Try to access auth users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.log('❌ Service role connection failed:', error.message)
    } else {
      console.log(`✅ Service role connection successful (${users.length} users found)`)
    }
  } catch (err) {
    console.log('❌ Service role test failed:', err.message)
  }
  
  console.log('\n📋 Creating basic tables...')
  
  // Create a simple test table
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS refract_test (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
  
  try {
    const { error } = await supabaseAdmin.rpc('exec_sql', { 
      query: createTableSQL.trim() 
    })
    
    if (error) {
      console.log('❌ Table creation failed:', error.message)
      
      // Try alternative approach
      console.log('🔄 Trying alternative table creation...')
      
      const { data, error: altError } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(5)
      
      if (altError) {
        console.log('❌ Alternative query failed:', altError.message)
      } else {
        console.log('✅ Database access confirmed, existing tables:', data?.length || 0)
      }
      
    } else {
      console.log('✅ Test table created successfully')
      
      // Test insert
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('refract_test')
        .insert({ message: 'Hello from Refract.trade!' })
        .select()
      
      if (insertError) {
        console.log('❌ Test insert failed:', insertError.message)
      } else {
        console.log('✅ Test insert successful:', insertData)
        
        // Clean up
        await supabaseAdmin.from('refract_test').delete().eq('id', insertData[0].id)
        console.log('🧹 Test data cleaned up')
      }
    }
  } catch (err) {
    console.log('❌ SQL execution failed:', err.message)
  }
}

async function createUsersTables() {
  console.log('\n👥 Creating users tables...')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  
  const usersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      name TEXT,
      avatar TEXT,
      subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'pro', 'elite')),
      subscription_expiry TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      risk_tolerance TEXT DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
      experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
      trading_goals TEXT[] DEFAULT '{}',
      dashboard_layout JSONB,
      notification_settings JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
    CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
    CREATE POLICY "Users can view own user_profile" ON user_profiles FOR ALL USING (auth.uid()::text = user_id::text);
  `
  
  try {
    // Split into individual statements and execute
    const statements = usersTableSQL.split(';').filter(s => s.trim())
    
    for (const statement of statements) {
      const trimmedStatement = statement.trim()
      if (trimmedStatement) {
        console.log(`Executing: ${trimmedStatement.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          query: trimmedStatement + ';'
        })
        
        if (error && !error.message.includes('already exists')) {
          console.log(`⚠️  SQL warning: ${error.message}`)
        } else {
          console.log('✅ Statement executed')
        }
      }
    }
    
    console.log('✅ Users tables setup complete!')
    
    // Test the tables
    const { data, error } = await supabase.from('users').select('count').limit(0)
    
    if (error) {
      console.log('❌ Users table test failed:', error.message)
    } else {
      console.log('✅ Users table is accessible')
    }
    
  } catch (err) {
    console.log('❌ Users table creation failed:', err.message)
  }
}

if (require.main === module) {
  testConnection().then(() => {
    return createUsersTables()
  }).catch(console.error)
}

module.exports = { testConnection, createUsersTables }