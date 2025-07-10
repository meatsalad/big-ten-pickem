// netlify/functions/get-user-summary-stats.js
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
    // Fetch all weekly results for the season to calculate ranks for all users
    const { data: allWeeklyResults, error } = await supabase
      .from('weekly_results')
      .select('user_id, is_winner')
      .eq('season', season);

    if (error) throw error;

    // --- Calculate wins for every user in JavaScript ---
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

    // Create a sorted leaderboard to find the rank
    const leaderboard = Object.keys(userScores)
      .map(id => ({
        user_id: id,
        wins: userScores[id].wins,
      }))
      .sort((a, b) => b.wins - a.wins);

    // Find the specific user's rank
    const rank = leaderboard.findIndex(player => player.user_id === user_id) + 1;

    // Get the specific user's stats
    const myStats = userScores[user_id] || { wins: 0, losses: 0 };

    const responseData = {
      rank: rank > 0 ? rank : null, // If user has no score, rank is null
      weeks_won: myStats.wins,
      weeks_lost: myStats.losses,
    };

    return { statusCode: 200, body: JSON.stringify(responseData) };

  } catch (err) {
    console.error('Error in get-user-summary-stats:', err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};