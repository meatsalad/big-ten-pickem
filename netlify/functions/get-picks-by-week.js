import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

export const handler = async (event) => {
  const { week, season } = event.queryStringParameters;
  if (!week || !season) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Week and season are required.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: { headers: { Authorization: event.headers.authorization } }
});

  // Get the lock time for the week
  const { data: lockTime, error: lockTimeError } = await supabase.rpc('get_week_lock_time', {
    p_season: season,
    p_week_num: week,
  });

  if (lockTimeError) {
    return { statusCode: 500, body: JSON.stringify({ message: lockTimeError.message }) };
  }

  const query = supabase.from('picks').select('*').eq('week', week).eq('season', season);
  
  // If the lock time has NOT passed, only fetch the current user's picks
  if (new Date() < new Date(lockTime)) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      query.eq('user_id', user.id);
    } else {
        // If no user and not locked, return no picks
        return { statusCode: 200, body: JSON.stringify([]) };
    }
  }

  const { data, error } = await query;

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify(data) };
};