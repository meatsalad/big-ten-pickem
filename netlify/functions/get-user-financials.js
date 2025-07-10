// netlify/functions/get-user-financials.js
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
    // 1. Fetch all weekly results for the entire season. This is the only data we need.
    const { data: allWeeklyResults, error } = await supabase
      .from('weekly_results')
      .select('user_id, week, is_winner, is_perfect')
      .eq('season', season);

    if (error) throw error;

    // 2. Filter down to just the weeks the specified user participated in.
    const userWeeks = allWeeklyResults.filter(r => r.user_id === user_id);

    let total_winnings = 0;
    let total_losses = 0;

    // 3. Loop through each week the user played.
    for (const userResult of userWeeks) {
      const { week, is_winner } = userResult;

      // Get all results for the current week from our full dataset
      const resultsForThisWeek = allWeeklyResults.filter(r => r.week === week);

      // Determine the pot size for this week
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