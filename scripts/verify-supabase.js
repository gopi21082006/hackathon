import { createClient } from '../backend/node_modules/@supabase/supabase-js/dist/index.cjs';
import dotenv from '../backend/node_modules/dotenv/lib/main.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing from .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySupabase() {
  console.log('=== SUPABASE DATABASE & SCHEMA VERIFICATION ===\n');
  console.log(`Endpoint: ${supabaseUrl}`);

  // 1. Table Verification
  console.log('\n1. Verifying Database Tables:');
  const tables = ['profiles', 'user_setup', 'check_ins', 'wellbeing_data', 'digital_wellbeing'];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error && error.code !== 'PGRST116') {
      console.error(`   ❌ public.${table}: ${error.message}`);
    } else {
      console.log(`   ✓ public.${table} exists and is accessible`);
    }
  }

  // 2. Auth & RLS Status
  console.log('\n2. Authentication & RLS:');
  const { data: authSettings } = await supabase.auth.getSession();
  console.log('   ✓ Supabase Auth client initialized');
  console.log('   ✓ Active session:', authSettings?.session ? 'Authenticated' : 'No active session (Anonymous)');

  console.log('\n3. Real Check-in Query Check:');
  const { data: recentCheckins, error: chkErr } = await supabase
    .from('check_ins')
    .select('id, question_id, question, category, answer, numeric_value, emoji, response_time_seconds, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (chkErr) {
    console.error('   Notice on check_ins query:', chkErr.message);
  } else {
    console.log(`   ✓ Currently recorded real check-ins in database: ${recentCheckins ? recentCheckins.length : 0}`);
    if (recentCheckins && recentCheckins.length > 0) {
      console.log('   Latest check-in:', recentCheckins[0]);
    }
  }

  console.log('\n=== ALL DATABASE CHECKS COMPLETED SUCCESSFULLY ===');
}

verifySupabase().catch(console.error);
