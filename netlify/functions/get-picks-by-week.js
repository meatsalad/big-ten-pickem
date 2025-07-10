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

  // We still need to pass the user's auth token to know who "they" are
  const { authorization } = event.headers;
  const token = authorization?.replace('Bearer ', '');

  try {
    const { data: lockTime, error: lockTimeError } = await supabase.rpc('get_week_lock_time', {
      p_season: season,
      p_week_num: week,
    });

    if (lockTimeError) throw lockTimeError;

    let query = supabase.from('picks').select('*').eq('week', week).eq('season', season);
    
    // If the lock time has NOT passed, only return picks for the logged-in user
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