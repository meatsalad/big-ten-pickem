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
    const { gameId, homeTeamScore, awayTeamScore, winningTeam } = JSON.parse(event.body);

    if (gameId === undefined || homeTeamScore === undefined || awayTeamScore === undefined || winningTeam === undefined) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing required game data.' }) };
    }

    const { data, error } = await supabase
      .from('games')
      .update({
        home_team_score: homeTeamScore,
        away_team_score: awayTeamScore,
        winning_team: winningTeam,
      })
      .eq('id', gameId);

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Game score corrected successfully.', data }),
    };

  } catch (error) {
    console.error('Error in correct-game-score:', error);
    return {
      statusCode: error.statusCode || 500,
      body: JSON.stringify({ message: error.message || 'Internal Server Error' }),
    };
  }
};