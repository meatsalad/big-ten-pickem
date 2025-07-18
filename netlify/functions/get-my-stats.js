// netlify/functions/get-my-stats.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {
  // 1. Now requires league_id
  const { season, user_id, league_id } = event.queryStringParameters;

  if (!season || !user_id || !league_id) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Season, user_id, and league_id are required.' }) };
  }

  // 2. Use the Service Key for robust permissions
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 3. Add league_id filter to both database queries
    const [performanceRes, tendenciesRes] = await Promise.all([
      supabase
        .from('picks')
        .select('week, is_correct')
        .eq('user_id', user_id)
        .eq('season', season)
        .eq('league_id', league_id) // <-- Filter added
        .eq('is_correct', true),

      supabase
        .from('picks')
        .select('*, games(home_team, away_team)')
        .eq('user_id', user_id)
        .eq('season', season)
        .eq('league_id', league_id) // <-- Filter added
    ]);

    if (performanceRes.error) throw performanceRes.error;
    if (tendenciesRes.error) throw tendenciesRes.error;

    // --- All of the existing JavaScript logic below remains the same ---
    const performanceMap = performanceRes.data.reduce((acc, pick) => {
        acc[pick.week] = (acc[pick.week] || 0) + 1;
        return acc;
    }, {});
    const performance_over_time = Object.entries(performanceMap)
        .map(([week, wins]) => ({ week: parseInt(week), wins }))
        .sort((a, b) => a.week - b.week);

    const picking_tendencies = tendenciesRes.data.reduce((acc, pick) => {
        if (pick.selected_team === pick.games.home_team) {
            acc.home_picks++;
        } else if (pick.selected_team === pick.games.away_team) {
            acc.away_picks++;
        }
        return acc;
    }, { home_picks: 0, away_picks: 0 });

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