const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Simple parse for .env.local
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#\s]+?)=(.*)$/);
  if (match) env[match[1]] = match[2];
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('Verifying DB Migrations...');
  
  // 1. Check user_rate_limits
  const { data: rlData, error: rlError } = await supabase
    .from('user_rate_limits')
    .select('request_count')
    .limit(1);
    
  if (rlError && rlError.code === '42P01') {
    console.error('❌ Table "user_rate_limits" is MISSING! (Migration not applied)');
  } else if (rlError && rlError.code !== 'PGRST116') {
    console.error('❌ Error checking "user_rate_limits":', rlError);
  } else {
    console.log('✅ Table "user_rate_limits" exists and is accessible.');
  }

  // 2. Check played_words
  const { data: pwData, error: pwError } = await supabase
    .from('played_words')
    .select('id')
    .limit(1);
    
  if (pwError && pwError.code === '42P01') {
    console.error('❌ Table "played_words" is MISSING! (Migration not applied)');
  } else if (pwError && pwError.code !== 'PGRST116') {
    console.error('❌ Error checking "played_words":', pwError);
  } else {
    console.log('✅ Table "played_words" exists and is accessible.');
  }
}

verify();
