import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

export const handler = async (event) => {
  const { week, season } = event.queryStringParameters;
  if (!week || !season) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Week and season are required.' }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('week', week)
    .eq('season', season)
    .order('game_time', { ascending: true });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify(data) };
};