import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { authorizeCommissioner } from './lib/auth.js';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    await authorizeCommissioner(supabase, event);

    const { week, season } = JSON.parse(event.body);
    if (!week || !season) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Week and season are required.' }) };
    }

    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, winning_team')
      .eq('week', week)
      .eq('season', season)
      .not('winning_team', 'is', null);

    if (gamesError) throw gamesError;
    if (games.length === 0) throw new Error('No completed games found for this week.');
    
    const winnerMap = new Map(games.map(g => [g.id, g.winning_team]));

    // --- THIS QUERY IS UPDATED ---
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('id, user_id, game_id, selected_team') // Added user_id
      .eq('week', week)
      .eq('season', season);
      
    if (picksError) throw picksError;

    const gradedPicks = picks.map(pick => ({
      id: pick.id,
      user_id: pick.user_id, // Ensure user_id is included in the upsert payload
      game_id: pick.game_id,
      selected_team: pick.selected_team,
      is_correct: winnerMap.get(pick.game_id) === pick.selected_team
    }));

    const { error: upsertError } = await supabase.from('picks').upsert(gradedPicks);
    if (upsertError) throw upsertError;
    
    const { data: finalPicks, error: finalPicksError } = await supabase
      .from('picks')
      .select('user_id, is_correct')
      .eq('week', week)
      .eq('season', season);
    
    if(finalPicksError) throw finalPicksError;

    const scores = finalPicks.reduce((acc, pick) => {
        acc[pick.user_id] = (acc[pick.user_id] || 0) + (pick.is_correct ? 1 : 0);
        return acc;
    }, {});
    
    if (Object.keys(scores).length === 0) {
        return { statusCode: 200, body: JSON.stringify({ message: "Week settled, but no players had picks to grade."})};
    }
    
    const maxScore = Math.max(...Object.values(scores));
    const minScore = Math.min(...Object.values(scores));
    
    const weeklyResults = Object.entries(scores).map(([user_id, score]) => ({
        user_id,
        week,
        season,
        is_winner: score === maxScore,
        is_poopstar: score === minScore && Object.values(scores).filter(s => s === maxScore).length === 1,
        is_perfect: score === games.length,
    }));

    const { error: resultsError } = await supabase.from('weekly_results').upsert(weeklyResults, { onConflict: 'user_id, week, season' });
    if (resultsError) throw resultsError;

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Week ${week} has been successfully settled.` }),
    };

  } catch (error) {
    console.error('Error settling week:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message || 'An internal error occurred.' }),
    };
  }
};