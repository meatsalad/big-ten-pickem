import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  const { season, league_id } = event.queryStringParameters;
  if (!season || !league_id) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Season and league_id are required.' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_season: season,
      p_league_id: league_id,
    });

    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};