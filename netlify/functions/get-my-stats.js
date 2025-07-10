// netlify/functions/get-my-stats.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  const { season, user_id } = event.queryStringParameters;

  if (!season || !user_id) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Season and user_id are required.' }) };
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // Fetch performance and tendencies data concurrently
    const [performanceRes, tendenciesRes] = await Promise.all([
      // Performance: Count correct picks grouped by week
      supabase
        .from('picks')
        .select('week, is_correct')
        .eq('user_id', user_id)
        .eq('season', season)
        .eq('is_correct', true),

      // Tendencies: Count home vs away picks
      supabase
        .from('picks')
        .select('*, games(home_team, away_team)')
        .eq('user_id', user_id)
        .eq('season', season)
    ]);

    if (performanceRes.error) throw performanceRes.error;
    if (tendenciesRes.error) throw tendenciesRes.error;

    // --- Process Performance Data ---
    const performanceMap = performanceRes.data.reduce((acc, pick) => {
        acc[pick.week] = (acc[pick.week] || 0) + 1;
        return acc;
    }, {});
    const performance_over_time = Object.entries(performanceMap)
        .map(([week, wins]) => ({ week: parseInt(week), wins }))
        .sort((a, b) => a.week - b.week);

    // --- Process Tendencies Data ---
    const picking_tendencies = tendenciesRes.data.reduce((acc, pick) => {
        if (pick.selected_team === pick.games.home_team) {
            acc.home_picks++;
        } else if (pick.selected_team === pick.games.away_team) {
            acc.away_picks++;
        }
        return acc;
    }, { home_picks: 0, away_picks: 0 });


    // Assemble the final object
    const responseData = {
      performance_over_time,
      picking_tendencies,
    };

    return { statusCode: 200, body: JSON.stringify(responseData) };

  } catch (error) {
    console.error('Error fetching my-stats:', error);
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};