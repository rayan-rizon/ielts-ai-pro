import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data: wTests, error: wErr } = await supabase
    .from('passages')
    .select('*, questions(*)')
    .eq('test_type', 'writing')
    .limit(1);
  const { data: sTests, error: sErr } = await supabase
    .from('passages')
    .select('*, questions(*)')
    .eq('test_type', 'speaking')
    .limit(1);

  console.log('Writing Test Error:', wErr);
  console.log('Writing Tests:', JSON.stringify(wTests, null, 2));

  console.log('Speaking Test Error:', sErr);
  console.log('Speaking Tests:', JSON.stringify(sTests, null, 2));
}

check();
