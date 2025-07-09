import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

export const handler = async (event) => {
  const { week, season } = event.queryStringParameters;
  if (!week || !season) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Week and season are required.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  // We use an RPC call to efficiently get distinct players for a week.
  // This requires a simple helper function in the database.
  const { data, error } = await supabase.rpc('get_players_for_week', {
    p_season: season,
    p_week_num: week
  });

  if (error) {
    // If the function doesn't exist, create it.
    if (error.code === '42883') {
        await createRpcFunction(supabase);
        // Retry the call
        const { data: retryData, error: retryError } = await supabase.rpc('get_players_for_week', { p_season: season, p_week_num: week });
        if (retryError) {
            return { statusCode: 500, body: JSON.stringify({ message: retryError.message }) };
        }
        return { statusCode: 200, body: JSON.stringify(retryData) };
    }
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify(data) };
};

// Helper to create the DB function if it doesn't exist.
const createRpcFunction = async (supabase) => {
  await supabase.rpc('sql', {
    sql: `
      CREATE OR REPLACE FUNCTION get_players_for_week(p_season integer, p_week_num integer)
      RETURNS TABLE(id uuid, username text) AS $$
      BEGIN
        RETURN QUERY
        SELECT DISTINCT p.id, p.username
        FROM public.profiles p
        JOIN public.picks pi ON p.id = pi.user_id
        WHERE pi.week = p_week_num AND pi.season = p_season;
      END;
      $$ LANGUAGE plpgsql;
    `
  });
};