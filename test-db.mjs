import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('Ebook').select('description').limit(1);
  if (error) {
    console.error('ERROR:', error.message);
  } else {
    console.log('SUCCESS!', data);
  }
}
run();
