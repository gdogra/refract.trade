#!/usr/bin/env node
/**
 * Script to clear users from Supabase database for testing.
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually from .env.local
function loadEnv() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, value] = line.split('=', 2);
        process.env[key] = value.replace(/^"|"$/g, ''); // Remove quotes
      }
    });
  } catch (error) {
    console.log('Warning: Could not load .env.local file');
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearUsers() {
  console.log('🧹 Checking users from Supabase...');
  
  try {
    // First, check if we can connect and see current users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .order('created_at');
    
    if (fetchError) {
      console.log('❌ Error fetching users:', fetchError.message);
      return false;
    }
    
    console.log(`📊 Current users in database: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📋 Current users:');
      users.forEach(user => {
        console.log(`  - ID: ${user.id}`);
        console.log(`    Name: ${user.name || 'N/A'}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Verified: ${user.email_verified || false}`);
        console.log(`    Verification Token: ${user.verification_token || 'N/A'}`);
        console.log(`    Token Expires: ${user.verification_expires || 'N/A'}`);
        console.log(`    Created: ${user.created_at}`);
        console.log('');
      });
      
      // Clear all users
      console.log(`🗑️  Removing ${users.length} users...`);
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all users
      
      if (deleteError) {
        console.log('❌ Error deleting users:', deleteError.message);
        return false;
      }
      
      console.log('✅ All users removed successfully!');
    } else {
      console.log('✅ Database is already empty (no users found)');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔗 Connecting to Supabase...');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseKey ? 'Present' : 'Missing');
  
  const success = await clearUsers();
  
  if (success) {
    console.log('\n✅ Database cleared. Ready for testing signup workflow!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Navigate to: http://localhost:3000/auth/signup');
    console.log('   3. Test the complete signup flow');
  } else {
    console.log('\n❌ Failed to clear database. Please check Supabase connection.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}