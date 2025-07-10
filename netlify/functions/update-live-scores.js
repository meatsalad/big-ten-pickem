import 'dotenv/config';
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Helper function to get the current college football week
const getCurrentNCAAFWeek = () => {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 7, 24); 
  const week = Math.ceil((now - seasonStart) / (1000 * 60 * 60 * 24 * 7));
  return week > 0 ? week : 1;
};

export const handler = async (event) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const cfbdApiKey = process.env.CFBD_API_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const year = new Date().getFullYear();
  const week = getCurrentNCAAFWeek();

  try {
    // 1. Fetch live game data from CFBD API for the current week
    const response = await fetch(`https://api.collegefootballdata.com/games?year=${year}&week=${week}&conference=B1G`);
    if (!response.ok) throw new Error(`CFBD API Error: ${response.statusText}`);
    const liveGames = await response.json();

    // 2. Get the games we already have in our DB for this week
    const { data: dbGames, error: dbError } = await supabase
      .from('games')
      .select('id, winning_team')
      .eq('week', week);
    if (dbError) throw dbError;

    // 3. Find games that are finished AND haven't been processed yet
    const gamesToUpdate = liveGames.filter(liveGame => {
      const correspondingDbGame = dbGames.find(g => g.id === liveGame.id);
      // Process if the game is completed and we don't have a winner for it yet
      return liveGame.completed && correspondingDbGame && !correspondingDbGame.winning_team;
    });

    if (gamesToUpdate.length === 0) {
      return { statusCode: 200, body: 'No new completed games to update.' };
    }

    // 4. Update the 'games' table with final scores and winners
    const gameUpdates = gamesToUpdate.map(g => ({
      id: g.id,
      home_team_score: g.home_points,
      away_team_score: g.away_points,
      winning_team: g.home_points > g.away_points ? g.home_team : g.away_team,
    }));
    await supabase.from('games').upsert(gameUpdates);

    // 5. Grade all picks for the games that just finished
    for (const game of gamesToUpdate) {
      const winningTeam = game.home_points > game.away_points ? game.home_team : game.away_team;
      
      // Get all picks for this game
      const { data: picksToGrade, error: picksError } = await supabase
        .from('picks')
        .select('id, selected_team')
        .eq('game_id', game.id);
      if (picksError) continue; // Skip to next game if error

      // Determine if each pick was correct and prepare the update
      const pickUpdates = picksToGrade.map(pick => ({
        id: pick.id,
        is_correct: pick.selected_team === winningTeam,
      }));
      
      // Update the 'picks' table with the graded results
      if (pickUpdates.length > 0) {
        await supabase.from('picks').upsert(pickUpdates);
      }
    }

    return {
      statusCode: 200,
      body: `Successfully updated ${gamesToUpdate.length} games and graded picks.`,
    };

  } catch (error) {
    console.error('Error in update-live-scores function:', error);
    return { statusCode: 500, body: error.toString() };
  }
};
