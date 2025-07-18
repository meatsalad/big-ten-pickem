// netlify/functions/get-user-financials.js
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
      .select('user_id, week, is_winner, is_perfect')
      .eq('season', season)
      .eq('league_id', league_id);

    if (error) throw error;

    // --- All of the existing JavaScript logic below remains the same ---
    const userWeeks = allWeeklyResults.filter(r => r.user_id === user_id);

    let total_winnings = 0;
    let total_losses = 0;

    for (const userResult of userWeeks) {
      const { week, is_winner } = userResult;

      const resultsForThisWeek = allWeeklyResults.filter(r => r.week === week);
      const isPerfectWeek = resultsForThisWeek.some(r => r.is_perfect);
      const week_pot = isPerfectWeek ? 20 : 10;

      if (is_winner) {
        const winner_count = resultsForThisWeek.filter(r => r.is_winner).length;
        const loser_count = resultsForThisWeek.filter(r => !r.is_winner).length;

        if (winner_count > 0) {
          const winningsThisWeek = (loser_count * week_pot) / winner_count;
          total_winnings += winningsThisWeek;
        }
      } else {
        total_losses += week_pot;
      }
    }

    const responseData = {
      total_winnings,
      total_losses,
    };

    return { statusCode: 200, body: JSON.stringify(responseData) };

  } catch (err) {
    console.error('Error in get-user-financials:', err);
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};