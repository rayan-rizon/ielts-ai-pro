import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(supabaseUrl, supabaseKey);
sb.from('questions')
  .select('id, question_number, type, explanation_data')
  .not('explanation_data', 'is', null)
  .limit(10)
  .then((r) => console.log(JSON.stringify(r.data, null, 2)))
  .catch(console.error);
