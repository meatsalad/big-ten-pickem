import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async () => {
  // Use the SUPABASE_SERVICE_KEY to bypass RLS for this system-level query
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Missing required environment variables for seasons.' }),
    };
  }

  // Initialize the client with the service role key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase.rpc('get_distinct_seasons');
    if (error) throw error;
    
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};