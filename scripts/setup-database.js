/**
 * Database Setup Script for Supabase
 * This script creates all necessary tables, indexes, and policies
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const SUPABASE_URL = 'https://pfeikjkqqotksxwijcwh.supabase.co'
const SUPABASE_SERVICE_KEY = 'your-supabase-key-here

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function setupDatabase() {
  console.log('🚀 Starting Refract.trade database setup...')
  
  try {
    // Read the SQL setup file
    const sqlFile = path.join(__dirname, '..', 'supabase-setup.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📋 Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      try {
        const { error } = await supabase.rpc('exec_sql', { query: statement })
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1}: ${error.message}`)
          // Continue with other statements even if one fails
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      } catch (err) {
        console.log(`❌ Error in statement ${i + 1}: ${err.message}`)
      }
    }
    
    // Test the setup by checking if tables exist
    console.log('\n🔍 Verifying table creation...')
    
    const tables = [
      'users', 'user_profiles', 'accounts', 'positions', 
      'position_legs', 'transactions', 'strategies',
      'portfolio_snapshots', 'risk_alerts', 'tax_records',
      'wash_sales', 'learning_progress', 'community_profiles',
      'option_chains', 'market_data'
    ]
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)')
        .limit(0)
      
      if (error) {
        console.log(`❌ Table '${table}' not found`)
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    }
    
    console.log('\n🎉 Database setup complete!')
    console.log('📖 Next steps:')
    console.log('   1. Update your .env.local with database password')
    console.log('   2. Run: npm install')
    console.log('   3. Run: npx prisma generate')
    console.log('   4. Run: npm run dev')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
    process.exit(1)
  }
}

// Alternative method using direct SQL execution
async function setupDatabaseDirect() {
  console.log('🚀 Setting up database using direct SQL execution...')
  
  const createTablesSQL = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      name TEXT,
      avatar TEXT,
      subscription_tier TEXT DEFAULT 'basic',
      subscription_expiry TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- User profiles table
    CREATE TABLE IF NOT EXISTS user_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
      risk_tolerance TEXT DEFAULT 'moderate',
      experience_level TEXT DEFAULT 'beginner',
      trading_goals TEXT[] DEFAULT '{}',
      dashboard_layout JSONB,
      notification_settings JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `
  
  try {
    const { error } = await supabase.rpc('exec_sql', { query: createTablesSQL })
    
    if (error) {
      console.error('❌ SQL execution failed:', error)
      return
    }
    
    console.log('✅ Basic tables created successfully!')
    
    // Test by inserting a sample user
    console.log('🧪 Testing with sample data...')
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'test@refract.trade',
        name: 'Test User',
        subscription_tier: 'basic'
      })
      .select()
      .single()
    
    if (userError) {
      console.log('⚠️  Sample user creation failed:', userError.message)
    } else {
      console.log('✅ Sample user created:', user.email)
      
      // Clean up
      await supabase.from('users').delete().eq('id', user.id)
      console.log('🧹 Sample data cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

// Run the setup
if (require.main === module) {
  setupDatabaseDirect()
}

module.exports = { setupDatabase, setupDatabaseDirect }