import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data: q } = await supabase
    .from('questions')
    .select('id, explanation_data')
    .not('explanation_data', 'is', null)
    .limit(1);
  if (!q || q.length === 0) {
    console.log('No questions with explanation_data found.');
    return;
  }
  const id = q[0].id;
  console.log('Found question:', q[0]);

  const { data, error } = await supabase
    .from('questions')
    .update({ explanation_data: null })
    .eq('id', id)
    .select();
  console.log('Update result:', data, error);
}

test();
