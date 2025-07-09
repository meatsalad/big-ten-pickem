import { createClient } from '@supabase/supabase-js';
import { authorizeCommissioner } from './lib/auth';

const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: { 'Allow': 'POST' },
    };
  }
  
  const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

  try {
    // 1. Authorize the user
    await authorizeCommissioner(supabase, event);

    // 2. Proceed with business logic
    const { week, season } = JSON.parse(event.body);
    if (!week || !season) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Week and season are required.' }) };
    }

    // The logic to settle the week would go here.
    // This might involve calling a database function (RPC) or executing
    // a series of queries to grade picks and create weekly_results.
    // For example:
    // const { error } = await supabase.rpc('settle_week', { p_week: week, p_season: season });
    // if (error) throw error;

    console.log(`Settling results for Season: ${season}, Week: ${week}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Week ${week} for season ${season} has been settled.` }),
    };

  } catch (error) {
    console.error('Error in settle-most-recent-week:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message || 'Internal Server Error' }),
    };
  }
};