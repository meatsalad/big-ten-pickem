import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  const { week, season } = event.queryStringParameters;
  if (!week || !season) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Week and season are required.' }) };
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // This RPC call will now succeed because the function exists in the database
  const { data, error } = await supabase.rpc('get_players_for_week', {
    p_season: season,
    p_week_num: week,
  });

  if (error) {
    console.error('Error fetching players for week:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify(data) };
};