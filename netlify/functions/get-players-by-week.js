import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  // 1. Now requires league_id
  const { week, season, league_id } = event.queryStringParameters;
  if (!week || !season || !league_id) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Week, season, and league_id are required.' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    // 2. Pass league_id to the RPC call
    const { data, error } = await supabase.rpc('get_players_for_week', {
      p_season: season,
      p_week_num: week,
      p_league_id: league_id
    });

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch(error) {
     return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};