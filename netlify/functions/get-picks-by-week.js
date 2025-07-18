import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  const { week, season, league_id } = event.queryStringParameters;
  if (!week || !season || !league_id) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Week, season, and league_id are required.' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { authorization } = event.headers;
  const token = authorization?.replace('Bearer ', '');

  try {
    // 1. Get the authenticated user making the request.
    // We need this in all cases now to apply the correct privacy rules.
    if (!token) {
        // If there's no token, we can't know who the user is, so return no picks.
        return { statusCode: 200, body: JSON.stringify([]) };
    }
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
        // If the token is invalid, return no picks.
        return { statusCode: 200, body: JSON.stringify([]) };
    }

    // 2. Get the week's lock time from the database.
    const { data: lockTime, error: lockTimeError } = await supabase.rpc('get_week_lock_time', {
      p_season: season,
      p_week_num: week,
    });

    if (lockTimeError) throw lockTimeError;

    // 3. Determine if the week is considered "locked".
    // It's only locked if a lockTime exists AND that time is in the past.
    const isWeekLocked = lockTime && new Date() > new Date(lockTime);

    // 4. Build the initial query.
    let query = supabase
      .from('picks')
      .select('*')
      .eq('week', week)
      .eq('season', season)
      .eq('league_id', league_id);
    
    // 5. Apply privacy filter if the week is NOT locked.
    // If the week is not locked (either future or TBD), filter for the current user's picks ONLY.
    if (!isWeekLocked) {
      query = query.eq('user_id', user.id);
    }
    // If the week IS locked, this filter is skipped, and the query will fetch all picks for the league.

    const { data, error } = await query;

    if (error) throw error;

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch(error) {
    console.error("Error in get-picks-by-week:", error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};