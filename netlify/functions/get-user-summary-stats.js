// netlify/functions/get-user-summary-stats.js
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
    // 3. Filter the query by league_id
    const { data: allWeeklyResults, error } = await supabase
      .from('weekly_results')
      .select('user_id, is_winner')
      .eq('season', season)
      .eq('league_id', league_id);

    if (error) throw error;

    // --- All of the existing JavaScript logic below remains the same ---
    const userScores = allWeeklyResults.reduce((acc, result) => {
      const id = result.user_id;
      if (!acc[id]) {
        acc[id] = { wins: 0, losses: 0 };
      }
      if (result.is_winner) {
        acc[id].wins++;
      } else {
        acc[id].losses++;
      }
      return acc;
    }, {});

    const leaderboard = Object.keys(userScores)
      .map(id => ({
        user_id: id,
        wins: userScores[id].wins,
      }))
      .sort((a, b) => b.wins - a.wins);

    const rank = leaderboard.findIndex(player => player.user_id === user_id) + 1;
    const myStats = userScores[user_id] || { wins: 0, losses: 0 };

    const responseData = {
      rank: rank > 0 ? rank : null,
      weeks_won: myStats.wins,
      weeks_lost: myStats.losses,
    };

    return { statusCode: 200, body: JSON.stringify(responseData) };

  } catch (err) {
    console.error('Error in get-user-summary-stats:', err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};