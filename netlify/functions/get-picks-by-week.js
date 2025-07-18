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

  const { authorization } = event.headers;
  const token = authorization?.replace('Bearer ', '');

  try {
    const { data: lockTime, error: lockTimeError } = await supabase.rpc('get_week_lock_time', {
      p_season: season,
      p_week_num: week,
    });

    if (lockTimeError) throw lockTimeError;

    // 2. Add league_id filter to the main query
    let query = supabase
      .from('picks')
      .select('*')
      .eq('week', week)
      .eq('season', season)
      .eq('league_id', league_id);
    
    // The rest of the logic remains the same
    if (new Date() < new Date(lockTime) && token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        query = query.eq('user_id', user.id);
      } else {
        return { statusCode: 200, body: JSON.stringify([]) };
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch(error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};