const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('test_sessions')
    .select('id, is_completed, content_data')
    .eq('test_type', 'speaking')
    .eq('is_completed', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('DB Error:', error);
    return;
  }

  console.log(`Found ${data.length} completed sessions.`);
  for (const row of data) {
    console.log(`Session ${row.id}: keys = ${Object.keys(row.content_data || {}).join(', ')}`);
    if (row.content_data?.evaluation) console.log('  -> Has evaluation');
    if (row.content_data?.finalEvaluation) console.log('  -> Has finalEvaluation');
  }
}

check();
