import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  const { week, season } = event.queryStringParameters;
  if (!week || !season) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Week and season are required.' }) };
  }

  // Use the service key to bypass RLS
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    const { data, error } = await supabase.rpc('get_players_for_week', {
      p_season: season,
      p_week_num: week,
    });

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch(error) {
     return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};