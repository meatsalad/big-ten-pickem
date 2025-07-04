const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  // This function can only be called via a POST request
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  // IMPORTANT: Use the SERVICE_ROLE_KEY to bypass RLS policies
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { game_id, home_score, away_score } = JSON.parse(event.body);

    if (!game_id || home_score === null || away_score === null) {
      return { statusCode: 400, body: 'Missing game_id or scores' };
    }

    // 1. Determine the winning team based on the corrected scores
    const { data: gameInfo } = await supabase
        .from('games')
        .select('home_team, away_team')
        .eq('id', game_id)
        .single();
    
    if (!gameInfo) throw new Error('Game not found.');

    const winning_team = home_score > away_score ? gameInfo.home_team : gameInfo.away_team;
    
    // 2. Update the game with the new scores and winner
    await supabase
      .from('games')
      .update({ 
          home_team_score: home_score,
          away_team_score: away_score,
          winning_team: winning_team
      })
      .eq('id', game_id);

    // 3. Re-grade all picks for that game
    const { data: picksToRegrade, error: picksError } = await supabase
        .from('picks')
        .select('id, selected_team')
        .eq('game_id', game_id);

    if (picksError) throw picksError;

    const pickUpdates = picksToRegrade.map(pick => ({
        id: pick.id,
        is_correct: pick.selected_team === winning_team,
    }));

    if (pickUpdates.length > 0) {
        await supabase.from('picks').upsert(pickUpdates);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Game score corrected and picks re-graded successfully!' }),
    };

  } catch (error) {
    console.error('Error correcting game score:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
